import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Login, Server, Status, ServerResponse } from '../models'
import 'rxjs/add/operator/timeout'

@Injectable()
export class StatusService {

    constructor(private http: HttpClient) {
    }

    getStatusGlobal(server: Server, login: Login): Promise<Status> {
        const url = `${server.url}/api/v1/get_status?token=${login.token}`;
        return this.http
            .get<ServerResponse>(url)
            .timeout(10000)
            .toPromise()
            .then((res:ServerResponse) => res.data as Status)
            .catch(this.handleError);
    }

    getStatusCamera(server: Server, login: Login, cameraId: number): Promise<Status> {
        const url = `${server.url}/api/v1/get_status?token=${login.token}&cameraId=${cameraId}`;
        return this.http
            .get<ServerResponse>(url)
            .timeout(10000)
            .toPromise()
            .then((res:ServerResponse) => res.data as Status)
            .catch(this.handleError);
    }

    private handleError(error: HttpErrorResponse): Promise<any> {
        return Promise.reject(error);
    }

}
