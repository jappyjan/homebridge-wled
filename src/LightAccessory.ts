import {
  Categories,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  PlatformAccessory,
  Service,
} from 'homebridge';

import {Plugin} from './Plugin';
import Axios from 'axios';

export interface Device {
  'name': string;
  'ip': string;
}

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class LightAccessory {
  private lightService?: Service;
  private readonly device: Device;
  private readonly baseURL: string;
  private currentState: { [key: string]: any } = {};

  constructor(
    private readonly platform: Plugin,
    private readonly accessory: PlatformAccessory,
  ) {
    accessory.category = Categories.LIGHTBULB;

    this.device = accessory.context.device;

    this.platform.log.info(`Adding Lightbulb Device ${this.device.name}`, this.device);

    this.baseURL = `http://${this.device.ip}/json`;

    this.platform.log.info(`Lightbulb Device with ${this.device.name} Base URL: ${this.baseURL}`);

    this.initializeService();
    this.loadCurrentState();
  }

  loadCurrentState() {
    let fetchCount = 0;
    const fetch = () => {
      fetchCount++;

      return Axios.get(this.baseURL)
        .then(response => {
          if (!response.data || !response.data.effects) {
            if (fetchCount < 10) {
              return new Promise((resolve, reject) => {
                setTimeout(() => {
                  fetch().then((resolve)).catch((e) => reject(e));
                }, 500);
              });
            }

            this.platform.log.error('Could not load effect names', response);
            return;
          }

          this.currentState = response.data;

          this.refreshCharacteristicValuesBasedOnCurrentState();
        });
    };

    return fetch().catch(e => this.platform.log.error('Could not refresh state', e));
  }

  refreshCharacteristicValuesBasedOnCurrentState() {
    this.lightService!
      .setCharacteristic(this.platform.Characteristic.Name, this.currentState.info.name)
      .setCharacteristic(this.platform.Characteristic.On, this.currentState.state.on ? 1 : 0);
  }

  initializeService() {
    this.platform.log.info('Adding Lightbulb service');

    this.lightService =
      this.accessory.getService(this.platform.Service.Lightbulb) ||
      this.accessory.addService(this.platform.Service.Lightbulb);

    this.lightService.setCharacteristic(this.platform.Characteristic.Name, this.device.name);

    this.lightService
      .getCharacteristic(this.platform.Characteristic.On)
      .on('set', this.setPower.bind(this))
      .on('get', this.getPower.bind(this));

    this.lightService
      .getCharacteristic(this.platform.Characteristic.Brightness)
      .on('set', this.setBrightness.bind(this))
      .on('get', this.getBrightness.bind(this));
  }

  async setPower(
    value: CharacteristicValue,
    callback: CharacteristicSetCallback,
  ): Promise<void> {
    this.platform.log.info('setPower called with: ' + value);

    callback(null);
    try {
      await Axios.post(this.baseURL, {
        on: value === 1,
      });
    } catch (e) {
      this.platform.log.error(e);
    }
  }

  async getPower(
    callback: CharacteristicGetCallback,
  ): Promise<void> {
    this.platform.log.info('getPower called');

    await this.loadCurrentState();
    callback(null, this.currentState.state.on ? 1 : 0);
  }

  async setBrightness(
    value: CharacteristicValue,
    callback: CharacteristicSetCallback,
  ): Promise<void> {
    const brightness = Math.round((value as number / 100) * 255);
    this.platform.log.info(`setVolume called with: ${value}, calculated bri: ${brightness}`);

    try {
      await Axios.post(this.baseURL, {
        bri: brightness,
      });
      callback(null);
    } catch (e) {
      this.platform.log.error(e);
      callback(e);
    }
  }

  async getBrightness(
    callback: CharacteristicGetCallback,
  ): Promise<void> {
    this.platform.log.info('getBrightness called');

    await this.loadCurrentState();
    callback(null, Math.round((this.currentState.state.bri / 255) * 100));
  }
}
