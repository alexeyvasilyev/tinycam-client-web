import { AfterViewInit, Component, ElementRef, SimpleChanges, ChangeDetectionStrategy, OnChanges, OnDestroy, input, signal, viewChild } from '@angular/core';
import { LoginService } from '../services';
import { WindowRefService } from '../services';
import StorageUtils from '../utils-storage';
import { MsePlayer } from '../mse-player';
import { LiveMux } from '../live-mux';

// Live view plays progressive (fragmented) MP4 stream via Media Source Extensions.
// MJPEG is used if selected in Admin settings ("Use MJPEG codec for live view").
// Falls back to MJPEG if MSE or camera codec (e.g. H.265) is not supported by the browser,
// or if the camera does not provide H.264/H.265 (server responds with 415).
// Multiple cameras layouts provide mux, single connection with MP4 streams of all cameras on the page
// (browsers allow only ~6 simultaneous connections per server). JPEG snapshots are used instead
// of MJPEG there (snapshotMode or fallback), since each MJPEG stream keeps a connection open.

const RECONNECT_DELAY_MSEC = 2000;
const SNAPSHOT_INTERVAL_MSEC = 500;

@Component({
    selector: 'live',
    template: `
      <!-- Classes live-view-loading and live-view are not loaded in Angular 12.0.0. Bug? -->
      <div animate.enter="app-fade-in" style="cursor: pointer; background-repeat: no-repeat; background-position: center; background-size: contain; background-image: url('assets/img/loading.png');">
        <video #video muted autoplay playsinline disablepictureinpicture
          style="display: block; width: 100%; object-fit: contain; background: transparent;"
          [style.display]="imageMode() ? 'none' : 'block'"
          [style.visibility]="playing() ? 'visible' : 'hidden'"
          [style.height.px]="viewHeightPx()"></video>
        <div #cell style="background-repeat: no-repeat; background-position: center; background-size: contain;"
          [style.display]="imageMode() ? 'block' : 'none'"
          [style.height.px]="viewHeightPx()"></div>
      </div>
    `,
    changeDetection: ChangeDetectionStrategy.Eager
})

export class LiveComponent implements AfterViewInit, OnChanges, OnDestroy {

    readonly viewHeightPx = input<number>(100); // Hack for Safari
    readonly cameraId = input<number>(undefined);
    readonly snapshotMode = input(false);
    readonly mux = input<LiveMux | null>(null);
    readonly cellEl = viewChild<ElementRef>('cell');
    readonly videoEl = viewChild<ElementRef<HTMLVideoElement>>('video');

    // Signals, since they are changed from fetch() and MSE callbacks (zoneless)
    // MJPEG or JPEG snapshots are shown in cell instead of video
    readonly imageMode = signal(false);
    readonly playing = signal(false);

    private viewInitialized = false;
    // Incremented on each (re)start. Stale async callbacks check it and exit.
    private session = 0;
    private abortController: AbortController | null = null;
    private player: MsePlayer | null = null;
    private unsubscribeMux: (() => void) | null = null;
    private reconnectTimer: any = null;
    private mjpegStarted = false;
    private snapshotUrl: string | null = null;

    constructor(
        public loginService: LoginService,
        private windowRef: WindowRefService) {
    }

    ngAfterViewInit() {
        this.viewInitialized = true;
        this.start();
    }

    ngOnChanges(changes: SimpleChanges) {
        // Height changes do not require reconnection
        if (!this.viewInitialized || (!changes['cameraId'] && !changes['snapshotMode'] && !changes['mux']))
            return;
        this.stop();
        this.start();
    }

    ngOnDestroy() {
        this.stop();
    }

    private start() {
        this.stop();
        if (this.snapshotMode()) {
            this.startSnapshots(++this.session);
            return;
        }
        const mux = this.mux();
        if (mux != null) {
            this.imageMode.set(false);
            this.startMux(mux, ++this.session);
            return;
        }
        const mseSupported = MsePlayer.getMediaSourceImpl() != null;
        // MJPEG selected in Admin settings or MSE not supported
        if (StorageUtils.getUseMjpegLiveView() || !mseSupported) {
            this.startMjpeg(!mseSupported ? 'Media Source Extensions not supported by the browser' : 'selected in Admin settings');
            return;
        }
        this.imageMode.set(false);
        this.startMp4(++this.session);
    }

    private stop() {
        this.session++;
        this.playing.set(false);
        if (this.reconnectTimer != null) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.stopMp4();
        if (this.unsubscribeMux != null) {
            this.unsubscribeMux();
            this.unsubscribeMux = null;
        }
        this.stopSnapshots();
        if (this.mjpegStarted)
            this.stopMjpeg();
    }

    // -------------------------------------------------------------------------
    // MP4
    // -------------------------------------------------------------------------

    private async startMp4(session: number) {
        const abortController = new AbortController();
        this.abortController = abortController;
        try {
            const response = await fetch(this.getLiveMp4Url(), { signal: abortController.signal, cache: 'no-store' });
            if (session !== this.session)
                return;
            if (response.status === 415) {
                // Camera does not provide H.264/H.265
                abortController.abort();
                this.startMjpeg('camera video codec is not H.264/H.265');
                return;
            }
            if (!response.ok || response.body == null)
                throw new Error(`HTTP ${response.status}`);

            const mimeType = response.headers.get('Content-Type') || 'video/mp4';
            if (!MsePlayer.isTypeSupported(mimeType)) {
                abortController.abort();
                this.startMjpeg(`'${mimeType}' is not supported by the browser`);
                return;
            }

            let failed: any = null;
            this.createPlayer(mimeType, session, e => failed = e);
            const reader = response.body.getReader();
            while (session === this.session) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                if (failed != null)
                    throw failed;
                this.player?.append(value);
            }
            reader.cancel().catch(() => { });
            // Stream ended by server (e.g. camera resolution changed). Reconnect.
        } catch (e) {
            if (session !== this.session)
                return;
            console.warn(`Camera ${this.cameraId()}: MP4 live view error`, e);
        }
        this.scheduleReconnect(session);
    }

    private createPlayer(mimeType: string, session: number, onError: (e: any) => void) {
        this.player?.dispose();
        const video = this.videoEl().nativeElement;
        video.addEventListener('loadedmetadata', () => {
            if (session === this.session)
                console.info(`Camera ${this.cameraId()}: live view MP4 ${MsePlayer.getCodecName(mimeType)} ${video.videoWidth}x${video.videoHeight} (${mimeType})`);
        }, { once: true });
        this.player = new MsePlayer(video, mimeType, () => {
            if (session === this.session)
                this.playing.set(true);
        }, e => {
            if (session === this.session)
                onError(e);
        });
    }

    private scheduleReconnect(session: number) {
        if (session !== this.session)
            return;
        this.stopMp4();
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (session === this.session)
                this.start();
        }, RECONNECT_DELAY_MSEC);
    }

    private stopMp4() {
        if (this.abortController != null) {
            this.abortController.abort();
            this.abortController = null;
        }
        this.player?.dispose();
        this.player = null;
    }

    // -------------------------------------------------------------------------
    // MP4 from multiplexed stream of several cameras
    // -------------------------------------------------------------------------

    private startMux(mux: LiveMux, session: number) {
        let lastInit: { mimeType: string, data: Uint8Array<ArrayBuffer> } | null = null;
        const onPlayerError = (e: any) => {
            console.warn(`Camera ${this.cameraId()}: MP4 live view error`, e);
            this.playing.set(false);
            // Recreate decoder. Frames before the next key frame are skipped by browser.
            if (lastInit != null)
                this.createMuxPlayer(lastInit.mimeType, lastInit.data, session, onPlayerError);
        };
        this.unsubscribeMux = mux.subscribe(this.cameraId(), {
            onInit: (mimeType, data) => {
                if (session !== this.session)
                    return;
                if (!MsePlayer.isTypeSupported(mimeType)) {
                    this.startMuxFallback(`'${mimeType}' is not supported by the browser`);
                    return;
                }
                lastInit = { mimeType, data };
                this.createMuxPlayer(mimeType, data, session, onPlayerError);
            },
            onMedia: data => {
                if (session === this.session)
                    this.player?.append(data);
            },
            onError: (status, message) => {
                if (session !== this.session)
                    return;
                if (status === 503) {
                    // No video yet. INIT is sent when camera video is available.
                    console.warn(`Camera ${this.cameraId()}: ${message}`);
                } else {
                    this.startMuxFallback(status === 415 ? 'camera video codec is not H.264/H.265' : `${status} ${message}`);
                }
            }
        });
    }

    private createMuxPlayer(mimeType: string, initSegment: Uint8Array<ArrayBuffer>, session: number, onError: (e: any) => void) {
        this.createPlayer(mimeType, session, onError);
        this.player.append(initSegment);
    }

    private startMuxFallback(reason: string) {
        console.info(`Camera ${this.cameraId()}: live view JPEG snapshots (${reason})`);
        this.stop();
        this.startSnapshots(++this.session);
    }

    getLiveMp4Url(): string {
        return `${this.loginService.server.url}/axis-cgi/media.cgi?container=mp4&cameraId=${this.cameraId()}&token=${this.loginService.login.token}`;
    }

    // -------------------------------------------------------------------------
    // MJPEG (fallback)
    // -------------------------------------------------------------------------

    private startMjpeg(reason: string) {
        console.info(`Camera ${this.cameraId()}: live view MJPEG (${reason})`);
        this.mjpegStarted = true;
        this.imageMode.set(true);
        this.playing.set(true);
        this.cellEl().nativeElement.style.backgroundImage = "url('" + this.getLiveImage() + "')";
    }

    private stopMjpeg() {
        this.mjpegStarted = false;
        this.cellEl().nativeElement.style.backgroundImage = 'none';
        // HACK: Preventing Chrome keeping/leaking connection for MJPEG stream.
        // http://stackoverflow.com/questions/16137381/html5-video-element-request-stay-pending-forever-on-chrome
        // Sideeffect: makes Mozilla unwanted refreshes.
        this.windowRef.nativeWindow.stop();
    }

    getLiveImage(): string {
        return `${this.loginService.server.url}/axis-cgi/mjpg/video.cgi?cameraId=${this.cameraId()}&token=${this.loginService.login.token}`;
    }

    // -------------------------------------------------------------------------
    // JPEG snapshots
    // -------------------------------------------------------------------------

    private async startSnapshots(session: number) {
        this.imageMode.set(true);
        while (session === this.session) {
            const started = Date.now();
            // Do not load images for the browser tab in background
            if (!document.hidden) {
                try {
                    const abortController = new AbortController();
                    this.abortController = abortController;
                    const response = await fetch(this.getSnapshotUrl(), { signal: abortController.signal, cache: 'no-store' });
                    if (!response.ok)
                        throw new Error(`HTTP ${response.status}`);
                    const url = URL.createObjectURL(await response.blob());
                    // Decode before showing. Otherwise cell is empty while new image is decoded (flickering).
                    const image = new Image();
                    image.src = url;
                    try {
                        await image.decode();
                    } catch (e) {
                        URL.revokeObjectURL(url);
                        throw e;
                    }
                    if (session !== this.session) {
                        URL.revokeObjectURL(url);
                        return;
                    }
                    this.showSnapshot(url);
                    this.playing.set(true);
                } catch (e) {
                    if (session !== this.session)
                        return;
                    console.warn(`Camera ${this.cameraId()}: JPEG snapshot error`, e);
                    await LiveComponent.delay(RECONNECT_DELAY_MSEC);
                    continue;
                }
            }
            await LiveComponent.delay(Math.max(0, SNAPSHOT_INTERVAL_MSEC - (Date.now() - started)));
        }
    }

    private showSnapshot(url: string) {
        this.cellEl().nativeElement.style.backgroundImage = `url('${url}')`;
        if (this.snapshotUrl != null)
            URL.revokeObjectURL(this.snapshotUrl);
        this.snapshotUrl = url;
    }

    private stopSnapshots() {
        if (this.snapshotUrl == null)
            return;
        const cell = this.cellEl()?.nativeElement;
        if (cell != null)
            cell.style.backgroundImage = 'none';
        URL.revokeObjectURL(this.snapshotUrl);
        this.snapshotUrl = null;
    }

    private static delay(msec: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, msec));
    }

    getSnapshotUrl(): string {
        return `${this.loginService.server.url}/axis-cgi/jpg/image.cgi?cameraId=${this.cameraId()}&token=${this.loginService.login.token}`;
    }

}
