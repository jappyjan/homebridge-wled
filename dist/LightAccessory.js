"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LightAccessory = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class LightAccessory {
    constructor(platform, accessory) {
        this.platform = platform;
        this.accessory = accessory;
        this.currentState = {};
        accessory.category = 5 /* LIGHTBULB */;
        this.device = accessory.context.device;
        this.platform.log.info(`Adding Lightbulb Device ${this.device.name}`, this.device);
        this.baseURL = `http://${this.device.ip}/json`;
        this.platform.log.info(`Lightbulb Device with ${this.device.name} Base URL: ${this.baseURL}`);
        this.initializeService();
        this.loadCurrentState();
    }
    loadCurrentState() {
        let fetchCount = 0;
        const fetch = () => {
            fetchCount++;
            return axios_1.default.get(this.baseURL)
                .then(response => {
                if (!response.data || !response.data.effects) {
                    if (fetchCount < 10) {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => {
                                fetch().then((resolve)).catch((e) => reject(e));
                            }, 500);
                        });
                    }
                    this.platform.log.error('Could not load effect names', response);
                    return;
                }
                this.currentState = response.data;
                this.refreshCharacteristicValuesBasedOnCurrentState();
            });
        };
        return fetch().catch(e => this.platform.log.error('Could not refresh state', e));
    }
    refreshCharacteristicValuesBasedOnCurrentState() {
        this.lightService
            .setCharacteristic(this.platform.Characteristic.Name, this.currentState.info.name)
            .setCharacteristic(this.platform.Characteristic.On, this.currentState.state.on ? 1 : 0);
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
    async setPower(value, callback) {
        this.platform.log.info('setPower called with: ' + value);
        callback(null);
        try {
            await axios_1.default.post(this.baseURL, {
                on: value === 1,
            });
        }
        catch (e) {
            this.platform.log.error(e);
        }
    }
    async getPower(callback) {
        this.platform.log.info('getPower called');
        await this.loadCurrentState();
        callback(null, this.currentState.state.on ? 1 : 0);
    }
    async setBrightness(value, callback) {
        const brightness = Math.round((value / 100) * 255);
        this.platform.log.info(`setVolume called with: ${value}, calculated bri: ${brightness}`);
        try {
            await axios_1.default.post(this.baseURL, {
                bri: brightness,
            });
            callback(null);
        }
        catch (e) {
            this.platform.log.error(e);
            callback(e);
        }
    }
    async getBrightness(callback) {
        this.platform.log.info('getBrightness called');
        await this.loadCurrentState();
        callback(null, Math.round((this.currentState.state.bri / 255) * 100));
    }
}
exports.LightAccessory = LightAccessory;
//# sourceMappingURL=LightAccessory.js.map