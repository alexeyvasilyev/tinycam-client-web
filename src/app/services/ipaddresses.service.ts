import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Login, Server, ServerResponse, IpAddress } from '../models';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/timeout'

@Injectable()
export class IpAddressesService {

    constructor(private http: HttpClient) {
    }

    getIpAddresses(server: Server, login: Login): Promise<IpAddress[]> {
        // console.log('getIpAddresses()');
        const url = `${server.url}/api/v1/get_ip_addresses?token=${login.token}`;
        return this.http
            .get<ServerResponse>(url)
            .timeout(10000)
            .toPromise()
            .then((res:ServerResponse) => res.data as IpAddress[])
            .catch(this.handleError);
    }

    private handleError(error: HttpErrorResponse): Promise<any> {
        // console.error('An error occurred in /api/v1/get_ip_addresses', error);
        return Promise.reject(error);
    }

}
