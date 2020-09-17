import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Server, ServerResponse } from '../models'

@Injectable()
export class LogoutService {

    constructor(private http: HttpClient) {
    }

    getLogout(server: Server, token: String): Promise<any> {
        const url = `${server.url}/api/v1/logout?token=${token}`;
        return this.http
            .get<ServerResponse>(url)
            .toPromise()
            .then()
            .catch(this.handleError);
        //{"data":{"token", "abc123456789def"}}
    }

    private handleError(error: HttpErrorResponse): Promise<any> {
        // console.error('An error occurred', error);
        return Promise.reject(error);
    }

}
