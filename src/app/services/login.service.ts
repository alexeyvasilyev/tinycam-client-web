import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Login, Server, ServerResponse } from '../models'
import 'rxjs/add/operator/timeout'

@Injectable()
export class LoginService {

    public login  = new Login('', '');
    public server = new Server();

    constructor(private http: HttpClient) {
    }

    getLogin(server: Server, username: String, password: String): Promise<Login> {
        const url = `${server.url}/api/v1/login?user=${username}&pwd=${password}`;
        return this.http
            .get<ServerResponse>(url)
            .timeout(10000)
            .toPromise()
            .then((res:ServerResponse) => res.data as Login)
            .catch(this.handleError);
        //{"data":{"token", "abc123456789def"}}
    }

    private handleError(error: HttpErrorResponse): Promise<any> {
        // console.error('An error occurred', error);
        return Promise.reject(error);
    }

}
