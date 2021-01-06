"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Plugin = void 0;
const settings_1 = require("../settings");
const TVAccessory_1 = require("../accessory/TVAccessory");
const LightAccessory_1 = require("../accessory/LightAccessory");
class Plugin {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.Service = this.api.hap.Service;
        this.Characteristic = this.api.hap.Characteristic;
        // this is used to track restored cached accessories
        this.accessories = [];
        this.log.info('Finished initializing platform:', this.config.name);
        // When this event is fired it means Homebridge has restored all cached accessories from disk.
        // Dynamic Platform plugins should only register new accessories after this event was fired,
        // in order to ensure they weren't added to homebridge already. This event can also be used
        // to start discovery of new accessories.
        this.api.on('didFinishLaunching', () => {
            this.log.debug('Executed didFinishLaunching callback');
            // run the method to discover / register your devices as accessories
            this.discoverDevices();
        });
    }
    /**
     * This function is invoked when homebridge restores cached accessories from disk at startup.
     * It should be used to setup event handlers for characteristics and update respective values.
     */
    configureAccessory(accessory) {
        this.log.info('Loading accessory from cache:', accessory.displayName);
        // add the restored accessory to the accessories cache so we can track if it has already been registered
        this.accessories.push(accessory);
    }
    /**
     * This is an example method showing how to register discovered accessories.
     * Accessories must only be registered once, previously created accessories
     * must not be registered again to prevent "duplicate UUID" errors.
     */
    discoverDevices() {
        this.accessories.forEach(accessory => {
            this.removeAccessory(accessory);
        });
        const devices = this.config.devices;
        for (const device of devices) {
            this.addAccessory(device);
        }
    }
    getUid(device) {
        return this.api.hap.uuid.generate(`jappyjan-wled_${device.topic.split('/').join('_')}`);
    }
    addAccessory(device) {
        // the accessory does not yet exist, so we need to create it
        this.log.info('Adding new accessory - topic: ', device.topic);
        // create a new accessory
        const accessory = new this.api.platformAccessory(device.topic, this.getUid(device), 31 /* TELEVISION */);
        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context.device = device;
        // create the accessory handler for the newly create accessory
        // this is imported from `platformAccessory.ts`
        new TVAccessory_1.TVAccessory(this, accessory);
        new LightAccessory_1.LightAccessory(this, accessory);
        // link the accessory to your platform
        this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
    }
    removeAccessory(accessory) {
        this.api.unregisterPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
        this.log.info('Removing existing accessory from cache:', accessory.displayName);
    }
}
exports.Plugin = Plugin;
//# sourceMappingURL=Plugin.js.map