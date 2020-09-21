import { Component, Input } from '@angular/core';
import { CamListSelectionComponent } from './cam-list-selection.component';

@Component({
  selector: 'timeline-cam-list',
  styles: [ `
    .full-width {
      width: 100%;
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
          <div *ngIf="cameras.length > 1" style="text-align:right;padding-top:20px;padding-bottom:20px;">
            <mat-checkbox [(ngModel)]="multipleTimeline">Show all cameras on timeline</mat-checkbox>
          </div>

          <div *ngIf="cameras.length > 1 && !multipleTimeline" style="margin-bottom:20px;">
            <mat-card>
              <div class="right">
                <mat-button-toggle-group *ngIf="cameraSelected !== null && cameraSelected.cloudAccess" [(value)]="localCloudSelected">
                  <mat-button-toggle value="local">Local</mat-button-toggle>
                  <mat-button-toggle value="cloud">Cloud</mat-button-toggle>
                </mat-button-toggle-group>
              </div>

              <div class="left">
                <mat-form-field color="accent" style="padding-top:10px;" class="full-width">
                  <mat-select [(value)]="cameraSelected" (selectionChange)="onSelected($event.value)" placeholder="Camera timeline">
                    <mat-option *ngFor="let camera of cameras" [value]="camera">
                      {{getCameraName(camera)}}
                    </mat-option> 
                  </mat-select>
                </mat-form-field>
              </div>
            </mat-card>
          </div>

          <timeline [selectedCameraId]="cameraSelected.id" [cameras]="cameras" [multipleTimeline]="multipleTimeline" [type]="localCloudSelected"></timeline>
        </div>
      </div>

      <ng-template #no_cams_content><mat-card>No cameras added. Please add cameras via <a routerLink="/account">Account</a> tab or via <a href="https://tinycammonitor.com/">tinyCam Monitor</a> Android app.</mat-card></ng-template>
      <ng-template #loading_content><mat-card>Loading cameras list...</mat-card></ng-template>
    </div>
  `
})

export class TimelineCamListComponent extends CamListSelectionComponent {

  @Input() multipleTimeline: boolean;

}
