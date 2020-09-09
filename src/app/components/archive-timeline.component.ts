import { Component, OnInit, Input, SimpleChanges, ElementRef, ViewChild } from '@angular/core';
import { CameraSettings, EventRecord } from '../models'
import { EventListService, LoginService } from '../services';
import Utils from '../utils';
import ResizeObserver from 'resize-observer-polyfill';

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
  selector: 'archive-timeline',
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
      padding: 10px 20px;
      text-align: center;
      text-decoration: none;
      margin: 4px 2px;
      cursor: pointer;
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
      padding: 10px 10px;
      text-align: center;
      text-decoration: none;
      margin: 4px 1px;
      width: 60px;
      cursor: pointer;
      font-size: 16px;
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
    '(document:keydown)': 'handleKeyboardEvents($event)'
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

    <div width="100%" style="background-color: #212121; cursor: pointer;">
      <div class="app-video-container">
        <video class="video" preload="auto" #videoComponent playsinline autoplay
          (error)="handleVideoError()" (playing)="handleVideoPlaying()"
          (pause)="handleVideoStoppedPaused()" (ended)="handleVideoEnded()"
          (loadstart)="handleVideoLoadStart()" (loadeddata)="handleVideoLoadedData()"
          (click)="handleVideoClicked()" (dblclick)="startFullScreen()" src="{{videoUrl}}">
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
      <button class="button" (click)="handlePlayPauseClicked();">
        <span *ngIf="!videoPlaying">
          <i class="fas fa-play"></i>
        </span>
        <span *ngIf="videoPlaying">
          <i class="fas fa-pause"></i>
        </span>
      </button>

      <button class="button" (click)="gotoPrevEvent(true);" style="margin-left:30px;">
        <span>
          <i class="fas fa-backward"></i>
        </span>
      </button>
      <button class="button" (click)="gotoNextEvent(true);">
        <span>
          <i class="fas fa-forward"></i>
        </span>
      </button>
      <button class="button" (click)="gotoLastEvent();" style="margin-left:30px;">
        <span>
          <i class="fas fa-fast-forward"></i>
        </span>
      </button>

      <button class="button" (click)="timeline.increaseInterval();" style="margin-left:30px;">
        <span>
          <i class="fas fa-minus"></i>
        </span>
      </button>
      <button class="button" (click)="timeline.decreaseInterval();">
        <span>
          <i class="fas fa-plus"></i>
        </span>
      </button>

      <button class="button" (click)="startFullScreen();" style="margin-left:30px;">
        <span>
          <i class="fas fa-expand"></i>
        </span>
      </button>

      <button class="button" (click)="handleMoreClicked();" style="margin-left:30px;">
        <span *ngIf="!moreButtons">
          <i class="fas fa-angle-down"></i>
        </span>
        <span *ngIf="moreButtons">
          <i class="fas fa-angle-up"></i>
        </span>
      </button>

      <div *ngIf="moreButtons" style="padding-top:20px;">
        <button class="button-selectable" (click)="setSpeed(0.1);" style="margin-left:30px;" [ngStyle]="{'opacity':playerSpeed==0.1?'0.5':'1.0'}">
          <span>0.1x</span>
        </button>
        <button class="button-selectable" (click)="setSpeed(0.5);" [ngStyle]="{'opacity':playerSpeed==0.5?'0.5':'1.0'}">
          <span>0.2x</span>
        </button>
        <button class="button-selectable" (click)="setSpeed(1.0);" [ngStyle]="{'opacity':playerSpeed==1.0?'0.5':'1.0'}">
          <span>1x</span>
        </button>
        <button class="button-selectable" (click)="setSpeed(2.0);" [ngStyle]="{'opacity':playerSpeed==2.0?'0.5':'1.0'}">
          <span>2x</span>
        </button>
        <button class="button-selectable" (click)="setSpeed(3.0);" [ngStyle]="{'opacity':playerSpeed==3.0?'0.5':'1.0'}">
          <span>3x</span>
        </button>
        <!-- <a href="{{this.videoUrl}}" download class="button" style="margin-left:30px;" target="_blank">
          <i class="fas fa-download"></i>
        </a> -->
      </div>

    </div>
    <div style="padding:10px;">
      <p>Keys <b>+</b>/<b>-</b> to increase/decrease timeline scale.<br/>
      Keys <b>left</b>/<b>right</b> to select previous/next events.<br/>
      <span *ngIf="multipleTimeline">Keys <b>q</b>/<b>a</b> to change timelines.<br/></span>
      <b>Space bar</b> - start/stop playback.<br/>
    </div>
    <div style="padding:10px;">
      NOTE: Video recordings will appear on timeline with 10-15 minutes delay.
    </div>


  `
})

export class ArchiveTimelineComponent implements OnInit {

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
    @Input() selectedCamId: number;
    @Input() multipleTimeline: boolean;
    @ViewChild('component', { static: true }) componentEl: ElementRef;
    @ViewChild('canvasTimeline', { static: true }) canvasTimelineEl: ElementRef;
    @ViewChild('videoComponent', { static: true }) videoEl: ElementRef;

    ngOnInit() {
        // console.log('ngOnInit()');
        var names = [];
        for (let camera of this.cameras) {
            names.push(CameraSettings.getName(camera));
        }
        // console.log('archive-timeline init');
        var options = {
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
        for (var i = 0; i < options.timelines; i++) {
            this.events[i] = [];
            // this.noOldArchivesAvailable[i] = false;
            this.noOldEventsAvailable[i] = false;
            this.eventsLoaded[i] = false;
        }

        this.updateTimeline();
        this.resizeCanvas();

        const ro = new ResizeObserver((entries, observer) => {
            this.resizeCanvas();
        });
        ro.observe(this.componentEl.nativeElement);

        // this.loadLastArchives();
        this.loadLastEvents();
    }

    ngOnChanges(changes: SimpleChanges) {
      // console.log('ngOnChanges()');
      // Stop previous camera playback
      let video = this.videoEl.nativeElement;
      if (video) {
        video.poster = "";
        video.pause();
        this.videoUrl = '/';
        video.load();
      }
      this.ngOnInit();

//        this.loadLastArchives();
    }

    handleKeyboardEvents(event: KeyboardEvent) {
        let keyCode = event.which || event.keyCode;
        // console.log("Key: " + keyCode);
        switch(keyCode) {
            case 32: this.handlePlayPauseClicked(); event.preventDefault(); break;
            case 173: // firefox
            case 189: this.timeline.increaseInterval(); event.preventDefault(); break; // -
            case 61: // firefox
            case 187: this.timeline.decreaseInterval(); event.preventDefault(); break; // +
            case 37: this.gotoPrevEvent(true); event.preventDefault(); break; // Left
            case 39: this.gotoNextEvent(true); event.preventDefault(); break; // Right
            case 81: this.selectUpperTimeline(); event.preventDefault(); break; // Q
            case 65: this.selectBottomTimeline(); event.preventDefault(); break; // A
        }
    }

    private mouseScrolling = false;
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

    private firstTouch = 0;
    handleTouchStartEvent(event: TouchEvent) {
        if (event.targetTouches.length == 1) {
            this.firstTouch = event.targetTouches[0].pageX;
        }
    }

    handleTouchMoveEvent(event: TouchEvent) {
        if (event.targetTouches.length == 1) {
            var touchDelta = event.targetTouches[0].pageX - this.firstTouch;
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

    startFullScreen() {
        Utils.startFullScreen(this.videoEl.nativeElement);
    }

    private updateTimeline() {
        console.log('updateTimeline()');
        let totalTimelines = this.timeline.getTotalTimelines();
        for (let i = 0; i < totalTimelines; i++) {
            let recordsVideoEvents = this.getVideoEventRecords(i);
            let recordsAudioEvents = this.getAudioEventRecords(i);
            let recordsArchives = this.getBackgroundRecords(i);

            this.timeline.setMajor1Records(i, recordsVideoEvents);
            this.timeline.setMajor2Records(i, recordsAudioEvents);
            this.timeline.setBackgroundRecords(i, recordsArchives);
        }

        this.timeline.draw();
    }

    private fitToContainerWidth(canvas) {
        canvas.style.width = '100%';
        let timelines = this.timeline.getTotalTimelines();
        canvas.height = timelines * (timelines > 1 ? 40 : 50) + 25;
        canvas.width = canvas.offsetWidth;
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
            let playerPosition = Math.floor(Math.max(timestampMsec - record.timestampMsec, 0) / 1000);
            this.playRecord(record, playerPosition);
            this.videoError = false;
        } else {
            console.error('Cannot play video');
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
      let i = this.timeline.getCurrentTimeline();
      let records = this.timeline.getBackgroundRecords(i);
      if (records.length > 0) {
          let record = this.timeline.getRecord(this.timeline.getCurrent(), records);
          let timestamp = this.timeline.getCurrent();
          this.timeSelectedCallback(i, timestamp, record);
          this.timeline.draw();
      }
    }

    gotoNextEvent(animation: boolean) {
        let i = this.timeline.getCurrentTimeline();
        var record = this.timeline.getNextMajorRecord(i);
        if (record != null) {
            let timestamp = this.getTimestampFromRecord(record);
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
        let i = this.timeline.getCurrentTimeline();
        let records = this.timeline.getMajor1Records(i);
        // At least one event exists
        if (records.length > 0) {
            let record = records[0];
            let timestamp = this.getTimestampFromRecord(record);
            this.timeSelectedCallback(i, timestamp, record);
            this.timeline.setCurrentWithAnimation(record.timestampMsec);
            this.timeline.draw();
        } else {
            // No events found. Show last video recording.
            records = this.timeline.getBackgroundRecords(i);
            if (records.length > 0) {
                let record = records[0];
                // 30 sec before video finished.
                let timestamp = record.timestampMsec + Math.max(record.durationMsec - 30000, 0);
                this.timeSelectedCallback(i, timestamp, record);
                this.timeline.setCurrentWithAnimation(record.timestampMsec);
                this.timeline.draw();
            }
        }
    }

    gotoPrevEvent(animation: boolean) {
        let i = this.timeline.getCurrentTimeline();
        var record = this.timeline.getPrevMajorRecord(i);
        if (record != null) {
            var timestamp = this.getTimestampFromRecord(record);
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
        let video = this.videoEl.nativeElement;
        if (video) {
            video.pause();
        }
    }

    private playRecord(record, positionSec: number) {
        console.log('playRecord(positionSec=' + positionSec + ')');
        let video = this.videoEl.nativeElement;
        let needRefresh = true;
        if (video) {
            let newUrl = this.getEventVideo(record.object);
            // if (this.videoUrl) {
            //     // Extracting real filename to check if new video loading needed, e.g.
            //     // "name":"2019-02-11_17h57m51s_321995_cam.mp4"
            //     // TODO: Delete time from date.
            //     let lastCoreUrl = this.videoUrl.substring(this.videoUrl.lastIndexOf('%22name%22%3A%22'), this.videoUrl.lastIndexOf('%22%2C%22cam_id%22'));
            //     let newCoreUrl = newUrl.substring(newUrl.lastIndexOf('%22name%22%3A%22'), newUrl.lastIndexOf('%22%2C%22cam_id%22'));
            //     // let lastCoreUrl = this.videoUrl.substring(0, this.videoUrl.lastIndexOf('#t='));
            //     // let newCoreUrl = newUrl.substring(0, newUrl.lastIndexOf('#t='));
            //     if (lastCoreUrl.localeCompare(newCoreUrl) == 0) {
            //         video.currentTime = positionSec;
            //         // video.play();
            //         needRefresh = false;
            //     }
            // }
            // if (needRefresh) {
                // Clear preview image
                video.poster = "";
                video.pause();
                // Load preview image before
                video.poster = this.getEventImage(record.object);
                this.videoUrl = newUrl + '#t=' + positionSec;
                console.log('videUrl: ' + this.videoUrl);
                // Load video
                video.load();
                // video.currentTime = positionSec;
                video.play();
            // }
        }
    }

    isAllEventsLoaded(): boolean {
        let timelines = this.timeline.getTotalTimelines();
        for (let i = 0; i < timelines; ++i) {
            if (!this.eventsLoaded[i])
                return false;
        }
        return true;
    }

    private loadLastEvents() {
        console.log('loadLastEvents()');
        // Clear events
        let timelines = this.timeline.getTotalTimelines();
        this.events = new Array(timelines);
        for (let i = 0; i < timelines; i++) {
          this.eventsLoaded[i] = false;
          this.events[i] = [];
        }
        for (let i = 0; i < timelines; ++i) {
           this.eventListService.getEventList(
               this.loginService.server,
               this.loginService.login,
               timelines > 1 ? this.cameras[i].id : this.selectedCamId,
               null,
               this.getEventsToLoad())
                   .then(events => {
                       this.requestingMoreVideoEvents = false;
                       this.processEventList(i, events, true);
                       this.gotoLastEvent();
                   });
           }
    }

    private processEventList(timelineIndex: number, events: EventRecord[], firstLoad: boolean) {
        console.log('processEventList(timelineIndex=' + timelineIndex + ', firstLoad=' + firstLoad + ')');
        if (events) {
            console.log('Events: ' + events.length);
            // Forbid requesting old events
            if (events.length == 0) {
                if (timelineIndex > -1)
                    this.noOldEventsAvailable[timelineIndex] = true;
            } else {
                var newEvents = [];
                for (let event of events) {
                    if (event.duration > this.MIN_DURATION_EVENT_MSEC) {
                        // Make event started before 3 seconds
//                        event.video_offset = Math.max(0, event.video_offset - this.EVENT_OFFSET_MSEC);
                        event.duration += this.EVENT_OFFSET_MSEC;
                        newEvents.push(event);
                    }
                }
                if (newEvents.length == 0) {
                    if (timelineIndex > -1)
                        this.noOldEventsAvailable[timelineIndex] = true;
                } else {
                    // Concatinate arrays
                    this.events[timelineIndex] = this.events[timelineIndex].concat(newEvents);
                }
                console.log('Filtered events: ' + newEvents.length);
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
        // for (var i = 0; i < timelines; i++) {
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
        let interval = this.timeline.getInterval();
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
            let event = this.events[timelineIndex][this.events[timelineIndex].length - 1];
            let timelines = this.timeline.getTotalTimelines();
            let eventsToLoad = this.getEventsToLoad() * 2;
            this.eventListService.getEventList(
                this.loginService.server,
                this.loginService.login,
                timelines > 1 ? this.cameras[timelineIndex].id : this.selectedCamId,
                //
                // this.cameras[timelineIndex].id,//this.selectedCamId,
                event.time,
                //this.EVENTS_TO_LOAD)//
                eventsToLoad)
                    .then(events => {
                       // console.log("this.requestingMoreVideoEvents = false");
                        this.requestingMoreVideoEvents = false;
                        this.processEventList(timelineIndex, events, false);
                    });
        }
    }

    private getVideoEventRecords(timelineIndex: number): object[] {
        var records = [];
        for (let event of this.events[timelineIndex]) {
            // if (event.has_video) {
                let l = new Date(event.time).getTime();
                records.push(new TimeRecord(l, event.duration, event));
            // }
        }
        return records;
    }

    private getAudioEventRecords(timelineIndex: number): object[] {
        var records = [];
        // for (let event of this.events[timelineIndex]) {
        //     if (event.has_audio) {
        //         let l = new Date(event.date).getTime();
        //         records.push(new TimeRecord(l, event.duration, event));
        //     }
        // }
        return records;
    }

    private getBackgroundRecords(timelineIndex: number): object[] {
        // var records = [];
        // for (let archive of this.archives[timelineIndex]) {
        //     let l = new Date(archive.date).getTime();
        //     records.push(new TimeRecord(l, archive.duration, archive));
        // }
        // return records;
        return this.getVideoEventRecords(timelineIndex);
    }

    // private getArchiveImage(archive: ArchiveRecord): string {
    //     return JsonUtils.getArchiveFilename(
    //         this.loginService.server,
    //         this.loginService.login,
    //         archive.image,
    //         archive.id,
    //         archive.date);
    // }

    // private getEventImage(event: EventRecord): string {
    //     return JsonUtils.getArchiveFilename(
    //         this.loginService.server,
    //         this.loginService.login,
    //         event.image,
    //         event.id,
    //         event.date);
    //     return "";
    // }

    getEventImage(event: EventRecord): string {
        return `${this.loginService.server.server_addr}${event.image}?token=${this.loginService.login.token}`;
    }

    getEventVideo(event: EventRecord): string {
        return `${this.loginService.server.server_addr}${event.video}?token=${this.loginService.login.token}`;
    }

    // private getArchiveVideo(archive: ArchiveRecord): string {
    //     let videoUrl = JsonUtils.getArchiveFilename(
    //         this.loginService.server,
    //         this.loginService.login,
    //         archive.video,
    //         archive.id,
    //         archive.date);
    //     return videoUrl;
    // }

    // private getEventVideo(event: EventRecord): string {
    //     let videoUrl = JsonUtils.getArchiveFilename(
    //         this.loginService.server,
    //         this.loginService.login,
    //         event.video,
    //         event.id,
    //         event.date);
    //     // videoUrl += '#t=' + ((event.video_offset - 3000) / 1000).toFixed();
    //     return videoUrl;
    // }

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
        // if (this.timerSubscription)
        //     this.timerSubscription.unsubscribe();
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
