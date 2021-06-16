import { Device } from 'homey';
import fetch from 'node-fetch';
import { IDeviceCapabilities, IPlayerState } from './interfaces';

class MyDevice extends Device implements IDeviceCapabilities {
  private _poller: any;
  private poller(func: () => Promise<void>): NodeJS.Timeout {
    if (!this._poller) {
      this._poller == setInterval(func, 2000);
    }
    return this._poller as NodeJS.Timeout;
  }

  private clearPoller(): void {
    if (this._poller) {
      clearInterval(this._poller);
    }
  }

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('MyDevice has been initialized');

    await this.pinger();

    this.poller(() => this.getPlayerState());
    // await this.getPlayerState();

    this.registerCapabilityListener("speaker_prev", async (value: any) => {
      this.log("speaker_prev", value);
      await this.previous();
    });

    this.registerCapabilityListener("speaker_next", async (value: any) => {
      this.log("speaker_next", value);
      await this.next();
    });

    this.registerCapabilityListener("speaker_playing", async (value: any) => {
      this.log("speaker_playing", value);
      await (value ? this.play() : this.pause()).catch(this.error);
    });

    this.registerCapabilityListener("volume_set", async (value: any) => {
      this.log("volume_set", value);
      await this.setVolume(value * 100).catch(this.error);
    });

    this.registerCapabilityListener("volume_down", async (value: any) => {
      this.log("volume_down", value);
      await this.decreaseVolume().catch(this.error);
    });

    this.registerCapabilityListener("volume_mute", async (value: any) => {
      this.log("volume_mute", value);
      await (value ? this.mute() : this.unmute()).catch(this.error);
    });

    this.registerCapabilityListener("volume_up", async (value: any) => {
      this.log("volume_up", value);
      await this.increaseVolume().catch(this.error);
    });

    this.registerCapabilityListener("speaker_shuffle", async (value: any) => {
      this.log("speaker_shuffle", value);
      await this.shuffle(value);
    });

    // this.registerCapabilityListener("speaker_repeat", async (value: any) => {
    //   this.log("speaker_repeat", value);// track playlist none
    //   await this.repeat(value !== "none");
    // });
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('MyDevice has been added');
  }

  private _ip: string = "http://192.168.178.26";
  private get ip(): string {
    return this._ip;
  }
  private set ip(value: string) {
    this._ip = value;
  }

  async pinger(): Promise<void> {
    this.log(`pinger`);
    const response = await fetch(`${this.ip}/api/v1/ping`);
    if (!response.ok) {
      throw new Error(this.homey.__("pingError"));
    }
  }

  async getPlayerState(): Promise<void> {
    const response = await fetch(`${this.ip}/api/v1/getState`);
    if (!response.ok) {
      throw new Error(this.homey.__("volumioPlayerError"));
    }
    const state = await response.json();
    await this.setPlayerState(state as IPlayerState);
  }

  async isPlaying(): Promise<boolean> {
    const response = await fetch(`${this.ip}/api/v1/getState`);
    if (!response.ok) {
      throw new Error(this.homey.__("volumioPlayerError"));
    }
    const { status } = await response.json();
    return status === "playing";
  }

  private async apiCommandCall(routeArguments: string): Promise<void> {
    const response = await fetch(`${this.ip}/api/v1/commands/?${routeArguments}`);
    if (!response.ok) {
      throw new Error(this.homey.__("volumioPlayerError"));
    }
  }

  play(): Promise<void> {
    return this.apiCommandCall("cmd=play");
  }

  toggle(): Promise<void> {
    return this.apiCommandCall("cmd=toggle");
  }

  pause(): Promise<void> {
    return this.apiCommandCall("cmd=pause");
  }

  stop(): Promise<void> {
    return this.apiCommandCall("cmd=stop");
  }

  next(): Promise<void> {
    return this.apiCommandCall("cmd=next").then(_ => this.getPlayerState());
  }

  previous(): Promise<void> {
    return this.apiCommandCall("cmd=prev").then(_ => this.getPlayerState());
  }

  shuffle(value: boolean): Promise<void> {
    return this.apiCommandCall(`cmd=random&value=${value}`);
  }

  repeat(value: boolean): Promise<void> {
    return this.apiCommandCall(`cmd=repeat&value=${value}`);
  }

  // ** Seek ** seek N(N is the time in seconds that the playback will keep)
  // ** Random ** setRandom({ "value": true | false })
  // ** repeat ** setRepeat({ "value": true | false })

  // search {value:'query'}

  setVolume(value: number): Promise<void> {
    return this.apiCommandCall(`cmd=volume&volume=${value}`);
  }

  increaseVolume(): Promise<void> {
    return this.apiCommandCall(`cmd=volume&volume=plus`);
  }

  decreaseVolume(): Promise<void> {
    return this.apiCommandCall(`cmd=volume&volume=minus`);
  }

  async mute(): Promise<void> {
    return this.apiCommandCall(`cmd=volume&volume=mute`);
  }

  async unmute(): Promise<void> {
    return this.apiCommandCall(`cmd=volume&volume=unmute`);
  }

  private async setPlayerState(state: IPlayerState): Promise<void> {
    // this.log(`setPlayerState ${JSON.stringify(state)}`);
    await this.setCapabilityValue("speaker_artist", state.artist).catch(this.error);
    await this.setCapabilityValue("speaker_album", state.album).catch(this.error);
    await this.setCapabilityValue("speaker_track", state.title).catch(this.error);
    await this.setCapabilityValue("speaker_duration", state.duration).catch(this.error);
    await this.setCapabilityValue("speaker_position", state.position).catch(this.error);
    await this.setCapabilityValue("volume_set", state.volume / 100).catch(this.error);
    await this.setCapabilityValue("speaker_shuffle", state.random).catch(this.error);
    // await this.setCapabilityValue("speaker_repeat", state.repeatSingle ? "track" : state.repeat ? "playlist" : "none").catch(this.error);
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({ oldSettings: { }, newSettings: { }, changedKeys: { } }): Promise<string | void> {
    this.log('MyDevice settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name: string) {
    this.log('MyDevice was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('MyDevice has been deleted');
    this.clearPoller();
  }
}

module.exports = MyDevice;
