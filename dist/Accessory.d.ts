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
    private device;
    private baseURL;
    constructor(platform: Plugin, accessory: PlatformAccessory);
    configureSpeakerService(): void;
    setMute(value: CharacteristicValue, callback: CharacteristicSetCallback): Promise<void>;
    getMute(callback: CharacteristicGetCallback): Promise<void>;
    setVolume(value: CharacteristicValue, callback: CharacteristicSetCallback): Promise<void>;
}
//# sourceMappingURL=Accessory.d.ts.map