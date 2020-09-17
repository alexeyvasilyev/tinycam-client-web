import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { LoginService, WindowRefService } from '../services';
import StorageUtils from '../utils-storage';

@Injectable()
export class AuthGuard implements CanActivate {

    constructor(
        private router: Router,
        private windowRef: WindowRefService,
        private loginService: LoginService) {
    }

    makeRedirection(url: string) {
        console.log('Redirecting to ' + url);
        this.windowRef.nativeWindow.location.href = url;
    }

    canActivate() {
        if (!this.loginService.login.succeeded) {
            StorageUtils.loadStorage(this.loginService);
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
