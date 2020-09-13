import { Component } from '@angular/core';
import { LoginService } from '../services';

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
      </div>
    `
})

export class AdminComponent {

  constructor(
    public loginService: LoginService) {
  }

  getAppLogsUrl(): string {
      return `${this.loginService.server.server_addr}/axis-cgi/admin/applog.cgi?token=${this.loginService.login.token}`;
  }

  getAccessLogsUrl(): string {
    return `${this.loginService.server.server_addr}/axis-cgi/admin/accesslog.cgi?token=${this.loginService.login.token}`;
  }

  getEventLogsUrl(): string {
    return `${this.loginService.server.server_addr}/axis-cgi/admin/eventlog.cgi?token=${this.loginService.login.token}`;
  }

  getWatchdogLogsUrl(): string {
    return `${this.loginService.server.server_addr}/axis-cgi/admin/watchdoglog.cgi?token=${this.loginService.login.token}`;
  }

  getCrashLogsUrl(): string {
    return `${this.loginService.server.server_addr}/axis-cgi/admin/crashlog.cgi?token=${this.loginService.login.token}`;
  }

  clearAppLogs(): string {
    return `${this.loginService.server.server_addr}/axis-cgi/admin/clearapplog.cgi?token=${this.loginService.login.token}`;
  }

  clearAllLogs(): string {
    return `${this.loginService.server.server_addr}/axis-cgi/admin/clearalllog.cgi?token=${this.loginService.login.token}`;
  }

}
