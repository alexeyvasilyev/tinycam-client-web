import { Component, Input, ElementRef, ViewChild } from '@angular/core';
import { LoginService } from '../services';
import { fadeInAnimation } from '../animations/';

@Component({
    selector: 'live',
    animations: [fadeInAnimation],
    // animations: [animateFactory(150, 0, 'ease-in')],
    styles: [ `
        .live-view-loading {
            background-repeat: no-repeat;
            background-position: center;
            background-size: contain;
            background-image: url("assets/img/loading.png");
            height:100%;
        }
        .live-view {
            background-repeat: no-repeat;
            background-position: center;
            background-size: contain;
            height:100%;
        }
    `],
    template: `
      <!-- <img #image alt="" (load)="loadImage(0)" (error)="loadImageError(0)" src="{{getLiveImage()}}"/> -->
      <div [@fadeInAnimation] class="live-view-loading">
        <div #cell class="live-view"></div>
      </div>
    `
})

export class LiveComponent {

    @Input() camId: number; 
    @ViewChild('image', { static: true }) imageEl: ElementRef;
    @ViewChild('cell', { static: true }) cellEl: ElementRef;

    constructor(
        public loginService: LoginService) {
          console.log('LiveComponent()');
    }

    ngAfterViewInit() {
        this.loadImage(0);
    }

    loadImage(cellId: number) {
        this.loadImageImpl(cellId, false);
    }
  
    private loadImageImpl(cellId: number, forceReload: boolean) {
        console.log('loadImageImpl(cellId=' + cellId + ')');
        // this.imageEl.nativeElement.src = this.getLiveImage();
        //console.log('loadImage(cellId=' + cellId + ')');
        // const image = document.getElementById("image" + cellId);
        // const cell  = document.getElementById("cell"  + cellId);
        // const url = (forceReload ? image.src + '&' + this.randomInteger(0, 10000) : image.src);
        // cell.style.backgroundImage = "url('" + url + "')";
        //setTimeout(loadImage, 5000, cellId);
       this.cellEl.nativeElement.style.backgroundImage = "url('" + this.getLiveImage() + "')";
    }

    loadImageError(cellId: number) {
        console.log('loadImageError(cellId=' + cellId + ')');
        this.cellEl.nativeElement.style.backgroundImage = "url('assets/img/loading.png')";
        this.loadImageImpl(cellId, true);
    }
  
    private randomInteger(min: number, max: number): number {
        const rand = min - 0.5 + Math.random() * (max - min + 1)
        return Math.round(rand);
    }

    getLiveImage(): string {
        return `${this.loginService.server.server_addr}/axis-cgi/mjpg/video.cgi?cameraId=${this.camId}&token=${this.loginService.login.token}`;
    }

}
