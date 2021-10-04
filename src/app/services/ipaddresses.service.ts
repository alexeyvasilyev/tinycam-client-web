import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Login, Server, ServerResponse, IpAddress } from '../models';
import { Observable } from 'rxjs';
import { timeout, map } from 'rxjs/operators'

@Injectable()
export class IpAddressesService {

    constructor(private http: HttpClient) {
    }

    getIpAddresses(server: Server, login: Login): Observable<IpAddress[]> {
        // console.log('getIpAddresses()');
        const url = `${server.url}/api/v1/get_ip_addresses?token=${login.token}`;
        return this.http
            .get<ServerResponse>(url)
            .pipe(
                timeout(10000),
                map((res:ServerResponse) => res.data as IpAddress[])
            );
    }

    // private handleError(error: HttpErrorResponse): Promise<any> {
    //     // console.error('An error occurred in /api/v1/get_ip_addresses', error);
    //     return Promise.reject(error);
    // }

}
