import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Login, Server } from '../models'

@Injectable()
export class GenericService {

    constructor(private http: HttpClient) {
    }

    getRequest(server: Server, login: Login, request: String): Promise<any> {
        const url = `${server.url}${request}&token=${login.token}`;
        return this.http
            .get<any>(url)
            .toPromise()
            .then()
            .catch(this.handleError);
    }

    private handleError(error: HttpErrorResponse): Promise<any> {
        // console.error('An error occurred', error);
        return Promise.reject(error);
    }

}
