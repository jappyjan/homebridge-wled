"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WLEDClient = void 0;
const mqtt_1 = require("mqtt");
const xml2js_1 = require("xml2js");
const events_1 = require("events");
class WLEDClient extends events_1.EventEmitter {
    constructor(props) {
        super();
        this.effectNames = [];
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
        const newFx = this.effectNames[newFxIndex];
        if (newFx) {
            this.emit('change:fx', newFx);
        }
        const newBrightness = message.vs.ac[0];
        if (newBrightness) {
            this.emit('change:brightness', newBrightness);
        }
        this.log.debug('api change', JSON.stringify(message, null, 4));
    }
    setPower(on) {
        try {
            this.client.publish(this.topic, on ? 'ON' : 'OFF');
            return null;
        }
        catch (e) {
            this.log.error(e);
            return e;
        }
    }
    setBrightness(bri) {
        this.client.publish(this.topic, bri.toString());
        return null;
    }
    setEffect(effectIndex) {
        this.log.info(`Setting Effect to ${effectIndex}`);
        return null;
        /*
            try {
              const response = await Axios.get(this.baseURL);
    
              const segConfigs = response.data.state.seg.map(() => {
                return {
                  fx: effectIndex,
                };
              });
    
              await Axios.post(this.baseURL, {
                seg: segConfigs,
              });
    
              this.currentState.state.seg = segConfigs;
              this.emitStateChange();
    
              return null;
            } catch (e) {
              this.log.error(e);
    
              return e;
            }*/
    }
}
exports.WLEDClient = WLEDClient;
//# sourceMappingURL=WLEDClient.js.map