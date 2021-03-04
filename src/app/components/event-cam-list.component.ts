import { Component } from '@angular/core';
import { CamListSelectionComponent } from './cam-list-selection.component';

@Component({
  selector: 'event-cam-list',
  styles: [ `
    .my-card {
      margin-bottom: 20px;
    }
    .left {
      overflow: hidden;
    }
    .right {
      float: right;
      width: auto;
      margin-left: 10px;
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

            <div class="right">
              <mat-button-toggle-group *ngIf="cameraSelected !== null && cameraSelected.cloudAccess" [(value)]="localCloudSelected">
                <mat-button-toggle value="local">Local</mat-button-toggle>
                <mat-button-toggle value="cloud">Cloud</mat-button-toggle>
              </mat-button-toggle-group>
            </div>

            <div class="left">
              <mat-form-field color="accent" style="padding-top:10px;width:100%">
                <mat-select [(value)]="cameraSelected" (selectionChange)="onSelected($event.value)" placeholder="Camera events">
                  <mat-option [value]="-1" >All cameras</mat-option>
                  <mat-option *ngFor="let camera of cameras" [value]="camera">
                    {{getCameraName(camera)}}
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <span *ngIf="cameraSelected !== null">
              <ng-container *ngTemplateOutlet="liveview_content">
              </ng-container>
            </span>
            <span *ngIf="cameraSelected === null">
              <ng-container *ngTemplateOutlet="liveview_content_multiple">
              </ng-container>
            </span>
          </mat-card>

          <event-list [type]="localCloudSelected" [cameraId]="cameraSelected.id" [cameras]="cameras"></event-list>
        </div>
      </div>

      <ng-template #no_cams_content><mat-card>No cameras added.</mat-card></ng-template>
      <ng-template #loading_content><mat-card>Loading cameras list...</mat-card></ng-template>
    </div>
  `
})

export class EventCamListComponent extends CamListSelectionComponent {

    ngOnInit() {
        this.allCamerasSupport = true;
        super.ngOnInit();
    }

}
