// Plays fragmented MP4 (init segment followed by media segments) via Media Source Extensions
// keeping playback close to the live edge.

// Keep playback this close to the live edge (sec)
const MAX_LATENCY_SEC = 1.5;
const TARGET_LATENCY_SEC = 0.3;
// Keep this much already played video in SourceBuffer (sec)
const MAX_BUFFER_SEC = 30;
const KEEP_BUFFER_SEC = 10;

export class MsePlayer {

    private mediaSource: MediaSource | null = null;
    private objectUrl: string | null = null;
    private sourceBuffer: SourceBuffer | null = null;
    private readonly queue: Uint8Array<ArrayBuffer>[] = [];
    private playing = false;
    private disposed = false;
    // Stopped on error, but video element still shows the last frame until dispose()
    private failed = false;
    // Decoding errors are reported by video element, not by SourceBuffer
    private readonly onVideoError = () => {
        const error = this.video.error;
        this.fail(new Error(`Video error ${error?.code ?? '?'}: ${error?.message || 'unknown'}`));
    };

    // onPlaying is called when the first frame is shown, onError on any MSE error (once).
    // After error player stops, but keeps the last frame shown. Owner must call dispose().
    constructor(
        private readonly video: HTMLVideoElement,
        private readonly mimeType: string,
        private readonly onPlaying: () => void,
        private readonly onError: (e: any) => void) {
        const MediaSourceImpl = MsePlayer.getMediaSourceImpl();
        const mediaSource = new MediaSourceImpl();
        this.mediaSource = mediaSource;
        mediaSource.addEventListener('sourceopen', () => {
            if (this.disposed || this.failed)
                return;
            try {
                const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
                this.sourceBuffer = sourceBuffer;
                sourceBuffer.addEventListener('updateend', () => {
                    if (this.disposed || this.failed)
                        return;
                    this.keepUpWithLiveEdge();
                    this.appendNext();
                });
                sourceBuffer.addEventListener('error', () => this.fail(new Error('SourceBuffer error')));
                this.appendNext();
            } catch (e) {
                this.fail(e);
            }
        }, { once: true });
        // Required by ManagedMediaSource
        (video as any).disableRemotePlayback = true;
        video.addEventListener('error', this.onVideoError);
        this.objectUrl = URL.createObjectURL(mediaSource);
        video.src = this.objectUrl;
        this.play();
    }

    static getMediaSourceImpl(): typeof MediaSource | null {
        const w = window as any;
        // ManagedMediaSource is the only MSE implementation available on iOS 17.1+
        return w.ManagedMediaSource || w.MediaSource || null;
    }

    static isTypeSupported(mimeType: string): boolean {
        return MsePlayer.getMediaSourceImpl()?.isTypeSupported(mimeType) ?? false;
    }

    // E.g. 'video/mp4; codecs="avc1.64001F"' -> 'H.264'
    static getCodecName(mimeType: string): string {
        const codecs = /codecs="?([^",;]+)/i.exec(mimeType)?.[1] ?? '';
        if (/^avc[13]\./i.test(codecs))
            return 'H.264';
        if (/^(hvc1|hev1)\./i.test(codecs))
            return 'H.265';
        return codecs || 'unknown codec';
    }

    append(chunk: Uint8Array<ArrayBuffer>) {
        if (this.disposed || this.failed || chunk.length === 0)
            return;
        this.queue.push(chunk);
        this.appendNext();
    }

    dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        this.queue.length = 0;
        this.video.removeEventListener('error', this.onVideoError);
        if (this.objectUrl != null) {
            this.video.removeAttribute('src');
            this.video.load();
        }
        if (this.mediaSource != null && this.mediaSource.readyState === 'open') {
            try {
                this.mediaSource.endOfStream();
            } catch (e) { }
        }
        this.mediaSource = null;
        this.sourceBuffer = null;
        if (this.objectUrl != null) {
            URL.revokeObjectURL(this.objectUrl);
            this.objectUrl = null;
        }
    }

    private fail(e: any) {
        if (this.disposed || this.failed)
            return;
        this.failed = true;
        this.queue.length = 0;
        this.video.removeEventListener('error', this.onVideoError);
        this.onError(e);
    }

    private appendNext() {
        const sourceBuffer = this.sourceBuffer;
        if (this.disposed || this.failed || sourceBuffer == null || sourceBuffer.updating || this.queue.length === 0)
            return;
        // 'error' event is dispatched asynchronously, appendBuffer() would throw InvalidStateError
        if (this.video.error != null) {
            this.onVideoError();
            return;
        }
        try {
            if (!this.trimBuffer(sourceBuffer))
                sourceBuffer.appendBuffer(MsePlayer.concat(this.queue.splice(0, this.queue.length)));
        } catch (e) {
            this.fail(e);
        }
    }

    // Removes already played video. Returns true if removal started.
    private trimBuffer(sourceBuffer: SourceBuffer): boolean {
        const buffered = sourceBuffer.buffered;
        if (buffered.length === 0)
            return false;
        const start = buffered.start(0);
        if (this.video.currentTime - start > MAX_BUFFER_SEC) {
            sourceBuffer.remove(start, this.video.currentTime - KEEP_BUFFER_SEC);
            return true;
        }
        return false;
    }

    private keepUpWithLiveEdge() {
        const buffered = this.sourceBuffer.buffered;
        if (buffered.length === 0)
            return;
        const video = this.video;
        const end = buffered.end(buffered.length - 1);
        if (!this.playing) {
            this.playing = true;
            video.currentTime = Math.max(buffered.start(buffered.length - 1), end - TARGET_LATENCY_SEC);
            this.play();
            this.onPlaying();
        } else if (end - video.currentTime > MAX_LATENCY_SEC) {
            // Browser tab was in background or network stalled. Jump to live.
            video.currentTime = end - TARGET_LATENCY_SEC;
        }
        if (video.paused)
            this.play();
    }

    // Autoplay with sound may be blocked by browser (no user interaction yet). Play muted then.
    private play() {
        const video = this.video;
        video.play().catch(e => {
            if (e?.name === 'NotAllowedError' && !video.muted && !this.disposed) {
                console.warn('Autoplay with sound is not allowed by browser. Playing muted.');
                video.muted = true;
                video.play().catch(() => { });
            }
            // Otherwise autoplay will start once data available
        });
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
}
