"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LightAccessory = void 0;
const WLEDClient_1 = require("./WLEDClient");
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
        this.initializeService();
        this.client = new WLEDClient_1.WLEDClient({
            host: this.platform.config.host,
            port: this.platform.config.port,
            topic: this.device.topic,
            logger: this.log,
        });
    }
    initializeService() {
        this.log.info('Adding Lightbulb service');
        this.lightService =
            this.accessory.getService(this.platform.Service.Lightbulb) ||
                this.accessory.addService(this.platform.Service.Lightbulb);
        this.lightService.setCharacteristic(this.platform.Characteristic.Name, 'WLED (CLR/BRI)');
        this.lightService
            .getCharacteristic(this.platform.Characteristic.On)
            .on('set', this.setPower.bind(this))
            .on('get', this.getPower.bind(this));
        this.lightService
            .getCharacteristic(this.platform.Characteristic.Brightness)
            .on('set', this.setBrightness.bind(this))
            .on('get', this.getBrightness.bind(this));
    }
    setPower(value, callback) {
        let result;
        try {
            this.log.info(`Set Power to ${value} via Lightbulb`);
            result = this.client.setPower(value);
        }
        catch (e) {
            this.log.error(e);
            result = e;
        }
        callback(result);
    }
    getPower(callback) {
        callback(null, this.client.currentState.on ? 1 : 0);
    }
    setBrightness(value, callback) {
        let result;
        try {
            const brightness = Math.round((value / 100) * 255);
            this.log.info(`Set Brightness to ${brightness} via Lightbulb`);
            result = this.client.setBrightness(brightness);
        }
        catch (e) {
            result = e;
            this.log.error(e);
        }
        callback(result);
    }
    getBrightness(callback) {
        callback(null, Math.round((this.client.currentState.brightness / 255) * 100));
    }
}
exports.LightAccessory = LightAccessory;
LightAccessory.instanceCount = 0;
//# sourceMappingURL=LightAccessory.js.map