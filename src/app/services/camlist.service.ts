import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Login, Server, ServerResponse, CameraSettings } from '../models';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class CamListService {

    constructor(private http: HttpClient) {
    }

    getCamList(server: Server, login: Login): Promise<CameraSettings[]> {
        console.log('getCamList()');
        const url = `${server.server_addr}/api/v1/get_cam_list?token=${login.token}`;
        return this.http
            .get<ServerResponse>(url)
            .toPromise()
            .then((res:ServerResponse) => res.data as CameraSettings[])
            .catch(this.handleError);
    }

    private handleError(error: any): Promise<any> {
        console.error('An error occurred in /api/v1/get_cam_list', error);
        return Promise.reject(error.message || error);
    }

}