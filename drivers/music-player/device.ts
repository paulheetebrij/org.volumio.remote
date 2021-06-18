import Homey from 'homey'; // eslint-disable-line
import fetch from 'node-fetch'; // eslint-disable-line

interface IPlayerState {
  status: string;
  position: number;
  title: string;
  artist: string;
  album: string;
  albumart: string;
  uri: string;
  trackType: string;
  seek: number;
  duration: number;
  random: boolean;
  repeat: boolean;
  repeatSingle: boolean;
  volume: number;
  mute: boolean;
  stream: boolean;
  updatedb: boolean;
  volatile: boolean;
  service: string;
}

class VolumioMusicPlayerDevice extends Homey.Device {
  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('Volumio music player device init');
    this.log('Name:', this.getName());
    this.log('Class:', this.getClass());

    try {
      await this.pinger();
    } catch (err) {
      this.error(JSON.stringify(err));
      this.setUnavailable(this.homey.__('volumioDeviceUnavailable'));
    }
    await this.subscribeStatus();

    this.poller(() =>
      this.getPlayerState().then(
        () => this.setAvailable(),
        (err) => {
          this.error(JSON.stringify(err));
          this.setUnavailable(this.homey.__('volumioDeviceUnavailable'));
        }
      )
    );

    this.registerCapabilityListener('speaker_prev', async (value: any) => {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      this.log('speaker_prev', value);
      await this.previous();
    });

    this.registerCapabilityListener('speaker_next', async (value: any) => {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      this.log('speaker_next', value);
      await this.next();
    });

    this.registerCapabilityListener('speaker_playing', async (value: any) => {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      this.log('speaker_playing', value);
      await (value ? this.play() : this.pause()).catch(this.error);
    });

    this.registerCapabilityListener('volume_set', async (value: any) => {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      this.log('volume_set', value);
      await this.setVolume(value * 100).catch(this.error);
    });

    this.registerCapabilityListener('volume_down', async (value: any) => {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      this.log('volume_down', value);
      await this.decreaseVolume().catch(this.error);
    });

    this.registerCapabilityListener('volume_mute', async (value: any) => {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      this.log('volume_mute', value);
      await (value ? this.mute() : this.unmute()).catch(this.error);
    });

    this.registerCapabilityListener('volume_up', async (value: any) => {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      this.log('volume_up', value);
      await this.increaseVolume().catch(this.error);
    });

    this.registerCapabilityListener('speaker_shuffle', async (value: any) => {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      this.log('speaker_shuffle', value);
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
    this.log('Volumio music player has been added');
    await this.subscribeStatus();
  }

  private get ip(): string {
    return `http://${this.getStoreValue('address')}`;
  }

  async pinger(): Promise<void> {
    const response = await fetch(`${this.ip}/api/v1/ping`);
    if (!response.ok) {
      this.log(JSON.stringify(response));
      throw new Error(this.homey.__('pingError'));
    }
  }

  async getPlayerState(): Promise<void> {
    const response = await fetch(`${this.ip}/api/v1/getState`);
    if (!response.ok) {
      this.log(JSON.stringify(response));
      throw new Error(this.homey.__('volumioPlayerError'));
    }
    const state = await response.json();
    await this.setPlayerState(state as IPlayerState);
  }

  async isPlaying(): Promise<boolean> {
    const response = await fetch(`${this.ip}/api/v1/getState`);
    if (!response.ok) {
      this.log(JSON.stringify(response));
      throw new Error(this.homey.__('volumioPlayerError'));
    }
    const { status } = await response.json();
    return status === 'playing';
  }

  private async apiCommandCall(routeArguments: string): Promise<void> {
    const response = await fetch(`${this.ip}/api/v1/commands/?${routeArguments}`);
    if (!response.ok) {
      this.log(JSON.stringify(response));
      throw new Error(this.homey.__('volumioPlayerError'));
    }
  }

  async play(): Promise<void> {
    await this.apiCommandCall('cmd=play');
  }

  async toggle(): Promise<void> {
    await this.apiCommandCall('cmd=toggle');
  }

  async pause(): Promise<void> {
    await this.apiCommandCall('cmd=pause');
  }

  async stop(): Promise<void> {
    await this.apiCommandCall('cmd=stop');
  }

  async next(): Promise<void> {
    await this.apiCommandCall('cmd=next').then(() => this.getPlayerState());
  }

  async previous(): Promise<void> {
    await this.apiCommandCall('cmd=prev').then(() => this.getPlayerState());
  }

  async shuffle(value: boolean): Promise<void> {
    await this.apiCommandCall(`cmd=random&value=${value}`);
  }

  async repeat(value: boolean): Promise<void> {
    await this.apiCommandCall(`cmd=repeat&value=${value}`);
  }

  // ** Seek ** seek N(N is the time in seconds that the playback will keep)
  // ** Random ** setRandom({ "value": true | false })
  // ** repeat ** setRepeat({ "value": true | false })

  // search {value:'query'}

  async setVolume(value: number): Promise<void> {
    await this.apiCommandCall(`cmd=volume&volume=${value}`);
  }

  async increaseVolume(): Promise<void> {
    await this.apiCommandCall('cmd=volume&volume=plus');
  }

  async decreaseVolume(): Promise<void> {
    await this.apiCommandCall('cmd=volume&volume=minus');
  }

  async mute(): Promise<void> {
    await this.apiCommandCall('cmd=volume&volume=mute');
  }

  async unmute(): Promise<void> {
    await this.apiCommandCall('cmd=volume&volume=unmute');
  }

  async playList(title: string): Promise<void> {
    await this.apiCommandCall(`cmd=playplaylist&name=${title}`);
  }

  private async setPlayerState(state: IPlayerState): Promise<void> {
    await this.setCapabilityValue('speaker_artist', state.artist).catch(this.error);
    await this.setCapabilityValue('speaker_album', state.album).catch(this.error);
    await this.setCapabilityValue('speaker_track', state.title).catch(this.error);
    await this.setCapabilityValue('speaker_duration', state.duration).catch(this.error);
    await this.setCapabilityValue('speaker_position', state.position).catch(this.error);
    await this.setCapabilityValue('volume_set', state.volume / 100).catch(this.error);
    await this.setCapabilityValue('speaker_shuffle', state.random).catch(this.error);
    await this.setAlbumArtwork(state.albumart);

    // await this.setCapabilityValue("speaker_repeat", state.repeatSingle ?
    // "track" : state.repeat ? "playlist" : "none").catch (this.error);
  }

  private async setAlbumArtwork(imageUrl?: string): Promise<void> {
    // const loadImage = async (image: any, url: string) => { // eslint-disable-line
    //   await image.setStream(async (stream: any) => { // eslint-disable-line
    //     const response = await fetch(url);
    //     if (!response.ok) {
    //       this.log(JSON.stringify(response));
    //       throw new Error(this.homey.__('volumioPlayerError'));
    //     }
    //     return response.body.pipe(stream);
    //   });
    // };
    // try {
    //   const fullImageUrl = `${this.ip}${!imageUrl ||
    // imageUrl.includes('undefined') ? 'albumart' : imageUrl}`;
    //   const image = await this.getImage();
    //   if (this.fullImageUrl !== fullImageUrl) {
    //     await loadImage(image, fullImageUrl);
    //     await image.update();
    //     await this.setAlbumArtImage(image);
    //     this.fullImageUrl = fullImageUrl;
    //   } else {
    //     await loadImage(image, fullImageUrl);
    //     await image.update();
    //     await this.setAlbumArtImage(image);
    //   }
    // } catch (err) {
    //   this.error(JSON.stringify(err));
    // }
  }

  private async getImage(): Promise<Homey.Image> {
    if (!this._image) {
      this._image = await this.homey.images.createImage();
    }
    return this._image;
  }

  private set fullImageUrl(value: string) {
    this._fullImageUrl = value;
  }

  private get fullImageUrl(): string {
    return this._fullImageUrl;
  }

  private _image: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  private _fullImageUrl: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  private async subscribeStatus(): Promise<void> {
    const { id } = this.getData();
    const homeyAddress = await this.homey.cloud.getLocalAddress();
    const homeyUrl = homeyAddress.split(':');
    const query = `?url=http://${homeyUrl[0]}/api/app/com.volumio.remote/${id}${homeyUrl.length === 2 ? ':' + homeyUrl[1] : ''}`;
    this.log(`subscribe status ${query}`);
    // const response = await fetch(`${this.ip}/api/v1/pushNotificationUrls${query}`,
    //   {
    //     method: 'POST',
    //     body: JSON.stringify({ url: `http://${homeyUrl[0]}/api/app/com.volumio.remote/${id}${homeyUrl.length === 2 ? ':' + homeyUrl[1] : ''}` })
    //   });
    // if (!response.ok) {
    //   this.log(JSON.stringify(response));
    //   throw new Error(this.homey.__('volumioPlayerError'));
    // }
  }

  private async unSubscribeStatus(): Promise<void> {
    this.log(`subscribe status ${this.getName()}`);
    const { id } = this.getData();
    const homeyAddress = await this.homey.cloud.getLocalAddress();
    const homeyUrl = homeyAddress.split(':');
    const query = `?url=http://${homeyUrl[0]}/api/app/com.volumio.remote/${id}${homeyUrl.length === 2 ? ':' + homeyUrl[1] : ''}`;
    // const response = await fetch(`${this.ip}/api/v1/pushNotificationUrls${query}`,
    //   {
    //     method: 'DELETE',
    //   });
    // if (!response.ok) {
    //   this.log(JSON.stringify(response));
    //   throw new Error(this.homey.__('volumioPlayerError'));
    // }
  }

  private _poller: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  private poller(pollingFunction: () => Promise<void>): NodeJS.Timeout {
    if (!this._poller) {
      this._poller === setInterval(pollingFunction, 2000); // eslint-disable-line
    }
    return this._poller as NodeJS.Timeout;
  }

  private clearPoller(): void {
    if (this._poller) {
      clearInterval(this._poller);
    }
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */

  /* eslint-disable no-empty-pattern */
  async onSettings({ oldSettings: { }, newSettings: { }, changedKeys: { } }): Promise<string | void> {
    this.log('Volumio music player settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name: string) {
    // eslint-disable-line @typescript-eslint/no-unused-vars
    this.log(`Volumio music player was renamed: ${name}`);
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('Volumio music player has been deleted');
    const image = await this.getImage();
    await image.unregister();
    await this.unSubscribeStatus();
    this.clearPoller();
  }
}

module.exports = VolumioMusicPlayerDevice;
