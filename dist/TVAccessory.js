"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TVAccessory = void 0;
const WLEDClient_1 = __importDefault(require("./WLEDClient"));
const INPUT_SOURCES_LIMIT = 45;
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class TVAccessory {
    constructor(platform, accessory) {
        this.platform = platform;
        this.accessory = accessory;
        this.availableInputServices = [];
        this.effectNamesLoaded = false;
        accessory.category = 26 /* SPEAKER */;
        this.device = accessory.context.device;
        this.client = new WLEDClient_1.default(this.device.ip, this.platform.log);
        this.initializeService();
        this.client.onStateChange = this.onWLEDStateChange.bind(this);
    }
    onWLEDStateChange(currentState) {
        this.televisionService.setCharacteristic(this.platform.Characteristic.ConfiguredName, currentState.info.name + ' (FX)');
        this.televisionService.setCharacteristic(this.platform.Characteristic.ActiveIdentifier, currentState.state.seg[0].fx);
        this.televisionService.setCharacteristic(this.platform.Characteristic.Active, currentState.state.on ? 1 : 0);
        this.setEffectNames(this.client.currentState.effects);
    }
    initializeService() {
        this.televisionService =
            this.accessory.getService(this.platform.Service.Television) ||
                this.accessory.addService(this.platform.Service.Television);
        this.televisionService
            .setCharacteristic(this.platform.Characteristic.ConfiguredName, this.device.name);
        this.televisionService
            .getCharacteristic(this.platform.Characteristic.Active)
            .on('set', this.setPower.bind(this))
            .on('get', this.getPower.bind(this));
        this.televisionService.setCharacteristic(this.platform.Characteristic.SleepDiscoveryMode, this.platform.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);
        this.configureInputSources();
    }
    configureInputSources() {
        if (!this.televisionService) {
            return;
        }
        this.televisionService.setCharacteristic(this.platform.Characteristic.ActiveIdentifier, 1);
        // handle input source changes
        this.televisionService.getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
            .on('set', this.setInputSource.bind(this));
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
            this.availableInputServices.push(dummyInputSource);
        }
    }
    setEffectNames(effects) {
        if (this.effectNamesLoaded) {
            return;
        }
        const wantedEffects = (this.device.effects || '').split(',')
            .map(id => Number(id.trim()))
            .filter(id => !Number.isNaN(id));
        effects.forEach((effectName, index) => {
            if (!wantedEffects.includes(index)) {
                return;
            }
            const service = this.availableInputServices.shift();
            if (!service) {
                this.platform.log.error(`Cannot map Effect ${effectName} (${index}), MAX of ${INPUT_SOURCES_LIMIT} reached`);
                return;
            }
            service
                .setCharacteristic(this.platform.Characteristic.ConfiguredName, effectName)
                .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.platform.Characteristic.CurrentVisibilityState.SHOWN);
        });
    }
    async setPower(value, callback) {
        this.platform.log.info(`Set Power to ${value} via TV`);
        const result = await this.client.setPower(value === 1);
        callback(result);
    }
    async getPower(callback) {
        callback(null, this.client.currentState.state.on ? 1 : 0);
    }
    async setInputSource(value, callback) {
        this.platform.log.info(`Set Effect to ${value} via TV`);
        const result = await this.client.setEffect(value);
        callback(result);
    }
}
exports.TVAccessory = TVAccessory;
//# sourceMappingURL=TVAccessory.js.map