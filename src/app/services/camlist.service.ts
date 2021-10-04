import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Login, Server, ServerResponse, CameraSettings } from '../models';
import { Observable } from 'rxjs';
import { timeout, map } from 'rxjs/operators'

@Injectable()
export class CamListService {

    constructor(private http: HttpClient) {
    }

    getCamList(server: Server, login: Login): Observable<CameraSettings[]> {
        // console.log('getCamList()');
        const url = `${server.url}/api/v1/get_cam_list?token=${login.token}`;
        return this.http
            .get<ServerResponse>(url)
            .pipe(
                timeout(10000),
                map((res:ServerResponse) => res.data as CameraSettings[])
            );
    }

    // private handleError(error: HttpErrorResponse): Promise<any> {
    //     // console.error('An error occurred in /api/v1/get_cam_list', error);
    //     return Promise.reject(error);
    // }

}
