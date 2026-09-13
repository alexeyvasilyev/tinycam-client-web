import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    template: `
    <h2 mat-dialog-title>Share livestream</h2>
    <mat-dialog-content class="mat-typography">
      <div class="mat-small" style="margin-bottom:4px;">RTSP stream</div>
      <div style="display:flex; align-items:center; gap:8px;">
        <mat-form-field color="accent" style="flex:1;">
          <input matInput [(ngModel)]="rtspUrl" name="rtspUrl" (focus)="onFocus($event)">
        </mat-form-field>
        <button mat-button color="accent" (click)="copy(rtspUrl)">Copy</button>
      </div>
      <div class="mat-small" style="margin:12px 0 4px;">MJPEG stream</div>
      <div style="display:flex; align-items:center; gap:8px;">
        <mat-form-field color="accent" style="flex:1;">
          <input matInput [(ngModel)]="mjpegUrl" name="mjpegUrl" (focus)="onFocus($event)">
        </mat-form-field>
        <button mat-button color="accent" (click)="copy(mjpegUrl)">Copy</button>
      </div>
      <div class="mat-small" style="color: rgba(0,0,0,.54); margin-top:8px;">Note that token is not valid if web server restarted</div>
      <div class="mat-small" style="margin-top:4px;"><a href="https://github.com/alexeyvasilyev/tinycam-api" target="_blank" rel="noopener">https://github.com/alexeyvasilyev/tinycam-api</a></div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button
        mat-raised-button
        mat-dialog-close>Close</button>
    </mat-dialog-actions>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class LiveShareRtspDialogComponent {

    rtspUrl: string;
    mjpegUrl: string;

    constructor(
        public dialogRef: MatDialogRef<LiveShareRtspDialogComponent>,
        private snackBar: MatSnackBar,
        @Inject(MAT_DIALOG_DATA) public data: { rtspUrl: string, mjpegUrl: string }) {
        this.rtspUrl = data.rtspUrl;
        this.mjpegUrl = data.mjpegUrl;
    }

    copy(text: string): void {
        navigator.clipboard.writeText(text).then(() => {
            this.snackBar.open(`Link copied`, null, {
                duration: 4000,
            });
        });
    }

    onFocus(event: FocusEvent): void {
        const input = event.target as HTMLInputElement;
        input.select();
        // Some browsers scroll the input to show the end of the selection;
        // force it back to the start so the beginning of a long URL is visible.
        setTimeout(() => { input.scrollLeft = 0; });
    }

}
