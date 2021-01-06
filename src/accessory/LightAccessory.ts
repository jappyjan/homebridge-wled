import {Categories, CharacteristicSetCallback, CharacteristicValue, Logger, PlatformAccessory, Service} from 'homebridge';

import {Plugin} from '../plugin/Plugin';
import {WLEDClient} from '../client/WLEDClient';
import {Device} from '../Device';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class LightAccessory {
  private lightService?: Service;
  private readonly device: Device;
  private client: WLEDClient;
  private readonly log: Logger;
  private static instanceCount = 0;
  private isSetting = {
    power: false,
    brightness: false,
    hue: false,
    saturation: false,
  };

  constructor(
    private readonly platform: Plugin,
    private readonly accessory: PlatformAccessory,
  ) {
    accessory.category = Categories.LIGHTBULB;

    this.device = accessory.context.device;
    this.log = {
      ...platform.log,
      prefix: platform.log.prefix + '--light-' + LightAccessory.instanceCount,
    } as Logger;
    LightAccessory.instanceCount++;

    this.client = new WLEDClient({
      host: this.platform.config.host as string,
      port: this.platform.config.port as number,
      topic: this.device.topic,
      logger: this.log,
    });

    this.initializeService();

  }

  initializeService() {
    this.log.info('Adding Lightbulb service');

    this.lightService =
      this.accessory.getService(this.platform.Service.Lightbulb) ||
      this.accessory.addService(this.platform.Service.Lightbulb);

    this.lightService.setCharacteristic(this.platform.Characteristic.Name, 'WLED (CLR/BRI)');
    this.client.on('change:displayName', name => {
      this.lightService!.setCharacteristic(this.platform.Characteristic.Name, `${name} (CLR/BRI)`);
    });

    this.lightService
      .getCharacteristic(this.platform.Characteristic.On)
      .on('set', this.setPower.bind(this));

    this.client.on('change:power', isOn => {
      this.isSetting.power = true;
      setTimeout(() => this.isSetting.power = false, 500);
      this.lightService!.setCharacteristic(this.platform.Characteristic.On, isOn);
    });

    this.lightService
      .getCharacteristic(this.platform.Characteristic.Brightness)
      .on('set', this.setBrightness.bind(this));

    this.client.on('change:brightness', brightness => {
      this.isSetting.brightness = true;
      setTimeout(() => this.isSetting.brightness = false, 500);
      this.lightService!.setCharacteristic(this.platform.Characteristic.Brightness, brightness);
    });

    this.lightService.getCharacteristic(this.platform.Characteristic.Hue)
      .on('set', this.setHue.bind(this));

    this.client.on('change:hue', hue => {
      this.isSetting.hue = true;
      setTimeout(() => this.isSetting.hue = false, 500);
      this.lightService!.setCharacteristic(this.platform.Characteristic.Hue, hue);
    });

    this.lightService.getCharacteristic(this.platform.Characteristic.Saturation)
      .on('set', this.setSaturation.bind(this));

    this.client.on('change:saturation', saturation => {
      this.isSetting.saturation = true;
      setTimeout(() => this.isSetting.saturation = false, 500);
      this.lightService!.setCharacteristic(this.platform.Characteristic.Saturation, saturation);
    });
  }

  private setPower(
    value: CharacteristicValue,
    callback: CharacteristicSetCallback,
  ): void {
    if (this.isSetting.power) {
      return;
    }
    this.log.info(`Set Power to ${value} via Lightbulb`);
    this.client.setPower(value as boolean);
    callback(null);
  }

  private setBrightness(
    value: CharacteristicValue,
    callback: CharacteristicSetCallback,
  ): void {
    if (this.isSetting.brightness) {
      return;
    }

    const brightness = Math.round((value as number / 100) * 255);
    this.log.info(`Set Brightness to ${brightness} via Lightbulb`);
    this.client.setBrightness(brightness);
    callback(null);
  }

  private setHue(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    if (this.isSetting.hue) {
      return;
    }

    this.client.setHue(value as number);

    callback(null);
  }

  private setSaturation(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    if (this.isSetting.saturation) {
      return;
    }

    this.client.setSaturation(value as number);

    callback(null);
  }
}
