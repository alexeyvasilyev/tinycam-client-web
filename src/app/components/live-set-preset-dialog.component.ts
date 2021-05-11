import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    template: `
    <h2 mat-dialog-title>Save preset</h2>
    <mat-dialog-content class="mat-typography">
      <div>
          <mat-form-field color="accent" style="padding-top:10px;" class="input-full-width">
            <mat-select [(value)]="camPreset" placeholder="Preset to save">
              <mat-option value="1">Preset 1</mat-option>
              <mat-option value="2">Preset 2</mat-option>
              <mat-option value="3">Preset 3</mat-option>
              <mat-option value="4">Preset 4</mat-option>
              <mat-option value="5">Preset 5</mat-option>
              <mat-option value="6">Preset 6</mat-option>
              <mat-option value="7">Preset 7</mat-option>
              <mat-option value="8">Preset 8</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button
        mat-raised-button
        mat-dialog-close>Cancel</button>
      <button
        mat-raised-button
        color="accent"
        (click)="onSaveClicked()">Save</button>
    </mat-dialog-actions>
    `
  })
export class LiveSetPresetDialogComponent {

    camPreset: string = "1";

    constructor(
        public dialogRef: MatDialogRef<LiveSetPresetDialogComponent>) {}

    onSaveClicked(): void {
        // console.log('onSaveClicked()');
        this.dialogRef.close(this.camPreset);
    }

}
