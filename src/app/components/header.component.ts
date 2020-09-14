import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'header',
  styles: [ `
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
        color="accent"
        [disabled]="selected == 0"><i class="fas fa-square fa-lg"></i> &nbsp; Live</button>

      <button
        mat-raised-button
        class="header-button"
        routerLink="/events"
        routerLinkActive="active"
        color="accent"
        [disabled]="selected == 1"><i class="fas fa-child fa-lg"></i> &nbsp; Events</button>

      <button
        mat-raised-button
        class="header-button"
        routerLink="/timeline"
        routerLinkActive="active"
        color="accent"
        [disabled]="selected == 2"><i class="fas fa-barcode fa-lg"></i> &nbsp; Timeline</button>

      <span *ngIf="isAdmin">
        <button
          mat-raised-button
          class="header-button"
          routerLink="/admin"
          routerLinkActive="active"
          color="accent"
          [disabled]="selected == 3">
            <i class="fas fa-user fa-lg"></i> &nbsp; Admin</button>
      </span>

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
    @Input() public isAdmin: boolean;

    constructor(
        private router: Router) {
    }

    doLogout() {
        console.log('Logout');
        localStorage.removeItem('login');
        this.router.navigate(['/login']);
    }

}
