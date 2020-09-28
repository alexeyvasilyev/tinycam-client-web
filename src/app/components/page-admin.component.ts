import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { GenericService, LoginService, StatusService } from '../services';
import { Status } from '../models'
import { HttpErrorResponse } from '@angular/common/http';
import { fadeInAnimation } from '../animations/';
import Utils from '../utils'
import ResizeObserver from 'resize-observer-polyfill';
import { SmoothieChart, TimeSeries } from 'smoothie';

@Component({
    animations: [fadeInAnimation],
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
      .warning {
        color: red;
      }
    `],
    template: `
      <header [selected]="3" [isAdmin]=true></header>
      <div #component class="app-container">
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
              <div style="margin-top: 30px;" class="app-text-dark-hint">
                <div>Recorded: {{humanReadableByteCount(status.spaceUsed)}}, Free: {{humanReadableByteCount(status.spaceAvailable)}}</div>
                <div>Motion: <span class="app-text-warning"><b>{{status.motionCameras}}</b></span></div>
              </div>
            </div>
            <div style="float:right;width:40%">
              <div>
                <mat-form-field color="accent" style="padding-top:10px;" class="full-width">
                  <mat-select [(value)]="status.streamProfile" (selectionChange)="sendHttpGetRequest('/param.cgi?action=update&root.StreamProfile=' + ($event.value==0 ? 'main' : ($event.value==1 ? 'sub' : 'auto')))" placeholder="Stream profile">
                    <mat-option [value]="0">Main</mat-option>
                    <mat-option [value]="1">Sub</mat-option>
                    <mat-option [value]="2">Auto</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <div>
                <mat-form-field color="accent" style="padding-top:10px;" class="full-width">
                  <mat-select [(value)]="status.powerSafeMode" (selectionChange)="sendHttpGetRequest('/param.cgi?action=update&root.PowerSafeMode=' + ($event.value ? 'on' : 'off'))" placeholder="Power safe mode">
                    <mat-option [value]="true">On</mat-option>
                    <mat-option [value]="false">Off</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <div [@fadeInAnimation] *ngIf="status.powerSafeMode !== undefined && status.powerSafeMode" class="app-text-warning" style="padding-bottom:10px">Power safe mode is ON. Only keyframes are decoded (jerky live view).</div>
              <div>
                <mat-form-field color="accent" style="padding-top:10px;" class="full-width">
                  <mat-select [(value)]="status.notifications" (selectionChange)="sendHttpGetRequest('/param.cgi?action=update&root.Notifications=' + ($event.value ? 'on' : 'off'))" placeholder="Notifications">
                    <mat-option [value]="true">On</mat-option>
                    <mat-option [value]="false">Off</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <div [@fadeInAnimation] *ngIf="status.notifications !== undefined && !status.notifications" class="app-text-warning">Notifications are OFF. The following features disabled:<br/>
 - Sound on motion<br/>
 - Vibration on motion<br/>
 - System notification on motion<br/>
 - Email on motion<br/>
 - Telegram on motion<br/>
 - Zoom and track on motion (live view)<br/>
 - Wake up on motion (background mode)<br/>
 - Webhook on motion<br/>
 - Record to local storage on motion<br/>
 - Record to cloud on motion<br/>
 - Record to FTP on motion<br/>
 - Record to Telegram on motion</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-content>
            <div class="app-text-dark-hint">
              <div>Live view connections: {{status.liveConnections !== undefined ? status.liveConnections : '-'}}</div>
              <div [@fadeInAnimation] *ngIf="status.threadsRunnableUsed !== undefined">Threads: {{status.threadsRunnableUsed}}/{{status.threadsUsed}}</div>
              <div>Memory Used: {{humanReadableByteCount(status.memoryUsed)}}, Free: {{humanReadableByteCount(status.memoryAvailable)}}</div>
              <div>Processes: {{getProcessesWithUsage()}}</div>
              <div>Battery: {{status.batteryLevel}} ({{status.batteryStatus}})</div>
              <div>Web server uptime: {{humanReadableTime(status.uptime)}}</div>

              <div style="margin-top:10px">Network <span style="color:#EA4238">In</span>: {{humanReadableKBs(status.networkInBps)}}, <span style="color:#5DAEE4">Out</span>: {{humanReadableKBs(status.networkOutBps)}}</div>
              <div><canvas #networkChart height="70"></canvas></div>

              <div style="margin-top:10px">CPU usage: {{status.cpuUsagePercents}}%</div>
              <div><canvas #cpuUsageChart height="70"></canvas></div>

              <div style="margin-top:10px">CPU frequency: {{status.cpuFrequencyMhz}}MHz</div>
              <div><canvas #cpuFreqChart height="70"></canvas></div>
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

        <mat-card>
          <mat-card-content>
            <div>
              <div><a class="my-button" mat-raised-button color="warn" href="{{getRestartWebServerUrl()}}">{{status.rootAvailable ? 'Reboot device' : 'Restart web server'}}</a></div>
            </div>
          </mat-card-content>
        </mat-card>

        <div style="padding:30px 0px;">
          <div class="mat-small app-text-right">tinyCam Monitor web client is <a href="https://github.com/alexeyvasilyev/tinycam-client-web">open sourced</a> under Apache License 2.0</div>
          <div class="mat-small app-text-right">tinyCam Monitor web server <a href="https://github.com/alexeyvasilyev/tinycam-api">API</a></div>
        </div>
      </div>
    `
})

export class PageAdminComponent implements OnInit {

    @ViewChild('component', { static: true }) componentEl: ElementRef;
    @ViewChild('networkChart', { static: true }) networkChartEl: ElementRef;
    @ViewChild('cpuUsageChart', { static: true }) cpuUsageChartEl: ElementRef;
    @ViewChild('cpuFreqChart', { static: true }) cpuFreqChartEl: ElementRef;

    status: Status = new Status();
    private timerSubscription;
    private networkChart: SmoothieChart = null;
    private cpuUsageChart: SmoothieChart = null;
    private cpuFreqChart: SmoothieChart = null;
    private networkInSeries = new TimeSeries();
    private networkOutSeries = new TimeSeries();
    private cpuUsageSeries = new TimeSeries();
    private cpuFreqSeries = new TimeSeries();

    constructor(
        public loginService: LoginService,
        private genericService: GenericService,
        private statusService: StatusService) {
    }

    humanReadableByteCount(bytes: number): string {
        return bytes !== undefined ? Utils.humanReadableByteCount(bytes) : '-';
        return bytes !== undefined ? Math.round(bytes / 1048576) + ' MB' : '-';
    }

    humanReadableTime(msec: number): string {
        return msec !== undefined ? Utils.humanReadableTime(msec) : '-';
    }

    humanReadableKBs(bytesPerSec: number): string {
        return bytesPerSec !== undefined ? Math.round(bytesPerSec / 1024) + ' KB/s' : '-';
    }

    ngOnInit() {
        const ro = new ResizeObserver((entries, observer) => {
            this.resizeCanvas();
        });
        ro.observe(this.componentEl.nativeElement);

        this.startUpdateTimer(100);
        this.initCharts();
    }

    ngOnDestroy() {
        this.stopUpdateTimer();
    }

    getProcessesWithUsage(): string {
        if (this.status.processes !== undefined) {
            let processText = '';
            for (let process of this.status.processes) {
                processText += `${process.name} (${Math.floor(process.memoryUsed / 1048576)} MB), `;
            }
            if (this.status.processes.length > 1)
                processText = processText.substr(0, processText.length - 2);
            return processText;
        }
        return '-';
    }

    private fitToContainerWidth(element) {
        element.style.width = '100%';
        element.width = element.offsetWidth;
    }

    private initCharts() {
        this.networkChart = new SmoothieChart({millisPerPixel:100, grid:{fillStyle:'#EEEEEE', verticalSections:5, strokeStyle:'#E0E0E0'}, labels:{fillStyle:'#000000', precision:0}, minValue:0});
        this.networkChart.addTimeSeries(this.networkInSeries, {lineWidth:2, strokeStyle:'#EA4238', fillStyle:'rgba(234,66,56,0.30)'});
        this.networkChart.addTimeSeries(this.networkOutSeries, {lineWidth:2, strokeStyle:'#5DAEE4', fillStyle:'rgba(93,174,228,0.30)'});
        this.networkChart.streamTo(this.networkChartEl.nativeElement, 3000);

        this.cpuUsageChart = new SmoothieChart({millisPerPixel:100, grid:{fillStyle:'#EEEEEE', verticalSections:5, strokeStyle:'#E0E0E0'}, labels:{fillStyle:'#000000', precision:0}, minValue:0});
        this.cpuUsageChart.addTimeSeries(this.cpuUsageSeries, {lineWidth:2, strokeStyle:'#F57C00', fillStyle:'rgba(245,124,0,0.30)'});
        this.cpuUsageChart.streamTo(this.cpuUsageChartEl.nativeElement, 3000);

        this.cpuFreqChart = new SmoothieChart({millisPerPixel:100, grid:{fillStyle:'#EEEEEE', verticalSections:5, strokeStyle:'#E0E0E0'}, labels:{fillStyle:'#000000', precision:0}, minValue:0});
        this.cpuFreqChart.addTimeSeries(this.cpuFreqSeries, {lineWidth:2, strokeStyle:'#8BC34A', fillStyle:'rgba(139,195,74,0.30)'});
        this.cpuFreqChart.streamTo(this.cpuFreqChartEl.nativeElement, 3000);
    }

    private resizeCanvas() {
        this.fitToContainerWidth(this.networkChartEl.nativeElement);
        this.fitToContainerWidth(this.cpuUsageChartEl.nativeElement);
        this.fitToContainerWidth(this.cpuFreqChartEl.nativeElement);
    }

    setBackgroundMode(start: boolean) {
        const value = start ? 'on' : 'off';
        this.sendHttpGetRequest(`/param.cgi?action=update&root.BackgroundMode=${value}`);
        this.status.backgroundMode = start;
    }

    processStatus(status: Status) {
        this.status = status;

        const currentTime = new Date().getTime();
        this.networkInSeries.append(currentTime, Math.round(status.networkInBps / 1024));
        this.networkOutSeries.append(currentTime, Math.round(status.networkOutBps / 1024));
        this.cpuUsageSeries.append(currentTime, status.cpuUsagePercents);
        this.cpuFreqSeries.append(currentTime, status.cpuFrequencyMhz);

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

    getRestartWebServerUrl(): string {
      return `${this.loginService.server.url}/axis-cgi/admin/restart.cgi?token=${this.loginService.login.token}`;
    }

    private startUpdateTimer(timeout: number) {
        console.log(`startUpdateTimer(timeout=${timeout})`);
        if (this.timerSubscription)
            clearTimeout(this.timerSubscription);
        this.timerSubscription = setTimeout(() => {
            this.statusService
                .getStatusGlobal(this.loginService.server, this.loginService.login)
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
