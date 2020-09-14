import { Component } from '@angular/core';
import { CamListSelectionComponent } from './cam-list-selection.component';
import { CamListService, LoginService, WindowRefService } from '../services';
import { Router } from '@angular/router';

@Component({
  selector: 'live-cam-list',
  styles: [ `
    .full-width {
      width: 100%;
    }
  `],
  template: `
    <div>
      <mat-card *ngIf="errorMessage != null" class="app-text-center app-card-warning" style="margin-bottom: 30px">
        {{this.errorMessage}}
      </mat-card>
      <div *ngIf="cameras; else loading_content" >
        <div *ngIf="cameras.length > 0; else no_cams_content">
          <div *ngIf="cameras.length > 1">
            <div style="margin:0px 15px;">
              <mat-form-field color="accent" style="padding-top:10px;">
                <mat-select [(value)]="selectedCamId" (selectionChange)="onSelected($event.value)">
                  <mat-option *ngFor="let camera of cameras" [value]="camera.id">
                    {{getCameraName(camera)}}
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </div>
          <div style="background-color: #212121; overflow: auto;" [style.height.px]="myInnerHeight">
            <live [camId]="camId"></live>
          </div>
          <!-- <live [camId]="182399567"></live> -->
        </div>
      </div>

      <ng-template #no_cams_content><mat-card>No cameras added. Please add cameras via <a routerLink="/account">Account</a> tab or via <a href="https://tinycammonitor.com/">tinyCam Monitor</a> Android app.</mat-card></ng-template>
      <ng-template #loading_content><mat-card>Loading cameras list...</mat-card></ng-template>
    </div>

  `
})

export class LiveCamListComponent extends CamListSelectionComponent {

    selectedCamId: number = -1;
    myInnerHeight = this.windowRef.nativeWindow.innerHeight;

    constructor(
        protected router: Router,
        protected loginService: LoginService,
        protected camListService: CamListService,
        private windowRef: WindowRefService) {
            super(router, loginService, camListService);
            console.log(`myInnerHeight: ${this.myInnerHeight}`);
    }

    camerasLoaded() {
        if (this.cameras && this.cameras.length > 0) {
            this.camId = this.cameras[0].id;
            this.selectedCamId = this.getSelectedCamId();
            this.onSelected(this.selectedCamId);
        }
    }

    getSelectedCamId(): number {
      console.log('getSelectedCamId()');
        // Find first enabled camera
        for (let camera of this.cameras) {
            if (camera.enabled)
                return camera.id;
        }
        // No enabled cameras found.
        // Return the first item in the list.
        return this.cameras[0].id;
    }

}
