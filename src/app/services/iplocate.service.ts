import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/timeout'

@Injectable()
export class IpLocateService {

    constructor(private http: HttpClient) {
    }

    getLookup(ip: string): Promise<any> {
        // console.log('getLookup()');
        const url = `https://www.iplocate.io/api/lookup/${ip}`;
        return this.http
            .get<any>(url)
            .timeout(10000)
            .toPromise()
            .then()
            .catch(this.handleError);
    }

    private handleError(error: HttpErrorResponse): Promise<any> {
        // console.error('An error occurred in /api/v1/get_cam_list', error);
        return Promise.reject(error);
    }

}
