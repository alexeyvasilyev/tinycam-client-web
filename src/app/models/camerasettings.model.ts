//{"data":[{"name":"Front yard","enabled":true,"id":182399567}]}
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
