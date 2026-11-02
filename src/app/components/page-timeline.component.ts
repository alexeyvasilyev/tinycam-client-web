import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LoginService } from '../services';
import { HeaderComponent } from './header.component';
import { TimelineCamListComponent } from './timeline-cam-list.component';

@Component({
    template: `
    <header [selected]="2" [isAdmin]="this.loginService.login.isAdmin()"></header>
    <div class="app-container">
      <timeline-cam-list></timeline-cam-list>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [HeaderComponent, TimelineCamListComponent]
})

export class PageTimelineComponent {

    constructor (
        public loginService: LoginService) {
    }

}
