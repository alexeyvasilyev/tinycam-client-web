import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';

// Replacement for ngx-moment's amTimeAgo / amCalendar pipes (moment.js not needed).

const relativeTimeFormat = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

/**
 * Relative time, e.g. "5 minutes ago". Refreshes itself while shown.
 */
@Pipe({ name: 'timeAgo', pure: false })
export class TimeAgoPipe implements PipeTransform, OnDestroy {

    private timer: any = null;
    private lastTime = NaN;
    private lastText = '';

    constructor(private changeDetectorRef: ChangeDetectorRef) {
    }

    transform(value: Date | string | number | null | undefined): string {
        if (value == null)
            return '';
        const time = new Date(value).getTime();
        if (isNaN(time))
            return '';
        if (time !== this.lastTime || this.timer == null) {
            this.lastTime = time;
            this.lastText = TimeAgoPipe.format(time);
            this.scheduleUpdate(time);
        }
        return this.lastText;
    }

    ngOnDestroy() {
        this.clearTimer();
    }

    private scheduleUpdate(time: number) {
        this.clearTimer();
        const ageSec = Math.abs(Date.now() - time) / 1000;
        // Update often for recent times, rarely for old ones
        const delaySec = ageSec < 60 ? 10 : ageSec < 3600 ? 30 : 300;
        this.timer = setTimeout(() => {
            this.timer = null;
            const text = TimeAgoPipe.format(this.lastTime);
            if (text !== this.lastText) {
                this.lastText = text;
                this.changeDetectorRef.markForCheck();
            }
            this.scheduleUpdate(this.lastTime);
        }, delaySec * 1000);
    }

    private clearTimer() {
        if (this.timer != null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    static format(time: number): string {
        const diffSec = Math.round((time - Date.now()) / 1000);
        const absSec = Math.abs(diffSec);
        if (absSec < 45)
            return relativeTimeFormat.format(0, 'second'); // "now"
        if (absSec < 45 * 60)
            return relativeTimeFormat.format(Math.round(diffSec / 60), 'minute');
        if (absSec < 22 * 3600)
            return relativeTimeFormat.format(Math.round(diffSec / 3600), 'hour');
        return relativeTimeFormat.format(Math.round(diffSec / 86400), 'day');
    }
}

/**
 * Calendar time, e.g. "Today at 14:05", "Yesterday at 9:30". Older dates are shown in full.
 */
@Pipe({ name: 'calendarTime' })
export class CalendarTimePipe implements PipeTransform {

    transform(value: Date | string | number | null | undefined): string {
        if (value == null)
            return '';
        const date = new Date(value);
        if (isNaN(date.getTime()))
            return '';
        const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
        const today = new Date();
        const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
        if (CalendarTimePipe.isSameDay(date, today))
            return `Today at ${time}`;
        if (CalendarTimePipe.isSameDay(date, yesterday))
            return `Yesterday at ${time}`;
        return date.toLocaleString();
    }

    private static isSameDay(a: Date, b: Date): boolean {
        return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    }
}
