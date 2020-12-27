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
  name: string;
  ip: string;
  effects: string;
}

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class TVAccessory {
  private televisionService?: Service;
  private readonly device: Device;
  private readonly client: WLEDClient;

  constructor(
    private readonly platform: Plugin,
    private readonly accessory: PlatformAccessory,
  ) {
    accessory.category = Categories.SPEAKER;
    this.device = accessory.context.device;

    this.client = new WLEDClient(this.device.ip, this.platform.log);

    this.initializeService();
    this.client.onStateChange = this.onWLEDStateChange.bind(this);
    this.client.loadCurrentState();
  }

  private onWLEDStateChange(currentState: any) {
    this.televisionService!.setCharacteristic(
      this.platform.Characteristic.ConfiguredName,
      currentState.info.name + ' (FX)',
    );

    this.televisionService!.setCharacteristic(
      this.platform.Characteristic.ActiveIdentifier,
      currentState.state.seg[0].fx,
    );

    this.televisionService!.setCharacteristic(
      this.platform.Characteristic.Active,
      currentState.state.on ? 1 : 0,
    );
  }

  private initializeService() {
    this.televisionService =
      this.accessory.getService(this.platform.Service.Television) ||
      this.accessory.addService(this.platform.Service.Television);

    this.televisionService
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, this.device.name);

    this.televisionService
      .getCharacteristic(this.platform.Characteristic.Active)
      .on('set', this.setPower.bind(this))
      .on('get', this.getPower.bind(this));

    this.televisionService.setCharacteristic(
      this.platform.Characteristic.SleepDiscoveryMode,
      this.platform.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE,
    );

    this.configureInputSources();
  }

  private configureInputSources() {
    if (!this.televisionService) {
      return;
    }

    this.televisionService.setCharacteristic(this.platform.Characteristic.ActiveIdentifier, 1);

    // handle input source changes
    this.televisionService.getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
      .on('set', this.setInputSource.bind(this));

    const INPUT_SOURCES_LIMIT = 45;
    const availableInputServices: Service[] = [];

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

      availableInputServices.push(dummyInputSource);
    }

    const wantedEffects = (this.device.effects || '').split(',')
      .map(id => Number(id.trim()))
      .filter(id => !Number.isNaN(id));

    const setEffectNames = (effects: string[]) => {
      effects.forEach((effectName, index) => {
        if (!wantedEffects.includes(index)) {
          return;
        }

        const service = availableInputServices.shift();

        if (!service) {
          this.platform.log.error(`Cannot map Effect ${effectName} (${index}), MAX of ${INPUT_SOURCES_LIMIT} reached`);
          return;
        }

        service
          .setCharacteristic(this.platform.Characteristic.ConfiguredName, effectName)
          .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
          .setCharacteristic(
            this.platform.Characteristic.CurrentVisibilityState,
            this.platform.Characteristic.CurrentVisibilityState.SHOWN,
          );
      });
    };

    this.client.loadCurrentState()
      .then(() => {
        setEffectNames(this.client.currentState.effects);
      });
  }

  async setPower(
    value: CharacteristicValue,
    callback: CharacteristicSetCallback,
  ): Promise<void> {
    this.platform.log.info(`Set Power to ${value} via TV`);
    const result = await this.client.setPower(value === 1);
    callback(result);
  }

  async getPower(
    callback: CharacteristicGetCallback,
  ): Promise<void> {
    await this.client.loadCurrentState();
    callback(null, this.client.currentState.state.on ? 1 : 0);
  }

  async setInputSource(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    this.platform.log.info(`Set Effect to ${value} via TV`);
    const result = await this.client.setEffect(value as number);
    callback(result);
  }
}
