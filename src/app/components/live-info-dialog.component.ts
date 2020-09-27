import { Component } from '@angular/core';

@Component({
    template: `
    <h2 mat-dialog-title>Live view keyboard control</h2>
    <mat-dialog-content class="mat-typography">
      <div><b>Space bar</b> - full/normal screen</div>
      <div>Keys <b>Left/Right</b> - next/previous camera/page</div>
      <div style="margin-top:10px"><b>PTZ</b></div>
      <div>Keys <b>W/A/S/D</b> - pan-tilt</div>
      <div>Keys <b>+/-</b> - optical zoom in/out</div>
      <div>Keys <b>F/N</b> - focus far/near</div>
      <div>Keys <b>O/C</b> - iris open/close</div>
      <div>Keys <b>1..9</b> - presets</div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
    `
  })
  export class LiveInfoDialogComponent {}
  