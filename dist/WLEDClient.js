"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
class WLEDClient {
    constructor(ip, logger) {
        this.currentState = {};
        this.onStateChange = null;
        this.log = logger;
        this.baseURL = `http://${ip}/json`;
        this.loadCurrentState();
    }
    loadCurrentState() {
        let fetchCount = 0;
        const fetch = () => {
            fetchCount++;
            return axios_1.default.get(this.baseURL)
                .then(response => {
                if (!response.data || !response.data.effects) {
                    if (fetchCount < 10) {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => {
                                fetch().then((resolve)).catch((e) => reject(e));
                            }, 500);
                        });
                    }
                    this.log.error('Could not load effect names', response);
                    return;
                }
                this.currentState = response.data;
                if (typeof this.onStateChange === 'function') {
                    this.onStateChange(this.currentState);
                }
            });
        };
        return fetch().catch(e => this.log.error('Could not refresh state', e));
    }
    async setPower(on) {
        try {
            await axios_1.default.post(this.baseURL, {
                on,
            });
            return null;
        }
        catch (e) {
            this.log.error(e);
            return e;
        }
    }
    async setBrightness(bri) {
        try {
            await axios_1.default.post(this.baseURL, {
                bri,
            });
            return null;
        }
        catch (e) {
            this.log.error(e);
            return e;
        }
    }
    async setEffect(effectIndex) {
        this.log.info(`Setting Effect to ${effectIndex}`);
        try {
            const response = await axios_1.default.get(this.baseURL);
            const segConfigs = response.data.state.seg.map(() => {
                return {
                    fx: effectIndex,
                };
            });
            await axios_1.default.post(this.baseURL, {
                seg: segConfigs,
            });
            return null;
        }
        catch (e) {
            this.log.error(e);
            return e;
        }
    }
}
exports.default = WLEDClient;
//# sourceMappingURL=WLEDClient.js.map