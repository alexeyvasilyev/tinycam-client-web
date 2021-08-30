export class IpAddress {
    ip: string;
    time: number; // epoch
    user: string; // demo | admin

    // Params updated by https://www.iplocate.io/api/lookup/<IP> service
    city: string;
    country: string;
    latitude: string;
    longitude: string;
}
