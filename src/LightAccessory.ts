import {
  Categories,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  PlatformAccessory,
  Service,
} from 'homebridge';

import {Plugin} from './Plugin';
import WLEDClient from './WLEDClient';

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
  private client: WLEDClient;

  constructor(
    private readonly platform: Plugin,
    private readonly accessory: PlatformAccessory,
  ) {
    accessory.category = Categories.LIGHTBULB;

    this.device = accessory.context.device;

    this.initializeService();

    this.client = new WLEDClient(this.device.ip, this.platform.log);
    this.client.onStateChange = this.onWLEDStateChange.bind(this);
    this.client.loadCurrentState();
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

  onWLEDStateChange(currentState: any) {
    this.lightService!
      .setCharacteristic(this.platform.Characteristic.Name, currentState.info.name + ' (CLR/BRI)')
      .setCharacteristic(this.platform.Characteristic.On, currentState.state.on ? 1 : 0);
  }

  async setPower(
    value: CharacteristicValue,
    callback: CharacteristicSetCallback,
  ): Promise<void> {
    const result = await this.client.setPower(value === 1);
    callback(result);
  }

  async getPower(
    callback: CharacteristicGetCallback,
  ): Promise<void> {
    await this.client.loadCurrentState();
    callback(null, this.client.currentState.state.on ? 1 : 0);
  }

  async setBrightness(
    value: CharacteristicValue,
    callback: CharacteristicSetCallback,
  ): Promise<void> {
    const brightness = Math.round((value as number / 100) * 255);
    const result = await this.client.setBrightness(brightness);
    callback(result);
  }

  async getBrightness(
    callback: CharacteristicGetCallback,
  ): Promise<void> {
    await this.client.loadCurrentState();
    callback(null, Math.round((this.client.currentState.state.bri / 255) * 100));
  }
}
