import { Logger } from 'homebridge';
export default class WLEDClient {
    currentState: {
        [key: string]: any;
    };
    private readonly baseURL;
    private readonly log;
    onStateChange: ((state: {
        [key: string]: any;
    }) => any) | null;
    constructor(ip: string, logger: Logger);
    loadCurrentState(): Promise<unknown>;
    private emitStateChange;
    setPower(on: boolean): Promise<null | Error>;
    setBrightness(bri: number): Promise<null | Error>;
    setEffect(effectIndex: number): Promise<null | Error>;
}
//# sourceMappingURL=WLEDClient.d.ts.map