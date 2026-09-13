import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CamListSelectionComponent } from './cam-list-selection.component';

@Component({
    selector: 'event-cam-list',
    styles: [`
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
                <mat-card style="margin-bottom:20px;">
                  <div class="right">
                    @if (cameraSelected !== null && cameraSelected.cloudAccess) {
                      <mat-button-toggle-group [(value)]="localCloudSelected">
                        <mat-button-toggle value="local">Local</mat-button-toggle>
                        <mat-button-toggle value="cloud">Cloud</mat-button-toggle>
                      </mat-button-toggle-group>
                    }
                  </div>
                  <div class="left">
                    <mat-form-field color="accent" style="padding-top:10px;width:100%">
                      <mat-select [(value)]="cameraSelected" (selectionChange)="onSelected($event.value)" placeholder="Camera events">
                        <mat-option [value]="-1" >All cameras</mat-option>
                        @for (camera of cameras; track camera) {
                          <mat-option [value]="camera">
                            {{getCameraName(camera)}}
                          </mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>
                  @if (cameraSelected !== null) {
                    <span>
                      <ng-container *ngTemplateOutlet="liveview_content">
                      </ng-container>
                    </span>
                  }
                  @if (cameraSelected === null) {
                    <span>
                      <ng-container *ngTemplateOutlet="liveview_content_multiple">
                      </ng-container>
                    </span>
                  }
                </mat-card>
              }
              <event-list [type]="localCloudSelected" [cameraId]="cameraSelected.id" [cameras]="cameras"></event-list>
            </div>
          } @else {
            <mat-card>No cameras added.</mat-card>
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

export class EventCamListComponent extends CamListSelectionComponent {

    ngOnInit() {
        this.allCamerasSupport = true;
        super.ngOnInit();
    }

}
