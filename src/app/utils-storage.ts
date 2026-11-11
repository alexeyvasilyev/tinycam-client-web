import { Login } from './models';
import { LoginService } from './services';

// Pages remembered to be opened again on start and after login
const REMEMBERED_PAGES = ['live', 'livem', 'events', 'timeline', 'admin'];

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

    // Live view uses MJPEG instead of MP4
    static getUseMjpegLiveView(): boolean {
        try {
            return localStorage.getItem('useMjpegLiveView') === 'true';
        } catch {
            return false;
        }
    }

    static setUseMjpegLiveView(useMjpeg: boolean) {
        try {
            localStorage.setItem('useMjpegLiveView', useMjpeg ? 'true' : 'false');
        } catch {
            // Setting still works for the current page when storage is unavailable.
        }
    }

    // Last opened page (live, livem, events, timeline, admin), opened again after login
    static getLastPage(): string | null {
        try {
            return localStorage.getItem('lastPage');
        } catch {
            return null;
        }
    }

    static setLastPage(page: string) {
        if (!REMEMBERED_PAGES.includes(page)) return;
        try {
            localStorage.setItem('lastPage', page);
        } catch {
            // Login opens the default page when storage is unavailable.
        }
    }

    // Last opened page if still allowed, admin page is for admins only
    static getStartPage(loginService: LoginService): string {
        if (!loginService.login.succeeded)
            StorageUtils.loadStorage(loginService);
        const page = StorageUtils.getLastPage();
        if (page == null || !REMEMBERED_PAGES.includes(page) ||
            (page === 'admin' && !loginService.login.isAdmin()))
            return 'events';
        return page;
    }

    // Multiple cameras layout id (see live-layouts.ts)
    static getLiveLayout(): string | null {
        try {
            return localStorage.getItem('liveLayout');
        } catch {
            return null;
        }
    }

    static setLiveLayout(layoutId: string) {
        try {
            localStorage.setItem('liveLayout', layoutId);
        } catch {
            // Layout still works for the current page when storage is unavailable.
        }
    }

}
