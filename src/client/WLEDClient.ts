import {Logger} from 'homebridge';
import {Client, connect as MQTTConnect} from 'mqtt';
import {parseStringPromise as parseXml} from 'xml2js';
import {EventEmitter} from 'events';
import {effects} from './effects';
import {hsv2rgb, rgb2Hsl, rgbToHex} from '../utils/colors';

interface WLEDClientOptions {
  topic: string;
  logger: Logger;
  host: string;
  port: number;
}

interface WLEDClientEvents {
  'change:displayName': (newName: string) => void;
  'change:fx': (newFx: string) => void;
  'change:power': (isOn: boolean) => void;
  'change:brightness': (newBrightness: number) => void;
  'change:hue': (newHue: number) => void;
  'change:saturation': (newSaturation: number) => void;
}

export declare interface WLEDClient {
  on<U extends keyof WLEDClientEvents>(
    event: U, listener: WLEDClientEvents[U],
  ): this;

  emit<U extends keyof WLEDClientEvents>(
    event: U, ...args: Parameters<WLEDClientEvents[U]>
  ): boolean;
}

export class WLEDClient extends EventEmitter {
  private readonly client: Client;
  private readonly log: Logger;
  private readonly topic: string;
  private state = {
    hue: 0,
    saturation: 0,
    brightness: 0,
    fx: 0,
  };

  constructor(props: WLEDClientOptions) {
    super();
    this.log = props.logger;
    this.topic = props.topic;

    this.log.debug(`connecting to MQTT broker. mqtt://${props.host}:${props.port}`);
    this.client = MQTTConnect('mqtt://' + props.host, {
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

  private async handleApiResponseMessage(xml: string) {
    const message = await parseXml(xml);

    const newDisplayName = message.vs.ds[0];
    if (newDisplayName) {
      this.emit('change:displayName', newDisplayName);
    }

    const newFxIndex = message.vs.fx[0];
    const newFx = effects[newFxIndex];
    if (newFx) {
      this.emit('change:fx', newFx);
      this.state.fx = newFxIndex;
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

  public setPower(on: boolean) {
    this.client.publish(this.topic, on ? 'ON' : 'OFF');
  }

  public setEffect(
    effectIndex: number,
  ) {
    this.log.info(`setting Effect to ${effectIndex}`);

    this.client.publish(this.topic + '/api', 'FX=' + effectIndex);
  }

  public setBrightness(brightness: number) {
    this.state.brightness = brightness;
    this.updateColor();
    this.client.publish(this.topic, brightness.toString());
  }

  public setHue(value: number) {
    this.state.hue = value;
    this.updateColor();
  }

  public setSaturation(value: number) {
    this.state.saturation = value;
    this.updateColor();
  }

  private updateColor() {
    const rgbw = hsv2rgb(this.state.hue, this.state.saturation, this.state.brightness);
    const hexColor = rgbToHex(rgbw);

    this.log.info(`Setting color to: rgbw: ${JSON.stringify(rgbw)}, hex: ${hexColor}`);

    this.client.publish(this.topic + '/col', hexColor);
  }
}
