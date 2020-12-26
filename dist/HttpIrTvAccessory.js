"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpIrTvAccessory = void 0;
const SocketClient_1 = __importDefault(require("./SocketClient"));
var SOCKET_COMMANDS;
(function (SOCKET_COMMANDS) {
    SOCKET_COMMANDS["RECEIVING_POWER_STATE"] = "POWER_STATE;";
})(SOCKET_COMMANDS || (SOCKET_COMMANDS = {}));
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class HttpIrTvAccessory {
    constructor(platform, accessory) {
        this.platform = platform;
        this.accessory = accessory;
        this.configuredRemoteKeys = [];
        this.state = {
            mute: false,
        };
        this.platform.log.debug('Inside Accessory class');
        accessory.category = 31 /* TELEVISION */;
        this.device = accessory.context.device;
        this.socketClient = new SocketClient_1.default(this.device.ip, this.device.port, this.device.codeType, this.platform.log);
        this.televisionService = this.accessory.getService(this.platform.Service.Television) ||
            this.accessory.addService(this.platform.Service.Television, 'Television', 'Television');
        this.configureMetaCharacteristics();
        this.televisionService.getCharacteristic(this.platform.Characteristic.Active)
            .on('set', this.onPowerTogglePress.bind(this));
        this.configureRemoteKeys();
        if (this.device.codes.volume.up && this.device.codes.volume.down) {
            this.configureVolumeKeys();
        }
        this.televisionService
            .getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
            .on('set', (newValue, callback) => {
            this.platform.log.debug('set Active Identifier => setNewValue: ' + newValue);
            callback(null);
        });
        this.televisionService.updateCharacteristic(this.platform.Characteristic.Active, false);
        this.socketClient.addMessageListener('POWER_STATE', (msg) => {
            this.platform.log.debug('received message');
            this.platform.log.debug(msg);
            if (!msg.startsWith(SOCKET_COMMANDS.RECEIVING_POWER_STATE)) {
                return;
            }
            const [, stateString] = msg.split(';');
            const state = stateString === 'on';
            this.platform.log.debug('Updating Television Active State:', state);
            this.televisionService.updateCharacteristic(this.platform.Characteristic.Active, state);
        });
    }
    configureMetaCharacteristics() {
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, this.platform.config['tv-manufacturer'] || 'Default-Manufacturer')
            .setCharacteristic(this.platform.Characteristic.Model, this.platform.config['tv-model'] || 'Default-Model')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, this.platform.config['tv-serial'] || 'Default-Serial');
        this.televisionService
            .setCharacteristic(this.platform.Characteristic.ActiveIdentifier, 1);
        this.televisionService.setCharacteristic(this.platform.Characteristic.ConfiguredName, this.accessory.context.device.name);
        this.televisionService.setCharacteristic(this.platform.Characteristic.SleepDiscoveryMode, this.platform.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);
        this.televisionService.setCharacteristic(this.platform.Characteristic.Name, this.accessory.context.device.name);
    }
    configureRemoteKeys() {
        this.televisionService.getCharacteristic(this.platform.Characteristic.RemoteKey)
            .on('set', this.onRemoteKeyPress.bind(this));
        const configuredRemoteKeyStrings = this.device.codes.keys ? Object.keys(this.device.codes.keys) : [];
        configuredRemoteKeyStrings.forEach(key => {
            this.platform.log.debug('Configuring Remote-Key: ' + key);
            this.configuredRemoteKeys.push(this.platform.Characteristic.RemoteKey[key]);
        });
    }
    configureVolumeKeys() {
        this.platform.log.debug('Adding speaker service');
        this.speakerService =
            this.accessory.getService(this.platform.Service.TelevisionSpeaker) ||
                this.accessory.addService(this.platform.Service.TelevisionSpeaker);
        // set the volume control type
        this.speakerService
            .setCharacteristic(this.platform.Characteristic.Active, this.platform.Characteristic.Active.ACTIVE)
            .setCharacteristic(this.platform.Characteristic.VolumeControlType, this.platform.Characteristic.VolumeControlType.ABSOLUTE);
        if (this.device.codes.volume.mute) {
            this.speakerService
                .getCharacteristic(this.platform.Characteristic.Mute)
                .on('set', this.setMute.bind(this))
                .on('get', this.getMute.bind(this));
        }
        this.speakerService
            .getCharacteristic(this.platform.Characteristic.VolumeSelector)
            .on('set', this.setVolume.bind(this));
        // Link the service
        this.televisionService.addLinkedService(this.speakerService);
    }
    setMute(value, callback) {
        this.platform.log.debug('setMute called with: ' + value);
        this.socketClient.sendCommand('IR-SEND', this.device.codes.volume.mute)
            .catch((e) => this.platform.log.error(e));
        this.state.mute = !this.state.mute;
        callback(null);
    }
    getMute(callback) {
        this.platform.log.debug('getMute called');
        callback(null, this.state.mute);
    }
    setVolume(value, callback) {
        this.platform.log.debug('setVolume called with: ' + value);
        let command = this.device.codes.volume.up;
        if (value === this.platform.Characteristic.VolumeSelector.DECREMENT) {
            command = this.device.codes.volume.down;
        }
        this.socketClient.sendCommand('IR-SEND', command)
            .catch((e) => this.platform.log.error(e));
        this.platform.log.debug('Sending code: ' + command);
        callback(null);
    }
    async onPowerTogglePress(value, callback) {
        this.platform.log.debug('Set Characteristic On ->', value);
        this.socketClient.sendCommand('IR-SEND', this.device.codes.power)
            .then(() => {
            callback(null);
        })
            .catch((e) => {
            this.platform.log.error(e);
            callback(e);
        });
    }
    onRemoteKeyPress(value, callback) {
        this.platform.log.debug('Remote Key Pressed ' + value);
        if (!this.device.codes.keys ||
            !this.configuredRemoteKeys.find((item) => item === value)) {
            this.platform.log.error(`Remote Key ${value} not configured in this.configuredRemoteKeys`);
            this.platform.log.debug(JSON.stringify(this.configuredRemoteKeys, null, 4));
            callback(new Error(`Remote-Key "${value}" not configured`));
            return;
        }
        let command = '';
        Object.keys(this.platform.Characteristic.RemoteKey).forEach((keyOfRemoteKeyObject) => {
            if (this.platform.Characteristic.RemoteKey[keyOfRemoteKeyObject] === value) {
                this.platform.log.debug(`Remote-Key ${value} maps to ${keyOfRemoteKeyObject}`);
                command = this.device.codes.keys[keyOfRemoteKeyObject];
            }
        });
        if (!command) {
            this.platform.log.debug(JSON.stringify(Object.keys(this.platform.Characteristic.RemoteKey), null, 4));
            this.platform.log.error(`Remote Key ${value} not configured`);
            callback(new Error(`Remote-Key ${value} not configured`));
            return;
        }
        this.socketClient.sendCommand('IR-SEND', command)
            .catch((e) => this.platform.log.error(e));
        callback(null);
    }
}
exports.HttpIrTvAccessory = HttpIrTvAccessory;
//# sourceMappingURL=HttpIrTvAccessory.js.map