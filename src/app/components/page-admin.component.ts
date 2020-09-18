import { Component, OnInit } from '@angular/core';
import { GenericService, LoginService, StatusService } from '../services';
import { Status, StatusStreamProfile } from '../models'
import { HttpErrorResponse } from '@angular/common/http';

@Component({
    // animations: [animateFactory(150, 0, 'ease-in')],
    styles: [ `
      .my-button {
        margin: 5px 6px;
        text-transform: uppercase;
        font-weight: normal;
      }
      mat-card {
        padding: 20px 40px;
        margin-top: 20px;
      }
      .my-caption {
        color: grey;
      }
    `],
    template: `
      <header [selected]="3" [isAdmin]=true></header>
      <div class="app-container">
        <h2 class="mat-h2" style="padding-top:20px">Admin information</h2>

        <mat-card>
          <mat-card-content>
            <div class="mat-h3">Username: <b>{{this.loginService.login.username}}</b></div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-content style="display:table; width:100%;">
            <div style="float:left;width:55%;">
              <div class="mat-h3">Background mode: <b>{{status.backgroundMode === undefined ? '-' : (status.backgroundMode ? 'Started' : 'Stopped')}}</b></div>
              <button mat-raised-button color="primary" class="my-button" (click)="setBackgroundMode(true)" [(disabled)]="status.backgroundMode === undefined || status.backgroundMode">Start</button>
              <button mat-raised-button color="primary" class="my-button" (click)="setBackgroundMode(false)" [(disabled)]="status.backgroundMode === undefined || !status.backgroundMode">Stop</button>
              <div style="margin-top: 30px;" class="my-caption">
                <div>Recorded: <span id="recorded">-</span>, Free: <span id="available">-</span></div>
                <div>Motion: <span id="motion">-</span></div>
              </div>
            </div>
            <div style="float:right;width:40%">
              <div>
                <mat-form-field color="accent" style="padding-top:10px;" class="full-width">
                  <mat-select [(value)]="status.streamProfile" (selectionChange)="sendHttpGetRequest('/param.cgi?action=update&root.StreamProfile=' + ($event.value==0 ? 'main' : ($event.value==1 ? 'sub' : 'auto')))" placeholder="Stream profile">
                    <mat-option [value]="0">MAIN</mat-option>
                    <mat-option [value]="1">SUB</mat-option>
                    <mat-option [value]="2">AUTO</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <div>
                <mat-form-field color="accent" style="padding-top:10px;" class="full-width">
                  <mat-select [(value)]="status.powerSafeMode" (selectionChange)="sendHttpGetRequest('/param.cgi?action=update&root.PowerSafeMode=' + ($event.value ? 'on' : 'off'))" placeholder="Power safe mode">
                  <mat-option [value]="true">ON</mat-option>
                  <mat-option [value]="false">OFF</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <div>
                <mat-form-field color="accent" style="padding-top:10px;" class="full-width">
                  <mat-select [(value)]="status.notifications" (selectionChange)="sendHttpGetRequest('/param.cgi?action=update&root.Notifications=' + ($event.value ? 'on' : 'off'))" placeholder="Notifications">
                  <mat-option [value]="true">ON</mat-option>
                  <mat-option [value]="false">OFF</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <div id="notificationsWarning" style="display: none;" class="mui--text-danger">Notifications are OFF. The following features disabled:<br/>
 - Sound on motion<br/>
 - Vibration on motion<br/>
 - System notification on motion<br/>
 - Email on motion<br/>
 - Zoom and track on motion (live view)<br/>
 - Wake up on motion (background mode)<br/>
 - Webhook on motion<br/>
 - Record to local storage on motion<br/>
 - Record to cloud on motion<br/>
 - Record to FTP on motion</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-content>
            <div class="my-caption">
              <div *ngIf="status.threadsRunnableUsed !== undefined">Threads: {{status.threadsRunnableUsed}}/{{status.threadsUsed}}</div>
              <div>Processes: {{status.processes}}</div>
              <div>Live view connections: {{status.liveConnections}}</div>
              <div>Network In: {{getKB(status.networkInBps)}} KB/s, Out: {{getKB(status.networkOutBps)}} KB/s</div>
              <div>Web server uptime: {{status.uptime}}</div>
              <div>CPU usage: {{status.cpuUsagePercents}}%</div>
              <div>CPU frequency: {{status.cpuFrequencyMhz}}MHz</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-content>
            <div>
              <div><a class="my-button" mat-raised-button href="{{getAppLogsUrl()}}">App logs</a>
              <a class="my-button" mat-raised-button href="{{getAccessLogsUrl()}}">Web server logs</a>
              <a class="my-button" mat-raised-button href="{{getWatchdogLogsUrl()}}">Watchdog logs</a>
              <a class="my-button" mat-raised-button href="{{getEventLogsUrl()}}">Event logs</a>
              <a class="my-button" mat-raised-button href="{{getCrashLogsUrl()}}">Crash logs</a></div>
              <div style="margin-top: 20px"><a class="my-button" mat-raised-button color="primary" href="{{clearAppLogs()}}">Clear app logs</a>
              <a class="my-button" mat-raised-button color="primary" href="{{clearAllLogs()}}">Clear all logs</a></div>
            </div>
          </mat-card-content>
        </mat-card>

        <div class="mat-small app-text-right" style="padding:10px">tinyCam Monitor web client is <a href="https://github.com/alexeyvasilyev/tinycam-client-web">open sourced</a> under Apache License 2.0</div>
      </div>
    `
})

export class PageAdminComponent implements OnInit {

    // streamProfile: StatusStreamProfile;
    // powerSafeMode: boolean;
    // notifications: boolean;
    // backgroundMode: boolean = undefined;
    status: Status = new Status();
    private timerSubscription;

    constructor(
        public loginService: LoginService,
        private genericService: GenericService,
        private statusService: StatusService) {
    }

    getKB(bytes: number): number {
      return Math.round(bytes / 1024);
    }
    ngOnInit() {
        this.startUpdateTimer(100);
    }

    ngOnDestroy() {
        this.stopUpdateTimer();
    }

    setBackgroundMode(start: boolean) {
        const value = start ? 'on' : 'off';
        this.sendHttpGetRequest(`/param.cgi?action=update&root.BackgroundMode=${value}`);
        this.status.backgroundMode = start;
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

    sendHttpGetRequest(request: string) {
        this.genericService.getRequest(this.loginService.server, this.loginService.login, request);
    }

    getAppLogsUrl(): string {
        return `${this.loginService.server.url}/axis-cgi/admin/applog.cgi?token=${this.loginService.login.token}`;
    }

    getAccessLogsUrl(): string {
      return `${this.loginService.server.url}/axis-cgi/admin/accesslog.cgi?token=${this.loginService.login.token}`;
    }

    getEventLogsUrl(): string {
      return `${this.loginService.server.url}/axis-cgi/admin/eventlog.cgi?token=${this.loginService.login.token}`;
    }

    getWatchdogLogsUrl(): string {
      return `${this.loginService.server.url}/axis-cgi/admin/watchdoglog.cgi?token=${this.loginService.login.token}`;
    }

    getCrashLogsUrl(): string {
      return `${this.loginService.server.url}/axis-cgi/admin/crashlog.cgi?token=${this.loginService.login.token}`;
    }

    clearAppLogs(): string {
      return `${this.loginService.server.url}/axis-cgi/admin/clearapplog.cgi?token=${this.loginService.login.token}`;
    }

    clearAllLogs(): string {
      return `${this.loginService.server.url}/axis-cgi/admin/clearalllog.cgi?token=${this.loginService.login.token}`;
    }

    private startUpdateTimer(timeout: number) {
        console.log(`startUpdateTimer(timeout=${timeout})`);
        if (this.timerSubscription)
            clearTimeout(this.timerSubscription);
        this.timerSubscription = setTimeout(()=> {
            this.statusService
                .getStatusGlobal(this.loginService.server, this.loginService.login)
                .then(
                  status  => { this.processStatus(status); },
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
