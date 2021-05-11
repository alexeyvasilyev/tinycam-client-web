import { Component, ViewChild, ElementRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CamListSelectionComponent } from './cam-list-selection.component';
import { CamListService, GenericService, LoginService, StatusService, WindowRefService } from '../services';
import { PtzCapability, CameraSettings, Status } from '../models'
import { LiveInfoDialogComponent } from './live-info-dialog.component';
import { LiveSetPresetDialogComponent } from './live-set-preset-dialog.component';
import { Router, Params, ActivatedRoute } from '@angular/router';
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
  `],
  template: `
    <div>
      <mat-card *ngIf="errorMessage != null" class="app-text-center app-card-warning" style="margin-bottom: 30px">
        {{this.errorMessage}}
      </mat-card>
      <div *ngIf="cameras; else loading_content">
        <div *ngIf="cameras.length > 0; else no_cams_content">

          <div class="live-container">
            <div class="live-left">
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

            <div class="live-right">

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
                <i class="fas fa-walking fa-lg"></i> &nbsp;
                  <span>Trigger motion event</span>
                </button>

                <button mat-menu-item [matMenuTriggerFor]="led">
                  <i class="far fa-lightbulb fa-lg"></i> &nbsp;
                  <span>LED</span>
                </button>

                <mat-menu #led="matMenu">
                  <button mat-menu-item (click)="ledOn()" [disabled]="!isLedOnSupported()" >
                    <i class="far fa-lightbulb fa-lg"></i> &nbsp;
                    <span>LED On</span>
                  </button>
                  <button mat-menu-item (click)="ledOff()" [disabled]="!isLedOffSupported()">
                    <i class="far fa-lightbulb fa-lg"></i> &nbsp;
                    <span>LED Off</span>
                  </button>
                  <button mat-menu-item (click)="ledAuto()" [disabled]="!isLedAutoSupported()">
                    <i class="far fa-lightbulb fa-lg"></i> &nbsp;
                    <span>LED Auto</span>
                  </button>
                </mat-menu>

                <button mat-menu-item (click)="openSetPresetDialog()">
                  <i class="fas fa-map-marker-alt"></i> &nbsp;
                  <span>Save preset</span>
                </button>
                <button mat-menu-item (click)="openInfoDialog()">
                  <i class="fas fa-info fa-lg"></i> &nbsp;
                  <span>Info</span>
                </button>
              </mat-menu>

              <button mat-raised-button class="live-button" style="margin-left:20px;" matTooltip="Multiple cameras layout" (click)="showMultipleScreen()">
                <i class="fas fa-th-large"></i>
              </button>
              <!-- <button mat-raised-button class="live-button" (click)="toggleFullScreen()" style="margin-left:20px;" matTooltip="Full screen">
                <i class="fas fa-expand-alt"></i>
              </button> -->
            </div>

          </div>

          <div #live style="background-color: #212121; overflow: auto;" [style.height.px]="getLiveHeight()" [@fadeInAnimation]>
            <live [cameraId]="cameraSelected.id" [viewHeightPx]="getLiveHeight()" (dblclick)="liveDoubleClick()" (click)="liveSingleClick()"></live>
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

    @ViewChild('live') liveEl: ElementRef;
    @ViewChild('joystick') joystickEl: ElementRef;

    windowInnerHeight = this.windowRef.nativeWindow.innerHeight;
    private timerSubscription;
    private nipple = null;
    nippleShown = false;
    audioShown = false;
    audioLoading = false;
    status: Status = new Status();
    private timerClick;
    private showSnackBarOnStart = true;

    REQUEST_PTZ = '/axis-cgi/com/ptz.cgi';
    REQUEST_LED = '/axis-cgi/io/lightcontrol.cgi';

    PARAM_CONT_MOVE   = "continuouspantiltmove";
    PARAM_CONT_ZOOM   = "continuouszoommove";
    PARAM_CONT_FOCUS  = "continuousfocusmove";
    PARAM_CONT_IRIS   = "continuousirismove";
    PARAM_GOTO_PRESET = "gotoserverpresetno";
    PARAM_SET_PRESET  = "setserverpresetno";
    PARAM_ACTION      = "action";

    constructor(
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        protected router: Router,
        private activatedRoute: ActivatedRoute,
        protected loginService: LoginService,
        private genericService: GenericService,
        private statusService: StatusService,
        protected camListService: CamListService,
        private windowRef: WindowRefService) {
            super(router, loginService, camListService);
    }

    liveSingleClick() {
        if (this.timerClick)
            clearTimeout(this.timerClick);
        this.timerClick = setTimeout(() => {
            this.showHideToolbar();
        }, 250);
    }

    liveDoubleClick() {
        if (this.timerClick)
            clearTimeout(this.timerClick);
        this.showMultipleScreen();
    }

    getLiveHeight(): number {
        return this.windowRef.nativeWindow.innerHeight;
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
        return (this.cameraSelected as CameraSettings).audioListening;
    }

    isPtzPanTiltSupported(): boolean {
        if (this.cameraSelected === null)
            return false;
        return Utils.hasCapability((this.cameraSelected as CameraSettings).ptzCapabilities, PtzCapability.MoveRel);
    }

    isPtzPresetsSupported(): boolean {
        if (this.cameraSelected === null)
            return false;
        return Utils.hasCapability((this.cameraSelected as CameraSettings).ptzCapabilities, PtzCapability.GotoPresets);
    }

    isLedOnSupported(): boolean {
        if (this.cameraSelected === null)
            return false;
        return Utils.hasCapability((this.cameraSelected as CameraSettings).ptzCapabilities, PtzCapability.LedOn);
    }

    isLedOffSupported(): boolean {
        if (this.cameraSelected === null)
            return false;
        return Utils.hasCapability((this.cameraSelected as CameraSettings).ptzCapabilities, PtzCapability.LedOff);
    }

    isLedAutoSupported(): boolean {
        if (this.cameraSelected === null)
            return false;
        return Utils.hasCapability((this.cameraSelected as CameraSettings).ptzCapabilities, PtzCapability.LedAuto);
    }

    showMultipleScreen() {
        if (document.documentElement.scrollTop > 0)
            this.router.navigate(['/livem'], { queryParams: { bottom: "yes" } });
        else
            this.router.navigate(['/livem']);
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
            this.moveUp(false);
        }.bind(this))

        this.nipple.on('dir:down', function (evt, nipple) {
            this.moveDown(false);
        }.bind(this))

        this.nipple.on('dir:left', function (evt, nipple) {
            this.moveLeft(false);
        }.bind(this))

        this.nipple.on('dir:right', function (evt, nipple) {
            this.moveRight(false);
        }.bind(this))

        this.nipple.on('end', function (evt, nipple) {
            this.moveStop();
        }.bind(this));
    }

    ngOnInit() {
        super.ngOnInit();
        this.startUpdateTimer(100);
        // Check if '/live?bottom'
        this.activatedRoute.queryParams.subscribe((params: Params) => {
            let bottom = params['bottom'];
            if (bottom) {
                this.showSnackBarOnStart = false;
                this.scrollBottom();
            }
        });
    }

    ngOnDestroy() {
        super.ngOnDestroy();
        this.stopUpdateTimer();
    }

    openInfoDialog() {
        this.dialog.open(LiveInfoDialogComponent);
    }

    openSetPresetDialog() {
        let dialog = this.dialog.open(LiveSetPresetDialogComponent);
        dialog.afterClosed().subscribe(result => {
            if (result > -1)
                this.setPreset(result);
        });
    }

    // toggleFullScreen() {
    //    Utils.toggleFullScreen(this.liveEl.nativeElement);
    // }

    getAudioUrl() {
        console.log(`Audio: ${this.loginService.server.url}/axis-cgi/audio/receive.wav?cameraId=${(this.cameraSelected as CameraSettings).id}&token=${this.loginService.login.token}`);
        return `${this.loginService.server.url}/axis-cgi/audio/receive.wav?cameraId=${(this.cameraSelected as CameraSettings).id}&token=${this.loginService.login.token}`;
    }

    camerasLoaded() {
        super.camerasLoaded();
        if (this.showSnackBarOnStart) {
            this.snackBar.openFromComponent(ScrollDownComponent, {
                duration: 3000
            });
        }
    }

    sendCameraMotionEvent() {
        this.sendHttpGetRequest(`/axis-cgi/motion/createmotion.cgi?cameraId=${(this.cameraSelected as CameraSettings).id}`)
        .then(
            res => { this.snackBar.open('Motion event triggered', null, {
                duration: 4000,
            })
        });
    }

    sendHttpGetRequest(request: string): Promise<any> {
        return this.genericService.getRequest(this.loginService.server, this.loginService.login, request);
    }

    moveUp(showTip: boolean) {
        this.sendHttpGetRequest(`${this.REQUEST_PTZ}?${this.PARAM_CONT_MOVE}=0,100`)
        .then(
            res => { if (showTip) this.snackBar.open(`Move up`, null, {
                duration: 3000,
            })
        });
    }

    moveDown(showTip: boolean) {
        this.sendHttpGetRequest(`${this.REQUEST_PTZ}?${this.PARAM_CONT_MOVE}=0,-100`)
        .then(
            res => { if (showTip) this.snackBar.open(`Move down`, null, {
                duration: 3000,
            })
        });
    }

    moveLeft(showTip: boolean) {
        this.sendHttpGetRequest(`${this.REQUEST_PTZ}?${this.PARAM_CONT_MOVE}=-100,0`)
        .then(
            res => { if (showTip) this.snackBar.open(`Move left`, null, {
                duration: 3000,
            })
        });
    }

    moveRight(showTip: boolean) {
        this.sendHttpGetRequest(`${this.REQUEST_PTZ}?${this.PARAM_CONT_MOVE}=100,0`)
        .then(
            res => { if (showTip) this.snackBar.open(`Move right`, null, {
                duration: 3000,
            })
        });
    }

    moveStop() {
      this.sendHttpGetRequest(`${this.REQUEST_PTZ}?${this.PARAM_CONT_MOVE}=0,0`);
    }

    ledOn() {
        this.sendHttpGetRequest(`${this.REQUEST_LED}?${this.PARAM_ACTION}=L1:-100`)
        .then(
            res => { this.snackBar.open(`LED On`, null, {
                duration: 3000,
            })
        });
    }

    ledOff() {
        this.sendHttpGetRequest(`${this.REQUEST_LED}?${this.PARAM_ACTION}=L1:-0`)
        .then(
            res => { this.snackBar.open(`LED Off`, null, {
                duration: 3000,
            })
        });
    }

    ledAuto() {
        this.sendHttpGetRequest(`${this.REQUEST_LED}?${this.PARAM_ACTION}=L1:-50`)
        .then(
            res => { this.snackBar.open(`LED Auto`, null, {
                duration: 3000,
            })
        });
    }

    zoomIn() {
        this.sendHttpGetRequest(`${this.REQUEST_PTZ}?${this.PARAM_CONT_ZOOM}=100`)
        .then(
            res => { this.snackBar.open(`Zoom In`, null, {
                duration: 3000,
            })
        });
    }

    zoomOut() {
        this.sendHttpGetRequest(`${this.REQUEST_PTZ}?${this.PARAM_CONT_ZOOM}=-100`)
        .then(
            res => { this.snackBar.open(`Zoom Out`, null, {
                duration: 3000,
            })
        });
    }

    zoomStop() {
        this.sendHttpGetRequest(`${this.REQUEST_PTZ}?${this.PARAM_CONT_ZOOM}=0`);
    }
  
    focusNear() {
        this.sendHttpGetRequest(`${this.REQUEST_PTZ}?${this.PARAM_CONT_FOCUS}=100`)
        .then(
            res => { this.snackBar.open(`Focus Near`, null, {
                duration: 3000,
            })
        });
    }

    focusFar() {
        this.sendHttpGetRequest(`${this.REQUEST_PTZ}?${this.PARAM_CONT_FOCUS}=-100`)
        .then(
            res => { this.snackBar.open(`Focus Far`, null, {
                duration: 3000,
            })
        });
    }

    focusStop() {
        this.sendHttpGetRequest(`${this.REQUEST_PTZ}?${this.PARAM_CONT_FOCUS}=0`);
    }

    irisOpen() {
        this.sendHttpGetRequest(`${this.REQUEST_PTZ}?${this.PARAM_CONT_IRIS}=100`)
        .then(
            res => { this.snackBar.open(`Iris Open`, null, {
                duration: 3000,
            })
        });
    }

    irisClose() {
        this.sendHttpGetRequest(`${this.REQUEST_PTZ}?${this.PARAM_CONT_IRIS}=-100`)
        .then(
            res => { this.snackBar.open(`Iris Close`, null, {
                duration: 3000,
            })
        });
    }

    irisStop() {
        this.sendHttpGetRequest(`${this.REQUEST_PTZ}?${this.PARAM_CONT_IRIS}=0`);
    }

    gotoPreset(preset: number) {
        this.sendHttpGetRequest(`${this.REQUEST_PTZ}?${this.PARAM_GOTO_PRESET}=${preset}`)
        .then(
            res => { this.snackBar.open(`Preset ${preset}`, null, {
                duration: 3000,
            })
        });
    }

    setPreset(preset: number) {
        this.sendHttpGetRequest(`${this.REQUEST_PTZ}?${this.PARAM_SET_PRESET}=${preset}`)
        .then(
            res => { this.snackBar.open(`Saved preset ${preset}`, null, {
                duration: 3000,
            })
        });
    }

    private getCameraIndex(camera: CameraSettings): number {
        let i = 0;
        for (let camera of this.cameras) {
            if (camera == this.cameraSelected)
                return i;
            i++;
        }
        return 0;
    }

    showCurrentCamera() {
        this.snackBar.open(`Camera '${(this.cameraSelected as CameraSettings).name}'`, null, {
            duration: 3000,
        });
    }

    switchPrevCamera(showTip: boolean) {
        let index = this.getCameraIndex((this.cameraSelected as CameraSettings));
        if (--index >= 0) {
            this.cameraSelected = this.cameras[index];
            if (showTip)
                this.showCurrentCamera();
        }
    }

    switchNextCamera(showTip: boolean) {
        let index = this.getCameraIndex((this.cameraSelected as CameraSettings));
        if (++index < this.cameras.length) {
            this.cameraSelected = this.cameras[index];
            if (showTip)
                this.showCurrentCamera();
        }
    }

    handleKeyDown(event: KeyboardEvent) {
        if (event.repeat) return;
        // console.log("Key down: " + event.key);
        switch(event.key) {
            case "ArrowUp": this.scrollTop(); event.preventDefault(); break;
            case "ArrowDown": this.scrollBottom(); event.preventDefault(); break;
            case "ArrowLeft": this.switchPrevCamera(true); break;
            case "ArrowRight": this.switchNextCamera(true); break;
            case "a": this.moveLeft(true); break;
            // case "ArrowLeft": this.moveLeft(); break;
            case "d": this.moveRight(true); break;
            // case "ArrowRight": this.moveRight(); break;
            case "w": this.moveUp(true); break;
            case "s": this.moveDown(true); break;
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
            if (this.cameraSelected != null) {
                this.statusService
                    .getStatusCamera(this.loginService.server, this.loginService.login, (this.cameraSelected as CameraSettings).id)
                    .then(
                    status => { this.processStatus(status); },
                    error => { this.processStatusError(error); });
            }
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
