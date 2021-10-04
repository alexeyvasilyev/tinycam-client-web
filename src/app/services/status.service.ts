import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Login, Server, Status, ServerResponse } from '../models'
import { Observable } from 'rxjs';
import { timeout, map } from 'rxjs/operators'

@Injectable()
export class StatusService {

    constructor(private http: HttpClient) {
    }

    getStatusGlobal(server: Server, login: Login): Observable<HttpResponse<ServerResponse>> {
        const url = `${server.url}/api/v1/get_status?token=${login.token}`;
        return this.http
            .get<ServerResponse>(url, { observe: 'response' })
            .pipe(
                timeout(10000)
            );
    }

    getStatusCamera(server: Server, login: Login, cameraId: number): Observable<Status> {
        const url = `${server.url}/api/v1/get_status?token=${login.token}&cameraId=${cameraId}`;
        return this.http
            .get<ServerResponse>(url)
            .pipe(
                timeout(10000),
                map((res:ServerResponse) => res.data as Status)
            );
    }

    // private handleError(error: HttpErrorResponse): Promise<any> {
    //     return Promise.reject(error);
    // }

}
