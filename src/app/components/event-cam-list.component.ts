import { Component, OnInit } from '@angular/core';
import { Router, Params } from '@angular/router';
import { CamListSelectionComponent } from './cam-list-selection.component';
import { CameraSettings, Server } from '../models'
// import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { CamListService, LoginService } from '../services';
// import { LiveDialogComponent } from './live-dialog.component';

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
        <div *ngIf="responseCode == 107">Want to <a href=\"/password_reset.html\">reset</a> password?</div>
      </mat-card>
      <div *ngIf="cameras; else loading_content">

        <div *ngIf="warnings && warnings.length > 0" style="padding-bottom: 30px">
          <div *ngFor="let camera of warnings">
            <mat-card *ngIf="isInError(camera); else show_info" class="app-card-warning my-card">
              <mat-card-content><i class="fas fa-exclamation-triangle" style="padding-right:10px;"></i>Camera "{{camera.name}}" error: <br/>{{getHumanReadableError(camera)}}</mat-card-content>
            </mat-card>
            <ng-template #show_info>
              <mat-card *ngIf="camera.enabled" class="camlist-info my-card">
                Camera "{{camera.name}}" info:<br/> {{getHumanReadableError(camera)}}
              </mat-card>
            </ng-template>
          </div>
        </div>

        <div *ngIf="cameras.length > 0; else no_cams_content">
          <mat-card *ngIf="cameras.length > 1" style="margin-bottom:20px;">
            <mat-form-field color="accent" style="padding-top:10px;" class="full-width">
              <mat-select [(value)]="selectedCamId" (selectionChange)="onSelected($event.value)" placeholder="Camera events">
                <!-- <mat-option [value]="-1" >All cameras</mat-option> -->
                <mat-option *ngFor="let camera of cameras" [value]="camera.id">
                  {{getCameraName(camera)}}
                </mat-option>
              </mat-select>
            </mat-form-field>
            <span *ngIf="camId != -1">
              <ng-container *ngTemplateOutlet="liveview_content">
              </ng-container>
            </span>
            <span *ngIf="camId == -1">
              <ng-container *ngTemplateOutlet="liveview_content_multiple">
              </ng-container>
            </span>
          </mat-card>

          <!-- <mat-card *ngIf="cameras.length == 1 && camId != -1" style="margin-bottom:20px;">
            <ng-container *ngTemplateOutlet="liveview_content">
            </ng-container>
          </mat-card> -->

          <event-list [camId]="camId" [cameras]="cameras"></event-list>
        </div>
      </div>

      <!-- <ng-template #liveview_content>
        <button
            mat-raised-button
            [disabled]="!liveEnabled"
            color="accent"
            (click)="onLiveClicked(camId)">GO LIVE</button>
        <span *ngIf="!liveEnabled" style="padding-left: 10px">Live view is available only if camera enabled and recording started</span>
      </ng-template> -->

      <!-- <ng-template #liveview_content_multiple>
        <div *ngFor="let camera of cameras">
          <div *ngIf="camera.enabled && camera.cam_last_error != 'info_payment'" style="padding-bottom: 10px">
            <button
              mat-raised-button
              color="accent"
              (click)="onLiveClicked(camera.id)">{{camera.name}} LIVE</button>
          </div>
        </div>
      </ng-template> -->

      <ng-template #no_cams_content><mat-card>No cameras added.</mat-card></ng-template>

      <ng-template #loading_content><mat-card>Loading cameras list...</mat-card></ng-template>
    </div>
  `
})

export class EventCamListComponent extends CamListSelectionComponent implements OnInit {

    selectedCamId: number = -1;
    liveEnabled: boolean = true;

    constructor(
        // private activatedRoute: ActivatedRoute,
        private dialog: MatDialog,
        protected loginService: LoginService,
        protected camListService: CamListService) {
            super(loginService, camListService);
    }

    ngOnInit() {
        super.ngOnInit();
        // subscribe to router event
        // this.activatedRoute.queryParams.subscribe((params: Params) => {
        //     let status = params['live'];
        //     if (status) {
        //         switch (status) {
        //             case 'true': this.liveAvailable = true; break;
        //             default: this.liveAvailable = false;
        //         }
        //         console.log('live=' + status);
        //     }
        // });
    }

    private getCameraSettingsByCamId(cameraId: number): CameraSettings {
        for (let camera of this.cameras) {
            if (camera.id == cameraId)
                return camera;
        }
        return null;
    }

    onSelected(cameraId: number): void {
        super.onSelected(cameraId);
//         let camera = this.getCameraSettingsByCamId(camId);
//         if (camera != null) {
// //          this.liveEnabled = camera.cam_enabled && camera.cam_last_error != 'info_payment';
//             this.liveEnabled = camera.cam_enabled && camera.state == 'Active';
//         }
    }

    getHumanReadableError(cameraSettings: CameraSettings): string {
        return "";//CameraSettings.getHumanReadableError(cameraSettings);
    }


    isInError(cameraSettings: CameraSettings): boolean {
        return false;//CameraSettings.isInError(cameraSettings);
    }

    onLiveClicked(camId: number): void {
        console.log('onLiveClicked(' + camId + ')');
        // let dialog = this.dialog.open(LiveDialogComponent);//, this.config);
        // dialog.componentInstance.camId = camId;
        // dialog.componentInstance.title = this.getCameraSettingsByCamId(camId).cam_name + " LIVE";
        // dialog.afterClosed().subscribe(result => {
        //     //console.log(`Dialog result: ${result}`);
        //     // this.loadCameras();
        // });
    }

    camerasLoaded() {
      console.log('camerasLoaded()');
        if (this.cameras.length > 0) {
            this.camId = this.cameras[0].id;
            this.onSelected(this.camId);
        }
    }

    // isError(error: string): boolean {
    //     if (error == null || error.length == 0)
    //         return false;
    //     return !error.startsWith("info");
    // }

}
