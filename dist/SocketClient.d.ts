import { Logger } from 'homebridge';
export default class SocketClient {
    private readonly sockeHost;
    private readonly socketPort;
    private readonly irCodeType;
    private readonly logger;
    private client;
    private connection;
    private listeners;
    constructor(sockeHost: string, socketPort: number, irCodeType: string, logger: Logger);
    private connect;
    addMessageListener(listenerId: string, callback: (msg: string) => unknown): void;
    removeMessageListener(listenerId: string): void;
    private handleMessage;
    sendCommand(command: string, payload?: string): Promise<unknown>;
}
//# sourceMappingURL=SocketClient.d.ts.map