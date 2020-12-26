"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Accessory = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class Accessory {
    constructor(platform, accessory) {
        this.platform = platform;
        this.accessory = accessory;
        accessory.category = 26 /* SPEAKER */;
        this.device = accessory.context.device;
        this.platform.log.info(`Adding Device ${this.device.name}`, this.device);
        this.baseURL = `http://${this.device.ip}/json`;
        this.platform.log.info(`Device ${this.device.name} Base URL: ${this.baseURL}`);
        this.configureTelevisionService();
    }
    configureTelevisionService() {
        this.platform.log.info('Adding Televion service');
        this.televisionService =
            this.accessory.getService(this.platform.Service.Television) ||
                this.accessory.addService(this.platform.Service.Television);
        this.televisionService.setCharacteristic(this.platform.Characteristic.ConfiguredName, this.device.name);
        this.televisionService.setCharacteristic(this.platform.Characteristic.SleepDiscoveryMode, this.platform.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);
        this.configureInputSources();
        this.televisionService
            .getCharacteristic(this.platform.Characteristic.Active)
            .on('set', this.setPower.bind(this))
            .on('get', this.getPower.bind(this));
        this.configureSpeakerService();
    }
    configureInputSources() {
        if (!this.televisionService) {
            return;
        }
        this.televisionService.setCharacteristic(this.platform.Characteristic.ActiveIdentifier, 1);
        for (let effectIndex = 0; effectIndex < 100; effectIndex++) {
            const inputSourceService = this.accessory.addService(this.platform.Service.InputSource, `effect-${effectIndex}`, `Effekt ${effectIndex}`);
            inputSourceService
                .setCharacteristic(this.platform.Characteristic.Identifier, 1)
                .setCharacteristic(this.platform.Characteristic.ConfiguredName, `Effekt ${effectIndex}`)
                .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(this.platform.Characteristic.InputSourceType, this.platform.Characteristic.InputSourceType.HDMI);
            this.televisionService.addLinkedService(inputSourceService); // link to tv service
        }
        // handle input source changes
        this.televisionService.getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
            .on('set', (newValue, callback) => {
            // the value will be the value you set for the Identifier Characteristic
            // on the Input Source service that was selected - see input sources below.
            this.platform.log.info('set Active Identifier => setNewValue: ' + newValue);
            callback(null);
        });
    }
    configureSpeakerService() {
        this.platform.log.info('Adding speaker service');
        this.speakerService =
            this.accessory.getService(this.platform.Service.TelevisionSpeaker) ||
                this.accessory.addService(this.platform.Service.TelevisionSpeaker);
        // set the volume control type
        this.speakerService
            .setCharacteristic(this.platform.Characteristic.VolumeControlType, this.platform.Characteristic.VolumeControlType.ABSOLUTE);
        this.speakerService
            .getCharacteristic(this.platform.Characteristic.VolumeSelector)
            .on('set', this.setVolume.bind(this));
        this.televisionService.addLinkedService(this.speakerService);
    }
    async setPower(value, callback) {
        this.platform.log.info('setPower called with: ' + value);
        try {
            await axios_1.default.post(this.baseURL, {
                on: value,
            });
            callback(null);
        }
        catch (e) {
            this.platform.log.error(e);
            callback(e);
        }
    }
    async getPower(callback) {
        this.platform.log.info('getPower called');
        try {
            const response = await axios_1.default.get(this.baseURL);
            callback(null, response.data.state.on);
        }
        catch (e) {
            this.platform.log.error(e);
            callback(e);
        }
    }
    async setVolume(value, callback) {
        const brightness = 255 * (100 / value);
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
}
exports.Accessory = Accessory;
//# sourceMappingURL=Accessory.js.map