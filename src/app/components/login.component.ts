import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Login } from '../models';
import { LoginService } from '../services';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'login',
  styles: [ `
    .login-form {
      padding: 20px;
    }
    .login-screen {
      padding-top: 50px;
      margin: 0 auto;
      max-width: 400px;
    }
    .login-button {
      margin: 10px 0px;
      padding: 5px 40px;
      text-transform: uppercase;
      font-weight: normal;
      letter-spacing: .03em;
    }
    .login-full-width {
      width: 100%;
    }
  `],
  template: `
    <div class="login-screen">
      <div class="app-text-center"><a href="https://tinycammonitor.com"><img src="assets/img/applogo.png"/></a></div>
      <div class="app-text-center mat-display-1">tinyCam Monitor Login</div>
      <mat-card>
        <mat-card-content>
          <form (ngSubmit)="doLogin()" #loginForm="ngForm" class="login-form">

            <mat-form-field class="login-full-width">
              <input
                matInput
                required
                type="text"
                placeholder="Username"
                [(ngModel)]="login.username" name="Username">
            </mat-form-field>

            <mat-form-field class="login-full-width" style="padding-top:10px;">
              <input
                matInput
                type="password"
                placeholder="Password"
                [(ngModel)]="password" name="Password">
            </mat-form-field>

            <mat-form-field class="login-full-width" style="padding-top:10px;">
              <input
                matInput
                type="text"
                placeholder="Server, e.g. http://192.168.0.3:8083"
                [(ngModel)]="server" name="Server">
            </mat-form-field>

            <div class="app-text-center">
              <button type="submit" [disabled]="!loginForm.form.valid" mat-raised-button color="accent" class="login-button">LOGIN</button>
              <mat-card *ngIf="error != null" class="app-card-warning" style="padding: 30px;">
                <mat-card-content>Failed to login.<br/>{{error}}</mat-card-content>
              </mat-card>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
      <div style="padding-top: 40px; padding-bottom: 10px" class="mat-small app-text-center">
        Want to have constant 24/7 recording? Check  <a href="https://cloud.tinycammonitor.com/">tinyCam Cloud</a> service.<br/>
        <a href="https://tinysolutionsllc.com/">Tiny Solutions LLC., 2010–2020</a>
      </div>
    </div>
  `,
})

export class LoginComponent implements OnInit {

    login = this.loginService.login;
    error: string = null;
    password: string = '';
    server: string = '';

    // loginFormControl = new FormControl('', [
    //     Validators.required,
    //     Validators.email,
    //   ]);

    // matcher = new MyErrorStateMatcher();

    constructor(
        private router: Router,
        private loginService: LoginService) {
    }

    ngOnInit() {
      this.server = this.loginService.server.server_addr;
    }

    processLogin(newLogin: Login) {
        console.log('processLogin() token: ' + newLogin.token);
        // this.loginService.server = server;
        this.loginService.login.succeeded = true;
        this.loginService.login.token = newLogin.token;
        this.loginService.login.access = newLogin.access;
        this.loginService.server.server_addr = this.server;

        // Save credentials to database
        localStorage.setItem(
          'login',
          JSON.stringify({
            user: this.loginService.login.username,
            token: this.loginService.login.token,
            access: this.loginService.login.access
          }))
        // Save server to database
        localStorage.setItem(
          'server',
          JSON.stringify({
            server: this.loginService.server.server_addr
          }));

        this.router.navigate(['/events']);
    }

    doLogin() {
        console.log('Trying to login...');
        this.error = null;
        this.loginService.login.username = this.loginService.login.username.trim();
        this.loginService.server.server_addr = this.server;
      
        // Send HTTP request
        this.loginService.getLogin(this.loginService.server, this.login.username, this.password)
            .then(login => this.processLogin(login))
            .catch(this.handleError.bind(this));
    }

    private handleError(error: HttpErrorResponse): Promise<any> {
        this.error = error.message;
        console.error('Failed to login.', error.message);
        return Promise.reject(error.message || error);
    }

}
