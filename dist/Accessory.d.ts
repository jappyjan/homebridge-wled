import { CharacteristicGetCallback, CharacteristicSetCallback, CharacteristicValue, PlatformAccessory } from 'homebridge';
import { Plugin } from './Plugin';
export interface Device {
    'name': string;
    'ip': string;
}
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class Accessory {
    private readonly platform;
    private readonly accessory;
    private speakerService?;
    private televisionService?;
    private readonly device;
    private readonly baseURL;
    constructor(platform: Plugin, accessory: PlatformAccessory);
    configureTelevisionService(): void;
    configureInputSources(): void;
    configureSpeakerService(): void;
    setPower(value: CharacteristicValue, callback: CharacteristicSetCallback): Promise<void>;
    getPower(callback: CharacteristicGetCallback): Promise<void>;
    onVolumeChange(value: CharacteristicValue, callback: CharacteristicSetCallback): Promise<void>;
    onRemoteKeyPress(remoteKey: unknown, callback: CharacteristicSetCallback): Promise<void>;
    setEffect(value: CharacteristicValue, callback: CharacteristicSetCallback): Promise<void>;
}
//# sourceMappingURL=Accessory.d.ts.map