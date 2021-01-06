import {Categories, CharacteristicSetCallback, CharacteristicValue, Logger, PlatformAccessory, Service} from 'homebridge';

import {Plugin} from '../plugin/Plugin';
import {WLEDClient} from '../client/WLEDClient';
import {Device} from '../Device';
import {effects} from '../client/effects';

const INPUT_SOURCES_LIMIT = 45;

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class TVAccessory {
  private televisionService?: Service;
  private readonly device: Device;
  private readonly client: WLEDClient;
  private readonly availableInputServices: Service[] = [];
  private readonly log: Logger;
  private static instanceCount = 0;
  private isSetting = {
    power: false,
  };

  constructor(
    private readonly platform: Plugin,
    private readonly accessory: PlatformAccessory,
  ) {
    accessory.category = Categories.SPEAKER;
    this.device = accessory.context.device;

    this.log = {
      ...platform.log,
      prefix: platform.log.prefix + '--tv-' + TVAccessory.instanceCount,
    } as Logger;
    TVAccessory.instanceCount++;

    this.client = new WLEDClient({
      host: this.platform.config.host as string,
      port: this.platform.config.port as number,
      topic: this.device.topic,
      logger: this.log,
    });

    this.initializeService();
  }

  private initializeService() {
    this.televisionService =
      this.accessory.getService(this.platform.Service.Television) ||
      this.accessory.addService(this.platform.Service.Television);

    this.televisionService
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, 'WLED (FX)');

    this.client.on('change:displayName', name => {
      this.televisionService!.setCharacteristic(this.platform.Characteristic.ConfiguredName, `${name} (FX)`);
    });

    this.televisionService.setCharacteristic(
      this.platform.Characteristic.SleepDiscoveryMode,
      this.platform.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE,
    );

    this.televisionService
      .getCharacteristic(this.platform.Characteristic.Active)
      .on('set', this.setPower.bind(this));

    this.client.on('change:power', isOn => {
      this.isSetting.power = true;
      setTimeout(() => this.isSetting.power = false, 500);
      this.televisionService!.setCharacteristic(this.platform.Characteristic.Active, isOn);
    });

    this.configureInputSources();
  }

  private configureInputSources() {
    if (!this.televisionService) {
      return;
    }

    // handle input source changes
    this.televisionService.getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
      .on('set', this.setInputSource.bind(this));

    this.client.on('change:fx', fx => {
      this.televisionService?.setCharacteristic(this.platform.Characteristic.ActiveIdentifier, fx);
    });

    // create dummy inputs
    for (let i = 0; i < INPUT_SOURCES_LIMIT; i++) {
      const inputId = i;

      const dummyInputSource = new this.platform.Service.InputSource('dummy', `input_${inputId}`);
      dummyInputSource
        .setCharacteristic(this.platform.Characteristic.Identifier, inputId)
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

  private setEffectNames() {
    // noinspection SuspiciousTypeOfGuard
    if (typeof this.device.effects !== 'string') {
      this.device.effects = '';
    }

    const wantedEffects = this.device.effects.split(',')
      .filter(s => s.trim() !== '')
      .map(id => Number(id.trim()))
      .filter(id => !Number.isNaN(id));

    this.log.info(`wanted effects: ${wantedEffects.join(', ')}`);

    effects.forEach((effectName, index) => {
      if (wantedEffects.length > 0 && !wantedEffects.includes(index)) {
        return;
      }

      const service = this.availableInputServices.shift();

      if (!service) {
        this.log.warn(`Cannot map Effect ${effectName} (${index}), MAX of ${INPUT_SOURCES_LIMIT} reached`);
        return;
      }

      this.log.info(`Adding Effect ${effectName} as Input Source`);

      service
        .setCharacteristic(this.platform.Characteristic.ConfiguredName, effectName)
        .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
        .setCharacteristic(
          this.platform.Characteristic.CurrentVisibilityState,
          this.platform.Characteristic.CurrentVisibilityState.SHOWN,
        );
    });
  }

  private setInputSource(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    this.log.info(`Set Effect to ${value} via TV`);
    this.client.setEffect(value as number);
    callback(null);
  }

  private setPower(
    value: CharacteristicValue,
    callback: CharacteristicSetCallback,
  ): void {
    if (this.isSetting.power) {
      return;
    }
    this.log.info(`Set Power to ${value} via TV`);
    this.client.setPower(value === 1);
    callback(null);
  }
}
