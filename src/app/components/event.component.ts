import { Component, OnInit, Input } from '@angular/core';
// import { trigger, animate, transition, style, state, keyframes } from '@angular/animations';
import { WindowRefService } from '../services';
// import { Observable } from 'rxjs/Rx';
import { MatDialog } from '@angular/material/dialog';
import { VideoDialogComponent } from './video-dialog.component';
import { fadeInAnimation } from '../animations/';

// <video> tag is shown only for Chrome/Firefox/Safari browsers. Not shown for IE.
// For Chrome browser only first 5 events are shown as <video>,
// the rest one are <image> (preventing too many active sockets issue).
@Component({
  selector: 'event',
  animations: [fadeInAnimation],
  // animations: [
  //     trigger('animate', [
  //         transition('* => fadeIn', [
  //             animate(150, keyframes([
  //                 style({opacity: 0, offset: 0}),
  //                 style({opacity: 1, offset: 1})
  //             ]))
  //         ])
  //   ])
  // ],
  // animations: [animateFactory(150, 0, 'ease-in')],
  styles: [ `
    .event-image {
      width: 400px;
      min-height: 224px;
      background: #616161;
    }
    .middle {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      -ms-transform: translate(-50%, -50%);
    }
    .circle:hover {
      opacity: 0;
    }
    .circle {
      position: absolute;
      background-color: #000000;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      transition: .5s ease;
    }
    .event-image-container:hover {
    }
    .event-image-container {
      position: relative;
      width: 400px;
      transition: .5s ease;
    }
    .event-video {
      background: #616161;
      width: 400px;
    }
    .preloadProgress {
      background: #616161;
      left: 0;
      position: absolute;
      bottom: 0;
      height: 4px;
      transition: width .8s ease;
      -webkit-transition: width .8s ease;
      z-index: 2
    }
    .img {
      position: relative;
      display: block;
    }
    .img:hover {
      cursor: pointer;
    }
  `],
  template: `
  <div [@fadeInAnimation]>
    <mat-card>
      <mat-card-content>
        <div class="app-row">
          <div class="app-column" style="width:80%">
            <span style="color:#424242;font-weight:bold;">{{number + 1}}. {{title}}</span>
            <span *ngIf="titleHint != null" class="app-text-dark-secondary" style="padding-left:5px;">[{{titleHint}}]</span>
            <div class="app-text-dark-secondary" style="padding-bottom: 10px">
              <div *ngIf="isThisHour(); else notThisHour" >
                {{getLocalDateTime() | amTimeAgo}}
              </div>
              <ng-template #notThisHour>
                <div *ngIf="isLessThenTwoDays(); else moreThanTwoDays" >
                  {{getLocalDateTime() | amCalendar}}
                </div>
              </ng-template>
              <ng-template #moreThanTwoDays>
                {{getLocalDateTimeFormatted()}}
              </ng-template>
            </div>
          </div>
          <div class="app-column" style="text-align:right; width:20%">
            <span *ngIf="this.hasAudio" >
                <i class="fas fa-lg fa-volume-up" style="color: #424242;"></i>
            </span>
            <span *ngIf="this.hasVideo" >
                <i class="fas fa-lg fa-child" style="color: #424242;"></i>
            </span>
          </div>
        </div>

    <!-- <a href="{{videoUrl}}" (mouseleave)="videoPlaying=false; videoLoading=false" class="img"> -->
    <!-- <a href="{{videoUrl}}" (mouseleave)="videoPlaying=false; videoLoading=false" class="img" [@animate]="'fadeIn'"> -->
    <div (click)="openDialog($event)" class="img" (mouseleave)="videoPlaying=false; videoLoading=false; loadedPercent=0;">

      <div *ngIf="autoplayOnHover" >
        <div class="event-image-container" [hidden]="videoPlaying" (mouseleave)="stopProgressBar()">
          <img class="event-image" alt="Video" src="{{imageUrl}}" (mouseover)="startPlayer($event)" />
          <!-- <div *ngIf="!videoPlaying" class="middle circle" [hidden]="videoLoading" style="opacity:0.4;"> -->
          <div class="middle circle" [ngStyle]="{'opacity': 0.5 - loadedPercent / 100}">
            <div class="middle">
              <i class="fas fa-play-circle fa-5x" style="color:white;"></i>
            </div>
          </div>
        </div>
        <div class="preloadProgress" *ngIf="videoLoading" [ngStyle]="{'width': loadedPercent + 'px'}"></div>
        <!-- <div class="marker-overlays">10</div> -->
        <video *ngIf="videoPlaying || videoLoading" [hidden]="!videoPlaying"
         class="event-video" autoplay preload="auto" (mouseleave)="stopPlayer($event)" poster="{{imageUrl}}" (canplaythrough)="videoLoaded($event)">
          <source src="{{videoUrl}}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      </div>

      <div *ngIf="!autoplayOnHover">
        <div class="event-image-container">
          <img class="event-image" src="{{imageUrl}}"/>
          <div class="middle circle" style="opacity: 0.5;">
            <div class="middle">
              <i class="fas fa-play-circle fa-5x" style="color:white;"></i>
            </div>
          </div>
        </div>
      </div>

    </div>
    <!-- </a> -->
    </mat-card-content>
    </mat-card>
  </div>
  `
})

export class EventComponent implements OnInit {

    TYPE_EVENT          = 0;
    TYPE_STATUS_STARTED = 1;
    TYPE_STATUS_STOPPED = 2;

    autoplayOnHover = false;
    videoPlaying = false;
    videoLoading = false;
    private timerSubscription;
    private timerSubscriptionStartedTime;
    loadedPercent = 0;
    private initTime = 0;

    constructor(private windowRef: WindowRefService, public dialog: MatDialog) {
    }

    @Input() status: number;
    @Input() number: number;
    @Input() title: string;
    @Input() titleHint: string;
    @Input() date: number;
    @Input() imageUrl: string;
    @Input() videoUrl: string;
    @Input() hasVideo: boolean;
    @Input() hasAudio: boolean;

    ngOnInit() {
        this.autoplayOnHover = true;//Utils.isBrowserFirefox();
        this.initTime = new Date().getTime();
    }

    ngOnDestroy() {
        this.stopProgressBar();
    }

    getLocalDateTime(): Date {
        return new Date(this.date);
        // return new Date(this.date).toLocaleString();
    }

    getLocalDateTimeFormatted(): string {
        return new Date(this.date).toLocaleString();
    }

    getUtcNow(): Date {
        var now = new Date();
        return new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    }

    videoLoaded(event): void {
        // console.log("videoLoaded()");
        this.stopProgressBar();
        this.videoLoading = false;
        this.videoPlaying = true;
    }

    private startProgressBar(): void {
        // console.log("startProgressBar()");
        // if (this.timerSubscription)
        //     this.timerSubscription.unsubscribe();
        // let timer = Observable.timer(0, 100).take(50); // 5 sec
        // this.timerSubscription = timer.subscribe(t => this.loadedPercent = Math.min(t * 10, 500));
        // this.loadedPercent = 0;
        this.timerSubscriptionStartedTime = Date.now();
        this.startProgressBarTimer();
    }

    private startProgressBarTimer() {
      // console.log("startProgressBarTimer()");
      if (this.timerSubscription)
          clearTimeout(this.timerSubscription);
      this.timerSubscription = setTimeout(() => {
        //this.loadedPercent = 500;
          let t = (Date.now() - this.timerSubscriptionStartedTime) / 1000;
          this.loadedPercent = Math.min(t * 40, 400);
          // console.log('Time: ' + t);
          if (this.timerSubscriptionStartedTime > 0 && this.loadedPercent < 400)
              this.startProgressBarTimer();
      }, 100);
    }

    stopProgressBar(): void {
        // console.log("stopProgressBar()");
        // if (this.timerSubscription)
        //     this.timerSubscription.unsubscribe();
        if (this.timerSubscription)
            clearTimeout(this.timerSubscription);
        this.timerSubscriptionStartedTime = 0;
        this.timerSubscription = null;
        this.loadedPercent = 0;
    }

    startPlayer(event): void {
        //console.log("startPlayer()");
        // var target = event.target || event.srcElement;
        this.videoLoading = true;
        this.startProgressBar();
        //target.hidden = true;
        //target.play();
        // HACK: Preventing Chrome loading keeping connection for video elements.
        // http://stackoverflow.com/questions/16137381/html5-video-element-request-stay-pending-forever-on-chrome
        // if (this.browserChrome && new Date().getTime() - this.initTime > 5000) {
        //     this.windowRef.nativeWindow.stop();
        //     this.imageUrl = this.imageUrl;
        // }
    }

    stopPlayer(event): void {
        //console.log("stopPlayer()");
        var target = event.target || event.srcElement;
        target.pause();
        this.videoPlaying = false;
    }

    // config: MatDialogConfig = {
        // disableClose: false,
        // hasBackdrop: false,
        // backdropClass: '',
        // width: '',
        // height: '',
        // position: {
        //   top: '',
        //   bottom: '',
        //   left: '',
        //   right: ''
        // },
        // data: {
        //   message: 'Jazzy jazz jazz'
        // }
    // };

    isThisHour() {
        return this.initTime - new Date(this.date).getTime() < 1800000;
    }

    isLessThenTwoDays() {
        return this.initTime - new Date(this.date).getTime() < 86400000; // 2 days in msec
    }

    openDialog(event) {
        console.log("openDialog()");
        // this.stopPlayer(event);
        this.videoPlaying = false;
        let dialog = this.dialog.open(VideoDialogComponent);//, this.config);
        dialog.componentInstance.title =
            (this.title == null ? "" : this.title) +
            " (" + this.getLocalDateTimeFormatted() + ")";//'Duration - ' + (this.duration / 1000).toFixed() + ' sec';
        //this.getLocalDateTime();
        dialog.componentInstance.videoUrl = this.videoUrl;
        dialog.componentInstance.imageUrl = this.imageUrl;
    }

}
