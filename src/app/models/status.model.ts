export const enum StatusStreamProfile {
    Main = 0,
    Sub = 1,
    Auto = 2
};

export class Status {

    backgroundMode: boolean;
    streamProfile: StatusStreamProfile;
    powerSafeMode: boolean;
    notifications: boolean;
    cpuUsagePercents: number;

}
