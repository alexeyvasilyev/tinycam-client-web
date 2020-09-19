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
    cpuFrequencyMhz: number;
    cpuUsagePercents: number;
    liveConnections: number;
    networkInBps: number;
    networkOutBps: number;
    processes: string[];
    threadsRunnableUsed: number;
    threadsUsed: number;
    uptime: string;
    rootAvailable: boolean;
    memoryUsed: number;
    memoryAvailable: number;
    spaceUsed: number;
    spaceAvailable: number;
    motionCameras: string[];

}
