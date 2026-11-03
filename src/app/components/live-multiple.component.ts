import { Component, OnInit, OnDestroy, ElementRef, ChangeDetectionStrategy, viewChild, ChangeDetectorRef, inject, signal } from '@angular/core';
import { Router, Params, ActivatedRoute } from '@angular/router';
import { CameraSettings } from '../models';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoginService, CamListService, WindowRefService } from '../services';
import { HttpErrorResponse } from '@angular/common/http';
import StorageUtils from '../utils-storage';
import { NgTemplateOutlet } from '@angular/common';
import { MatCard } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { LiveComponent } from './live.component';
import { LIVE_LAYOUTS, LiveLayout, LiveLayoutCell, MAX_MJPEG_STREAMS, getLiveLayout } from '../live-layouts';
import { LiveMux } from '../live-mux';
import { MsePlayer } from '../mse-player';

@Component({
    selector: 'live-multiple',
    host: {
        '(document:keydown)': 'handleKeyDown($event)',
        '(window:resize)': 'windowHeight.set(windowRef.nativeWindow.innerHeight)',
    },
    styles: [`
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
    .live-grid {
        display: grid;
        gap: 2px;
        padding: 2px;
        box-sizing: border-box;
        background-color: #424242;
    }
    .cell {
        background-color: #212121;
        /* Cell size must not depend on loaded video intrinsic size */
        min-width: 0;
        overflow: hidden;
    }
    .layout-icon {
        width: 24px;
        height: 18px;
        vertical-align: middle;
    }
    .layout-menu-icon {
        margin-right: 12px;
    }
    `],
    template: `
    <div>
      @if (errorMessage != null) {
        <mat-card class="app-text-center app-card-warning" style="margin-bottom: 30px">
          {{this.errorMessage}}
        </mat-card>
      }
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
          <button mat-raised-button class="live-button" matTooltip="Multiple cameras layout" [matMenuTriggerFor]="layoutMenu">
            <ng-container *ngTemplateOutlet="layoutIcon; context: { $implicit: layout }"></ng-container>
          </button>
          <mat-menu #layoutMenu="matMenu">
            @for (l of layouts; track l.id) {
              <button mat-menu-item (click)="selectLayout(l)">
                <ng-container *ngTemplateOutlet="layoutIcon; context: { $implicit: l, menu: true }"></ng-container>
                <span>{{l.name}}</span>
                @if (l === layout) {
                  <!-- Wrapper is needed since Font Awesome replaces <i> with <svg>, which Angular cannot remove -->
                  <span style="margin-left: 12px"><i class="fas fa-check"></i></span>
                }
              </button>
            }
          </mat-menu>
          <!-- <button mat-raised-button class="live-button" (click)="toggleFullScreen()" style="margin-left:20px;" matTooltip="Full screen">
          <i class="fas fa-expand-alt"></i>
        </button> -->
    
      </div>
    </div>
    
    @if (cameras !== null) {
      <div #live class="live-grid" [style.height.px]="windowHeight()" animate.enter="app-fade-in"
        [style.grid-template-columns]="'repeat(' + layout.cols + ', minmax(0, 1fr))'"
        [style.grid-template-rows]="'repeat(' + layout.rows + ', ' + getRowHeight() + 'px)'">
        @for (cell of layout.cells; track $index) {
          <div class="cell"
            [style.grid-column]="(cell.col + 1) + ' / span ' + cell.colSpan"
            [style.grid-row]="(cell.row + 1) + ' / span ' + cell.rowSpan">
            @if (getCameraPage($index); as camera) {
              <live [cameraId]="camera.id" [cameraName]="camera.name" [viewHeightPx]="getCellHeight(cell)" [mux]="mux" [snapshotMode]="isSnapshotMode()"
                (dblclick)="liveDoubleClick($index)" (click)="liveSingleClick()"></live>
            }
          </div>
        }
      </div>
    }

    <ng-template #layoutIcon let-l let-menu="menu">
      <svg class="layout-icon" [class.layout-menu-icon]="menu" [attr.viewBox]="'0 0 ' + l.cols + ' ' + l.rows" preserveAspectRatio="none">
        @for (c of l.cells; track $index) {
          <rect [attr.x]="c.col + 0.1" [attr.y]="c.row + 0.1" [attr.width]="c.colSpan - 0.2" [attr.height]="c.rowSpan - 0.2" fill="currentColor"/>
        }
      </svg>
    </ng-template>
    </div>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatCard, MatButton, MatTooltip, MatMenuTrigger, MatMenu, MatMenuItem, NgTemplateOutlet, LiveComponent]
})

export class LiveMultipleComponent implements OnInit, OnDestroy {

    // Zoneless: async updates must mark the view for check
    private readonly changeDetectorRef = inject(ChangeDetectorRef);

    readonly livemEl = viewChild<ElementRef>('livem');

    readonly layouts = LIVE_LAYOUTS;
    readonly windowHeight = signal(0);

    cameras: CameraSettings[] = null;
    errorMessage: string = null;
    currentPage: number = 0;
    layout: LiveLayout = getLiveLayout(StorageUtils.getLiveLayout());
    // Single connection with MP4 streams of all cameras on the current page
    mux: LiveMux | null = null;
    private readonly useMp4 = !StorageUtils.getUseMjpegLiveView() && MsePlayer.getMediaSourceImpl() != null;
    private timerClick;

    constructor (
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private snackBar: MatSnackBar,
        private loginService: LoginService,
        private camListService: CamListService,
        public windowRef: WindowRefService) {
        this.windowHeight.set(windowRef.nativeWindow.innerHeight);
    }

    ngOnInit() {
        console.log('ngOnInit()');
        this.camListService.getCamList(this.loginService.server, this.loginService.login)
            .subscribe({
                next: (events) => {
                    this.processCamList(events);
                    this.changeDetectorRef.markForCheck();
                },
                error: (e) => {
                    this.processCamListError(e);
                    this.changeDetectorRef.markForCheck();
                }
            });
        // Check if '/livem?bottom'
        this.activatedRoute.queryParams.subscribe((params: Params) => {
            let bottom = params['bottom'];
            if (bottom) {
                this.scrollBottom();
            }
        });
    }

    ngOnDestroy() {
        this.mux?.stop();
        this.mux = null;
    }

    // MJPEG is preferred, but too many cameras on the page for MJPEG streams
    isSnapshotMode(): boolean {
        return !this.useMp4 && this.getCamerasPerPage() > MAX_MJPEG_STREAMS;
    }

    // Recreates multiplexed stream if cameras on the page changed
    private updateMux() {
        if (!this.useMp4 || this.cameras == null)
            return;
        const ids: number[] = [];
        for (let i = 0; i < this.getCamerasPerPage(); i++) {
            const camera = this.getCameraPage(i);
            if (camera != null)
                ids.push(camera.id);
        }
        if (this.mux != null && this.mux.cameraIds.join(',') === ids.join(','))
            return;
        this.mux?.stop();
        this.mux = new LiveMux(LiveMux.createUrl(this.loginService.server.url, this.loginService.login.token, ids), ids);
        this.mux.start();
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

    // Grid gap and padding
    private static readonly GAP_PX = 2;

    getRowHeight(): number {
        const rows = this.layout.rows;
        return Math.floor((this.windowHeight() - LiveMultipleComponent.GAP_PX * (rows + 1)) / rows);
    }

    getCellHeight(cell: LiveLayoutCell): number {
        return this.getRowHeight() * cell.rowSpan + LiveMultipleComponent.GAP_PX * (cell.rowSpan - 1);
    }

    selectLayout(layout: LiveLayout) {
        // Keep the first camera of the current page visible
        const firstCamera = this.currentPage * this.getCamerasPerPage();
        this.layout = layout;
        StorageUtils.setLiveLayout(layout.id);
        this.currentPage = Math.floor(firstCamera / this.getCamerasPerPage());
        this.updateMux();
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
        return Math.ceil(this.cameras.length / this.getCamerasPerPage());
    }

    getCamerasPerPage(): number {
        return this.layout.cells.length;
    }

    showCurrentPage() {
        this.snackBar.open(`Page ${this.currentPage+1}/${this.getTotalPages()}`, null, {
            duration: 3000,
        });
    }

    switchPrevPage(showTip: boolean) {
        if (this.currentPage > 0) {
            this.currentPage--;
            if (showTip)
                this.showCurrentPage();
        }
        this.updateMux();
    }

    switchNextPage(showTip: boolean) {
        const totalPages = this.getTotalPages();
        console.log(`total: ${totalPages}`);
        if (this.currentPage < totalPages - 1) {
            this.currentPage++;
            if (showTip)
                this.showCurrentPage();
        }
        this.updateMux();
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
            // Show page with camera selected in single camera layout, e.g. camera 5 in 2x2 -> page 2
            const index = cameras.findIndex(c => c.id === StorageUtils.getLastCameraSelected());
            this.currentPage = index < 0 ? 0 : Math.floor(index / this.getCamerasPerPage());
            this.updateMux();
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
