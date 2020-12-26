"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TVAccessory = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class TVAccessory {
    constructor(platform, accessory) {
        this.platform = platform;
        this.accessory = accessory;
        accessory.category = 26 /* SPEAKER */;
        this.device = accessory.context.device;
        this.platform.log.info(`Adding Television Device ${this.device.name}`, this.device);
        this.baseURL = `http://${this.device.ip}/json`;
        this.platform.log.info(`Television Device with ${this.device.name} Base URL: ${this.baseURL}`);
        this.initializeService();
    }
    initializeService() {
        this.platform.log.info('Adding Television service');
        this.televisionService =
            this.accessory.getService(this.platform.Service.Television) ||
                this.accessory.addService(this.platform.Service.Television);
        this.televisionService.setCharacteristic(this.platform.Characteristic.ConfiguredName, this.device.name);
        axios_1.default.get(this.baseURL).then(response => {
            this.televisionService
                .setCharacteristic(this.platform.Characteristic.ConfiguredName, response.data.info.name);
        }).catch(e => this.platform.log.error('Failed to set Name and initial active state', e));
        this.televisionService.setCharacteristic(this.platform.Characteristic.SleepDiscoveryMode, this.platform.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);
        this.configureInputSources();
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
        const wantedEffects = (this.device.effects || '').split(',')
            .map(id => Number(id.trim()))
            .filter(id => !Number.isNaN(id));
        const setEffectNames = (effects) => {
            effects.forEach((effectName, index) => {
                if (!wantedEffects.includes(index)) {
                    return;
                }
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
exports.TVAccessory = TVAccessory;
//# sourceMappingURL=TVAccessory.js.map