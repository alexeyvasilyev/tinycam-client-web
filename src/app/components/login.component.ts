import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Login } from '../models';
import { LoginService } from '../services';
import { HttpErrorResponse } from '@angular/common/http';
import StorageUtils from '../utils-storage';

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
      <div class="app-text-center"><a href="https://tinycammonitor.com"><img src="assets/img/applogo.png"/><br/>
      https://tinycammonitor.com</a> - <a href="https://github.com/alexeyvasilyev/tinycam-api">API</a></div>
      <div class="app-text-center" style="padding:25px 0px"><h1>tinyCam Monitor Login</h1></div>
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

            <div *ngIf="showServer">
              <mat-form-field class="login-full-width" style="padding-top:10px;">
                <input
                  matInput
                  type="text"
                  placeholder="Remote server, e.g. http://192.168.0.3:8083"
                  [(ngModel)]="server" name="Server">
              </mat-form-field>
            </div>

            <div class="app-text-center">
              <button type="submit" [disabled]="!loginForm.form.valid" mat-raised-button color="accent" class="login-button">LOGIN</button>
              <mat-card *ngIf="error != null" class="app-card-warning" style="padding: 20px; margin-top:20px">
                <mat-card-content>Failed to login.<br/>{{error}}</mat-card-content>
              </mat-card>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <div style="padding: 20px;" class="app-text-right">
        Use <a href="/old/">Old</a> web UI
      </div>

      <div style="padding-top: 20px; padding-bottom: 10px" class="mat-small app-text-center">
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
    showServer: boolean = false;

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private loginService: LoginService) {
    }

    ngOnInit() {
      StorageUtils.loadStorage(this.loginService);
      this.server = this.loginService.server.url;
      // Check if '/login?remote=yes'
      this.activatedRoute.queryParams.subscribe((params: Params) => {
        let status = params['remote'];
        if (status) {
          this.showServer = status === 'yes' ? true : false;
        }
      });
      // Show server if saved server length not empty
      if (this.loginService.server.url.length > 0)
        this.showServer = true;
    }

    processLogin(newLogin: Login) {
        console.log('New login token acquired: ' + newLogin.token);
        this.loginService.login.succeeded = true;
        this.loginService.login.token = newLogin.token;
        this.loginService.login.access = newLogin.access;
        this.loginService.server.url = this.server;

        StorageUtils.saveStorage(this.loginService);
        this.router.navigate(['/events']);
    }

    doLogin() {
        console.log('Trying to login...');
        this.error = null;
        this.loginService.login.username = this.loginService.login.username.trim();
        this.loginService.server.url = this.server;
      
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
