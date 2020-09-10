import { Component } from '@angular/core';
import { Login, Server } from '../models';
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
      <header [selected]="2" [isAdmin]=true></header>
      <h2 class="mat-h2" style="padding-top:20px">Admin information</h2>
      <mat-card>
        <mat-card-content>
          <div>Username: <span style="font-weight: bold; padding-right: 5px;">{{this.loginService.login.username}}</span></div>
          <div style="margin-top: 20px">
            <div><a class="my-button" mat-raised-button href="{{getAppLogsUrl()}}">App logs</a></div>
            <div><a class="my-button" mat-raised-button href="{{getAccessLogsUrl()}}">Web server logs</a></div>
            <div><a class="my-button" mat-raised-button href="{{getWatchdogLogsUrl()}}">Watchdog logs</a></div>
            <div><a class="my-button" mat-raised-button href="{{getEventLogsUrl()}}">Event logs</a></div>
            <div><a class="my-button" mat-raised-button href="{{getCrashLogsUrl()}}">Crash logs</a></div>
          </div>
        </mat-card-content>
      </mat-card>
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

}
