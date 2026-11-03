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
// Last frame of failed player is shown while new player waits for a key frame, but not longer than
const LAST_FRAME_TIMEOUT_MSEC = 10000;
// Black frame is shown if no MP4 video received during
const NO_VIDEO_TIMEOUT_MSEC = 15000;
// Connection is reconnected if no data received during (e.g. phone Wi-Fi reconnected,
// TCP connection is not closed and read() would wait for TCP timeout ~1 min)
const STALL_TIMEOUT_MSEC = 10000;

@Component({
    selector: 'live',
    template: `
      <!-- Classes live-view-loading and live-view are not loaded in Angular 12.0.0. Bug? -->
      <div animate.enter="app-fade-in" style="position: relative; cursor: pointer; background-repeat: no-repeat; background-position: center; background-size: contain; background-image: url('assets/img/loading.png');">
        <!-- Two video elements: new player starts in hidden one while the other shows the last frame -->
        <video #video0 muted autoplay playsinline disablepictureinpicture
          style="display: block; width: 100%; object-fit: contain; background: transparent;"
          [style.display]="imageMode() ? 'none' : 'block'"
          [style.visibility]="visibleVideo() === 0 ? 'visible' : 'hidden'"
          [style.height.px]="viewHeightPx()"></video>
        <video #video1 muted autoplay playsinline disablepictureinpicture
          style="display: block; position: absolute; top: 0; left: 0; width: 100%; object-fit: contain; background: transparent;"
          [style.display]="imageMode() ? 'none' : 'block'"
          [style.visibility]="visibleVideo() === 1 ? 'visible' : 'hidden'"
          [style.height.px]="viewHeightPx()"></video>
        <!-- Camera audio for MJPEG live view (MP4 contains audio track) -->
        <audio #wav preload="none" style="display: none"></audio>
        <!-- Black frame shown by watchdog if no video frames received -->
        <div style="position: absolute; top: 0; left: 0; width: 100%; background: black;"
          [style.display]="!imageMode() && noVideo() ? 'block' : 'none'"
          [style.height.px]="viewHeightPx()"></div>
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
    // Used in console log only
    readonly cameraName = input<string>(undefined);
    readonly snapshotMode = input(false);
    readonly mux = input<LiveMux | null>(null);
    // Play camera audio (single camera layout)
    readonly audio = input(false);
    readonly wavEl = viewChild<ElementRef<HTMLAudioElement>>('wav');
    readonly cellEl = viewChild<ElementRef>('cell');
    readonly video0El = viewChild<ElementRef<HTMLVideoElement>>('video0');
    readonly video1El = viewChild<ElementRef<HTMLVideoElement>>('video1');

    // Signals, since they are changed from fetch() and MSE callbacks (zoneless)
    // MJPEG or JPEG snapshots are shown in cell instead of video
    readonly imageMode = signal(false);
    // Index of shown video element, -1 if none
    readonly visibleVideo = signal(-1);
    // No MP4 video received during NO_VIDEO_TIMEOUT_MSEC
    readonly noVideo = signal(false);

    private viewInitialized = false;
    // Incremented on each (re)start. Stale async callbacks check it and exit.
    private session = 0;
    private abortController: AbortController | null = null;
    private player: MsePlayer | null = null;
    private playerVideo = 0;
    // Previous (failed or stopped) player showing its last frame until the new one starts playing
    private lastFramePlayer: MsePlayer | null = null;
    private lastFrameVideo = 0;
    private lastFrameTimer: any = null;
    private noVideoTimer: any = null;
    private lastVideoMs = 0;
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
        if (!this.viewInitialized)
            return;
        if (changes['cameraId'] || changes['snapshotMode'] || changes['mux']) {
            this.stop();
            this.start();
        } else if (changes['audio']) {
            // MP4 stream with/without audio track. Keep the last frame shown while reconnecting.
            if (this.mjpegStarted)
                this.updateWavAudio();
            else if (this.mux() == null && !this.snapshotMode())
                this.start(true);
        }
        // Height changes do not require reconnection
    }

    ngOnDestroy() {
        this.stop();
    }

    // keepFrame - keep the last video frame shown until new player starts playing (reconnect)
    private start(keepFrame = false) {
        this.stop(keepFrame);
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

    private stop(keepFrame = false) {
        this.session++;
        if (this.reconnectTimer != null) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.stopMp4(keepFrame);
        // Reconnection keeps watchdog running, otherwise it would be reset on each attempt
        if (!keepFrame)
            this.stopNoVideoWatchdog();
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
        this.startNoVideoWatchdog();
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
            let lastDataMs = Date.now();
            const stallTimer = setInterval(() => {
                if (Date.now() - lastDataMs > STALL_TIMEOUT_MSEC) {
                    console.warn(`${this.getLogPrefix()}: no data during ${STALL_TIMEOUT_MSEC / 1000} sec. Reconnecting.`);
                    abortController.abort();
                }
            }, 1000);
            try {
                while (session === this.session) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    lastDataMs = Date.now();
                    if (failed != null)
                        throw failed;
                    this.onVideoReceived();
                    this.player?.append(value);
                }
            } finally {
                clearInterval(stallTimer);
            }
            reader.cancel().catch(() => { });
            // Stream ended by server (e.g. camera resolution changed). Reconnect.
        } catch (e) {
            if (session !== this.session)
                return;
            console.warn(`${this.getLogPrefix()}: MP4 live view error`, e);
        }
        this.scheduleReconnect(session);
    }

    // Previous player keeps showing its last frame (e.g. after decoding error) until the new one plays
    private createPlayer(mimeType: string, session: number, onError: (e: any) => void) {
        this.retirePlayer();
        const index = this.lastFramePlayer != null ? 1 - this.lastFrameVideo : this.playerVideo;
        const video = (index === 0 ? this.video0El() : this.video1El()).nativeElement;
        video.addEventListener('loadedmetadata', () => {
            if (session === this.session)
                console.info(`${this.getLogPrefix()}: live view MP4 ${MsePlayer.getCodecName(mimeType)} ${video.videoWidth}x${video.videoHeight} (${mimeType})`);
        }, { once: true });
        this.playerVideo = index;
        // Browser allows sound after user interaction (audio button click)
        video.muted = !this.audio();
        const player = new MsePlayer(video, mimeType, () => {
            if (session !== this.session || player !== this.player)
                return;
            this.visibleVideo.set(index);
            // Give view time to show new video before the old one is cleared
            const lastFramePlayer = this.lastFramePlayer;
            setTimeout(() => {
                if (lastFramePlayer === this.lastFramePlayer)
                    this.disposeLastFrame();
            }, 200);
        }, e => {
            if (session === this.session)
                onError(e);
        });
        this.player = player;
    }

    // Keeps current player showing the last frame if it is shown, disposes otherwise
    private retirePlayer() {
        const player = this.player;
        if (player == null)
            return;
        this.player = null;
        if (this.visibleVideo() !== this.playerVideo) {
            player.dispose();
            return;
        }
        this.disposeLastFrame();
        this.lastFramePlayer = player;
        this.lastFrameVideo = this.playerVideo;
        this.lastFrameTimer = setTimeout(() => {
            this.lastFrameTimer = null;
            this.disposeLastFrame();
        }, LAST_FRAME_TIMEOUT_MSEC);
    }

    private disposeLastFrame() {
        if (this.lastFrameTimer != null) {
            clearTimeout(this.lastFrameTimer);
            this.lastFrameTimer = null;
        }
        if (this.lastFramePlayer == null)
            return;
        this.lastFramePlayer.dispose();
        this.lastFramePlayer = null;
        if (this.visibleVideo() === this.lastFrameVideo)
            this.visibleVideo.set(-1);
    }

    private scheduleReconnect(session: number) {
        if (session !== this.session)
            return;
        this.stopMp4(true);
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (session === this.session)
                this.start(true);
        }, RECONNECT_DELAY_MSEC);
    }

    private stopMp4(keepFrame = false) {
        if (this.abortController != null) {
            this.abortController.abort();
            this.abortController = null;
        }
        if (keepFrame) {
            this.retirePlayer();
        } else {
            this.player?.dispose();
            this.player = null;
            this.disposeLastFrame();
            this.visibleVideo.set(-1);
        }
    }

    // -------------------------------------------------------------------------
    // MP4 from multiplexed stream of several cameras
    // -------------------------------------------------------------------------

    private startMux(mux: LiveMux, session: number) {
        this.startNoVideoWatchdog();
        let lastInit: { mimeType: string, data: Uint8Array<ArrayBuffer> } | null = null;
        const onPlayerError = (e: any) => {
            console.warn(`${this.getLogPrefix()}: MP4 live view error`, e);
            // Recreate decoder. Last frame is shown meanwhile. Frames before the next key frame are skipped by browser.
            if (lastInit != null)
                this.createMuxPlayer(lastInit.mimeType, lastInit.data, session, onPlayerError);
        };
        this.unsubscribeMux = mux.subscribe(this.cameraId(), {
            onInit: (mimeType, data, continuous) => {
                if (session !== this.session)
                    return;
                if (!MsePlayer.isTypeSupported(mimeType)) {
                    this.startMuxFallback(`'${mimeType}' is not supported by the browser`);
                    return;
                }
                const sameType = lastInit?.mimeType === mimeType;
                lastInit = { mimeType, data };
                if (continuous && sameType && this.player != null) {
                    // E.g. resolution changed (Eufy does it every few seconds). MSE accepts new init
                    // segment in the same SourceBuffer, recreating player would blank the video.
                    this.player.append(data);
                } else {
                    this.createMuxPlayer(mimeType, data, session, onPlayerError);
                }
            },
            onMedia: data => {
                if (session !== this.session)
                    return;
                this.onVideoReceived();
                this.player?.append(data);
            },
            onError: (status, message) => {
                if (session !== this.session)
                    return;
                if (status === 503) {
                    // No video yet. INIT is sent when camera video is available.
                    console.warn(`${this.getLogPrefix()}: ${message}`);
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
        console.info(`${this.getLogPrefix()}: live view JPEG snapshots (${reason})`);
        this.stop();
        this.startSnapshots(++this.session);
    }

    // -------------------------------------------------------------------------
    // No video watchdog
    // -------------------------------------------------------------------------

    // Does nothing if already running or black frame is shown
    private startNoVideoWatchdog() {
        if (this.noVideoTimer != null || this.noVideo())
            return;
        this.lastVideoMs = Date.now();
        this.scheduleNoVideoCheck(NO_VIDEO_TIMEOUT_MSEC);
    }

    private scheduleNoVideoCheck(delayMsec: number) {
        this.noVideoTimer = setTimeout(() => {
            this.noVideoTimer = null;
            const elapsed = Date.now() - this.lastVideoMs;
            if (elapsed < NO_VIDEO_TIMEOUT_MSEC) {
                this.scheduleNoVideoCheck(NO_VIDEO_TIMEOUT_MSEC - elapsed);
                return;
            }
            console.warn(`${this.getLogPrefix()}: no video during ${NO_VIDEO_TIMEOUT_MSEC / 1000} sec`);
            this.noVideo.set(true);
        }, delayMsec);
    }

    // Called on each received chunk. Timer is not recreated, only the time is updated.
    private onVideoReceived() {
        this.lastVideoMs = Date.now();
        if (this.noVideo()) {
            this.noVideo.set(false);
            this.startNoVideoWatchdog();
        }
    }

    private stopNoVideoWatchdog() {
        if (this.noVideoTimer != null) {
            clearTimeout(this.noVideoTimer);
            this.noVideoTimer = null;
        }
        this.noVideo.set(false);
    }

    // E.g. 'Camera "Front yard" (182399567)'
    private getLogPrefix(): string {
        const name = this.cameraName();
        return name ? `Camera "${name}" (${this.cameraId()})` : `Camera ${this.cameraId()}`;
    }

    getLiveMp4Url(): string {
        const audio = this.audio() ? '&audio=1' : '';
        return `${this.loginService.server.url}/axis-cgi/media.cgi?container=mp4&cameraId=${this.cameraId()}${audio}&token=${this.loginService.login.token}`;
    }

    // -------------------------------------------------------------------------
    // MJPEG (fallback)
    // -------------------------------------------------------------------------

    private startMjpeg(reason: string) {
        console.info(`${this.getLogPrefix()}: live view MJPEG (${reason})`);
        this.mjpegStarted = true;
        this.imageMode.set(true);
        this.cellEl().nativeElement.style.backgroundImage = "url('" + this.getLiveImage() + "')";
        this.updateWavAudio();
    }

    private stopMjpeg() {
        this.mjpegStarted = false;
        this.updateWavAudio();
        this.cellEl().nativeElement.style.backgroundImage = 'none';
        // HACK: Preventing Chrome keeping/leaking connection for MJPEG stream.
        // http://stackoverflow.com/questions/16137381/html5-video-element-request-stay-pending-forever-on-chrome
        // Sideeffect: makes Mozilla unwanted refreshes.
        this.windowRef.nativeWindow.stop();
    }

    // WAV audio stream is played along with MJPEG if audio is enabled
    private updateWavAudio() {
        const wav = this.wavEl()?.nativeElement;
        if (wav == null)
            return;
        const play = this.mjpegStarted && this.audio();
        if (play && !wav.getAttribute('src')) {
            wav.src = this.getWavUrl();
            wav.play().catch(e => console.warn(`${this.getLogPrefix()}: WAV audio error`, e));
        } else if (!play && wav.getAttribute('src')) {
            wav.removeAttribute('src');
            wav.load();
        }
    }

    getWavUrl(): string {
        return `${this.loginService.server.url}/axis-cgi/audio/receive.wav?cameraId=${this.cameraId()}&token=${this.loginService.login.token}`;
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
                } catch (e) {
                    if (session !== this.session)
                        return;
                    console.warn(`${this.getLogPrefix()}: JPEG snapshot error`, e);
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
