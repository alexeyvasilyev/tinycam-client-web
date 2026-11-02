import { AfterViewInit, Component, ElementRef, SimpleChanges, ChangeDetectionStrategy, OnChanges, OnDestroy, input, signal, viewChild } from '@angular/core';
import { LoginService } from '../services';
import { WindowRefService } from '../services';
import StorageUtils from '../utils-storage';

// Live view plays progressive (fragmented) MP4 stream via Media Source Extensions.
// MJPEG is used if selected in Admin settings ("Use MJPEG codec for live view").
// Falls back to MJPEG if MSE or camera codec (e.g. H.265) is not supported by the browser,
// or if the camera does not provide H.264/H.265 (server responds with 415).

// Keep playback this close to the live edge (sec)
const MAX_LATENCY_SEC = 1.5;
const TARGET_LATENCY_SEC = 0.3;
// Keep this much already played video in SourceBuffer (sec)
const MAX_BUFFER_SEC = 30;
const KEEP_BUFFER_SEC = 10;
const RECONNECT_DELAY_MSEC = 2000;

@Component({
    selector: 'live',
    template: `
      <!-- Classes live-view-loading and live-view are not loaded in Angular 12.0.0. Bug? -->
      <div animate.enter="app-fade-in" style="cursor: pointer; background-repeat: no-repeat; background-position: center; background-size: contain; background-image: url('assets/img/loading.png');">
        <video #video muted autoplay playsinline disablepictureinpicture
          style="display: block; width: 100%; object-fit: contain; background: transparent;"
          [style.display]="mjpegMode() ? 'none' : 'block'"
          [style.visibility]="playing() ? 'visible' : 'hidden'"
          [style.height.px]="viewHeightPx()"></video>
        <div #cell style="background-repeat: no-repeat; background-position: center; background-size: contain;"
          [style.display]="mjpegMode() ? 'block' : 'none'"
          [style.height.px]="viewHeightPx()"></div>
      </div>
    `,
    changeDetection: ChangeDetectionStrategy.Eager
})

export class LiveComponent implements AfterViewInit, OnChanges, OnDestroy {

    readonly viewHeightPx = input<number>(100); // Hack for Safari
    readonly cameraId = input<number>(undefined);
    readonly cellEl = viewChild<ElementRef>('cell');
    readonly videoEl = viewChild<ElementRef<HTMLVideoElement>>('video');

    // Signals, since they are changed from fetch() and MSE callbacks (zoneless)
    readonly mjpegMode = signal(false);
    readonly playing = signal(false);

    private viewInitialized = false;
    // Incremented on each (re)start. Stale async callbacks check it and exit.
    private session = 0;
    private abortController: AbortController | null = null;
    private mediaSource: MediaSource | null = null;
    private objectUrl: string | null = null;
    private reconnectTimer: any = null;

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
        if (!this.viewInitialized || !changes['cameraId'])
            return;
        this.stop();
        this.start();
    }

    ngOnDestroy() {
        this.stop();
    }

    private start() {
        this.stop();
        const MediaSourceImpl = LiveComponent.getMediaSourceImpl();
        // MJPEG selected in Admin settings or MSE not supported
        if (StorageUtils.getUseMjpegLiveView() || MediaSourceImpl == null) {
            this.startMjpeg(MediaSourceImpl == null ? 'Media Source Extensions not supported by the browser' : 'selected in Admin settings');
            return;
        }
        this.mjpegMode.set(false);
        this.startMp4(MediaSourceImpl, ++this.session);
    }

    private stop() {
        this.session++;
        this.playing.set(false);
        if (this.reconnectTimer != null) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.stopMp4();
        if (this.mjpegMode())
            this.stopMjpeg();
    }

    // -------------------------------------------------------------------------
    // MP4
    // -------------------------------------------------------------------------

    private static getMediaSourceImpl(): typeof MediaSource | null {
        const w = window as any;
        // ManagedMediaSource is the only MSE implementation available on iOS 17.1+
        return w.ManagedMediaSource || w.MediaSource || null;
    }

    private async startMp4(MediaSourceImpl: typeof MediaSource, session: number) {
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
            if (!MediaSourceImpl.isTypeSupported(mimeType)) {
                abortController.abort();
                this.startMjpeg(`'${mimeType}' is not supported by the browser`);
                return;
            }

            const sourceBuffer = await this.openMediaSource(MediaSourceImpl, mimeType, session);
            if (sourceBuffer == null)
                return;
            const video = this.videoEl().nativeElement;
            video.addEventListener('loadedmetadata', () => {
                if (session === this.session)
                    console.info(`Camera ${this.cameraId()}: live view MP4 ${LiveComponent.getCodecName(mimeType)} ${video.videoWidth}x${video.videoHeight} (${mimeType})`);
            }, { once: true });
            await this.pump(response.body.getReader(), sourceBuffer, session);
            // Stream ended by server (e.g. camera resolution changed). Reconnect.
        } catch (e) {
            if (session !== this.session)
                return;
            console.warn(`Camera ${this.cameraId()}: MP4 live view error`, e);
        }
        this.scheduleReconnect(session);
    }

    private openMediaSource(MediaSourceImpl: typeof MediaSource, mimeType: string, session: number): Promise<SourceBuffer | null> {
        return new Promise((resolve, reject) => {
            const video = this.videoEl().nativeElement;
            const mediaSource = new MediaSourceImpl();
            this.mediaSource = mediaSource;
            mediaSource.addEventListener('sourceopen', () => {
                if (session !== this.session) {
                    resolve(null);
                    return;
                }
                try {
                    resolve(mediaSource.addSourceBuffer(mimeType));
                } catch (e) {
                    reject(e);
                }
            }, { once: true });
            // Required by ManagedMediaSource
            (video as any).disableRemotePlayback = true;
            this.objectUrl = URL.createObjectURL(mediaSource);
            video.src = this.objectUrl;
            video.play().catch(() => { /* autoplay will start once data available */ });
        });
    }

    private async pump(reader: ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>, sourceBuffer: SourceBuffer, session: number) {
        const video = this.videoEl().nativeElement;
        const queue: Uint8Array<ArrayBuffer>[] = [];
        let failed: any = null;

        const appendNext = () => {
            if (session !== this.session || sourceBuffer.updating || queue.length === 0)
                return;
            try {
                if (!this.trimBuffer(sourceBuffer, video)) {
                    sourceBuffer.appendBuffer(LiveComponent.concat(queue.splice(0, queue.length)));
                }
            } catch (e) {
                failed = e;
            }
        };
        sourceBuffer.addEventListener('updateend', () => {
            if (session !== this.session)
                return;
            this.keepUpWithLiveEdge(sourceBuffer, video);
            appendNext();
        });
        sourceBuffer.addEventListener('error', () => failed = new Error('SourceBuffer error'));

        while (session === this.session) {
            const { done, value } = await reader.read();
            if (done)
                break;
            if (failed != null)
                throw failed;
            if (value && value.length > 0) {
                queue.push(value);
                appendNext();
            }
        }
        reader.cancel().catch(() => { });
    }

    // Removes already played video. Returns true if removal started.
    private trimBuffer(sourceBuffer: SourceBuffer, video: HTMLVideoElement): boolean {
        const buffered = sourceBuffer.buffered;
        if (buffered.length === 0)
            return false;
        const start = buffered.start(0);
        if (video.currentTime - start > MAX_BUFFER_SEC) {
            sourceBuffer.remove(start, video.currentTime - KEEP_BUFFER_SEC);
            return true;
        }
        return false;
    }

    private keepUpWithLiveEdge(sourceBuffer: SourceBuffer, video: HTMLVideoElement) {
        const buffered = sourceBuffer.buffered;
        if (buffered.length === 0)
            return;
        const end = buffered.end(buffered.length - 1);
        if (!this.playing()) {
            this.playing.set(true);
            video.currentTime = Math.max(buffered.start(buffered.length - 1), end - TARGET_LATENCY_SEC);
            video.play().catch(() => { });
        } else if (end - video.currentTime > MAX_LATENCY_SEC) {
            // Browser tab was in background or network stalled. Jump to live.
            video.currentTime = end - TARGET_LATENCY_SEC;
        }
        if (video.paused)
            video.play().catch(() => { });
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
        const video = this.videoEl()?.nativeElement;
        if (video != null && this.objectUrl != null) {
            video.removeAttribute('src');
            video.load();
        }
        if (this.mediaSource != null && this.mediaSource.readyState === 'open') {
            try {
                this.mediaSource.endOfStream();
            } catch (e) { }
        }
        this.mediaSource = null;
        if (this.objectUrl != null) {
            URL.revokeObjectURL(this.objectUrl);
            this.objectUrl = null;
        }
    }

    // E.g. 'video/mp4; codecs="avc1.64001F"' -> 'H.264'
    private static getCodecName(mimeType: string): string {
        const codecs = /codecs="?([^",;]+)/i.exec(mimeType)?.[1] ?? '';
        if (/^avc[13]\./i.test(codecs))
            return 'H.264';
        if (/^(hvc1|hev1)\./i.test(codecs))
            return 'H.265';
        return codecs || 'unknown codec';
    }

    private static concat(chunks: Uint8Array<ArrayBuffer>[]): Uint8Array<ArrayBuffer> {
        if (chunks.length === 1)
            return chunks[0];
        const total = chunks.reduce((sum, c) => sum + c.length, 0);
        const result = new Uint8Array(total);
        let offset = 0;
        for (const c of chunks) {
            result.set(c, offset);
            offset += c.length;
        }
        return result;
    }

    getLiveMp4Url(): string {
        return `${this.loginService.server.url}/axis-cgi/media.cgi?container=mp4&cameraId=${this.cameraId()}&token=${this.loginService.login.token}`;
    }

    // -------------------------------------------------------------------------
    // MJPEG (fallback)
    // -------------------------------------------------------------------------

    private startMjpeg(reason: string) {
        console.info(`Camera ${this.cameraId()}: live view MJPEG (${reason})`);
        this.mjpegMode.set(true);
        this.playing.set(true);
        this.cellEl().nativeElement.style.backgroundImage = "url('" + this.getLiveImage() + "')";
    }

    private stopMjpeg() {
        this.cellEl().nativeElement.style.backgroundImage = 'none';
        // HACK: Preventing Chrome keeping/leaking connection for MJPEG stream.
        // http://stackoverflow.com/questions/16137381/html5-video-element-request-stay-pending-forever-on-chrome
        // Sideeffect: makes Mozilla unwanted refreshes.
        this.windowRef.nativeWindow.stop();
    }

    getLiveImage(): string {
        return `${this.loginService.server.url}/axis-cgi/mjpg/video.cgi?cameraId=${this.cameraId()}&token=${this.loginService.login.token}`;
    }

}
