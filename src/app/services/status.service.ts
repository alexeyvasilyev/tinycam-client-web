import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Login, Server, ServerResponse } from '../models'

@Injectable()
export class StatusService {

    constructor(private http: HttpClient) {
    }

    getStatusGlobal(server: Server, login: Login): Promise<any> {
        const url = `${server.url}/api/v1/get_status?token=${login.token}`;
        return this.http
            .get<ServerResponse>(url)
            .toPromise()
            .then()
            .catch(this.handleError);
    }

    getStatusCamera(server: Server, login: Login, cameraId: number): Promise<any> {
        const url = `${server.url}/api/v1/get_status?token=${login.token}&cameraId=${cameraId}`;
        return this.http
            .get<ServerResponse>(url)
            .toPromise()
            .then()
            .catch(this.handleError);
    }

    private handleError(error: HttpErrorResponse): Promise<any> {
        return Promise.reject(error);
    }

}
