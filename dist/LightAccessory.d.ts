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
export declare class LightAccessory {
    private readonly platform;
    private readonly accessory;
    private lightService?;
    private readonly device;
    private client;
    constructor(platform: Plugin, accessory: PlatformAccessory);
    initializeService(): void;
    onWLEDStateChange(currentState: any): void;
    setPower(value: CharacteristicValue, callback: CharacteristicSetCallback): Promise<void>;
    getPower(callback: CharacteristicGetCallback): Promise<void>;
    setBrightness(value: CharacteristicValue, callback: CharacteristicSetCallback): Promise<void>;
    getBrightness(callback: CharacteristicGetCallback): Promise<void>;
}
//# sourceMappingURL=LightAccessory.d.ts.map