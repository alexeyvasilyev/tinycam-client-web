import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Server, ServerResponse } from '../models'
import { Observable } from 'rxjs';
import { timeout, map } from 'rxjs/operators'

@Injectable()
export class LogoutService {

    constructor(private http: HttpClient) {
    }

    getLogout(server: Server, token: String): Observable<any> {
        const url = `${server.url}/api/v1/logout?token=${token}`;
        return this.http
            .get<ServerResponse>(url)
            .pipe(
                timeout(10000),
                map((res:ServerResponse) => res.data as any)
            );

            // .timeout(10000)
            // .toPromise()
            // .then()
            // .catch(this.handleError);
        //{"data":{"token", "abc123456789def"}}
    }

    // private handleError(error: HttpErrorResponse): Promise<any> {
    //     // console.error('An error occurred', error);
    //     return Promise.reject(error);
    // }

}
