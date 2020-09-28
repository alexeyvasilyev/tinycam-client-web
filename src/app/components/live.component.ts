import { AfterViewInit, Component, Input, ElementRef, SimpleChanges, ViewChild } from '@angular/core';
import { LoginService } from '../services';
import { fadeInAnimation } from '../animations/';
import { WindowRefService } from '../services';

@Component({
    selector: 'live',
    animations: [fadeInAnimation],
    styles: [ `
      .live-view-loading {
        background-repeat: no-repeat;
        background-position: center;
        background-size: contain;
        background-image: url("assets/img/loading.png");
      }
      .live-view {
        background-repeat: no-repeat;
        background-position: center;
        background-size: contain;
      }
    `],
    template: `
      <!-- <img style="height:100px" #image alt="" (load)="loadImage()" (error)="loadImageError()" src="{{getLiveImage()}}"/> -->
      <div [@fadeInAnimation] class="live-view-loading" style="cursor: pointer;">
        <div #cell class="live-view" [style.height.px]="viewHeightPx"></div>
        <!-- <div #cell class="live-view" [style.height.vh]="viewHeightVh"></div> -->
      </div>
    `
})

export class LiveComponent implements AfterViewInit {

    @Input() viewHeightPx: number = 100; // Hack for Safari
    @Input() cameraId: number;
    @ViewChild('cell', { static: true }) cellEl: ElementRef;

    constructor(
        public loginService: LoginService,
        private windowRef: WindowRefService) {
    }

    ngAfterViewInit() {
        // console.log('ngAfterViewInit()');
        this.loadImage();
    }

    ngOnChanges(changes: SimpleChanges) {
        // console.log('ngOnChanges()');
        this.unloadImage();
        this.loadImage();
    }

    loadImage() {
        // console.log('loadImage()');
        // console.log(`${this.loginService.server.url}/axis-cgi/mjpg/video.cgi?cameraId=${this.cameraId}&token=${this.loginService.login.token}`);
        this.cellEl.nativeElement.style.backgroundImage = "url('" + this.getLiveImage() + "')";
    }

    unloadImage() {
        // console.log('unloadImage()');
        // HACK: Preventing Chrome keeping/leaking connection for MJPEG stream.
        // http://stackoverflow.com/questions/16137381/html5-video-element-request-stay-pending-forever-on-chrome
        // Sideeffect: makes Mozilla unwanted refreshes.
        this.windowRef.nativeWindow.stop();
    }

    ngOnDestroy() {
        // console.log('ngOnDestroy()');
        this.unloadImage();
    }

    // loadImageError() {
    //     console.log('loadImageError()');
    //     this.cellEl.nativeElement.style.backgroundImage = "url('assets/img/loading.png')";
    //     this.loadImage();
    // }
  
    getLiveImage(): string {
        return `${this.loginService.server.url}/axis-cgi/mjpg/video.cgi?cameraId=${this.cameraId}&token=${this.loginService.login.token}`;
    }

}
