import { Component, Input, ElementRef, ViewChild } from '@angular/core';
import { LoginService } from '../services';

@Component({
    selector: 'live',
    // animations: [animateFactory(150, 0, 'ease-in')],
    styles: [ `
        .cell {
            background-repeat: no-repeat;
            background-position: center;
            background-size: contain;
            background-image: url("assets/img/loading.png");
            background-color: #212121;
        }
    `],
    template: `
      <!-- <img #image alt="" (load)="loadImage(0)" (error)="loadImageError(0)" src="{{getLiveImage()}}"/> -->
      <div #cell class="cell" style="height:100%">
        <img #image alt="" style="height:100%"/>
      </div>
    `
})

export class LiveComponent {
    // .cell:hover .cover {
    //     display: block;
    //   }
    //   .cell {
    //     background-repeat: no-repeat;
    //     background-position: center;
    //     background-size: contain;
    //     background-image: url("assets/img/loading.png");
    //     background-color: #212121;
    //   }
    //   .full-height {
    //     height: 80vh;
    //     background: yellow;
    //   }

    @Input() camId: number; 
    @ViewChild('image', { static: true }) imageEl: ElementRef;
    @ViewChild('cell', { static: true }) cellEl: ElementRef;

    constructor(
        public loginService: LoginService) {
          console.log('LiveComponent()');
    }

      private fitToContainerWidthHeight(element) {
          console.log('fitToContainerWidthHeight(): ' + element.offsetHeight);
//         element.style.height = '1000px';
        // element.style.width = '100%';
    //    document.documentElement.scrollTop > document.documentElement.clientHeight
    //    element.height = document.documentElement.clientHeight;
    //    element.width = element.offsetWidth;
      }
    ngOnInit() {
        this.fitToContainerWidthHeight(this.cellEl.nativeElement);
        // this.cellEl.nativeElement.offsetWidth = '100px';
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
