import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'header',
  styles: [ `
    .header {
      padding: 10px;
      margin: 20px 0;
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
        routerLink="/events"
        routerLinkActive="active"
        color="accent"
        [disabled]="selected == 0"><i class="fas fa-child fa-lg"></i> &nbsp; Events</button>

      <button
        mat-raised-button
        class="header-button"
        routerLink="/timeline"
        routerLinkActive="active"
        color="accent"
        [disabled]="selected == 1"><i class="fas fa-barcode fa-lg"></i> &nbsp; Timeline</button>

      <button
        mat-raised-button
        class="header-button"
        routerLink="/admin"
        routerLinkActive="active"
        color="accent"
        [disabled]="selected == 2">
          <i class="fas fa-user fa-lg"></i> &nbsp; Admin</button>

      <button
        mat-raised-button
        class="header-button"
        style="margin-left:50px;"
        (click)="doLogout()"
        color="accent">Logout &nbsp;<i class="fas fa-sign-out-alt fa-lg" aria-hidden="true"></i></button>

    </div>
  `
})

export class HeaderComponent {

    @Input() public selected: number;

    constructor(
        private router: Router) {
    }

    doLogout() {
        console.log('Logout');
        localStorage.removeItem('login');
        this.router.navigate(['/login']);
    }

}