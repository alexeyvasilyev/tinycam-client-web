import { Component } from '@angular/core';
import { CamListSelectionComponent } from './cam-list-selection.component';

@Component({
  selector: 'event-cam-list',
  styles: [ `
    .camlist-info {
      color: #616161;
    }
    .full-width {
      width: 100%;
    }
    .my-card {
      margin-bottom: 20px;
    }
  `],
  template: `
    <div>
      <mat-card *ngIf="errorMessage != null" class="app-text-center app-card-warning" style="margin-bottom: 30px">
        {{this.errorMessage}}
      </mat-card>
      <div *ngIf="cameras; else loading_content">

        <div *ngIf="cameras.length > 0; else no_cams_content">
          <mat-card *ngIf="cameras.length > 1" style="margin-bottom:20px;">
            <mat-form-field color="accent" style="padding-top:10px;" class="full-width">
              <mat-select [(value)]="cameraSelected" (selectionChange)="onSelected($event.value)" placeholder="Camera events">
                <!-- <mat-option [value]="-1" >All cameras</mat-option> -->
                <mat-option *ngFor="let camera of cameras" [value]="camera">
                  {{getCameraName(camera)}}
                </mat-option>
              </mat-select>
            </mat-form-field>
            <span *ngIf="cameraSelected !== null">
              <ng-container *ngTemplateOutlet="liveview_content">
              </ng-container>
            </span>
            <span *ngIf="cameraSelected === null">
              <ng-container *ngTemplateOutlet="liveview_content_multiple">
              </ng-container>
            </span>
          </mat-card>

          <!-- <mat-card *ngIf="cameras.length == 1 && cameraSelected.id != -1" style="margin-bottom:20px;">
            <ng-container *ngTemplateOutlet="liveview_content">
            </ng-container>
          </mat-card> -->

          <event-list [camId]="cameraSelected.id" [cameras]="cameras"></event-list>
        </div>
      </div>

      <ng-template #no_cams_content><mat-card>No cameras added.</mat-card></ng-template>
      <ng-template #loading_content><mat-card>Loading cameras list...</mat-card></ng-template>
    </div>
  `
})

export class EventCamListComponent extends CamListSelectionComponent {
}
