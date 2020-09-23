import { Component, ViewChild, ElementRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CamListSelectionComponent } from './cam-list-selection.component';
import { CamListService, GenericService, LoginService, StatusService, WindowRefService } from '../services';
import { PtzCapability, CameraSettings, Status } from '../models'
import { LiveInfoDialogComponent } from './live-info-dialog.component';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import Utils from '../utils';
import * as nipplejs from 'nipplejs';
import { fadeInAnimation, fadeInOutAnimation } from '../animations/';

@Component({
  selector: 'live-cam-list',
  animations: [fadeInAnimation, fadeInOutAnimation],
  host: {
    '(document:keydown)': 'handleKeyDown($event)',
    '(document:keyup)': 'handleKeyUp($event)'
  },
  styles: [ `
    .full-width {
      width: 100%;
    }
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
    .container {
        margin: 0px 10px;
        height: auto;
        overflow: hidden;
     }
    .right {
         width: auto;
         float: right;
         height: 100%;
         text-align: center;
    }
    .left {
        float: left;
        width: auto;
        overflow: hidden;
      }
      .zone {
        display: block;
        position: relative;
        //position: absolute;
        //left: 0;
        //top: 0;
        width: 100%;
        height: 50%;
        min-width: 100%;
        min-height: 50%;
        background: rgba(255, 0, 0, 0.1);
      }
  `],
  template: `
    <div>
      <mat-card *ngIf="errorMessage != null" class="app-text-center app-card-warning" style="margin-bottom: 30px">
        {{this.errorMessage}}
      </mat-card>
      <div *ngIf="cameras; else loading_content">
        <div *ngIf="cameras.length > 0; else no_cams_content">

          <div class="container">
            <div class="left">
              <div *ngIf="cameras.length > 1">
                <div style="margin:0px 15px;">
                  <mat-form-field color="accent">
                    <mat-select [(value)]="cameraSelected" (selectionChange)="onSelected($event.value)" placeholder="Camera view">
                      <mat-option *ngFor="let camera of cameras" [value]="camera">
                        {{getCameraName(camera)}}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
              </div>
            </div>

            <div class="right">

              <span *ngIf="status.motion !== undefined" style="padding: 10px; margin-right:20px">
                <span *ngIf="status.motion; else no_motion_content" matTooltip="Motion detected"><i class="fas fa-walking fa-lg faa-tada faa-slow animated" style="color:red"></i></span>
              </span>

              <span *ngIf="isAudioListeningSupported()" style="margin-right:20px">
                <span *ngIf="audioShown; else notAudioShown">
                  <span *ngIf="audioLoading" [@fadeInOutAnimation] style="padding:2px; text-align: center; vertical-align: middle"><i class="fas fa-circle-notch fa-2x fa-spin"></i></span>
                  <audio preload="none" autoplay (canplay)="handleAudioCanPlay()" (error)="handleAudioError()" style="vertical-align: middle; margin-right:10px">
                    <source src="{{getAudioUrl()}}" type="audio/wav">
                  </audio>
                  <button mat-flat-button class="live-button" (click)="showHideAudio()" matTooltip="Stop audio"><i class="fas fa-volume-up"></i></button>
                </span>
                <ng-template #notAudioShown>
                  <button mat-raised-button class="live-button" (click)="showHideAudio()" matTooltip="Play audio"><i class="fas fa-volume-mute"></i></button>
                </ng-template>
              </span>

              <span style="margin-right:20px;">
                <span *ngIf="nippleShown; else notNippleShown">
                  <button mat-flat-button class="live-button" (click)="showHideJoystick()" matTooltip="Hide joystick"><i class="far fa-dot-circle"></i></button>
                </span>
                <ng-template #notNippleShown>
                  <button mat-raised-button class="live-button" [disabled]="!isPtzPanTiltSupported()" (click)="showHideJoystick()" matTooltip="Show joystick"><i class="far fa-dot-circle"></i></button>
                </ng-template>
              </span>

              <button mat-raised-button class="live-button" [disabled]="!isPtzPresetsSupported()" (click)="gotoPreset(1)" matTooltip="Go to preset 1">1</button>
              <button mat-raised-button class="live-button" [disabled]="!isPtzPresetsSupported()" (click)="gotoPreset(2)" matTooltip="Go to preset 2">2</button>
              <button mat-raised-button class="live-button" [disabled]="!isPtzPresetsSupported()" (click)="gotoPreset(3)" matTooltip="Go to preset 3">3</button>
              <button mat-raised-button class="live-button" [disabled]="!isPtzPresetsSupported()" (click)="gotoPreset(4)" matTooltip="Go to preset 4">4</button>

              <button mat-icon-button [matMenuTriggerFor]="menu"><i class="fas fa-ellipsis-v fa-lg" style="color:#111111;"></i></button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="sendCameraMotionEvent()">
                  <span>Create motion event</span>
                </button>
                <button mat-menu-item (click)="openInfoDialog()">
                  <span>Help</span>
                </button>
              </mat-menu>

              <!-- <button mat-raised-button class="live-button" style="margin-left:20px;" matTooltip="Multiple cameras layout">
                <i class="fas fa-th-large"></i>
              </button> -->
              <button mat-raised-button class="live-button" (click)="toggleFullScreen()" style="margin-left:20px;" matTooltip="Full screen">
                <i class="fas fa-expand-alt"></i>
              </button>
            </div>

          </div>

          <div #live style="background-color: #212121; overflow: auto;" [style.height.px]="myInnerHeight" [@fadeInAnimation]>
            <live [cameraId]="cameraSelected.id" (dblclick)="toggleFullScreen()" (click)="showHideToolbar()"></live>
          </div>
        </div>
      </div>

      <ng-template #no_cams_content><mat-card>No cameras added. Please add cameras via <a routerLink="/account">Account</a> tab or via <a href="https://tinycammonitor.com/">tinyCam Monitor</a> Android app.</mat-card></ng-template>
      <ng-template #loading_content><mat-card>Loading cameras list...</mat-card></ng-template>
      <ng-template #no_motion_content><span matTooltip="No motion detected"><i class="fas fa-male fa-lg"></i></span></ng-template>
    </div>
    <div *ngIf="isPtzPanTiltSupported()" #joystick style="position: absolute; right: 150px; bottom: 100px;" ></div>
  `
})

export class LiveCamListComponent extends CamListSelectionComponent {

    myInnerHeight = this.windowRef.nativeWindow.innerHeight;
    @ViewChild('live') liveEl: ElementRef;
    @ViewChild('joystick') joystickEl: ElementRef;

    private timerSubscription;
    private nipple = null;
    nippleShown = false;
    audioShown = false;
    audioLoading = false;
    status: Status = new Status();

    PTZ_REQUEST = '/axis-cgi/com/ptz.cgi';
    PARAM_CONT_MOVE   = "continuouspantiltmove";
    PARAM_CONT_ZOOM   = "continuouszoommove";
    PARAM_CONT_FOCUS  = "continuousfocusmove";
    PARAM_CONT_IRIS   = "continuousirismove";
    PARAM_GOTO_PRESET = "gotoserverpresetno";

    constructor(
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        protected router: Router,
        protected loginService: LoginService,
        private genericService: GenericService,
        private statusService: StatusService,
        protected camListService: CamListService,
        private windowRef: WindowRefService) {
            super(router, loginService, camListService);
    }

    handleAudioCanPlay() {
        this.audioLoading = false;
    }

    handleAudioError() {
        this.audioShown = false;
    }

    isAudioListeningSupported(): boolean {
        if (this.cameraSelected === null)
            return false;
        return this.cameraSelected.audioListening;
    }

    isPtzPanTiltSupported(): boolean {
        if (this.cameraSelected === null)
            return false;
        return Utils.hasCapability(this.cameraSelected.ptzCapabilities, PtzCapability.MoveRel);
    }

    isPtzPresetsSupported(): boolean {
        if (this.cameraSelected === null)
            return false;
        return Utils.hasCapability(this.cameraSelected.ptzCapabilities, PtzCapability.GotoPresets);
    }

    showHideJoystick() {
        // console.log('showHideJoystick()');
        this.nippleShown = !this.nippleShown;
        if (this.nippleShown) {
            this.initJoystick();
        } else {
            this.nipple.destroy();
        }
    }

    showHideAudio() {
        // console.log('showHideJoystick()');
        this.audioShown = !this.audioShown;
        if (this.audioShown)
            this.audioLoading = true;
    }

    initJoystick() {
        this.nipple = nipplejs.create({
            zone: this.joystickEl.nativeElement,
            size: 150,
            mode: 'static',
            restOpacity: 0.7,
            position: {right: '20%', bottom: '20%'}
        });
  
        this.nipple.on('dir:up', function (evt, nipple) {
            this.moveUp();
        }.bind(this))

        this.nipple.on('dir:down', function (evt, nipple) {
            this.moveDown();
        }.bind(this))

        this.nipple.on('dir:left', function (evt, nipple) {
            this.moveLeft();
        }.bind(this))

        this.nipple.on('dir:right', function (evt, nipple) {
            this.moveRight();
        }.bind(this))

        this.nipple.on('end', function (evt, nipple) {
            this.moveStop();
        }.bind(this));
    }

    ngOnInit() {
        super.ngOnInit();
        this.startUpdateTimer(100);
    }

    ngOnDestroy() {
        super.ngOnDestroy();
        this.stopUpdateTimer();
    }

    openInfoDialog() {
        this.dialog.open(LiveInfoDialogComponent);
    }

    toggleFullScreen() {
        Utils.toggleFullScreen(this.liveEl.nativeElement);
    }

    toggleAudio() {

    }

    getAudioUrl() {
        console.log(`Audio: ${this.loginService.server.url}/axis-cgi/audio/receive.wav?cameraId=${this.cameraSelected.id}&token=${this.loginService.login.token}`);
        return `${this.loginService.server.url}/axis-cgi/audio/receive.wav?cameraId=${this.cameraSelected.id}&token=${this.loginService.login.token}`;
    }

    camerasLoaded() {
        super.camerasLoaded();
        this.snackBar.openFromComponent(ScrollDownComponent, {
            duration: 3000
        });
    }

    sendCameraMotionEvent() {
        this.sendHttpGetRequest(`/axis-cgi/motion/createmotion.cgi?cameraId=${this.cameraSelected.id}`)
        .then(
            res => { this.snackBar.open('Motion signal sent', null, {
                duration: 4000,
            })
        });
    }

    sendHttpGetRequest(request: string): Promise<any> {
        return this.genericService.getRequest(this.loginService.server, this.loginService.login, request);
    }

    public moveUp() {
        this.sendHttpGetRequest(`${this.PTZ_REQUEST}?${this.PARAM_CONT_MOVE}=0,100`);
    }

    moveDown() {
        this.sendHttpGetRequest(`${this.PTZ_REQUEST}?${this.PARAM_CONT_MOVE}=0,-100`);
    }

    moveLeft() {
        this.sendHttpGetRequest(`${this.PTZ_REQUEST}?${this.PARAM_CONT_MOVE}=-100,0`);
    }
    moveRight() {
      this.sendHttpGetRequest(`${this.PTZ_REQUEST}?${this.PARAM_CONT_MOVE}=100,0`);
    }

    public moveStop() {
      this.sendHttpGetRequest(`${this.PTZ_REQUEST}?${this.PARAM_CONT_MOVE}=0,0`);
    }

    zoomIn() {
        this.sendHttpGetRequest(`${this.PTZ_REQUEST}?${this.PARAM_CONT_ZOOM}=100`)
        .then(
            res => { this.snackBar.open(`Zoom in`, null, {
                duration: 3000,
            })
        });
    }

    zoomOut() {
        this.sendHttpGetRequest(`${this.PTZ_REQUEST}?${this.PARAM_CONT_ZOOM}=-100`)
        .then(
            res => { this.snackBar.open(`Zoom out`, null, {
                duration: 3000,
            })
        });
    }

    zoomStop() {
        this.sendHttpGetRequest(`${this.PTZ_REQUEST}?${this.PARAM_CONT_ZOOM}=0`);
    }
  
    focusNear() {
        this.sendHttpGetRequest(`${this.PTZ_REQUEST}?${this.PARAM_CONT_FOCUS}=100`)
        .then(
            res => { this.snackBar.open(`Focus near`, null, {
                duration: 3000,
            })
        });
    }

    focusFar() {
        this.sendHttpGetRequest(`${this.PTZ_REQUEST}?${this.PARAM_CONT_FOCUS}=-100`)
        .then(
            res => { this.snackBar.open(`Focus far`, null, {
                duration: 3000,
            })
        });
    }

    focusStop() {
        this.sendHttpGetRequest(`${this.PTZ_REQUEST}?${this.PARAM_CONT_FOCUS}=0`);
    }

    irisOpen() {
        this.sendHttpGetRequest(`${this.PTZ_REQUEST}?${this.PARAM_CONT_IRIS}=100`)
        .then(
            res => { this.snackBar.open(`Iris open`, null, {
                duration: 3000,
            })
        });
    }

    irisClose() {
        this.sendHttpGetRequest(`${this.PTZ_REQUEST}?${this.PARAM_CONT_IRIS}=-100`)
        .then(
            res => { this.snackBar.open(`Iris close`, null, {
                duration: 3000,
            })
        });
    }

    irisStop() {
        this.sendHttpGetRequest(`${this.PTZ_REQUEST}?${this.PARAM_CONT_IRIS}=0`);
    }

    gotoPreset(preset: number) {
        this.sendHttpGetRequest(`${this.PTZ_REQUEST}?${this.PARAM_GOTO_PRESET}=${preset}`)
        .then(
            res => { this.snackBar.open(`Preset ${preset}`, null, {
                duration: 3000,
            })
        });
    }

    handleKeyDown(event: KeyboardEvent) {
        if (event.repeat) return;
        // console.log("Key down: " + event.key);
        switch(event.key) {
            case "ArrowUp": this.scrollTop(); event.preventDefault(); break;
            case "ArrowDown": this.scrollBottom(); event.preventDefault(); break;
            case "ArrowLeft": event.preventDefault(); 
            case "a": this.moveLeft(); break;
            // case "ArrowLeft": this.moveLeft(); break;
            case "ArrowRight": event.preventDefault(); 
            case "d": this.moveRight(); break;
            // case "ArrowRight": this.moveRight(); break;
            case "w": this.moveUp(); break;
            case "s": this.moveDown(); break;
            case "1": this.gotoPreset(1); break;
            case "2": this.gotoPreset(2); break;
            case "3": this.gotoPreset(3); break;
            case "4": this.gotoPreset(4); break;
            case "5": this.gotoPreset(5); break;
            case "6": this.gotoPreset(6); break;
            case "7": this.gotoPreset(7); break;
            case "8": this.gotoPreset(8); break;
            case "9": this.gotoPreset(9); break;
            case "=": this.zoomIn(); break;
            case "-": this.zoomOut(); break;
            case "f": this.focusFar(); break;
            case "n": this.focusNear(); break;
            case "o": this.irisOpen(); break;
            case "c": this.irisClose(); break;
            case " ": this.showHideToolbar(); event.preventDefault(); break;
        };
    }

    handleKeyUp(event: KeyboardEvent) {
        // console.log("Key up: " + event.key);
        switch(event.key) {
            case "ArrowLeft":
            case "ArrowRight":
            case "a":
            case "s":
            case "d":
            case "w": this.moveStop(); break;
            // case "ArrowLeft":
            // case "ArrowRight": this.moveStop(); break;
            case "=":
            case "-": this.zoomStop(); break;
            case "f":
            case "n": this.focusStop(); break;
            case "o":
            case "c": this.irisStop(); break;
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

    onSelected(camera: CameraSettings): void {
        // Check if joystick and shown and remove it
        this.nippleShown = false;
        if (this.nipple) {
            this.nipple.destroy();
            this.nipple = null;
        }
        this.audioShown = false;
        super.onSelected(camera);
    }

    processStatus(status: Status) {
        this.status = status;
        // this.backgroundMode = status.backgroundMode;
        // this.streamProfile = status.streamProfile;
        // this.powerSafeMode = status.powerSafeMode;
        // this.notifications = status.notifications;
        if (this.timerSubscription)
            this.startUpdateTimer(3000);
    }

    processStatusError(error: HttpErrorResponse) {
        if (this.timerSubscription)
            this.startUpdateTimer(10000);
    }

    private startUpdateTimer(timeout: number) {
        console.log(`startUpdateTimer(timeout=${timeout})`);
        if (this.timerSubscription)
            clearTimeout(this.timerSubscription);
        this.timerSubscription = setTimeout(() => {
            this.statusService
                .getStatusCamera(this.loginService.server, this.loginService.login, this.cameraSelected.id)
                .then(
                  status => { this.processStatus(status); },
                  error => { this.processStatusError(error); });
        }, timeout);
    }

    private stopUpdateTimer() {
        console.log("stopUpdateTimer()");
        if (this.timerSubscription)
            clearTimeout(this.timerSubscription);
        this.timerSubscription = null;
    }

}

@Component({
  template: `
  <span>Scroll down <i class="fas fa-arrow-down faa-falling animated"></i></span>
`,
})
export class ScrollDownComponent {}
