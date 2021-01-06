import { PlatformAccessory } from 'homebridge';
import { Plugin } from '../plugin/Plugin';
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
    private readonly log;
    private static instanceCount;
    private isSetting;
    constructor(platform: Plugin, accessory: PlatformAccessory);
    private initializeService;
    private configureInputSources;
    private setEffectNames;
    private setInputSource;
    private setPower;
}
//# sourceMappingURL=TVAccessory.d.ts.map