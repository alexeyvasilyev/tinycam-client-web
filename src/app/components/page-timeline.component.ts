import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LoginService } from '../services';

@Component({
    template: `
    <header [selected]="2" [isAdmin]="this.loginService.login.isAdmin()"></header>
    <div class="app-container">
      <timeline-cam-list></timeline-cam-list>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})

export class PageTimelineComponent {

    constructor (
        public loginService: LoginService) {
    }

}
