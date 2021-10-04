import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators'

@Injectable()
export class IpLocateService {

    constructor(private http: HttpClient) {
    }

    getLookup(ip: string): Observable<any> {
        // console.log('getLookup()');
        const url = `https://www.iplocate.io/api/lookup/${ip}`;
        return this.http
            .get<any>(url)
            .pipe(
                timeout(10000)
            );
    }

    // private handleError(error: HttpErrorResponse): Promise<any> {
    //     // console.error('An error occurred in /api/v1/get_cam_list', error);
    //     return Promise.reject(error);
    // }

}
