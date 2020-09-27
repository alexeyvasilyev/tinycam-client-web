import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CameraSettings } from '../models';
import { LoginService, CamListService, WindowRefService } from '../services';
import { HttpErrorResponse } from '@angular/common/http';
import { fadeInAnimation } from '../animations/';

@Component({
    selector: 'live-multiple',
    animations: [fadeInAnimation],
    styles: [ `
    `],
    template: `
    <div>
      <mat-card *ngIf="errorMessage != null" class="app-text-center app-card-warning" style="margin-bottom: 30px">
        {{this.errorMessage}}
      </mat-card>
      <div *ngIf="cameras !== null" #live style="background-color: #616161; overflow: auto;" [style.height.px]="myInnerHeight" [@fadeInAnimation]>
      <table width="100%" height="100%" style="border-spacing:3px;border-collapse:separate;">
        <tr>
          <td style="background-color:#212121">
            <live [cameraId]="cameras[0].id" (dblclick)="toggleFullScreen()" (click)="showHideToolbar()"></live>
          </td>
          <td style="background-color:#212121">
            <live [cameraId]="cameras[1].id" (dblclick)="toggleFullScreen()" (click)="showHideToolbar()"></live>
          </td>
        </tr>
      </table>
      </div>
    </div>
    `
})

export class LiveMultipleComponent implements OnInit {

    myInnerHeight = this.windowRef.nativeWindow.innerHeight;
    cameras: CameraSettings[] = null;
    errorMessage: string = null;

    constructor (
        private router: Router,
        private loginService: LoginService,
        private camListService: CamListService,
        private windowRef: WindowRefService) {
    }

    ngOnInit() {
        console.log('ngOnInit()');
        this.camListService.getCamList(this.loginService.server, this.loginService.login)
            .then(
                res  => { this.processCamList(res); },
                error => { this.processCamListError(error); });
    }

    processCamListError(error: HttpErrorResponse) {
        console.error('Error in getCamList()', error.message);
        // Token expired
        if (error.status == 401 || error.status == 403)
            this.router.navigate(['/login']);
        this.errorMessage = error.message;
    }

    processCamList(cameras: CameraSettings[]) {
        console.log('processCamList()');
        if (cameras) {
            this.cameras = cameras;
            console.log('Total cameras: ' + cameras.length);
        } else {
            console.log('No cameras found.');
        }
    }

    scrollTop() {
        // Scroll to top
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    }

    scrollBottom() {
        // Scroll to bottom
        window.scrollTo({
            top: 10000,
            left: 0,
            behavior: 'smooth'
        });
    }

    showHideToolbar() {
      console.log('showHideToolbar(): ' + document.documentElement.scrollTop);
      if (document.documentElement.scrollTop > 0)
          this.scrollTop();
      else
          this.scrollBottom();
    }
}
