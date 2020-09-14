import { Component } from '@angular/core';
import { LoginService } from '../services';

@Component({
    styles: [ `
    `],
    template: `
    <div>
        <header [selected]="0" [isAdmin]="this.loginService.login.isAdmin()"></header>
        <live-cam-list></live-cam-list>
    </div>
    `
})

export class PageLiveComponent {

    constructor (
        public loginService: LoginService) {
    }

}
