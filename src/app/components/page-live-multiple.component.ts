import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LoginService } from '../services';
import { HeaderComponent } from './header.component';
import { LiveMultipleComponent } from './live-multiple.component';

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
    imports: [HeaderComponent, LiveMultipleComponent]
})

export class PageLiveMultipleComponent {

    constructor (
        public loginService: LoginService) {
    }

}
