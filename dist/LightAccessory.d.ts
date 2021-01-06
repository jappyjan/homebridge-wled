import { PlatformAccessory } from 'homebridge';
import { Plugin } from './Plugin';
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
    private readonly log;
    private static instanceCount;
    constructor(platform: Plugin, accessory: PlatformAccessory);
    initializeService(): void;
    private setPower;
    private getPower;
    private setBrightness;
    private getBrightness;
}
//# sourceMappingURL=LightAccessory.d.ts.map