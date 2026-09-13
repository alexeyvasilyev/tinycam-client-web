import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CamListSelectionComponent } from './cam-list-selection.component';

@Component({
    selector: 'timeline-cam-list',
    styles: [`
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
      @if (errorMessage != null) {
        <mat-card class="app-text-center app-card-warning" style="margin-bottom: 30px">
          {{this.errorMessage}}
        </mat-card>
      }
      @if (cameras) {
        <div>
          @if (cameras.length > 0) {
            <div>
              @if (cameras.length > 1) {
                <div style="margin-bottom:20px;">
                  <mat-card>
                    <div class="right">
                      @if (cameraSelected !== null && cameraSelected.cloudAccess) {
                        <mat-button-toggle-group [(value)]="localCloudSelected">
                          <mat-button-toggle value="local">Local</mat-button-toggle>
                          <mat-button-toggle value="cloud">Cloud</mat-button-toggle>
                        </mat-button-toggle-group>
                      }
                    </div>
                    <div class="left">
                      <mat-form-field color="accent" style="padding-top:10px;" class="full-width">
                        <mat-select [(value)]="cameraSelected" (selectionChange)="onSelected($event.value)" placeholder="Camera timeline">
                          <mat-option [value]="-1" >All cameras</mat-option>
                          @for (camera of cameras; track camera) {
                            <mat-option [value]="camera">
                              {{getCameraName(camera)}}
                            </mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                    </div>
                  </mat-card>
                </div>
              }
              <timeline [selectedCameraId]="cameraSelected.id" [cameras]="cameras" [multipleTimeline]="cameraSelected == -1" [type]="localCloudSelected"></timeline>
            </div>
          } @else {
            <mat-card>No cameras added. Please add cameras via <a routerLink="/account">Account</a> tab or via <a href="https://tinycammonitor.com/">tinyCam Monitor</a> Android app.</mat-card>
          }
        </div>
      } @else {
        <mat-card>Loading cameras list...</mat-card>
      }
    
    </div>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})

export class TimelineCamListComponent extends CamListSelectionComponent {

    ngOnInit() {
        this.allCamerasSupport = true;
        super.ngOnInit();
    }

}
