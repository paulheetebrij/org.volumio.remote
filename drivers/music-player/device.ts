import { Device } from 'homey';
import fetch from 'node-fetch';

interface IPlayerState {
  status: string,
  position: number,
  title: string,
  artist: string,
  album: string,
  albumart: string,
  uri: string,
  trackType: string,
  seek: number,
  duration: number,
  random: boolean,
  repeat: boolean,
  repeatSingle: boolean,
  volume: number,
  mute: boolean,
  stream: boolean,
  updatedb: boolean,
  volatile: boolean,
  service: string,
};

class MyDevice extends Device {
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
      await this.setVolume(value).catch(this.error);
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

    this.registerCapabilityListener("speaker_repeat", async (value: any) => {
      this.log("speaker_repeat", value);// track playlist none
      await this.repeat(value);
    });
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
      throw new Error(`Volumio request error`);
    }
    const state = await response;
    this.log(JSON.stringify(state));
  }

  async getPlayerState(): Promise<void> {
    const response = await fetch(`${this.ip}/api/v1/getState`);
    if (!response.ok) {
      throw new Error(`getPlayerState: Volumio request error`);
    }
    const state = await response.json();
    await this.setPlayerState(state as IPlayerState);
  }

  async play(): Promise<void> {
    await fetch(`${this.ip}/api/v1/commands/?cmd=play`);
  }

  async toggle(): Promise<void> {
    await fetch(`${this.ip}/api/v1/commands/?cmd=toggle`);
  }

  async pause(): Promise<void> {
    await fetch(`${this.ip}/api/v1/commands/?cmd=pause`);
  }

  async stop(): Promise<void> {
    await fetch(`${this.ip}/api/v1/commands/?cmd=stop`);
  }

  async next(): Promise<void> {
    await fetch(`${this.ip}/api/v1/commands/?cmd=next`);
    await this.getPlayerState();
  }

  async previous(): Promise<void> {
    await fetch(`${this.ip}/api/v1/commands/?cmd=prev`);
    await this.getPlayerState();
  }

  async shuffle(value: boolean): Promise<void> {
    await fetch(`${this.ip}/api/v1/commands/?cmd=random&value=${value}`);
  }

  async repeat(value: string): Promise<void> {
    await fetch(`${this.ip}/api/v1/commands/?cmd=random&random=${value !== "none"}`);
  }

  // ** Seek ** seek N(N is the time in seconds that the playback will keep)
  // ** Random ** setRandom({ "value": true | false })
  // ** repeat ** setRepeat({ "value": true | false })

  // search {value:'query'}

  async setVolume(value: number): Promise<void> {
    this.log(`setVolume ${value}`);
    await fetch(`${this.ip}/api/v1/commands/?cmd=volume&volume=${value * 100}`);
  }

  async increaseVolume(): Promise<void> {
    this.log(`increaseVolume`);
    await fetch(`${this.ip}/api/v1/commands/?cmd=volume&volume=plus`);
  }

  async decreaseVolume(): Promise<void> {
    this.log(`decreaseVolume`);
    await fetch(`${this.ip}/api/v1/commands/?cmd=volume&volume=minus`);
  }

  async mute(): Promise<void> {
    this.log(`mute`);
    await fetch(`${this.ip}/api/v1/commands/?cmd=volume&volume=mute`);
  }

  async unmute(): Promise<void> {
    this.log(`unmute`);
    await fetch(`${this.ip}/api/v1/commands/?cmd=volume&volume=unmute`);
  }

  async setPlayerState(state: {
    status: string,
    position: number,
    title: string,
    artist: string,
    album: string,
    albumart: string,
    uri: string,
    trackType: string,
    seek: number,
    duration: number,
    random: boolean,
    repeat: boolean,
    repeatSingle: boolean,
    volume: number,
    mute: boolean,
    stream: boolean,
    updatedb: boolean,
    volatile: boolean,
    service: string,
  }): Promise<void> {
    // this.log(`setPlayerState ${JSON.stringify(state)}`);
    await this.setCapabilityValue("speaker_artist", state.artist).catch(this.error);
    await this.setCapabilityValue("speaker_album", state.album).catch(this.error);
    await this.setCapabilityValue("speaker_track", state.title).catch(this.error);
    await this.setCapabilityValue("speaker_duration", state.duration).catch(this.error);
    await this.setCapabilityValue("speaker_position", state.position).catch(this.error);
    await this.setCapabilityValue("volume_set", state.volume / 100).catch(this.error);
    // await this.setCapabilityValue("speaker_shuffle", state.random).catch(this.error);
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
