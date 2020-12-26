import { CharacteristicSetCallback, CharacteristicValue, PlatformAccessory } from 'homebridge';
import { Plugin } from './Plugin';
export interface Device {
    name: string;
    ip: string;
    effects: string;
}
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class TVAccessory {
    private readonly platform;
    private readonly accessory;
    private speakerService?;
    private televisionService?;
    private readonly device;
    private readonly baseURL;
    constructor(platform: Plugin, accessory: PlatformAccessory);
    initializeService(): void;
    configureInputSources(): void;
    setEffect(value: CharacteristicValue, callback: CharacteristicSetCallback): Promise<void>;
}
//# sourceMappingURL=TVAccessory.d.ts.map