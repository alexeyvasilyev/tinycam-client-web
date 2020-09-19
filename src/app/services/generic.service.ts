import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Login, Server } from '../models'
import 'rxjs/add/operator/timeout'

@Injectable()
export class GenericService {

    constructor(private http: HttpClient) {
    }

    getRequest(server: Server, login: Login, request: String): Promise<any> {
        const char = request.indexOf('?') == -1 ? '?' : '&';
        const url = `${server.url}${request}${char}token=${login.token}`;
        return this.http
            .get<any>(url)
            .timeout(10000)
            .toPromise()
            .then()
            .catch(this.handleError);
    }

    private handleError(error: HttpErrorResponse): Promise<any> {
        // console.error('An error occurred', error);
        return Promise.reject(error);
    }

}
