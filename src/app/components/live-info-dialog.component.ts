import { Component } from '@angular/core';

@Component({
    template: `
    <h2 mat-dialog-title>PTZ camera keyboard control</h2>
    <mat-dialog-content class="mat-typography">
      <div>Keys <b>W/A/S/D/Left/Right</b> - pan-tilt</div>
      <div>Keys <b>+/-</b> - optical zoom in/out</div>
      <div>Keys <b>F/N</b> - focus far/near</div>
      <div>Keys <b>O/C</b> - iris open/close</div>
      <div>Keys <b>1..9</b> - presets</div>
      <div><b>Space bar</b> - full/normal screen</div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
    `
  })
  export class LiveInfoDialogComponent {}
  