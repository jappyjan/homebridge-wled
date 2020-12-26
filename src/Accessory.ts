import {
  Categories,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  PlatformAccessory,
  Service,
} from 'homebridge';

import {Plugin} from './Plugin';
import Axios, {AxiosInstance} from 'axios';

export interface Device {
  'name': string;
  'ip': string;
  'port': number;
}

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class Accessory {
  private speakerService?: Service;
  private device: Device;
  private axios: AxiosInstance;

  private state = {
    mute: false,
  };

  constructor(
    private readonly platform: Plugin,
    private readonly accessory: PlatformAccessory,
  ) {
    accessory.category = Categories.LIGHTBULB;

    this.device = accessory.context.device;

    this.axios = Axios.create({
      baseURL: `${this.device.ip}:${this.device.port}/json`,
    });

    this.configureSpeakerService();
  }

  configureSpeakerService() {
    this.platform.log.debug('Adding speaker service');
    this.speakerService =
      this.accessory.getService(this.platform.Service.Speaker) ||
      this.accessory.addService(this.platform.Service.Speaker);

    // set the volume control type
    this.speakerService
      .setCharacteristic(
        this.platform.Characteristic.Active,
        this.platform.Characteristic.Active.ACTIVE,
      )
      .setCharacteristic(
        this.platform.Characteristic.VolumeControlType,
        this.platform.Characteristic.VolumeControlType.ABSOLUTE,
      );

    this.speakerService
      .getCharacteristic(this.platform.Characteristic.Active)
      .on('set', this.setPower.bind(this))
      .on('get', this.getPower.bind(this));

    this.speakerService
      .getCharacteristic(this.platform.Characteristic.VolumeSelector)
      .on('set', this.setVolume.bind(this));
  }

  async setPower(
    value: CharacteristicValue,
    callback: CharacteristicSetCallback,
  ): Promise<void> {
    this.platform.log.debug('setPower called with: ' + value);

    try {
      await this.axios.post('', {
        on: value,
      });

      this.state.mute = !this.state.mute;
      callback(null);
    } catch (e) {
      this.platform.log.debug(e);
      callback(e);
    }
  }

  async getPower(
    callback: CharacteristicGetCallback,
  ): Promise<void> {
    this.platform.log.debug('getPower called');

    try {
      const response = await this.axios.get('');
      callback(null, response.data.state.on);
    } catch (e) {
      this.platform.log.debug(e);
      callback(e);
    }
  }

  async setVolume(
    value: CharacteristicValue,
    callback: CharacteristicSetCallback,
  ): Promise<void> {
    const brightness = 255 * (100 / (value as number));
    this.platform.log.debug(`setVolume called with: ${value}, calculated bri: ${brightness}`);

    try {
      await this.axios.post('', {
        bri: brightness,
      });
      callback(null);
    } catch (e) {
      this.platform.log.debug(e);
      callback(e);
    }
  }
}
