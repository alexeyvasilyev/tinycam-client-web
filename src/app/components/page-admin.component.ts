import { Component, OnInit } from '@angular/core';
import { GenericService, LoginService, StatusService } from '../services';

@Component({
    // animations: [animateFactory(150, 0, 'ease-in')],
    styles: [ `
      .my-button {
        margin: 5px 10px;
        text-transform: uppercase;
      }
    `],
    template: `
      <header [selected]="3" [isAdmin]=true></header>
      <div class="app-container">
        <h2 class="mat-h2" style="padding-top:20px">Admin information</h2>

        <mat-card>
          <mat-card-content>
            <div>Username: <span style="font-weight: bold; padding-right: 5px;">{{this.loginService.login.username}}</span></div>
          </mat-card-content>
        </mat-card>

        <mat-card style="margin-top: 20px;">
          <mat-card-content>
            <div>
              <div>Background mode: {{backgroundModeStatus}}</div>
              <button mat-raised-button color="primary" class="my-button" (click)="sendHttpGetRequest('/param.cgi?action=update&root.BackgroundMode=on')" disabled>Start</button>
              <button mat-raised-button color="primary" class="my-button" (click)="sendHttpGetRequest('/param.cgi?action=update&root.BackgroundMode=off')">Stop</button>
              <div style="margin-top: 10px;">
                <div>Recorded: <span id="recorded">-</span>, Free: <span id="available">-</span></div>
                <div>Motion: <span id="motion">-</span></div>
              </div>
            </div>
            <div>
              <div>
                <mat-form-field color="accent" style="padding-top:10px;" class="full-width">
                  <mat-select [(value)]="streamProfile" (selectionChange)="sendHttpGetRequest('/param.cgi?action=update&root.StreamProfile='+$event.value)" placeholder="Stream profile">
                    <mat-option value="main">MAIN</mat-option>
                    <mat-option value="sub">SUB</mat-option>
                    <mat-option value="auto">AUTO</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <div>
                <mat-form-field color="accent" style="padding-top:10px;" class="full-width">
                  <mat-select [(value)]="powerSafeMode" (selectionChange)="sendHttpGetRequest('/param.cgi?action=update&root.PowerSafeMode='+$event.value)" placeholder="Power safe mode">
                    <mat-option value="off">OFF</mat-option>
                    <mat-option value="on">ON</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <div>
                <mat-form-field color="accent" style="padding-top:10px;" class="full-width">
                  <mat-select [(value)]="notifications" (selectionChange)="sendHttpGetRequest('/param.cgi?action=update&root.Notifications='+$event.value)" placeholder="Notifications">
                    <mat-option value="off">OFF</mat-option>
                    <mat-option value="on">ON</mat-option>
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

        <mat-card style="margin-top: 20px;">
          <mat-card-content>
            <div style="margin-top: 20px">
              <div><a class="my-button" mat-raised-button href="{{getAppLogsUrl()}}">App logs</a>
              <a class="my-button" mat-raised-button href="{{getAccessLogsUrl()}}">Web server logs</a>
              <a class="my-button" mat-raised-button href="{{getWatchdogLogsUrl()}}">Watchdog logs</a>
              <a class="my-button" mat-raised-button href="{{getEventLogsUrl()}}">Event logs</a>
              <a class="my-button" mat-raised-button href="{{getCrashLogsUrl()}}">Crash logs</a></div>
              <div><a class="my-button" mat-button href="{{clearAppLogs()}}">Clear app logs</a>
              <a class="my-button" mat-button href="{{clearAllLogs()}}">Clear all logs</a></div>
            </div>
          </mat-card-content>
        </mat-card>

        <div class="mat-small app-text-right" style="padding:10px">tinyCam web client is <a href="https://github.com/alexeyvasilyev/tinycam-client-web">open sourced</a> under Apache License 2.0</div>
      </div>
    `
})

export class PageAdminComponent implements OnInit {

    streamProfile = 'main';
    powerSafeMode = 'off';
    notifications = 'on';
    backgroundModeStatus: string = 'n/a'

    constructor(
        public loginService: LoginService,
        private genericService: GenericService,
        private statusService: StatusService) {
    }

    ngOnInit() {
        this.statusService
            .getStatusGlobal(this.loginService.server, this.loginService.login)
            .then(status => { this.processStatus(status); });
    }

    processStatus(status: any) {
        //status.notification;
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

}
