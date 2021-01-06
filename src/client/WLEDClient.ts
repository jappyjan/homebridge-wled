import {Logger} from 'homebridge';
import {Client, connect as MQTTConnect} from 'mqtt';
import {parseStringPromise as parseXml} from 'xml2js';
import {EventEmitter} from 'events';
import {effects} from './effects';
import {hsb2rgb, rgbToHex} from '../utils/colors';

interface WLEDClientOptions {
  topic: string;
  logger: Logger;
  host: string;
  port: number;
}

interface WLEDClientEvents {
  'change:displayName': (newName: string) => void;
  'change:fx': (newFx: string) => void;
  'change:brightness': (newBrightness: number) => void;
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
  private colorState = {
    hue: 0,
    saturation: 0,
    brightness: 0,
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
    }

    const newBrightness = message.vs.ac[0];
    if (newBrightness) {
      this.emit('change:brightness', newBrightness);
    }

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
    this.colorState.brightness = brightness;
    this.updateColor();
  }

  public setHue(value: number) {
    this.colorState.hue = value;
    this.updateColor();
  }

  public setSaturation(value: number) {
    this.colorState.saturation = value;
    this.updateColor();
  }

  private updateColor() {
    const rgbw = hsb2rgb(this.colorState.hue, this.colorState.saturation, this.colorState.brightness);
    const hexColor = rgbToHex(rgbw);

    this.log.info(`Setting color to: rgbw: ${JSON.stringify(rgbw)}, hex: ${hexColor}`);

    this.client.publish(this.topic + '/col', hexColor);
  }
}
