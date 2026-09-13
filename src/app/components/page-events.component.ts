import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LoginService } from '../services';

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
    standalone: false
})

export class PageEventsComponent {

    constructor (
        public loginService: LoginService) {
    }

}
