// Live view of several cameras as fragmented MP4 streams multiplexed into a single HTTP connection
// (/axis-cgi/media.cgi?container=mp4mux&cameraId=1,2,3). Browsers allow only ~6 simultaneous
// HTTP/1.1 connections per server, so a separate stream for each camera is not possible.
//
// Body is a sequence of packets: type (1 byte), stream index (1 byte, camera position in list),
// payload length (4 bytes, big endian), payload.
//   INIT  - mime type length (2 bytes), mime type, fMP4 init segment. Sent again on resolution
//           change with continuous timeline, so it can be appended into the same SourceBuffer.
//   MEDIA - fMP4 media segment.
//   ERROR - status (2 bytes, HTTP status code), message.

const TYPE_INIT = 1;
const TYPE_MEDIA = 2;
const TYPE_ERROR = 3;
const PACKET_HEADER_SIZE = 6;
const RECONNECT_DELAY_MSEC = 2000;
// Connection is reconnected if no packets received during (e.g. phone Wi-Fi reconnected,
// TCP connection is not closed and read() would wait for TCP timeout ~1 min)
const STALL_TIMEOUT_MSEC = 10000;

export interface LiveMuxListener {
    // continuous - media timeline continues the previous INIT of this stream (e.g. resolution changed).
    // Otherwise timeline restarted (first INIT, reconnect, video restarted after 503) and decoder should be reset.
    onInit(mimeType: string, initSegment: Uint8Array<ArrayBuffer>, continuous: boolean): void;
    onMedia(mediaSegment: Uint8Array<ArrayBuffer>): void;
    // 404 - camera not found, 415 - video codec is not H.264/H.265, 503 - no video from camera,
    // other - whole multiplexed stream failed (e.g. 400 from old server not supporting it).
    onError(status: number, message: string): void;
}

export class LiveMux {

    private readonly listeners = new Map<number, LiveMuxListener>();
    // Last INIT packet of each stream for listeners subscribed later
    private readonly lastInit = new Map<number, { mimeType: string, data: Uint8Array<ArrayBuffer> }>();
    // Incremented on each (re)start. Stale async callbacks check it and exit.
    private session = 0;
    private abortController: AbortController | null = null;
    private reconnectTimer: any = null;
    private readonly textDecoder = new TextDecoder();

    constructor(private readonly url: string, readonly cameraIds: number[]) {
    }

    static createUrl(serverUrl: string, token: string, cameraIds: number[]): string {
        return `${serverUrl}/axis-cgi/media.cgi?container=mp4mux&cameraId=${cameraIds.join(',')}&token=${token}`;
    }

    start() {
        this.stop();
        this.run(++this.session);
    }

    stop() {
        this.session++;
        if (this.reconnectTimer != null) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.abortController != null) {
            this.abortController.abort();
            this.abortController = null;
        }
        this.lastInit.clear();
    }

    // Returns unsubscribe function
    subscribe(cameraId: number, listener: LiveMuxListener): () => void {
        const index = this.cameraIds.indexOf(cameraId);
        if (index < 0)
            return () => { };
        this.listeners.set(index, listener);
        const init = this.lastInit.get(index);
        if (init != null)
            listener.onInit(init.mimeType, init.data, false);
        return () => {
            if (this.listeners.get(index) === listener)
                this.listeners.delete(index);
        };
    }

    private async run(session: number) {
        const abortController = new AbortController();
        this.abortController = abortController;
        try {
            const response = await fetch(this.url, { signal: abortController.signal, cache: 'no-store' });
            if (session !== this.session)
                return;
            if (!response.ok || response.body == null) {
                const message = await response.text().catch(() => '');
                console.warn(`Live view MP4 mux: HTTP ${response.status} ${message}`);
                // Not supported by server. Do not retry.
                if (response.status === 400 || response.status === 404) {
                    this.listeners.forEach(l => l.onError(response.status, message));
                    return;
                }
                throw new Error(`HTTP ${response.status}`);
            }
            console.info(`Live view MP4 mux: cameras ${this.cameraIds.join(',')}`);
            await this.read(response.body.getReader(), session, abortController);
        } catch (e) {
            if (session !== this.session)
                return;
            console.warn('Live view MP4 mux error', e);
        }
        if (session !== this.session)
            return;
        // Reconnect. Server sends INIT packets again.
        this.lastInit.clear();
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (session === this.session)
                this.run(++this.session);
        }, RECONNECT_DELAY_MSEC);
    }

    private async read(reader: ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>, session: number, abortController: AbortController) {
        let lastDataMs = Date.now();
        const stallTimer = setInterval(() => {
            if (Date.now() - lastDataMs > STALL_TIMEOUT_MSEC) {
                console.warn(`Live view MP4 mux: no data during ${STALL_TIMEOUT_MSEC / 1000} sec. Reconnecting.`);
                abortController.abort();
            }
        }, 1000);
        try {
            await this.readPackets(reader, session, () => lastDataMs = Date.now());
        } finally {
            clearInterval(stallTimer);
        }
    }

    private async readPackets(reader: ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>, session: number, onData: () => void) {
        let buffer = new Uint8Array(0);
        while (session === this.session) {
            const { done, value } = await reader.read();
            if (done)
                break;
            onData();
            if (value == null || value.length === 0)
                continue;
            buffer = LiveMux.concat(buffer, value);
            let offset = 0;
            while (buffer.length - offset >= PACKET_HEADER_SIZE) {
                const view = new DataView(buffer.buffer, buffer.byteOffset + offset);
                const length = view.getUint32(2);
                if (buffer.length - offset < PACKET_HEADER_SIZE + length)
                    break;
                const type = buffer[offset];
                const index = buffer[offset + 1];
                const payload = buffer.subarray(offset + PACKET_HEADER_SIZE, offset + PACKET_HEADER_SIZE + length);
                offset += PACKET_HEADER_SIZE + length;
                if (session !== this.session)
                    break;
                this.dispatch(type, index, payload);
            }
            buffer = buffer.subarray(offset);
        }
        reader.cancel().catch(() => { });
    }

    private dispatch(type: number, index: number, payload: Uint8Array<ArrayBuffer>) {
        const listener = this.listeners.get(index);
        switch (type) {
            case TYPE_INIT: {
                const mimeLength = (payload[0] << 8) | payload[1];
                const mimeType = this.textDecoder.decode(payload.subarray(2, 2 + mimeLength));
                const data = payload.subarray(2 + mimeLength);
                const continuous = this.lastInit.has(index);
                this.lastInit.set(index, { mimeType, data });
                listener?.onInit(mimeType, data, continuous);
                break;
            }
            case TYPE_MEDIA:
                listener?.onMedia(payload);
                break;
            case TYPE_ERROR: {
                const status = (payload[0] << 8) | payload[1];
                // Server restarts timeline with the next INIT
                this.lastInit.delete(index);
                listener?.onError(status, this.textDecoder.decode(payload.subarray(2)));
                break;
            }
        }
    }

    private static concat(a: Uint8Array<ArrayBuffer>, b: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
        if (a.length === 0)
            return b;
        const result = new Uint8Array(a.length + b.length);
        result.set(a, 0);
        result.set(b, a.length);
        return result;
    }
}
