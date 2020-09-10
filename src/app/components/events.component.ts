import { Component, OnInit } from '@angular/core';
import { LoginService } from '../services';

@Component({
  styles: [ ``
  ],
  template: `
    <header [selected]="1" [isAdmin]="this.loginService.login.isAdmin()"></header>
    <event-cam-list></event-cam-list>
  `
})

export class EventsComponent implements OnInit {

    constructor (
        public loginService: LoginService) {
    }

    ngOnInit() {
    }

}
