import { CharacteristicGetCallback, CharacteristicSetCallback, CharacteristicValue, PlatformAccessory } from 'homebridge';
import { Plugin } from './Plugin';
export interface Device {
    'name': string;
    'ip': string;
    'port': number;
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
    private tvService?;
    private device;
    private axios;
    private state;
    constructor(platform: Plugin, accessory: PlatformAccessory);
    configureSpeakerService(): void;
    setPower(value: CharacteristicValue, callback: CharacteristicSetCallback): Promise<void>;
    getPower(callback: CharacteristicGetCallback): Promise<void>;
    setVolume(value: CharacteristicValue, callback: CharacteristicSetCallback): Promise<void>;
}
//# sourceMappingURL=Accessory.d.ts.map