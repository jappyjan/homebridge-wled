import Axios from 'axios';
import {Logger} from 'homebridge';

export default class WLEDClient {
  public currentState: { [key: string]: any } = {};
  private readonly baseURL: string;
  private readonly log: Logger;
  public onStateChange: ((state: { [key: string]: any }) => any) | null = null;

  constructor(ip: string, logger: Logger) {
    this.log = logger;
    this.baseURL = `http://${ip}/json`;
    this.loadCurrentState();
  }

  public loadCurrentState() {
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

  public async setPower(on: boolean): Promise<null | Error> {
    try {
      await Axios.post(this.baseURL, {
        on,
      });
      return null;
    } catch (e) {
      this.log.error(e);
      return e;
    }
  }

  public async setBrightness(bri: number): Promise<null | Error> {
    try {
      await Axios.post(this.baseURL, {
        bri,
      });
      return null;
    } catch (e) {
      this.log.error(e);
      return e;
    }
  }

  public async setEffect(
    effectIndex: number,
  ): Promise<null | Error> {
    this.log.info(`Setting Effect to ${effectIndex}`);

    try {
      const response = await Axios.get(this.baseURL);

      const segConfigs = response.data.state.seg.map(() => {
        return {
          fx: effectIndex,
        };
      });

      await Axios.post(this.baseURL, {
        seg: segConfigs,
      });

      return null;
    } catch (e) {
      this.log.error(e);

      return e;
    }
  }
}
