import { Component, OnInit } from '@angular/core';
import { LoginService } from '../services';

@Component({
  styles: [ ``
  ],
  template: `
    <header [selected]="1" [isAdmin]="this.loginService.login.isAdmin()"></header>
    <div class="app-container">
      <event-cam-list></event-cam-list>
    </div>
  `
})

export class PageEventsComponent implements OnInit {

    constructor (
        public loginService: LoginService) {
    }

    ngOnInit() {
    }

}
