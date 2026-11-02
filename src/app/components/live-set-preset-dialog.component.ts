import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField } from '@angular/material/input';
import { MatSelect, MatOption } from '@angular/material/select';
import { MatButton } from '@angular/material/button';

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
    <mat-dialog-actions align="end" style="margin:20px">
      <button
        mat-raised-button
        mat-dialog-close>Cancel</button>
      <button
        mat-raised-button
        color="accent"
        (click)="onSaveClicked()">Save</button>
    </mat-dialog-actions>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatFormField, MatSelect, MatOption, MatDialogActions, MatButton, MatDialogClose]
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
