import { Component, ViewChild, ElementRef } from '@angular/core';
import { CamListSelectionComponent } from './cam-list-selection.component';
import { CamListService, LoginService, WindowRefService } from '../services';
import { Router } from '@angular/router';
import Utils from '../utils';

@Component({
  selector: 'live-cam-list',
  styles: [ `

    .full-width {
      width: 100%;
    }

    .live-button {
        background-color: #212121;
        border: none;
        color: white;
        padding: 10px 20px;
        text-align: center;
        text-decoration: none;
        margin: 4px 2px;
        cursor: pointer;
        font-size: 18px;
    }
    .live-button:hover {
        background-color: #424242;
        box-shadow: 0 0 2px rgba(0,0,0,.12), 0 2px 2px rgba(0,0,0,.2);
    }
    
    .container {
        margin: 0px 10px;
        height: auto;
        overflow: hidden;
     }
         
     .right {
         width: auto;
         float: right;
         height: 100%;
         text-align: center;
     }
     
     .left {
         float: none; /* not needed, just for clarification */
         width: auto;
         overflow: hidden;
     }
  `],
  template: `
    <div>
      <mat-card *ngIf="errorMessage != null" class="app-text-center app-card-warning" style="margin-bottom: 30px">
        {{this.errorMessage}}
      </mat-card>
      <div *ngIf="cameras; else loading_content">
        <div *ngIf="cameras.length > 0; else no_cams_content">

          <div class="container">
            <div class="right">
                <button class="live-button" style="margin-right:20px;">
                <i class="far fa-dot-circle"></i>
                </button>
                <button class="live-button">1</button>
                <button class="live-button">2</button>
                <button class="live-button">3</button>
                <button class="live-button">4</button>
                <button mat-icon-button>
                <i class="fas fa-ellipsis-v fa-lg" style="color:#111111;"></i>
                </button>
                <button class="live-button" (click)="toggleFullScreen()" style="margin-left:20px;">
                <i class="fas fa-expand-alt"></i>
                </button>
            </div>

            <div class="left">
                <div *ngIf="cameras.length > 1">
                <div style="margin:0px 15px;">
                    <mat-form-field color="accent">
                    <mat-select [(value)]="selectedCamId" (selectionChange)="onSelected($event.value)">
                        <mat-option *ngFor="let camera of cameras" [value]="camera.id">
                        {{getCameraName(camera)}}
                        </mat-option>
                    </mat-select>
                    </mat-form-field>
                </div>
                </div>
            </div>
          </div>

          <div style="background-color: #212121; overflow: auto;" [style.height.px]="myInnerHeight" #live>
            <live [camId]="camId" (dblclick)="toggleFullScreen()"></live>
          </div>
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
    @ViewChild('live') liveEl: ElementRef;

    constructor(
        protected router: Router,
        protected loginService: LoginService,
        protected camListService: CamListService,
        private windowRef: WindowRefService) {
            super(router, loginService, camListService);
    }

    camerasLoaded() {
        if (this.cameras && this.cameras.length > 0) {
            this.camId = this.cameras[0].id;
            this.selectedCamId = this.getSelectedCamId();
            this.onSelected(this.selectedCamId);
        }
    }

    toggleFullScreen() {
        console.log('A');
        Utils.toggleFullScreen(this.liveEl.nativeElement);
        // const height = this.mainEl.nativeElement.offsetHeight - this.canvasTimelineEl.nativeElement.offsetHeight;
        // this.videoEl.nativeElement.style.height = height + 'px';
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
