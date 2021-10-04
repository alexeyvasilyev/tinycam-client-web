import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { EventRecord, Login, Server, ServerResponse } from '../models'
import { Observable } from 'rxjs';
import { timeout, map } from 'rxjs/operators'

// export const enum EventType {
//     Local = "local",
//     Cloud = "cloud"
// };

@Injectable()
export class EventListService {

    constructor(private http: HttpClient) {
    }

    getEventList(server: Server, login: Login, cameraId: number, endtime: number, limit: number, type: string, filter: string): Observable<EventRecord[]> {
        // console.log('getEventList(cameraId=' + cameraId + ', eventId=' + eventId + ', endtime=' + endtime + ', limit=' + limit + ')');

        const url = `${server.url}/api/v1/get_cam_event_list?token=${login.token}&cameraId=${cameraId}&endtime=${endtime}&count=${limit}&type=${type}&filter=${filter}`;
        return this.http
            .get<ServerResponse>(url)
            .pipe(
                timeout(10000),
                map((res:ServerResponse) => res.data as EventRecord[])
            );
    }

    // private handleError(error: HttpErrorResponse): Promise<any> {
    //     // console.error('An error occurred', error);
    //     return Promise.reject(error);
    // }

}
