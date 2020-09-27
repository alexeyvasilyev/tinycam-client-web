import { Component, OnInit, Input } from '@angular/core';
import { LoginService, GenericService } from '../services';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VideoDialogComponent } from './video-dialog.component';
import { fadeInAnimation } from '../animations/';
import { EventRecord } from '../models';
import Utils from "../utils";

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
      max-width: 400px;
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
    .container {
      padding: 4px 4px;
      height: auto;
      overflow: hidden;
    }
    .right {
    }
    .left {
      float: left;
      margin-right: 20px;
    }
`],
  template: `
  <div [@fadeInAnimation]>
    <mat-card *ngIf="!eventDeleted">
      <mat-card-content [ngStyle]="{'background-color': eventPinned ? '#e3f0f7' : ''}">
        <div class="container" >

          <div (click)="openDialog()" class="left img" (mouseleave)="videoPlaying=false; videoLoading=false; loadedPercent=0;">

            <div *ngIf="autoplayOnHover">
              <div class="event-image-container" [hidden]="videoPlaying" (mouseleave)="stopProgressBar()">
                <img class="event-image" alt="Video" src="{{getEventImageUrl()}}" (mouseover)="startPlayer($event)" />
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
                <source src="{{getEventVideoUrl()}}" type="video/mp4">
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


          <div class="right">
            <div>
              <span style="color:#424242;font-weight:bold;">{{number + 1}}. {{getEventTitle()}}</span>
              <span *ngIf="getEventTitleHint() != null" class="app-chip" style="margin-left:10px;background-color:{{getEventTitleHintColor()}}">{{getEventTitleHint()}}</span>
              <div class="app-text-dark-secondary" style="padding-bottom: 10px">
                <div *ngIf="isThisHour(); else notThisHour" >
                  {{getLocalDateTime() | amTimeAgo}}
                </div>
                <div *ngIf="actionCommands" style="padding: 20px">
                  <span *ngIf="eventPinned; else notEventPinned">
                    <button mat-flat-button (click)="pinUnpinEvent(false)" matTooltip="Unpin event" style="margin-right:15px"><i class="fas fa-thumbtack fa-lg"></i></button>
                  </span>
                  <ng-template #notEventPinned>
                    <button mat-raised-button (click)="pinUnpinEvent(true)" matTooltip="Pin event" style="margin-right:15px"><i class="fas fa-thumbtack fa-lg"></i></button>
                  </ng-template>
                  <button mat-raised-button (click)="deleteEvent()" matTooltip="Delete event"><i class="fas fa-trash fa-lg"></i></button>
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
          </div>

        </div>

      </mat-card-content>
    </mat-card>
  </div>
  `
})
//<mat-card-content [ngStyle]="{'background-color': (eventPinned ? '#112233' : 'none')}">

export class EventComponent implements OnInit {

    autoplayOnHover = false;
    videoPlaying = false;
    videoLoading = false;
    private timerSubscription;
    private timerSubscriptionStartedTime;
    loadedPercent = 0;
    private initTime = 0;
    eventDeleted = false;
    eventPinned = false;

    constructor(
        private loginService: LoginService,
        private genericService: GenericService,
        private snackBar: MatSnackBar,
        public dialog: MatDialog) {
    }

    @Input() event: EventRecord;
    @Input() number: number;
    @Input() actionCommands: boolean;

    ngOnInit() {
        this.autoplayOnHover = true;//Utils.isBrowserFirefox();
        this.initTime = new Date().getTime();
        this.updateEventPinned();
    }

    private updateEventPinned() {
        // /api/v1/get_file?file=/Terrace/2020-09-20%2014.38.56%20613sec%20person_pin.mp4
        this.eventPinned = this.event.video.indexOf('_pin.mp4') > -1;
    }

    ngOnDestroy() {
        this.stopProgressBar();
    }

    getEventTitle(): string {
        if (this.event.motion === undefined) {
            return 'Recording - ' + (this.event.duration / 1000).toFixed() + ' sec';
        } else {
            return 'Motion - ' + (this.event.duration / 1000).toFixed() + ' sec';
        }
    }

    getEventTitleHint(): string {
        if (this.event.motion === undefined)
            return null;
        // Capitalize first letter
        return this.event.motion.charAt(0).toUpperCase() + this.event.motion.slice(1);
    }

    getEventTitleHintColor(): string {
        return Utils.getEventColor(this.event);
    }

    getEventImageUrl(): string {
        if (this.event.image !== undefined) {
            if (this.event.image.startsWith('http')) {
                return this.event.image;
            } else {
                const char = this.event.image.indexOf('?') == -1 ? '?' : '&';
                return `${this.loginService.server.url}${this.event.image}${char}token=${this.loginService.login.token}`;
            }
        } else {
            return `assets/img/placeholder.png`;
        }
    }

    getEventVideoUrl(): string {
        if (this.event.video !== undefined) {
            if (this.event.video.startsWith("http")) {
                return `${this.event.video}`;
            } else {
                const char = this.event.video.indexOf('?') == -1 ? '?' : '&';
                return `${this.loginService.server.url}${this.event.video}${char}token=${this.loginService.login.token}`;
            }
        }
    }

    getLocalDateTime(): Date {
        return new Date(this.event.time);
        // return new Date(this.date).toLocaleString();
    }

    getLocalDateTimeFormatted(): string {
        return new Date(this.event.time).toLocaleString();
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
        return this.initTime - new Date(this.event.time).getTime() < 1800000;
    }

    isLessThenTwoDays() {
        return this.initTime - new Date(this.event.time).getTime() < 86400000; // 2 days in msec
    }

    // From '/api/v1/get_file?file=/Doorbell/2020-09-20%2017.15.55%2043sec%20person.mp4'
    // To '/Doorbell/2020-09-20%2017.15.55%2043sec%20person.mp4'
    getPlainFilename(filename: string): string {
        return filename.replace("/api/v1/get_file?file=", "");
    }

    deleteEvent() {
        // console.log("deleteEvent()");
        const url = `/param.cgi?action=delete&root.Filename=${this.getPlainFilename(this.event.video)}`;
        this.sendHttpGetRequest(url)
        .then(
            res => {
                this.eventDeleted = true;
                this.snackBar.open('Event deleted', null, {
                    duration: 4000,
            })
        });
    }

    pinUnpinEvent(pin: boolean) {
        console.log(`pinEvent(pin=${pin})`);
        const ch = pin ? 'pin' : 'unpin';
        const url = `/param.cgi?action=${ch}&root.Filename=${this.getPlainFilename(this.event.video)}`;
        this.sendHttpGetRequest(url)
        .then(
            res => {
                if (pin) {
                    this.event.video = this.event.video.replace('.mp4', '_pin.mp4');
                    this.event.image = this.event.image.replace('.mp4', '_pin.mp4');
                } else {
                    this.event.video = this.event.video.replace('_pin.mp4', '.mp4');
                    this.event.image = this.event.image.replace('_pin.mp4', '.mp4');
                }
                this.eventPinned = pin;
                this.snackBar.open(`Event ${ch}ned`, null, {
                    duration: 4000,
            })
        });
    }

    sendHttpGetRequest(request: string): Promise<any> {
        return this.genericService.getRequest(this.loginService.server, this.loginService.login, request);
    }

    openDialog() {
        // console.log("openDialog()");
        // this.stopPlayer(event);
        this.videoPlaying = false;
        // const config = {
        //   width: '100%',
        // };
        const dialog = this.dialog.open(VideoDialogComponent);//, config);
        const title = this.getEventTitle();
        dialog.componentInstance.title =
            (title == null ? "" : title) +
            " (" + this.getLocalDateTimeFormatted() + ")";//'Duration - ' + (this.duration / 1000).toFixed() + ' sec';
        //this.getLocalDateTime();
        dialog.componentInstance.videoUrl = this.getEventVideoUrl();
        dialog.componentInstance.imageUrl = this.getEventImageUrl();
    }

}
