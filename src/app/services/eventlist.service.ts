import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { EventRecord, Login, Server, ServerResponse } from '../models'
import 'rxjs/add/operator/toPromise';

@Injectable()
export class EventListService {

    constructor(private http: HttpClient) {
    }

    // getEventListByDate(server: Server, login: Login, cameraId: number, date: Date, limit: number): Promise<EventRecord[]> {
    //     return this.getEventList(server, login, cameraId,  date, limit);
    // }

    // getEventListById(server: Server, login: Login, cameraId: number, limit: number): Promise<EventRecord[]> {
    //     return this.getEventList(server, login, cameraId, null, limit);
    // }

    getEventList(server: Server, login: Login, cameraId: number, date: number, limit: number): Promise<EventRecord[]> {
        // console.log('getEventList(camId=' + camId + ', eventId=' + eventId + ', date=' + date + ', limit=' + limit + ')');

        const url = `${server.server_addr}/api/v1/get_cam_event_list?token=${login.token}&cameraId=${cameraId}&endtime=${date}&count=${limit}`;
        return this.http
            .get<ServerResponse>(url)
            .toPromise()
            .then((res:ServerResponse) => res.data as EventRecord[])
            .catch(this.handleError);
    }

    private handleError(error: HttpErrorResponse): Promise<any> {
        // console.error('An error occurred', error);
        return Promise.reject(error);
    }

}
