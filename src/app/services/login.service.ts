import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Login, Server, ServerResponse } from '../models'
import { Observable } from 'rxjs';
import { timeout, map } from 'rxjs/operators'

@Injectable()
export class LoginService {

    public login  = new Login('', '');
    public server = new Server();

    constructor(private http: HttpClient) {
    }

    getLogin(server: Server, username: String, password: String): Observable<Login> {
        const url = `${server.url}/api/v1/login?user=${username}&pwd=${password}`;
        return this.http
            .get<ServerResponse>(url)
            .pipe(
                timeout(10000),
                map((res:ServerResponse) => res.data as Login)
            );
        //     .timeout(10000)
        //     .toPromise()
        //     .then((res:ServerResponse) => res.data as Login)
        //     .catch(this.handleError);
        // //{"data":{"token", "abc123456789def"}}
    }

    // private handleError(error: HttpErrorResponse): Promise<any> {
    //     // console.error('An error occurred', error);
    //     return Promise.reject(error);
    // }

}
