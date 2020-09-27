import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { CameraSettings } from '../models';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoginService, CamListService, WindowRefService } from '../services';
import { HttpErrorResponse } from '@angular/common/http';
import { fadeInAnimation } from '../animations/';
import Utils from '../utils';

@Component({
    selector: 'live-multiple',
    animations: [fadeInAnimation],
    host: {
        '(document:keydown)': 'handleKeyDown($event)',
      },
    styles: [ `
    .live-button {
        background-color: #212121;
        border: none;
        color: white;
        padding: 4px 4px;
        text-align: center;
        text-decoration: none;
        margin: 2px 2px;
        font-size: 18px;
    }
    .live-button:hover {
        background-color: #424242;
        box-shadow: 0 0 2px rgba(0,0,0,.12), 0 2px 2px rgba(0,0,0,.2);
    }
    .live-container {
        margin-left: 10px;
        margin-right: 10px;
        margin-bottom: 2px;
        height: auto;
        overflow: hidden;
     }
    .live-right {
         width: auto;
         float: right;
         height: 100%;
         text-align: center;
    }
    .live-left {
        float: left;
        width: auto;
        overflow: hidden;
    }
    `],
    template: `
    <div>
      <mat-card *ngIf="errorMessage != null" class="app-text-center app-card-warning" style="margin-bottom: 30px">
        {{this.errorMessage}}
      </mat-card>
      <div class="live-container">
        <div class="live-left" style="margin: 0px 10px">
            <h3>Page: {{this.currentPage + 1}}/{{getTotalPages()}}</h3>
        </div>

        <div class="live-right">

            <button mat-raised-button class="live-button" (click)="switchPrevPage(false)" matTooltip="Previos page" [disabled]="currentPage == 0">
                <span>
                    <i class="fas fa-chevron-left"></i>
                </span>
            </button>
            <button mat-raised-button class="live-button" (click)="switchNextPage(false)" matTooltip="Next page" [disabled]="currentPage == getTotalPages() - 1">
                <span>
                    <i class="fas fa-chevron-right"></i>
                </span>
            </button>

            <button mat-raised-button class="live-button" style="margin-left:20px;" matTooltip="Single camera layout" (click)="showSingleScreen()">
                <i class="fas fa-square"></i>
            </button>
            <button mat-raised-button class="live-button" (click)="toggleFullScreen()" style="margin-left:20px;" matTooltip="Full screen">
                <i class="fas fa-expand-alt"></i>
            </button>

        </div>
      </div>

      <div *ngIf="cameras !== null" #live style="background-color: #424242; overflow: auto;" [style.height.px]="windowInnerHeight" [@fadeInAnimation]>
      <table #livem width="100%" height="100%" style="border-spacing:3px;border-collapse:separate;" (click)="showHideToolbar()">
        <tr>
          <td style="background-color:#212121">
            <live [cameraId]="getCamera(currentPage * getCamerasPerPage()).id" (dblclick)="toggleFullScreen()" (click)="showHideToolbar()"></live>
          </td>
          <td style="background-color:#212121">
            <live *ngIf="getCamera(currentPage * getCamerasPerPage() + 1) != null" [cameraId]="getCamera(currentPage * getCamerasPerPage() + 1).id" (dblclick)="toggleFullScreen()"></live>
          </td>
        </tr>
        <tr *ngIf="getCamerasPerPage() >= 4">
          <td style="background-color:#212121">
            <live *ngIf="getCamera(currentPage * getCamerasPerPage() + 2) != null"  [cameraId]="getCamera(currentPage * getCamerasPerPage() + 2).id" (dblclick)="toggleFullScreen()" (click)="showHideToolbar()"></live>
          </td>
          <td style="background-color:#212121">
            <live *ngIf="getCamera(currentPage * getCamerasPerPage() + 3) != null" [cameraId]="getCamera(currentPage * getCamerasPerPage() + 3).id" (dblclick)="toggleFullScreen()"></live>
          </td>
        </tr>
      </table>
      </div>
    </div>
    `
})

export class LiveMultipleComponent implements OnInit {

    @ViewChild('livem') livemEl: ElementRef;

    windowInnerHeight = this.windowRef.nativeWindow.innerHeight;
    cameras: CameraSettings[] = null;
    errorMessage: string = null;
    currentPage: number = 0;
    private CAMS_PER_LAYOUT: number = 4;//number = Utils.isBrowserFirefox() ? 4 : 2;

    constructor (
        private router: Router,
        private snackBar: MatSnackBar,
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

    toggleFullScreen() {
        Utils.toggleFullScreen(this.livemEl.nativeElement);
    }

    getCamera(index: number): CameraSettings {
        // console.log(`getCamera(index:${index})`);
        if (index > this.cameras.length - 1)
            return null;
        return this.cameras[index];
    }

    getTotalPages(): number {
        if (this.cameras == null)
            return 0;
        return Math.floor(this.cameras.length / this.CAMS_PER_LAYOUT) + (this.cameras.length % this.CAMS_PER_LAYOUT > 0 ? 1 : 0);
    }

    getCamerasPerPage(): number {
        // console.log('getCamerasPerPage()=' + this.CAMS_PER_LAYOUT);
        return this.CAMS_PER_LAYOUT;
    }

    showCurrentPage() {
        this.snackBar.open(`Page ${this.currentPage+1}/${this.getTotalPages()}`, null, {
            duration: 3000,
        });
    }

    switchPrevPage(showTip: boolean) {
        if (--this.currentPage < 0) {
            this.currentPage = 0;
        } else if (showTip) {
            this.showCurrentPage();
        }
    }

    switchNextPage(showTip: boolean) {
        const totalPages = this.getTotalPages();
        console.log(`total: ${totalPages}`);
        if (++this.currentPage >= totalPages) {
            this.currentPage--;
        } else if (showTip) {
            this.showCurrentPage();
        }
    }

    showSingleScreen() {
        this.router.navigate(['/live']);
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

    handleKeyDown(event: KeyboardEvent) {
        if (event.repeat) return;
        // console.log("Key down: " + event.key);
        switch(event.key) {
            case "ArrowUp": this.scrollTop(); event.preventDefault(); break;
            case "ArrowDown": this.scrollBottom(); event.preventDefault(); break;
            case "ArrowLeft":  this.switchPrevPage(true); break;
            case "ArrowRight": this.switchNextPage(true); break;
            case " ": this.showHideToolbar(); event.preventDefault(); break;
        };
    }

}
