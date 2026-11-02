import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LoginService } from '../services';
import { HeaderComponent } from './header.component';
import { EventCamListComponent } from './event-cam-list.component';

@Component({
    styles: [``
    ],
    template: `
    <header [selected]="1" [isAdmin]="this.loginService.login.isAdmin()"></header>
    <div class="app-container">
      <event-cam-list></event-cam-list>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [HeaderComponent, EventCamListComponent]
})

export class PageEventsComponent {

    constructor (
        public loginService: LoginService) {
    }

}
