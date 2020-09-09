import { Component } from '@angular/core';
import { Login, Server } from '../models';
import { LoginService } from '../services';

@Component({
    // animations: [animateFactory(150, 0, 'ease-in')],
    styles: [ `
      .my-button {
        margin: 5px;
      }
    `],
    template: `
      <header [selected]="2"></header>
      <h2 class="mat-h2" style="padding-top:20px">Admin information</h2>
      <mat-card>
        <mat-card-content>
        <div class="app-row">
          <div class="app-column" style="width:80%;height:100%">
            Username: <span style="font-weight: bold; padding-right: 5px;">{{login.username}}</span>
          </div>
          <div class="app-column app-text-right" style="width:20%">
            <a class="my-button" mat-raised-button href="password_reset.html?login={{login.username}}"><i class="fas fa-key fa-lg"></i></a>
          </div>
        </div>
        </mat-card-content>
      </mat-card>
    `
})

export class AdminComponent {

    login = this.loginService.login;

    constructor(
        private loginService: LoginService) {
    }

}
