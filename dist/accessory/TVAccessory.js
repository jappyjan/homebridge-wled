"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TVAccessory = void 0;
const WLEDClient_1 = require("../client/WLEDClient");
const effects_1 = require("../client/effects");
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
        accessory.category = 26 /* SPEAKER */;
        this.device = accessory.context.device;
        this.log = {
            ...platform.log,
            prefix: platform.log.prefix + '--tv-' + TVAccessory.instanceCount,
        };
        TVAccessory.instanceCount++;
        this.client = new WLEDClient_1.WLEDClient({
            host: this.platform.config.host,
            port: this.platform.config.port,
            topic: this.device.topic,
            logger: this.log,
        });
        this.initializeService();
    }
    initializeService() {
        this.televisionService =
            this.accessory.getService(this.platform.Service.Television) ||
                this.accessory.addService(this.platform.Service.Television);
        this.televisionService
            .getCharacteristic(this.platform.Characteristic.ConfiguredName)
            .updateValue('WLED (FX)');
        this.client.on('change:displayName', name => {
            this.televisionService
                .getCharacteristic(this.platform.Characteristic.ConfiguredName)
                .updateValue(`${name} (FX)`);
        });
        this.televisionService
            .getCharacteristic(this.platform.Characteristic.SleepDiscoveryMode)
            .updateValue(this.platform.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);
        this.televisionService
            .getCharacteristic(this.platform.Characteristic.Active)
            .on('set', this.setPower.bind(this));
        this.client.on('change:power', isOn => {
            this.televisionService
                .getCharacteristic(this.platform.Characteristic.Active)
                .updateValue(isOn);
        });
        this.configureInputSources();
    }
    configureInputSources() {
        if (!this.televisionService) {
            return;
        }
        // handle input source changes
        this.televisionService.getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
            .on('set', this.setInputSource.bind(this));
        this.client.on('change:fx', fx => {
            this.televisionService
                .getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
                .updateValue(fx);
        });
        // create dummy inputs
        for (let i = 0; i < INPUT_SOURCES_LIMIT; i++) {
            const inputId = i;
            const dummyInputSource = new this.platform.Service.InputSource('dummy', `input_${inputId}`);
            dummyInputSource
                .setCharacteristic(this.platform.Characteristic.Identifier, inputId * 1000)
                .setCharacteristic(this.platform.Characteristic.ConfiguredName, 'dummy')
                .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.NOT_CONFIGURED)
                .setCharacteristic(this.platform.Characteristic.TargetVisibilityState, this.platform.Characteristic.TargetVisibilityState.SHOWN)
                .setCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
            // add the new dummy input source service to the tv accessory
            this.televisionService.addLinkedService(dummyInputSource);
            this.accessory.addService(dummyInputSource);
            this.availableInputServices.push(dummyInputSource);
        }
        this.setEffectNames();
    }
    setEffectNames() {
        // noinspection SuspiciousTypeOfGuard
        if (typeof this.device.effects !== 'string') {
            this.device.effects = '';
        }
        const wantedEffects = this.device.effects.split(',')
            .filter(s => s.trim() !== '')
            .map(id => Number(id.trim()))
            .filter(id => !Number.isNaN(id));
        this.log.info(`wanted effects: ${wantedEffects.join(', ')}`);
        effects_1.effects.forEach((effectName, effectIndex) => {
            if (wantedEffects.length > 0 && !wantedEffects.includes(effectIndex)) {
                return;
            }
            const service = this.availableInputServices.shift();
            if (!service) {
                this.log.warn(`Cannot map Effect ${effectName} (${effectIndex}), MAX of ${INPUT_SOURCES_LIMIT} reached`);
                return;
            }
            this.log.info(`Adding Effect ${effectName} as Input Source`);
            service
                .setCharacteristic(this.platform.Characteristic.ConfiguredName, effectName)
                .setCharacteristic(this.platform.Characteristic.Identifier, effectIndex)
                .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.platform.Characteristic.CurrentVisibilityState.SHOWN);
        });
    }
    setInputSource(value, callback) {
        this.log.info(`Set Effect to ${value} via TV`);
        this.client.setEffect(value);
        this.televisionService
            .getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
            .updateValue(value);
        callback(null);
    }
    setPower(value, callback) {
        this.log.info(`Set Power to ${value} via TV`);
        this.client.setPower(value === 1);
        this.televisionService
            .getCharacteristic(this.platform.Characteristic.Active)
            .updateValue(value);
        callback(null);
    }
}
exports.TVAccessory = TVAccessory;
TVAccessory.instanceCount = 0;
//# sourceMappingURL=TVAccessory.js.map