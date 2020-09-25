import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { EventRecord, Login, Server, ServerResponse } from '../models'
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/timeout'

// export const enum EventType {
//     Local = "local",
//     Cloud = "cloud"
// };

@Injectable()
export class EventListService {

    constructor(private http: HttpClient) {
    }

    getEventList(server: Server, login: Login, cameraId: number, endtime: number, limit: number, type: string, motion: string): Promise<EventRecord[]> {
        // console.log('getEventList(cameraId=' + cameraId + ', eventId=' + eventId + ', endtime=' + endtime + ', limit=' + limit + ')');

        const url = `${server.url}/api/v1/get_cam_event_list?token=${login.token}&cameraId=${cameraId}&endtime=${endtime}&count=${limit}&type=${type}&motion=${motion}`;
        return this.http
            .get<ServerResponse>(url)
            .timeout(10000)
            .toPromise()
            .then((res:ServerResponse) => res.data as EventRecord[])
            .catch(this.handleError);
    }

    private handleError(error: HttpErrorResponse): Promise<any> {
        // console.error('An error occurred', error);
        return Promise.reject(error);
    }

}
