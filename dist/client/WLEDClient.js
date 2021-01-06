"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WLEDClient = void 0;
const mqtt_1 = require("mqtt");
const xml2js_1 = require("xml2js");
const events_1 = require("events");
const effects_1 = require("./effects");
const colors_1 = require("../utils/colors");
class WLEDClient extends events_1.EventEmitter {
    constructor(props) {
        super();
        this.colorState = {
            hue: 0,
            saturation: 0,
            brightness: 0,
        };
        this.log = props.logger;
        this.topic = props.topic;
        this.log.debug(`connecting to MQTT broker. mqtt://${props.host}:${props.port}`);
        this.client = mqtt_1.connect('mqtt://' + props.host, {
            port: props.port,
        });
        this.log.debug(`subscribing to MQTT Topic ${props.topic}/g`);
        this.client.subscribe(props.topic + '/g');
        this.log.debug(`subscribing to MQTT Topic ${props.topic}/c`);
        this.client.subscribe(props.topic + '/c');
        this.log.debug(`subscribing to MQTT Topic ${props.topic}/v`);
        this.client.subscribe(props.topic + '/v');
        this.client.on('connect', () => {
            this.log.debug('connected to MQTT broker!');
        });
        this.client.on('message', async (topic, payload) => {
            const message = payload.toString();
            if (topic !== (props.topic + '/v')) {
                return;
            }
            this.log.debug('received MQTT message for /v topic');
            await this.handleApiResponseMessage(message);
        });
    }
    async handleApiResponseMessage(xml) {
        const message = await xml2js_1.parseStringPromise(xml);
        const newDisplayName = message.vs.ds[0];
        if (newDisplayName) {
            this.emit('change:displayName', newDisplayName);
        }
        const newFxIndex = message.vs.fx[0];
        const newFx = effects_1.effects[newFxIndex];
        if (newFx) {
            this.emit('change:fx', newFx);
        }
        const newBrightness = message.vs.ac[0];
        if (newBrightness) {
            this.emit('change:brightness', newBrightness);
            this.emit('change:power', newBrightness !== 0);
        }
        // const [newRed, newGreen, newBlue] = message.vs.cl;
        // this.colorState = rgb2Hsl(newRed, newGreen, newBlue);
        // this.emit('change:hue', this.colorState.hue);
        // this.emit('change:saturation', this.colorState.saturation);
        // this.log.debug('api change', JSON.stringify(message, null, 4));
    }
    setPower(on) {
        this.client.publish(this.topic, on ? 'ON' : 'OFF');
    }
    setEffect(effectIndex) {
        this.log.info(`setting Effect to ${effectIndex}`);
        this.client.publish(this.topic + '/api', 'FX=' + effectIndex);
    }
    setBrightness(brightness) {
        this.colorState.brightness = brightness;
        this.updateColor();
    }
    setHue(value) {
        this.colorState.hue = value;
        this.updateColor();
    }
    setSaturation(value) {
        this.colorState.saturation = value;
        this.updateColor();
    }
    updateColor() {
        const rgbw = colors_1.hsv2rgb(this.colorState.hue, this.colorState.saturation, this.colorState.brightness);
        const hexColor = colors_1.rgbToHex(rgbw);
        this.log.info(`Setting color to: rgbw: ${JSON.stringify(rgbw)}, hex: ${hexColor}`);
        this.client.publish(this.topic + '/col', hexColor);
    }
}
exports.WLEDClient = WLEDClient;
//# sourceMappingURL=WLEDClient.js.map