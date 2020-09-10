import { Component } from '@angular/core';
import { LoginService } from '../services';

@Component({
  template: `
    <header [selected]="1" [isAdmin]="this.loginService.login.isAdmin()"></header>
    <timeline-cam-list></timeline-cam-list>
  `
})

export class TimelineComponent {

    constructor (
        public loginService: LoginService) {
    }

}
