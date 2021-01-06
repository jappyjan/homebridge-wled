"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LightAccessory = void 0;
const WLEDClient_1 = require("../client/WLEDClient");
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class LightAccessory {
    constructor(platform, accessory) {
        this.platform = platform;
        this.accessory = accessory;
        accessory.category = 5 /* LIGHTBULB */;
        this.device = accessory.context.device;
        this.log = {
            ...platform.log,
            prefix: platform.log.prefix + '--light-' + LightAccessory.instanceCount,
        };
        LightAccessory.instanceCount++;
        this.client = new WLEDClient_1.WLEDClient({
            host: this.platform.config.host,
            port: this.platform.config.port,
            topic: this.device.topic,
            logger: this.log,
        });
        this.initializeService();
    }
    initializeService() {
        this.log.info('Adding Lightbulb service');
        this.lightService =
            this.accessory.getService(this.platform.Service.Lightbulb) ||
                this.accessory.addService(this.platform.Service.Lightbulb);
        this.lightService.setCharacteristic(this.platform.Characteristic.Name, 'WLED (CLR/BRI)');
        this.lightService
            .getCharacteristic(this.platform.Characteristic.On)
            .on('set', this.setPower.bind(this));
        this.lightService
            .getCharacteristic(this.platform.Characteristic.Brightness)
            .on('set', this.setBrightness.bind(this));
        this.lightService.getCharacteristic(this.platform.Characteristic.Hue)
            .on('set', this.setHue.bind(this));
        this.lightService.getCharacteristic(this.platform.Characteristic.Saturation)
            .on('set', this.setSaturation.bind(this));
    }
    setPower(value, callback) {
        this.log.info(`Set Power to ${value} via Lightbulb`);
        this.client.setPower(value);
        callback(null);
    }
    setBrightness(value, callback) {
        const brightness = Math.round((value / 100) * 255);
        this.log.info(`Set Brightness to ${brightness} via Lightbulb`);
        this.client.setBrightness(brightness);
        callback(null);
    }
    setHue(value, callback) {
        /*
        const WLED_MAX_HUE = 65535;
        const HOMEKIT_MAX_HUE = 359;
    
        let hue = Math.round(((value as number) / HOMEKIT_MAX_HUE) * WLED_MAX_HUE);
        if (hue > WLED_MAX_HUE) {
          hue = WLED_MAX_HUE;
        }
    
        this.client.setHue(hue);
         */
        this.client.setHue(value);
        callback(null);
    }
    setSaturation(value, callback) {
        this.client.setSaturation(value);
        callback(null);
    }
}
exports.LightAccessory = LightAccessory;
LightAccessory.instanceCount = 0;
//# sourceMappingURL=LightAccessory.js.map