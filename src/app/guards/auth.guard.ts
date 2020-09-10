import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { LoginService, WindowRefService } from '../services';

@Injectable()
export class AuthGuard implements CanActivate {

    constructor(
        private router: Router,
        private windowRef: WindowRefService,
        private loginService: LoginService) {
    }

    private restoreDatabase() {
        var login = JSON.parse(localStorage.getItem('login'));
        if (login != null && login.user != null && login.token != null) {
            console.log('Restoring login...');
            this.loginService.login.username = login.user;
            this.loginService.login.token = login.token;
            this.loginService.login.access = login.access;
            this.loginService.login.succeeded = true; //???
        }
        var server = JSON.parse(localStorage.getItem('server'));
        if (server != null && server.server != null) {
            console.log('Restoring server...');
            this.loginService.server.server_addr = server.server;
        }
    }

    makeRedirection(url: string) {
        console.log('Redirecting to ' + url);
        this.windowRef.nativeWindow.location.href = url;
    }

    canActivate() {
        if (!this.loginService.login.succeeded) {
            this.restoreDatabase();
        }

        if (this.loginService.login.succeeded) {
//          console.log('canActivate() true');
            return true;
        }

//      console.log('canActivate() false');
        this.router.navigate(['/login']);
        // this.makeRedirection('landing.html');
        return false;
    }
}
