import {API, Categories, Characteristic, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service} from 'homebridge';

import {PLATFORM_NAME, PLUGIN_NAME} from './settings';
import {TVAccessory, Device} from './TVAccessory';
import {LightAccessory} from './LightAccessory';

export class Plugin implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.info('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      this.log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {
    this.accessories.forEach(accessory => {
      this.removeAccessory(accessory);
    });

    const devices: Device[] = this.config.devices as Device[];
    for (const device of devices) {
      this.addAccessory(device);
    }
  }

  getUid(device: Device) {
    return this.api.hap.uuid.generate(
      `jappyjan-wled_${device.ip}_${device.name}`,
    );
  }

  addAccessory(device: Device) {
    // the accessory does not yet exist, so we need to create it
    this.log.info('Adding new accessory:', device.name);

    // create a new accessory
    const accessory = new this.api.platformAccessory(
      device.name,
      this.getUid(device),
      Categories.TELEVISION,
    );

    // store a copy of the device object in the `accessory.context`
    // the `context` property can be used to store any data about the accessory you may need
    accessory.context.device = device;

    // create the accessory handler for the newly create accessory
    // this is imported from `platformAccessory.ts`
    new TVAccessory(this, accessory);
    new LightAccessory(this, accessory);

    // link the accessory to your platform
    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
  }

  removeAccessory(accessory: PlatformAccessory) {
    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    this.log.info('Removing existing accessory from cache:', accessory.displayName);
  }
}
