import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Login, Server, Status, ServerResponse } from '../models'
import 'rxjs/add/operator/timeout'
import { Observable } from 'rxjs';

@Injectable()
export class StatusService {

    constructor(private http: HttpClient) {
    }

    getStatusGlobal(server: Server, login: Login): Observable<HttpResponse<ServerResponse>> {
        const url = `${server.url}/api/v1/get_status?token=${login.token}`;
        return this.http
            .get<ServerResponse>(url, { observe: 'response' })
            .timeout(10000);
            // .toPromise()
            // .then((res:ServerResponse) => res.data as Status)
            // .catch(this.handleError);
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
