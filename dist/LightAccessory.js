"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LightAccessory = void 0;
const WLEDClient_1 = __importDefault(require("./WLEDClient"));
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
        this.initializeService();
        this.client = new WLEDClient_1.default(this.device.ip, this.platform.log);
        this.client.onStateChange = this.onWLEDStateChange.bind(this);
        this.client.loadCurrentState();
    }
    initializeService() {
        this.platform.log.info('Adding Lightbulb service');
        this.lightService =
            this.accessory.getService(this.platform.Service.Lightbulb) ||
                this.accessory.addService(this.platform.Service.Lightbulb);
        this.lightService.setCharacteristic(this.platform.Characteristic.Name, this.device.name);
        this.lightService
            .getCharacteristic(this.platform.Characteristic.On)
            .on('set', this.setPower.bind(this))
            .on('get', this.getPower.bind(this));
        this.lightService
            .getCharacteristic(this.platform.Characteristic.Brightness)
            .on('set', this.setBrightness.bind(this))
            .on('get', this.getBrightness.bind(this));
    }
    onWLEDStateChange(currentState) {
        this.lightService
            .setCharacteristic(this.platform.Characteristic.Name, currentState.info.name + ' (CLR/BRI)')
            .setCharacteristic(this.platform.Characteristic.On, currentState.state.on ? 1 : 0);
    }
    async setPower(value, callback) {
        this.platform.log.info(`Set Power to ${value} via Lightbulb`);
        const result = await this.client.setPower(value);
        callback(result);
    }
    async getPower(callback) {
        await this.client.loadCurrentState();
        callback(null, this.client.currentState.state.on ? 1 : 0);
    }
    async setBrightness(value, callback) {
        const brightness = Math.round((value / 100) * 255);
        this.platform.log.info(`Set Brightness to ${brightness} via Lightbulb`);
        const result = await this.client.setBrightness(brightness);
        callback(result);
    }
    async getBrightness(callback) {
        await this.client.loadCurrentState();
        callback(null, Math.round((this.client.currentState.state.bri / 255) * 100));
    }
}
exports.LightAccessory = LightAccessory;
//# sourceMappingURL=LightAccessory.js.map