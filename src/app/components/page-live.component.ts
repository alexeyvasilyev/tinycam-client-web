import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LoginService } from '../services';
import { HeaderComponent } from './header.component';
import { LiveCamListComponent } from './live-cam-list.component';

@Component({
    styles: [`
    `],
    template: `
    <div>
        <header [selected]="0" [isAdmin]="this.loginService.login.isAdmin()"></header>
        <live-cam-list></live-cam-list>
    </div>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [HeaderComponent, LiveCamListComponent]
})

export class PageLiveComponent {

    constructor (
        public loginService: LoginService) {
    }

}
