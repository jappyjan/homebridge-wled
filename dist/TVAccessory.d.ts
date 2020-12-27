import { CharacteristicGetCallback, CharacteristicSetCallback, CharacteristicValue, PlatformAccessory } from 'homebridge';
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
    private televisionService?;
    private readonly device;
    private readonly client;
    private readonly availableInputServices;
    private effectNamesLoaded;
    constructor(platform: Plugin, accessory: PlatformAccessory);
    private onWLEDStateChange;
    private initializeService;
    private configureInputSources;
    private setEffectNames;
    setPower(value: CharacteristicValue, callback: CharacteristicSetCallback): Promise<void>;
    getPower(callback: CharacteristicGetCallback): Promise<void>;
    setInputSource(value: CharacteristicValue, callback: CharacteristicSetCallback): Promise<void>;
}
//# sourceMappingURL=TVAccessory.d.ts.map