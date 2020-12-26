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
        this.platform.log.info('Adding Television service');
        this.televisionService =
            this.accessory.getService(this.platform.Service.Television) ||
                this.accessory.addService(this.platform.Service.Television);
        this.televisionService.setCharacteristic(this.platform.Characteristic.ConfiguredName, this.device.name);
        axios_1.default.get(this.baseURL).then(response => {
            this.televisionService
                .setCharacteristic(this.platform.Characteristic.ConfiguredName, response.data.info.name)
                .setCharacteristic(this.platform.Characteristic.Active, response.data.state.on ? 1 : 0);
        }).catch(e => this.platform.log.error('Failed to set Name and initial active state', e));
        this.televisionService
            .getCharacteristic(this.platform.Characteristic.RemoteKey)
            .on('set', this.onRemoteKeyPress.bind(this));
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
        axios_1.default.get(this.baseURL).then(response => {
            this.televisionService.setCharacteristic(this.platform.Characteristic.ActiveIdentifier, response.data.state.seg[0].fx);
        }).catch(e => this.platform.log.error('Failed to set initial effect', e));
        // handle input source changes
        this.televisionService.getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
            .on('set', this.setEffect.bind(this));
        const INPUT_SOURCES_LIMIT = 45;
        const availableInputServices = [];
        // create dummy inputs
        for (let i = 0; i < INPUT_SOURCES_LIMIT; i++) {
            const inputId = i;
            const dummyInputSource = new this.platform.Service.InputSource('dummy', `input_${inputId}`);
            dummyInputSource
                .setCharacteristic(this.platform.Characteristic.Identifier, inputId)
                .setCharacteristic(this.platform.Characteristic.ConfiguredName, 'dummy')
                .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.NOT_CONFIGURED)
                .setCharacteristic(this.platform.Characteristic.TargetVisibilityState, this.platform.Characteristic.TargetVisibilityState.SHOWN)
                .setCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
            // add the new dummy input source service to the tv accessory
            this.televisionService.addLinkedService(dummyInputSource);
            this.accessory.addService(dummyInputSource);
            availableInputServices.push(dummyInputSource);
        }
        const setEffectNames = (effects) => {
            effects.forEach((effectName, index) => {
                const service = availableInputServices.shift();
                if (!service) {
                    this.platform.log.error(`Cannot map Effect ${effectName} (${index}), MAX of ${INPUT_SOURCES_LIMIT} reached`);
                    return;
                }
                service
                    .setCharacteristic(this.platform.Characteristic.ConfiguredName, effectName)
                    .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
                    .setCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.platform.Characteristic.CurrentVisibilityState.SHOWN);
            });
        };
        let fetchCount = 0;
        const fetchEffects = () => {
            fetchCount++;
            return axios_1.default.get(this.baseURL)
                .then(response => {
                if (!response.data || !response.data.effects) {
                    if (fetchCount < 10) {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => {
                                fetchEffects().then((resolve)).catch((e) => reject(e));
                            }, 500);
                        });
                    }
                    this.platform.log.error('Could not load effect names', response);
                    return [];
                }
                return response.data.effects;
            });
        };
        fetchEffects().then(effects => setEffectNames(effects));
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
            .on('set', this.onVolumeChange.bind(this));
        this.televisionService.addLinkedService(this.speakerService);
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
        try {
            const response = await axios_1.default.get(this.baseURL);
            callback(null, response.data.state.on);
        }
        catch (e) {
            this.platform.log.error(e);
            callback(e);
        }
    }
    async onVolumeChange(value, callback) {
        const brightness = value;
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
    async onRemoteKeyPress(remoteKey, callback) {
        callback(null);
    }
    async setEffect(value, callback) {
        this.platform.log.info(`Setting Effect to ${value}`);
        try {
            const response = await axios_1.default.get(this.baseURL);
            const segConfigs = response.data.state.seg.map(() => {
                return {
                    fx: value,
                };
            });
            await axios_1.default.post(this.baseURL, {
                seg: segConfigs,
            });
        }
        catch (e) {
            this.platform.log.error(e);
        }
        callback(null);
    }
}
exports.Accessory = Accessory;
//# sourceMappingURL=Accessory.js.map