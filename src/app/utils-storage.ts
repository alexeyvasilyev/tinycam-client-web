import { Login } from './models';
import { LoginService } from './services';

export default class StorageUtils {

    static loadStorage(loginService: LoginService) {
        // console.log('loadStorage()');
        var login = JSON.parse(localStorage.getItem('login'));
        if (login != null && login.user != null) {
            console.log('Restoring login...');
            loginService.login.username = login.user;
            if (login.token)
                loginService.login.token = login.token;
            if (login.access)
                loginService.login.access = login.access;
            loginService.login.succeeded = true; //???
        }
        var server = JSON.parse(localStorage.getItem('server'));
        if (server != null && server.url != null) {
            console.log('Restoring server...');
            loginService.server.url = server.url;
        }
    }

    static saveStorage(loginService: LoginService) {
        // Save credentials to database
        localStorage.setItem(
            'login',
            JSON.stringify({
                user: loginService.login.username,
                token: loginService.login.token,
                access: loginService.login.access
            }));
        // Save server to database
        localStorage.setItem(
            'server',
            JSON.stringify({
                url: loginService.server.url
            }));
    }

    static cleanStorage(loginService: LoginService) {
        localStorage.setItem(
            'login',
            JSON.stringify({
              user: loginService.login.username
            }))
          localStorage.removeItem('lastCameraSelected');
      }


    static getLastCameraSelected(): number {
        // console.log('getLastCameraSelected()');
        var camId = localStorage.getItem('lastCameraSelected');
        if (camId != null && !isNaN(Number(camId))) {
            console.log('Last selected camera: ' + camId);
            return Number(camId);   
        }
        return -1;
    }

    static setLastCameraSelected(camId: number) {
        localStorage.setItem('lastCameraSelected', camId.toString());
    }

}
