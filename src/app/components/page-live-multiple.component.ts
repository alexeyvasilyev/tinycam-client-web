import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LoginService } from '../services';

@Component({
    styles: [`
    `],
    template: `
    <div>
        <header [selected]="0" [isAdmin]="this.loginService.login.isAdmin()"></header>
        <live-multiple></live-multiple>
    </div>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})

export class PageLiveMultipleComponent {

    constructor (
        public loginService: LoginService) {
    }

}
