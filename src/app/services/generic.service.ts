import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Login, Server } from '../models'
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators'

@Injectable()
export class GenericService {

    constructor(private http: HttpClient) {
    }

    getRequest(server: Server, login: Login, request: String): Observable<any> {
        const char = request.indexOf('?') == -1 ? '?' : '&';
        const url = `${server.url}${request}${char}token=${login.token}`;
        return this.http
            .get<any>(url)
            .pipe(
                timeout(10000),
            );
    }

    // private handleError(error: HttpErrorResponse): Promise<any> {
    //     // console.error('An error occurred', error);
    //     return Promise.reject(error);
    // }

}
