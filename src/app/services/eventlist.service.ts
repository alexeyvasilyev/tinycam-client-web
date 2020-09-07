import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
        //[{"id":10,"cam_id":1444908568,"date":"2015-10-19 13:50:05","image":"2015-10-19_16:50:05_sen786945787.jpg",
        //  "video":"2015-10-19_16:50:05_rec.mp4","video_offset":17183,"duration":null,"has_audio":0,
        //  "has_video":1,"audio_level":0,"video_level":786945787}]
    }

    private handleError(error: any): Promise<any> {
        console.error('An error occurred', error);
        return Promise.reject(error.message || error);
    }

}
