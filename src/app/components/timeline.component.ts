import { Component, OnInit, Input, SimpleChanges, ElementRef, ViewChild } from '@angular/core';
import { CameraSettings, EventRecord } from '../models'
import { EventListService, LoginService } from '../services';
import { HttpErrorResponse } from '@angular/common/http';
import Utils from '../utils';
import ResizeObserver from 'resize-observer-polyfill';
import { fadeInAnimation } from '../animations/';

declare const Timeline: any;
declare const TimeRecord: any;
// declare const INTERVAL_DAY_7: any;
// declare const INTERVAL_DAY_1: any;
// declare const INTERVAL_HOUR_12: any;

// TODO: Fix via import/export
const INTERVAL_DAY_7   = 168 * 60 * 60 * 1000;
const INTERVAL_DAY_1   =  24 * 60 * 60 * 1000;
const INTERVAL_HOUR_12 =  12 * 60 * 60 * 1000;

@Component({
  selector: 'timeline',
  animations: [fadeInAnimation],
  styles: [ `
    .middle {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      -ms-transform: translate(-50%, -50%);
    }
    .circle {
      position: absolute;
      background-color: #000000;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      transition: .2s ease;
    }
    .button {
      background-color: #212121;
      border: none;
      color: white;
      padding: 4px 4px;
      text-align: center;
      text-decoration: none;
      margin: 2px 2px;
      font-size: 18px;
    }
    .button:hover {
      background-color: #424242;
      box-shadow: 0 0 2px rgba(0,0,0,.12), 0 2px 2px rgba(0,0,0,.2);
    }
    .button-selectable {
      background-color: #212121;
      border: none;
      color: white;
      padding: 4px 0px;
      text-align: center;
      text-decoration: none;
      margin: 0px 1px;
      font-size: 18px;
    }
    .button-selectable:hover {
      background-color: #424242;
      box-shadow: 0 0 2px rgba(0,0,0,.12), 0 2px 2px rgba(0,0,0,.2);
    }
    .video {
      display: block;
      margin-left: auto;
      margin-right: auto;
      width: 98%;
      height: 500px;
    }
    .app-video-container {
      position: relative;
    }
  `],
  host: {
    '(document:keydown)': 'handleKeyDown($event)'
  },
  template: `
  <div #component>
    <mat-card *ngIf="!isAllEventsLoaded()" style="margin:10px 0;">
      Loading archive...
    </mat-card>

    <div *ngIf="isAllEventsLoaded()">
      <div class="app-text-center" style="padding-bottom: 10px">
        <div *ngIf="events.length > 0; else no_archives_content">
        </div>
        <ng-template #no_archives_content>
          <mat-card>
            <p>No archives found.</p> If you just added a camera, <b>please wait for 15 minutes</b> to get recordings available.
          </mat-card>
        </ng-template>
      </div>
    </div>

    <div [@fadeInAnimation] width="100%" style="background-color: #212121; cursor: pointer;" #mainComponent>
      <div class="app-video-container">
        <video class="video" preload="auto" #videoComponent playsinline autoplay
          (error)="handleVideoError()" (playing)="handleVideoPlaying()"
          (pause)="handleVideoStoppedPaused()" (ended)="handleVideoEnded()"
          (loadstart)="handleVideoLoadStart()" (loadeddata)="handleVideoLoadedData()"
          (click)="handleVideoClicked()" (dblclick)="toggleFullScreen()" src="{{videoUrl}}">
          Your browser does not support the video tag.
        </video>
        <div style="padding:5px;"
         (mousemove)="handleMouseMoveEvent($event)" (mouseup)="handleMouseUpEvent($event)"
         (touchmove)="handleTouchMoveEvent($event)" (touchstart)="handleTouchStartEvent($event)">
          <canvas #canvasTimeline></canvas>
        </div>
        <div class="middle circle" *ngIf="videoLoading"
          style="opacity: 0.3;" (click)="handlePlayPauseClicked()"
          [style.opacity]="videoLoading ? '0.3' : '0'" [style.visibility]="videoLoading ? 'visible' : 'hidden'">
          <div class="middle">
            <i class="fas fa-circle-notch fa-spin fa-3x fa-fw" style="color:white;"></i>
          </div>
        </div>
        <div class="middle circle" *ngIf="videoError"
          style="opacity: 0.8;"
          [style.opacity]="videoError ? '0.8' : '0'" [style.visibility]="videoError ? 'visible' : 'hidden'">
          <div class="middle">
            <i class="fas fa-video-slash fa-3x fa-fw" style="color:white;"></i>
          </div>
        </div>

      </div>
    </div>

    <div style="padding: 20px; text-align: center;">
      <button mat-raised-button class="button" (click)="handlePlayPauseClicked();">
        <span *ngIf="!videoPlaying">
          <i class="fas fa-play"></i>
        </span>
        <span mat-raised-button *ngIf="videoPlaying">
          <i class="fas fa-pause"></i>
        </span>
      </button>

      <button mat-raised-button class="button" (click)="gotoPrevEvent(true);" style="margin-left:30px;">
        <span>
          <i class="fas fa-backward"></i>
        </span>
      </button>
      <button mat-raised-button class="button" (click)="gotoNextEvent(true);">
        <span>
          <i class="fas fa-forward"></i>
        </span>
      </button>
      <button mat-raised-button class="button" (click)="gotoLastEvent();" style="margin-left:30px;">
        <span>
          <i class="fas fa-fast-forward"></i>
        </span>
      </button>

      <button mat-raised-button class="button" (click)="timeline.increaseInterval();" style="margin-left:30px;">
        <span>
          <i class="fas fa-minus"></i>
        </span>
      </button>
      <button mat-raised-button class="button" (click)="timeline.decreaseInterval();">
        <span>
          <i class="fas fa-plus"></i>
        </span>
      </button>

      <button mat-raised-button class="button" (click)="toggleFullScreen();" style="margin-left:30px;">
        <span>
          <i class="fas fa-expand-alt"></i>
        </span>
      </button>

      <button mat-raised-button class="button" (click)="handleMoreClicked();" style="margin-left:30px;">
        <span *ngIf="!moreButtons">
          <i class="fas fa-angle-down"></i>
        </span>
        <span mat-raised-button *ngIf="moreButtons">
          <i class="fas fa-angle-up"></i>
        </span>
      </button>

      <div *ngIf="moreButtons" style="padding-top:20px;">
        <button mat-raised-button class="button-selectable" (click)="setSpeed(0.1);" style="margin-left:30px;" [ngStyle]="{'opacity':playerSpeed==0.1?'0.5':'1.0'}">
          <span>0.1x</span>
        </button>
        <button mat-raised-button class="button-selectable" (click)="setSpeed(0.5);" [ngStyle]="{'opacity':playerSpeed==0.5?'0.5':'1.0'}">
          <span>0.2x</span>
        </button>
        <button mat-raised-button class="button-selectable" (click)="setSpeed(1.0);" [ngStyle]="{'opacity':playerSpeed==1.0?'0.5':'1.0'}">
          <span>1x</span>
        </button>
        <button mat-raised-button class="button-selectable" (click)="setSpeed(2.0);" [ngStyle]="{'opacity':playerSpeed==2.0?'0.5':'1.0'}">
          <span>2x</span>
        </button>
        <button mat-raised-button class="button-selectable" (click)="setSpeed(3.0);" [ngStyle]="{'opacity':playerSpeed==3.0?'0.5':'1.0'}">
          <span>3x</span>
        </button>
        <!-- <a href="{{this.videoUrl}}" download class="button" style="margin-left:30px;" target="_blank">
          <i class="fas fa-download"></i>
        </a> -->
      </div>
    </div>

    <div style="padding:10px;">
      <p>Keys <b>+</b>/<b>-</b> - increase/decrease timeline scale.<br/>
      Keys <b>Left</b>/<b>Right</b>/<b>A</b>/<b>D</b> - previous/next events.<br/>
      <span *ngIf="multipleTimeline">Keys <b>W</b>/<b>S</b> - change timelines.<br/></span>
      <b>Space bar</b> - start/stop playback.<br/>
      <div style="margin-top:20px;">
        <span style="margin-right:25px;"><span style="background-color: #1de9b6; padding:3px; margin-right:8px;"></span>motion</span>
        <span style="margin-right:25px;"><span style="background-color: #ae5a41; padding:3px; margin-right:8px;"></span>audio</span>
        <span style="margin-right:25px;"><span style="background-color: #74559e; padding:3px; margin-right:8px;"></span>person</span>
        <span style="margin-right:25px;"><span style="background-color: #1b85b8; padding:3px; margin-right:8px;"></span>vehicle</span>
        <span style="margin-right:25px;"><span style="background-color: #827717; padding:3px; margin-right:8px;"></span>face</span>
        <span style="margin-right:25px;"><span style="background-color: #784646; padding:3px; margin-right:8px;"></span>pet</span>
      </div>
    </div>
  `
})

export class TimelineComponent implements OnInit {

    private MIN_DURATION_EVENT_MSEC = 3000;
    private EVENT_OFFSET_MSEC = 3000;
    // private ARCHIVES_TO_LOAD = 30;
    // private EVENTS_TO_LOAD = 30;

    // [timelineIndex][records]
    events: EventRecord[][] = null;
    // archivesLoaded = false;
    eventsLoaded: boolean[] = null;
    timeline = null;
    videoUrl: string = null;
    videoPlaying = false;
    videoLoading = false;
    videoError = false;
    playerSpeed = 1.0;
    moreButtons = false;
    // showOnScreenButton = true;

    // private noOldArchivesAvailable: boolean[] = null;
    private noOldEventsAvailable: boolean[] = null;
    private timerSubscription;
    private loadingDelayTimer = null;

    constructor(
        private loginService: LoginService,
        private eventListService: EventListService) {
    }

    @Input() cameras: CameraSettings[];
    @Input() selectedCameraId: number;
    @Input() multipleTimeline: boolean;
    @Input() type: string; // 'local' or 'cloud'
    @ViewChild('component', { static: true }) componentEl: ElementRef;
    @ViewChild('canvasTimeline', { static: true }) canvasTimelineEl: ElementRef;
    @ViewChild('videoComponent', { static: true }) videoEl: ElementRef;
    @ViewChild('mainComponent', { static: true }) mainEl: ElementRef;

    ngOnInit() {
        // console.log('ngOnInit()');
        let names = [];
        for (let camera of this.cameras) {
            names.push(CameraSettings.getName(camera));
        }
        // console.log('archive-timeline init');
        const options = {
            timelines: (this.multipleTimeline ? this.cameras.length : 1),
            timelineNames: (this.multipleTimeline ? names : []),
            colorTimeBackground: "#c62828",
            colorTimeText: "#ffffff",
            colorTimelineSelected: "#00838F",
            colorBackground: "#212121",
            colorRectNoData: "#2b2b2b",
            colorRectBackground: "#2e484b",
            colorRectMajor1: "#1de9b6",
            colorRectMajor2: "#ff6d00",
            colorMajor1Selected: "#ffca28",
            colorMajor2Selected: "#be8e00",
            colorDigits: "#cccccc",
        };
        this.timeline = new Timeline(options);
        this.timeline.setIntervalWithAnimation(INTERVAL_DAY_1);
        this.timeline.setCanvas(this.canvasTimelineEl.nativeElement);
        this.timeline.setTimeSelectedCallback(this.timeSelectedCallback.bind(this));
        // this.timeline.setRequestMoreBackgroundDataCallback(this.requestMoreBackgroundData.bind(this));
        this.timeline.setRequestMoreMajor1DataCallback(this.requestMoreVideoEvents.bind(this));

        this.events = new Array(options.timelines);
        // this.noOldArchivesAvailable = new Array(options.timelines);
        this.noOldEventsAvailable = new Array(options.timelines);
        this.eventsLoaded = new Array(options.timelines);
        for (let i = 0; i < options.timelines; i++) {
            this.events[i] = [];
            // this.noOldArchivesAvailable[i] = false;
            this.noOldEventsAvailable[i] = false;
            this.eventsLoaded[i] = false;
        }

        // this.updateTimeline();
        // this.resizeCanvas();

        const ro = new ResizeObserver((entries, observer) => {
            this.resizeCanvas();
        });
        ro.observe(this.componentEl.nativeElement);

        // this.loadLastArchives();
        this.loadLastEvents();

        document.onfullscreenchange = function(event) {
            let height: number;
            if (document.fullscreenElement) {
                height = this.mainEl.nativeElement.offsetHeight - this.canvasTimelineEl.nativeElement.offsetHeight;
            } else {
                height = 500;
            }
            this.videoEl.nativeElement.style.height = height + 'px';
        }.bind(this);
    }

    ngOnChanges(changes: SimpleChanges) {
        // console.log('ngOnChanges()');
        // Stop previous camera playback
        const video = this.videoEl.nativeElement;
        if (video) {
          video.poster = "";
          video.pause();
          this.videoUrl = '/';
          video.load();
        }
        this.ngOnInit();
        // this.loadLastArchives();
    }

    ngOnDestroy() {
        this.stopUpdateTimer();
        document.onfullscreenchange = null;
    }

    handleKeyDown(event: KeyboardEvent) {
        if (event.repeat) return;
        console.log("Key down: " + event.key);
        switch(event.key) {
            case "a":
            case "ArrowLeft": this.gotoPrevEvent(true); event.preventDefault(); break;
            case "d":
            case "ArrowRight": this.gotoNextEvent(true); event.preventDefault(); break;
            case "w": this.selectUpperTimeline(); event.preventDefault(); break;
            case "ArrowUp": if (document.fullscreenElement) { this.selectUpperTimeline(); event.preventDefault(); } break;
            case "ArrowDown": if (document.fullscreenElement) { this.selectBottomTimeline(); event.preventDefault(); } break;
            case "s": this.selectBottomTimeline(); event.preventDefault(); break;
            case " ": this.handlePlayPauseClicked(); event.preventDefault(); break;
            case "-": this.timeline.increaseInterval(); event.preventDefault(); break;
            case "=": this.timeline.decreaseInterval(); event.preventDefault(); break;
        };
    }

    // handleKeyboardEvents(event: KeyboardEvent) {
    //     const keyCode = event.which || event.keyCode;
    //     // console.log("Key: " + keyCode);
    //     switch(keyCode) {
    //         // case 173: // firefox
    //         // case 189: this.timeline.increaseInterval(); event.preventDefault(); break; // -
    //         // case 61: // firefox
    //         // case 187: this.timeline.decreaseInterval(); event.preventDefault(); break; // +
    //         case 37: this.gotoPrevEvent(true); event.preventDefault(); break; // Left
    //         case 39: this.gotoNextEvent(true); event.preventDefault(); break; // Right
    //         case 81: this.selectUpperTimeline(); event.preventDefault(); break; // Q
    //         case 65: this.selectBottomTimeline(); event.preventDefault(); break; // A
    //     }
    // }

    private mouseScrolling: boolean = false;
    handleMouseUpEvent(event: MouseEvent) {
        if (this.mouseScrolling)
            this.mouseScrolling = false;
        else
            this.timeline.onSingleTapUp(event);
    }

    handleMouseMoveEvent(event: MouseEvent) {
        // console.log("move: " + e.buttons);
        if (event.buttons == 1) {
            this.mouseScrolling = true;
            this.timeline.onScroll(event.movementX);
        }
    }

    private firstTouch: number = 0;
    handleTouchStartEvent(event: TouchEvent) {
        if (event.targetTouches.length == 1) {
            this.firstTouch = event.targetTouches[0].pageX;
        }
    }

    handleTouchMoveEvent(event: TouchEvent) {
        if (event.targetTouches.length == 1) {
            const touchDelta = event.targetTouches[0].pageX - this.firstTouch;
            this.timeline.onScroll(touchDelta);
            this.firstTouch = event.targetTouches[0].pageX;
        }
    }

    handleVideoError() {
        this.stopLoadingDelayTimer();
        this.stopUpdateTimer();
        if (this.videoUrl != '/') {
            console.error('Video loading error');
            this.videoError = true;
        }
        this.videoPlaying = false;
    }

    handleVideoPlaying() {
        console.log('Video playing');
        this.videoPlaying = true;
        this.videoError = false;
        this.stopLoadingDelayTimer();
        this.startUpdateTimer();
    }

    handleVideoStoppedPaused() {
        console.log('Video stopped');
        this.videoPlaying = false;
        this.stopLoadingDelayTimer();
        this.stopUpdateTimer();
    }

    handleVideoEnded() {
        console.log('Video ended');
        this.videoPlaying = false;
        this.stopLoadingDelayTimer();
        this.stopUpdateTimer();
        // TODO Get next video
        // this.videoError = true;
    }

    handleVideoLoadStart() {
        console.log('Video loading');
        this.videoPlaying = false;
        this.videoError = false;
        this.startLoadingDelayTimer();
        this.stopUpdateTimer();
        // TODO Get next video
    }

    handleVideoLoadedData() {
        console.log('Video loaded');
        this.stopLoadingDelayTimer();
    }

    handleVideoClicked() {
        console.log('Video clicked');
        // this.showOnScreenButton = !this.showOnScreenButton;
        this.handlePlayPauseClicked();
    }

    handlePlayPauseClicked() {
        console.log('Play/pause clicked');
        //playing = !playing;
        let video = this.videoEl.nativeElement;
        if (video) {
            if (!this.videoPlaying) {
                video.play();
                this.startLoadingDelayTimer();
            } else {
                video.pause();
                this.stopLoadingDelayTimer();
            }
        }
    }

    handleMoreClicked() {
        this.moreButtons = !this.moreButtons;
    }

    setSpeed(speed: number) {
        this.playerSpeed = speed;
        this.videoEl.nativeElement.defaultPlaybackRate = speed;
        this.videoEl.nativeElement.playbackRate = speed;
        if (this.timerSubscription) {
            this.stopUpdateTimer();
            this.startUpdateTimer();
        }
    }

    toggleFullScreen() {
      Utils.toggleFullScreen(this.mainEl.nativeElement);
      const height = this.mainEl.nativeElement.offsetHeight - this.canvasTimelineEl.nativeElement.offsetHeight;
      this.videoEl.nativeElement.style.height = height + 'px';
    }

    private updateTimeline() {
        console.log('updateTimeline()');
        const totalTimelines = this.timeline.getTotalTimelines();
        for (let i = 0; i < totalTimelines; i++) {
            const recordsVideoEvents = this.getVideoEventRecords(i);
            const recordsAudioEvents = this.getAudioEventRecords(i);
            const recordsArchives = this.getBackgroundRecords(i);

            this.timeline.setMajor1Records(i, recordsVideoEvents);
            this.timeline.setMajor2Records(i, recordsAudioEvents);
            this.timeline.setBackgroundRecords(i, recordsArchives);
        }

        this.timeline.draw();
    }

    private fitToContainerWidth(element) {
        element.style.width = '100%';
        const timelines = this.timeline.getTotalTimelines();
        element.height = timelines * (timelines > 1 ? 40 : 50) + 25;
        element.width = element.offsetWidth;
    }

    private resizeCanvas() {
        // console.log('resizeCanvas()');
        this.fitToContainerWidth(this.canvasTimelineEl.nativeElement);
        this.timeline.updateResize();
        this.timeline.draw();
    }

    private getTimestampFromRecord(record) {
        return /*record.object.video_offset +*/ record.timestampMsec;
    }

    private timeSelectedCallback(timelineIndex: number, timestampMsec: number, record) {
        console.log("timeSelectedCallback(timelineIndex=" + timelineIndex + ", timestampMsec=" + timestampMsec + ")");
        if (record) {
            const playerPosition = Math.floor(Math.max(timestampMsec - record.timestampMsec, 0) / 1000);
            this.playRecord(record, playerPosition);
            this.videoError = false;
        } else {
            console.error('Cannot play video. Selected record is empty.');
            this.stopPlay();
            this.videoError = true;
        }
    }

    selectUpperTimeline() {
      if (this.timeline.getCurrentTimeline() > 0) {
        this.timeline.setCurrentTimeline(this.timeline.getCurrentTimeline() - 1);
        this.gotoRecord();
        this.timeline.draw();
      }
    }

    selectBottomTimeline() {
      if (this.timeline.getCurrentTimeline() < this.timeline.getTotalTimelines()) {
        this.timeline.setCurrentTimeline(this.timeline.getCurrentTimeline() + 1);
        this.gotoRecord();
        this.timeline.draw();
      }
    }

    gotoRecord() {
      console.log('gotoRecord()');
      const i = this.timeline.getCurrentTimeline();
      const records = this.timeline.getBackgroundRecords(i);
      if (records.length > 0) {
          const record = this.timeline.getRecord(this.timeline.getCurrent(), records);
          const timestamp = this.timeline.getCurrent();
          this.timeSelectedCallback(i, timestamp, record);
          this.timeline.draw();
      }
    }

    gotoNextEvent(animation: boolean) {
        const i = this.timeline.getCurrentTimeline();
        const record = this.timeline.getNextMajorRecord(i);
        if (record != null) {
            const timestamp = this.getTimestampFromRecord(record);
            this.timeSelectedCallback(i, timestamp, record);
            if (animation)
                this.timeline.setCurrentWithAnimation(record.timestampMsec);
            else
                this.timeline.setCurrent(record.timestampMsec);
            this.timeline.draw();
            // console.log('Video: ' + this.videoUrl);
        }
    }

    gotoLastEvent() {
        console.log('gotoLastEvent()');
        const i = this.timeline.getCurrentTimeline();
        let records = this.timeline.getMajor1Records(i);
        // At least one event exists
        if (records.length > 0) {
            const record = records[0];
            const timestamp = this.getTimestampFromRecord(record);
            this.timeSelectedCallback(i, timestamp, record);
            this.timeline.setCurrentWithAnimation(record.timestampMsec);
            this.timeline.draw();
        } else {
            // No events found. Show last video recording.
            records = this.timeline.getBackgroundRecords(i);
            if (records.length > 0) {
                const record = records[0];
                // 30 sec before video finished.
                const timestamp = record.timestampMsec + Math.max(record.durationMsec - 30000, 0);
                this.timeSelectedCallback(i, timestamp, record);
                this.timeline.setCurrentWithAnimation(record.timestampMsec);
                this.timeline.draw();
            }
        }
    }

    gotoPrevEvent(animation: boolean) {
        const i = this.timeline.getCurrentTimeline();
        const record = this.timeline.getPrevMajorRecord(i);
        if (record != null) {
            const timestamp = this.getTimestampFromRecord(record);
            this.timeSelectedCallback(i, timestamp, record);
            if (animation)
                this.timeline.setCurrentWithAnimation(record.timestampMsec);
            else
                this.timeline.setCurrent(record.timestampMsec);
            this.timeline.draw();
            console.log('Video: ' + this.videoUrl);
        }
    }

    private stopPlay() {
        console.log('Stop play');
        const video = this.videoEl.nativeElement;
        if (video) {
            video.pause();
        }
    }

    private playRecord(record, positionSec: number) {
        console.log('playRecord(positionSec=' + positionSec + ')');
        if (record === undefined || record === null) {
            console.error('Failed to play empty record.');
            return;
        }
        const video = this.videoEl.nativeElement;
        let needRefresh = true;
        if (video) {
            const newUrl = this.getEventVideo(record.object);
            if (this.videoUrl) {
                // Extracting real filename to check if new video loading needed, e.g.
                const lastCoreUrl = this.videoUrl.slice(0, this.videoUrl.lastIndexOf('#t='));
                if (lastCoreUrl.localeCompare(newUrl) == 0) {
                    video.currentTime = positionSec;
                    // video.play();
                    needRefresh = false;
                }
            }
            if (needRefresh) {
                // Load preview image before video stopped for smooth transition
                const imageUrl = this.getEventImage(record.object);
                if (imageUrl !== undefined)
                    video.poster = imageUrl;
                else
                    console.log('Skipped showing empty poster');
                video.pause();
                this.videoUrl = newUrl + '#t=' + positionSec;
                console.log('videUrl: ' + this.videoUrl);
                // Load video
                video.load();
                // video.currentTime = positionSec;
                video.play();
            }
        }
    }

    isAllEventsLoaded(): boolean {
        const timelines = this.timeline.getTotalTimelines();
        for (let i = 0; i < timelines; ++i) {
            if (!this.eventsLoaded[i])
                return false;
        }
        return true;
    }

    private loadLastEvents() {
        console.log('loadLastEvents()');
        // Clear events
        const timelines = this.timeline.getTotalTimelines();
        this.events = new Array(timelines);
        for (let i = 0; i < timelines; i++) {
          this.eventsLoaded[i] = false;
          this.events[i] = [];
        }
        for (let i = 0; i < timelines; ++i) {
           this.eventListService.getEventList(
               this.loginService.server,
               this.loginService.login,
               timelines > 1 ? this.cameras[i].id : this.selectedCameraId,
               -1,
               this.getEventsToLoad(),
               this.type,
               '') // all events
                   .then(events => {
                          this.requestingMoreVideoEvents = false;
                          this.processEventList(i, events, true);
                          this.gotoLastEvent();
                      },
                      error => { this.processEventListError(i, error); }
                   );
           }
    }


    private processEventListError(timelineIndex: number, error: HttpErrorResponse) {
        console.error(`Error while getting events list for timeline ${timelineIndex}`, error.message);
        if (this.multipleTimeline && error.status == 400 && this.type === 'cloud') {
            // 400 (Bad Request) is OK for some timelines
            this.eventsLoaded[timelineIndex] = true;
            this.noOldEventsAvailable[timelineIndex] = true;
        }
    }

    private processEventList(timelineIndex: number, events: EventRecord[], firstLoad: boolean) {
        console.log('processEventList(timelineIndex=' + timelineIndex + ', firstLoad=' + firstLoad + ')');
        if (events) {
            console.log('Obtained events: ' + events.length);
            // Forbid requesting old events
            if (events.length == 0) {
                if (timelineIndex > -1)
                    this.noOldEventsAvailable[timelineIndex] = true;
            } else {
                // let newEvents = [];
                for (let event of events) {
                    if (event.duration < 1500)
                        event.duration = 1500; // 1.5 sec min
                }
                if (events.length == 0) {
                    if (timelineIndex > -1)
                        this.noOldEventsAvailable[timelineIndex] = true;
                } else {
                    // Concatinate arrays
                    this.events[timelineIndex] = this.events[timelineIndex].concat(events);
                }
                console.log('Filtered events: ' + events.length);
            }
        } else {
            console.log('Events empty');
        }

        this.eventsLoaded[timelineIndex] = true;
        this.updateTimeline();

        // Check that all timelines have at least one archive loaded
        if (firstLoad) {
          if (this.events[timelineIndex].length == 0) {
            console.log('Found empty events for timeline ' + timelineIndex + '. Requesting more data.');
            // Force to load background data
            this.requestingMoreVideoEvents = false;
            this.requestMoreVideoEvents(timelineIndex);
          }

            // let timelines = this.timeline.getTotalTimelines();
            // for (let i = 0; i < timelines; i++) {
            //     if (this.events[i].length == 0) {
            //         console.log('Found empty events for timeline ' + i + '. Requesting more data.');
            //         // Force to load background data
            //         this.requestingMoreVideoEvents = false;
            //         this.requestMoreVideoEvents(i);
            //     }
            // }
        }
    }

    // private loadLastArchives() {
        // console.log('loadLastArchives()');
        // this.archivesLoaded = false;
//        let timelines = this.timeline.getTotalTimelines();
        // this.archives = new Array(timelines);
        // for (let i = 0; i < timelines; i++) {
        //    this.archives[i] = [];
        // }
        // let archivesToLoad = this.getEventsToLoad() * timelines;
        // this.archiveListService.getArchiveListById(
        //     this.loginService.server,
        //     this.loginService.login,
        //     timelines > 1 ? -1 : this.selectedCamId,
        //     -1,
        //     archivesToLoad)
        //         .then(archives => {
        //             this.processArchiveList(timelines > 1 ? -1 : 0, archives, true);
        //             this.gotoLastEvent();
        //         });
    // }

    // private processArchiveList(timelineIndex: number, archives: ArchiveRecord[], firstLoad: boolean) {
    //     // console.log('processArchiveList(timelineIndex=' + timelineIndex + ', firstLoad=' + firstLoad + ')');
    //     if (archives) {
    //         // console.log('Archives: ' + archives.length);
    //         if (archives.length == 0) {
    //             if (timelineIndex > -1)
    //                 this.noOldArchivesAvailable[timelineIndex] = true;
    //         } else {
    //             // Concatinate arrays
    //             let timelines = this.timeline.getTotalTimelines();
    //             if (timelines > 1) {
    //                 for (let i = 0; i < timelines; i++) {
    //                     let camId = this.cameras[i].id;
    //                     for (let archive of archives) {
    //                         if (archive.id == camId)
    //                             this.archives[i].push(archive);
    //                     }
    //                 }
    //             } else {
    //                 this.archives[0] = this.archives[0].concat(archives);
    //             }
    //             // console.log('Filtered archives: ' + newArchives.length);
    //         }
    //     // } else {
    //     //     console.log('Archive empty');
    //     }

    //     this.archivesLoaded = true;
    //     this.updateTimeline();

    //     // Check that all timelines have at least one archive loaded
    //     if (firstLoad) {
    //         let timelines = this.timeline.getTotalTimelines();
    //         for (let i = 0; i < timelines; i++) {
    //             if (this.archives[i].length == 0) {
    //                 console.log('Found empty archives for timeline ' + i + '. Requesting more data.');
    //                 // Force to load background data
    //                 this.requestingMoreBackgroundData = false;
    //                 this.requestMoreBackgroundData(i);
    //             }
    //         }
    //     }
    // }

    private getEventsToLoad(): number {
        const interval = this.timeline.getInterval();
        if (interval > INTERVAL_DAY_7 - 1) {
            return 200;
        } if (interval > INTERVAL_DAY_1 - 1) {
            return 100;
        } else if (interval > INTERVAL_HOUR_12) {
            return 50;
        } else {
            return 25;
        }
    }

    // private requestingMoreBackgroundData = false;
    // private requestMoreBackgroundData(timelineIndex: number) {
    //     // console.log("requestMoreBackgroundData(timelineIndex=" + timelineIndex + ")");
    //     if (!this.requestingMoreBackgroundData && !this.noOldArchivesAvailable[timelineIndex]) {
    //         this.requestingMoreBackgroundData = true;
    //         let lastEvent = this.archives[timelineIndex][this.archives[timelineIndex].length - 1];
    //         let timelines = this.timeline.getTotalTimelines();
    //         let archivesToLoad = this.getEventsToLoad() * 2 * timelines;
    //         this.archiveListService.getArchiveListById(
    //             this.loginService.server,
    //             this.loginService.login,
    //             timelines > 1 ? this.cameras[timelineIndex].id : this.selectedCamId,
    //             lastEvent == null ? -1 : lastEvent.file_id,
    //             archivesToLoad)
    //                 .then(archives => {
    //                     this.requestingMoreBackgroundData = false;
    //                     this.processArchiveList(timelineIndex, archives, false);
    //                 });
    //         }
    // }

    private requestingMoreVideoEvents = false;
    private requestMoreVideoEvents(timelineIndex: number) {
        console.log("requestMoreVideoEvents(timelineIndex=" + timelineIndex + ")");
        if (!this.requestingMoreVideoEvents && !this.noOldEventsAvailable[timelineIndex]) {
            this.requestingMoreVideoEvents = true;
            const event = this.events[timelineIndex][this.events[timelineIndex].length - 1];
            const timelines = this.timeline.getTotalTimelines();
            const eventsToLoad = this.getEventsToLoad() * 2;
            this.eventListService.getEventList(
                this.loginService.server,
                this.loginService.login,
                timelines > 1 ? this.cameras[timelineIndex].id : this.selectedCameraId,
                event.time,
                eventsToLoad,
                this.type,
                '') // all events
                    .then(events => {
                       // console.log("this.requestingMoreVideoEvents = false");
                        this.requestingMoreVideoEvents = false;
                        this.processEventList(timelineIndex, events, false);
                    });
        }
    }

    private getVideoEventRecords(timelineIndex: number): object[] {
        console.log(`getVideoEventRecords(${timelineIndex})`);
        let records = [];
        for (let event of this.events[timelineIndex]) {
            const l = new Date(event.time).getTime();
            records.push(new TimeRecord(l, event.duration, event));
        }
        return records;
    }

    private getAudioEventRecords(timelineIndex: number): object[] {
        let records = [];
        for (let event of this.events[timelineIndex]) {
            if (event.motion !== 'motion') {
                const l = new Date(event.time).getTime();
                const color = Utils.getEventColor(event);
                records.push(new TimeRecord(l, event.duration, event, color));
            }
        }
        return records;
    }

    private getBackgroundRecords(timelineIndex: number): object[] {
        // let records = [];
        // for (let archive of this.archives[timelineIndex]) {
        //     let l = new Date(archive.date).getTime();
        //     records.push(new TimeRecord(l, archive.duration, archive));
        // }
        // return records;
        return this.getVideoEventRecords(timelineIndex);
    }

    getEventImage(event: EventRecord): string {
        if (event.image !== undefined) {
            if (event.image.startsWith('http')) {
                return event.image;
            } else {
                const char = event.image.indexOf('?') == -1 ? '?' : '&';
                return `${this.loginService.server.url}${event.image}${char}token=${this.loginService.login.token}`;
            }
        }
    }

    getEventVideo(event: EventRecord): string {
        if (event.video !== undefined) {
            if (event.video.startsWith("http")) {
                return `${event.video}`;
            } else {
              const char = event.video.indexOf('?') == -1 ? '?' : '&';
              return `${this.loginService.server.url}${event.video}${char}token=${this.loginService.login.token}`;
            }
        }
    }

    private startUpdateTimer(): void {
        console.log("startUpdateTimer()");
        if (this.timerSubscription)
            clearTimeout(this.timerSubscription);
        this.timerSubscription = setTimeout(()=> {
            let l = this.timeline.getCurrent() + 1000;
            this.timeline.setCurrent(l);
            this.timeline.draw();
            if (this.videoPlaying) {
                this.startUpdateTimer();
            }
        }, 1000 / this.playerSpeed);

        // if (this.timerSubscription)
        //     this.timerSubscription.unsubscribe();
        // let timer = Observable.timer(1000, 1000 / this.playerSpeed).takeWhile(() => this.videoPlaying);
        // this.timerSubscription = timer.subscribe(t => {
        //     // console.log('t: ' + t);
        //     let l = this.timeline.getCurrent() + 1000;
        //     this.timeline.setCurrent(l);
        //     this.timeline.draw();
        // });
    }

    private stopUpdateTimer(): void {
        console.log("stopUpdateTimer()");
        if (this.timerSubscription)
            clearTimeout(this.timerSubscription);
        this.timerSubscription = null;
    }

    // Show spinner if more than 3 sec passed on loading
    private startLoadingDelayTimer(): void {
        if (this.loadingDelayTimer)
            clearTimeout(this.loadingDelayTimer);
        this.loadingDelayTimer = setTimeout(()=> {
            this.videoLoading = true;
        }, 3000);
    }

    private stopLoadingDelayTimer(): void {
        if (this.loadingDelayTimer)
            clearTimeout(this.loadingDelayTimer);
        this.loadingDelayTimer = null;
        this.videoLoading = false;
    }

}
