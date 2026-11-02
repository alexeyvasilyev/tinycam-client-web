import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LoginService, LogoutService } from '../services';
import StorageUtils from '../utils-storage';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'header',
    styles: [`
    .header {
      padding: 20px;
      width: 100%;
    }
    .header-button {
      margin: 5px;
      text-transform: uppercase;
      border-radius: 2px;
      font-weight: normal;
      letter-spacing: .03em;
    }
  `],
    template: `
    <div class="app-container app-text-center header">
      <button
        mat-raised-button
        class="header-button"
        routerLink="/live"
        routerLinkActive="active"
        color="primary"
        [disabled]="selected() == 0"><i class="fas fa-square fa-lg"></i> &nbsp; Live</button>
    
        <button
          mat-raised-button
          class="header-button"
          routerLink="/events"
          routerLinkActive="active"
          color="primary"
          [disabled]="selected() == 1"><i class="fas fa-child fa-lg"></i> &nbsp; Events</button>
    
          <button
            mat-raised-button
            class="header-button"
            routerLink="/timeline"
            routerLinkActive="active"
            color="primary"
            [disabled]="selected() == 2"><i class="fas fa-barcode fa-lg"></i> &nbsp; Timeline</button>
    
            @if (isAdmin()) {
              <span>
                <button
                  mat-raised-button
                  class="header-button"
                  routerLink="/admin"
                  routerLinkActive="active"
                  color="primary"
                  [disabled]="selected() == 3">
                  <i class="fas fa-user fa-lg"></i> &nbsp; Admin</button>
                </span>
              }
    
              <button
                mat-raised-button
                class="header-button"
                style="margin-left:50px;"
                (click)="doLogout()"
                color="primary">Logout &nbsp;<i class="fas fa-sign-out-alt fa-lg" aria-hidden="true"></i></button>
    
              </div>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatButton, RouterLink, RouterLinkActive]
})

export class HeaderComponent {

    public readonly selected = input<number>(undefined);
    public readonly isAdmin = input<boolean>(undefined);

    constructor(
        private router: Router,
        private loginService: LoginService,
        private logoutService: LogoutService) {
    }

    doLogout() {
        console.log('Logout');
        this.logoutService.getLogout(this.loginService.server, this.loginService.login.token);
        StorageUtils.cleanStorage(this.loginService);
        this.router.navigate(['/login']);
    }

}
