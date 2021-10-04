import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router, Params, ActivatedRoute } from '@angular/router';
import { CameraSettings } from '../models';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoginService, CamListService, WindowRefService } from '../services';
import { HttpErrorResponse } from '@angular/common/http';
import { fadeInAnimation } from '../animations/';
import StorageUtils from '../utils-storage';

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
    .cell {
        background-color: #212121;
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

            <button mat-raised-button class="live-button" style="margin-left:20px;" matTooltip="Single camera layout" (click)="showSingleScreenLastSelected()">
                <i class="fas fa-square"></i>
            </button>
            <!-- <button mat-raised-button class="live-button" (click)="toggleFullScreen()" style="margin-left:20px;" matTooltip="Full screen">
                <i class="fas fa-expand-alt"></i>
            </button> -->

        </div>
      </div>

      <div *ngIf="cameras !== null" #live style="background-color: #424242; overflow: auto;" [style.height.px]="getLiveHeight()" [@fadeInAnimation]>
      <table #livem width="100%" height="100%" style="border-spacing:2px;border-collapse:separate;">
        <tr>
          <td class="cell">
            <live [cameraId]="getCameraPage(0).id" [viewHeightPx]="getCellHeight()" (dblclick)="liveDoubleClick(0)" (click)="liveSingleClick()"></live>
          </td>
          <td class="cell">
            <live *ngIf="getCameraPage(1) != null" [cameraId]="getCameraPage(1).id" [viewHeightPx]="getCellHeight()" (dblclick)="liveDoubleClick(1)" (click)="liveSingleClick()"></live>
          </td>
        </tr>
        <tr *ngIf="getCamerasPerPage() >= 4">
          <td class="cell">
            <live *ngIf="getCameraPage(2) != null" [cameraId]="getCameraPage(2).id" [viewHeightPx]="getCellHeight()" (dblclick)="liveDoubleClick(2)" (click)="liveSingleClick()"></live>
          </td>
          <td class="cell">
            <live *ngIf="getCameraPage(3) != null" [cameraId]="getCameraPage(3).id" [viewHeightPx]="getCellHeight()" (dblclick)="liveDoubleClick(3)" (click)="liveSingleClick()"></live>
          </td>
        </tr>
      </table>
      </div>
    </div>
    `
})

export class LiveMultipleComponent implements OnInit {

    @ViewChild('livem') livemEl: ElementRef;

    cameras: CameraSettings[] = null;
    errorMessage: string = null;
    currentPage: number = 0;
    private CAMS_PER_LAYOUT: number = 4; // Utils.isBrowserFirefox() ? 4 : 2;
    private timerClick;

    constructor (
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private snackBar: MatSnackBar,
        private loginService: LoginService,
        private camListService: CamListService,
        private windowRef: WindowRefService) {
    }

    ngOnInit() {
        console.log('ngOnInit()');
        this.camListService.getCamList(this.loginService.server, this.loginService.login)
            .subscribe({
                next: (events) => this.processCamList(events),
                error: (e) => this.processCamListError(e)
            });
        // Check if '/livem?bottom'
        this.activatedRoute.queryParams.subscribe((params: Params) => {
            let bottom = params['bottom'];
            if (bottom) {
                this.scrollBottom();
            }
        });
    }

    liveSingleClick() {
        console.log('liveSingleClick()');
        if (this.timerClick)
            clearTimeout(this.timerClick);
        this.timerClick = setTimeout(() => {
            this.showHideToolbar();
        }, 250);
    }

    liveDoubleClick(index: number) {
        console.log('liveDoubleClick()');
        if (this.timerClick)
            clearTimeout(this.timerClick);
        this.showSingleScreen(index);
    }

    // toggleFullScreen() {
    //    Utils.toggleFullScreen(this.livemEl.nativeElement);
    // }

    getCellHeight(): number {
        const rows = this.getCamerasPerPage() == 2 ? 1 : 2;
        return Math.floor(this.windowRef.nativeWindow.innerHeight / rows) - 2 /*size of border-spacing*/ * (rows + 2);
    }

    getLiveHeight(): number {
        return this.windowRef.nativeWindow.innerHeight;
    }

    getCameraPage(index: number): CameraSettings {
        return this.getCamera(this.currentPage * this.getCamerasPerPage() + index);
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

    showSingleScreenLastSelected() {
        this.router.navigate(['/live']);
    }

    showSingleScreen(index: number) {
        StorageUtils.setLastCameraSelected(this.getCameraPage(index).id);
        if (document.documentElement.scrollTop > 0)
            this.router.navigate(['/live'], { queryParams: { bottom: "yes" } });
        else
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
