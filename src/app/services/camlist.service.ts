import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Login, Server, ServerResponse, CameraSettings } from '../models';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/timeout'

@Injectable()
export class CamListService {

    constructor(private http: HttpClient) {
    }

    getCamList(server: Server, login: Login): Promise<CameraSettings[]> {
        // console.log('getCamList()');
        const url = `${server.url}/api/v1/get_cam_list?token=${login.token}`;
        return this.http
            .get<ServerResponse>(url)
            .timeout(10000)
            .toPromise()
            .then((res:ServerResponse) => res.data as CameraSettings[])
            .catch(this.handleError);
    }

    private handleError(error: HttpErrorResponse): Promise<any> {
        // console.error('An error occurred in /api/v1/get_cam_list', error);
        return Promise.reject(error);
    }

}
