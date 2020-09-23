export const enum StatusStreamProfile {
    Main = 0,
    Sub = 1,
    Auto = 2
};

export const enum BatteryStatus {
    Charging = 'charging',
    Charged = 'charged',
    Discharging = 'discharging',
    NotCharging = 'not charging',
    Unknown = 'unknown'
};

export class Status {

    // Global status
    backgroundMode: boolean;
    batteryLevel: number; // 0-100
    batteryStatus: BatteryStatus;
    streamProfile: StatusStreamProfile;
    powerSafeMode: boolean;
    notifications: boolean;
    cpuFrequencyMhz: number;
    cpuUsagePercents: number;
    liveConnections: number;
    networkInBps: number; // bytes per second
    networkOutBps: number; // bytes per second
    processes: string[]; // names of processes running
    threadsRunnableUsed: number;
    threadsUsed: number;
    uptime: number; // msec
    rootAvailable: boolean;
    memoryUsed: number; // bytes, RAM
    memoryAvailable: number; // bytes, RAM
    spaceUsed: number; // bytes, local storage use
    spaceAvailable: number; // bytes, local storage available
    motionCameras: string[]; // names of cameras which current motion detected

    // Camera status
    motion: boolean;

}
