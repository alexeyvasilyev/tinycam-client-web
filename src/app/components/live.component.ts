import { Component } from '@angular/core';
import { LoginService } from '../services';

@Component({
    // animations: [animateFactory(150, 0, 'ease-in')],
    styles: [ `
      .my-button {
        margin: 5px 10px;
        text-transform: uppercase;
      }
    `],
    template: `
      <header [selected]="0" [isAdmin]="this.loginService.login.isAdmin()"></header>
      <h2 class="mat-h2" style="padding-top:20px">Admin information</h2>
      <mat-card>
        <mat-card-content>
        </mat-card-content>
      </mat-card>
    `
})

export class LiveComponent {

  constructor(
    public loginService: LoginService) {
  }


}
