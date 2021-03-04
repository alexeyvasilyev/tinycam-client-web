//{"data":[{"name":"Front yard","enabled":true,"id":182399567}]}

export const enum PtzCapability {
    MoveRel     = 0x1 << 1,
    GotoPresets = 0x1 << 4,
    LedOn       = 0x1 << 15,
    LedOff      = 0x1 << 16,
    LedAuto     = 0x1 << 17,
};

export class CameraSettings {

    enabled: boolean;
    id: number;
    name: string;
    ptzCapabilities: number;
    audioListening: boolean;
    cloudAccess: boolean;

    static getName(cameraSettings: CameraSettings): string {
        var text = cameraSettings.name;
        if (text == null)
            text = "";
        if (!cameraSettings.enabled)
            text += " (Disabled)";
        return text;
    }

    public toString = () : string => {
        return `CameraSettings (name: ${this.name}, id: ${this.id}, enabled: ${this.enabled})`;
    }
}
