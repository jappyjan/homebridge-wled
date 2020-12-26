import { CharacteristicGetCallback, CharacteristicSetCallback, CharacteristicValue, PlatformAccessory } from 'homebridge';
import { HttpIrTvPlugin } from './HttpIrTvPlugin';
export interface TelevisionDevice {
    'name': string;
    'tv-manufacturer': string;
    'tv-model': string;
    'tv-serial': string;
    'ip': string;
    'port': number;
    'codeType': string;
    'codes': {
        'power': string;
        'volume': {
            'up': string;
            'down': string;
            'mute': string;
        };
        'keys': {
            'REWIND': string;
            'FAST_FORWARD': string;
            'NEXT_TRACK': string;
            'PREVIOUS_TRACK': string;
            'ARROW_UP': string;
            'ARROW_DOWN': string;
            'ARROW_LEFT': string;
            'ARROW_RIGHT': string;
            'SELECT': string;
            'BACK': string;
            'EXIT': string;
            'PLAY_PAUSE': string;
            'INFORMATION': string;
        };
    };
}
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class HttpIrTvAccessory {
    private readonly platform;
    private readonly accessory;
    private readonly televisionService;
    private speakerService?;
    private configuredRemoteKeys;
    private readonly device;
    private readonly socketClient;
    private state;
    constructor(platform: HttpIrTvPlugin, accessory: PlatformAccessory);
    configureMetaCharacteristics(): void;
    configureRemoteKeys(): void;
    configureVolumeKeys(): void;
    setMute(value: CharacteristicValue, callback: CharacteristicSetCallback): void;
    getMute(callback: CharacteristicGetCallback): void;
    setVolume(value: CharacteristicValue, callback: CharacteristicSetCallback): void;
    onPowerTogglePress(value: CharacteristicValue, callback: CharacteristicSetCallback): Promise<void>;
    onRemoteKeyPress(value: CharacteristicValue, callback: CharacteristicSetCallback): void;
}
//# sourceMappingURL=HttpIrTvAccessory.d.ts.map