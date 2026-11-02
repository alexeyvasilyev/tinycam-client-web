// Landscape multiple cameras layouts. Same as in tinyCam Monitor app (res/layout/liveview*.xml).

export interface LiveLayoutCell {
    col: number;
    row: number;
    colSpan: number;
    rowSpan: number;
}

export interface LiveLayout {
    id: string;
    name: string;
    cols: number;
    rows: number;
    // In camera order
    cells: LiveLayoutCell[];
}

// Browsers allow only ~6 simultaneous HTTP/1.1 connections per server. Each MJPEG stream keeps
// one connection open, so JPEG snapshots are shown instead of MJPEG in bigger layouts.
// MP4 streams of all cameras on the page are multiplexed into a single connection.
export const MAX_MJPEG_STREAMS = 4;

function cell(col: number, row: number, colSpan = 1, rowSpan = 1): LiveLayoutCell {
    return { col, row, colSpan, rowSpan };
}

function grid(cols: number, rows: number): LiveLayoutCell[] {
    const cells: LiveLayoutCell[] = [];
    for (let row = 0; row < rows; row++)
        for (let col = 0; col < cols; col++)
            cells.push(cell(col, row));
    return cells;
}

function row(rowIndex: number, cols: number): LiveLayoutCell[] {
    return Array.from({ length: cols }, (_, col) => cell(col, rowIndex));
}

export const LIVE_LAYOUTS: LiveLayout[] = [
    { id: '2h',    name: '2 cameras',        cols: 2, rows: 1, cells: grid(2, 1) },
    { id: '2x2',   name: '4 cameras',        cols: 2, rows: 2, cells: grid(2, 2) },
    // 1 big top-left, 2 small on the right, 3 small at the bottom
    { id: '1b5s',  name: '6 cameras (1+5)',  cols: 3, rows: 3, cells: [
        cell(0, 0, 2, 2), cell(2, 0), cell(2, 1), ...row(2, 3)] },
    { id: '3x2',   name: '6 cameras (3x2)',  cols: 3, rows: 2, cells: grid(3, 2) },
    // 3 big, 4 small at the bottom right
    { id: '3b4s',  name: '7 cameras (3+4)',  cols: 4, rows: 4, cells: [
        cell(0, 0, 2, 2), cell(2, 0, 2, 2), cell(0, 2, 2, 2), cell(2, 2), cell(3, 2), cell(2, 3), cell(3, 3)] },
    { id: '3x3',   name: '9 cameras',        cols: 3, rows: 3, cells: grid(3, 3) },
    // 2 big in the middle, 4 small at the top, 4 small at the bottom
    { id: '2b8s',  name: '10 cameras (2+8)', cols: 4, rows: 4, cells: [
        cell(0, 1, 2, 2), cell(2, 1, 2, 2), ...row(0, 4), ...row(3, 4)] },
    // 1 big in the center surrounded by 12 small
    { id: '1b12s', name: '13 cameras (1+12)', cols: 4, rows: 4, cells: [
        cell(1, 1, 2, 2), ...row(0, 4), cell(0, 1), cell(0, 2), cell(3, 1), cell(3, 2), ...row(3, 4)] },
    { id: '4x4',   name: '16 cameras',       cols: 4, rows: 4, cells: grid(4, 4) },
    { id: '5x5',   name: '25 cameras',       cols: 5, rows: 5, cells: grid(5, 5) },
];

export const DEFAULT_LIVE_LAYOUT_ID = '2x2';

export function getLiveLayout(id: string): LiveLayout {
    return LIVE_LAYOUTS.find(l => l.id === id) ?? LIVE_LAYOUTS.find(l => l.id === DEFAULT_LIVE_LAYOUT_ID);
}
