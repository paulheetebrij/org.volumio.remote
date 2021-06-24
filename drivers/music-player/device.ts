/* eslint-disable node/no-unsupported-features/es-syntax */
import Homey from 'homey'; // eslint-disable-line
import fetch from 'node-fetch'; // eslint-disable-line
import {
  ICollectionStats,
  IPlayerState,
  IQueueItem,
  ISearchResult,
  ISystemInfo,
  IVolumioMusicPlayerDevice,
  POLLING_INTERVAL
} from './interfaces'; // eslint-disable-line

class VolumioMusicPlayerDevice extends Homey.Device implements IVolumioMusicPlayerDevice {
  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('Volumio music player device init');
    this.log('Name:', this.getName());
    this.log('Class:', this.getClass());

    await this.refreshPlayerState({ firstTime: true });

    this.registerCapabilityListener('speaker_prev', async () => {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      await this.previous();
    });

    this.registerCapabilityListener('speaker_next', async () => {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      await this.next();
    });

    this.registerCapabilityListener('speaker_playing', async (value: boolean) => {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      await (value ? this.play() : this.pause()).catch(this.error);
    });

    this.registerCapabilityListener('volume_set', async (value: number) => {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      await this.setVolume(value * 100).catch(this.error);
    });

    this.registerCapabilityListener('volume_down', async () => {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      await this.decreaseVolume().catch(this.error);
    });

    this.registerCapabilityListener('volume_mute', async (value: boolean) => {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      await (value ? this.mute() : this.unmute()).catch(this.error);
    });

    this.registerCapabilityListener('volume_up', async () => {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      await this.increaseVolume().catch(this.error);
    });

    this.registerCapabilityListener('speaker_shuffle', async (value: boolean) => {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      await this.shuffle(value);
    });

    // Volumio REST API does not support repeat commands like: track playlist none
    // For that reason I have not implemented speaker_repeat capability
  }

  async refreshPlayerState(parameters: { firstTime?: boolean }): Promise<void> {
    if (this.notificationReceived) {
      this.notificationReceived = false;
    } else {
      try {
        const playerState = await this.getPlayerState();
        await this.setPlayerState(playerState).catch(this.error);
        if (parameters.firstTime === true) {
          await this.subscribeStatus();
        } else if (!this.getAvailable()) {
          await this.subscribeStatus();
          this.driver.emit('deviceOnline', { device: this });
          await this.setAvailable();
        }
      } catch (err) {
        this.error(err);
        if (this.getAvailable()) {
          this.driver.emit('deviceOffline', { device: this });
          this.setUnavailable(this.homey.__('volumioDeviceUnavailable'));
        }
      }
    }
    setTimeout(() => this.refreshPlayerState({}).catch(this.error), POLLING_INTERVAL);
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('Volumio music player has been added');
    await this.subscribeStatus();
  }

  private get ip4Address(): string {
    return `http://${this.getStoreValue('address')}`;
  }

  private async getPlayerState(): Promise<IPlayerState> {
    const response = await fetch(`${this.ip4Address}/api/v1/getState`);
    if (!response.ok) {
      this.log(JSON.stringify(response));
      throw new Error(this.homey.__('volumioPlayerError'));
    }
    return response.json();
  }

  private async apiCommandCall(routeArguments: string): Promise<void> {
    const response = await fetch(`${this.ip4Address}/api/v1/commands/?${routeArguments}`);
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
    await this.apiCommandCall('cmd=next');
  }

  async previous(): Promise<void> {
    await this.apiCommandCall('cmd=prev');
  }

  async shuffle(value: boolean): Promise<void> {
    await this.apiCommandCall(`cmd=random&value=${value}`);
  }

  async repeat(value: boolean): Promise<void> {
    await this.apiCommandCall(`cmd=repeat&value=${value}`);
  }

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

  async playPlayList(title: string): Promise<void> {
    await this.apiCommandCall(`cmd=playplaylist&name=${title}`);
  }

  async clearQueue(): Promise<void> {
    await this.apiCommandCall(`cmd=clearQueue`);
  }

  async getCollectionStats(): Promise<ICollectionStats> {
    const response = await fetch(`${this.ip4Address}/api/v1/collectionstats`);
    if (!response.ok) {
      this.log(JSON.stringify(response));
      throw new Error(this.homey.__('volumioPlayerError'));
    }
    return response.json();
  }

  async getSystemInfo(): Promise<ISystemInfo> {
    const response = await fetch(`${this.ip4Address}/api/v1/getSystemInfo`);
    if (!response.ok) {
      this.log(JSON.stringify(response));
      throw new Error(this.homey.__('volumioPlayerError'));
    }
    return response.json();
  }

  async replaceAndPlay(parameters: { items: IQueueItem[]; startAt?: number }): Promise<void> {
    const index =
      parameters.startAt && parameters.startAt > 0 && parameters.startAt < parameters.items.length
        ? parameters.startAt
        : 0;
    const item = parameters.items[index];
    const list = parameters.items;
    const body = JSON.stringify({ item, list, index });
    const response = await fetch(`${this.ip4Address}/api/v1/replaceAndPlay`, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      this.log(JSON.stringify(response));
      throw new Error(this.homey.__('volumioPlayerError'));
    }
  }

  async addToQueue(item: IQueueItem | IQueueItem[]): Promise<void> {
    const body = JSON.stringify(item);
    const response = await fetch(`${this.ip4Address}/api/v1/addToQueue`, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      this.log(JSON.stringify(response));
      throw new Error(this.homey.__('volumioPlayerError'));
    }
  }

  async listPlayLists(): Promise<string[]> {
    const response = await fetch(`${this.ip4Address}/api/v1/listplaylists`);
    if (!response.ok) {
      this.log(JSON.stringify(response));
      throw new Error(this.homey.__('volumioPlayerError'));
    }
    return response.json();
  }

  tinyarturi(artist: string): string {
    const artistCode = artist.toLowerCase().replace(/\//g, ' ').replace(' ', '_');
    return `${this.ip4Address}/tinyart/${artistCode}/large`;
  }

  async browse(uri: string): Promise<ISearchResult> {
    const response = await fetch(`${this.ip4Address}/api/v1/browse?uri=${uri}`);
    if (!response.ok) {
      this.log(JSON.stringify(response));
      throw new Error(this.homey.__('volumioPlayerError'));
    }
    return response.json();
  }

  async searchFor(wildcard: string): Promise<ISearchResult> {
    const response = await fetch(`${this.ip4Address}/api/v1/search?query=${encodeURI(wildcard)}`);
    if (!response.ok) {
      this.log(JSON.stringify(response));
      throw new Error(this.homey.__('volumioPlayerError'));
    }
    return response.json();
  }

  async promoteState(data: IPlayerState): Promise<void> {
    this.notificationReceived = true;
    await this.setPlayerState(data);
  }

  private set notificationReceived(value: boolean) {
    this._notificationReceived = value;
  }

  private get notificationReceived(): boolean {
    return this._notificationReceived;
  }

  private _notificationReceived = false;

  private async setPlayerState(state: IPlayerState): Promise<void> {
    await this.setCapabilityValue('speaker_playing', state.status === 'play').catch(this.error);
    await this.setCapabilityValue('speaker_artist', state.artist || '').catch(this.error);
    await this.setCapabilityValue('speaker_album', state.album || '').catch(this.error);
    await this.setCapabilityValue('speaker_track', state.title || '').catch(this.error);
    await this.setCapabilityValue('speaker_duration', state.duration || 0).catch(this.error);
    await this.setCapabilityValue('speaker_position', state.position || 0).catch(this.error);
    await this.setCapabilityValue('volume_set', state.volume / 100).catch(this.error);
    await this.setCapabilityValue('speaker_shuffle', state.random).catch(this.error);
    await this.setAlbumArtwork(state.albumart);
    // Volumio REST API does not support repeat commands like: track playlist none
    // For that reason I have not implemented speaker_repeat capability
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private async setAlbumArtwork(imageUrl?: string): Promise<void> {
    const loadImage = (image: any, url: string) => {
      image.setStream(async (stream: any) => {
        const response = await fetch(url);
        if (!response.ok) {
          this.log(JSON.stringify(response));
          throw new Error(this.homey.__('volumioPlayerError'));
        }
        return response.body.pipe(stream);
      });
    };
    try {
      const fullImageUrl = `${this.ip4Address}${
        !imageUrl || imageUrl.includes('undefined') ? 'albumart' : imageUrl
      }`;
      const image = await this.getImage();
      loadImage(image, fullImageUrl);
      await image.update();
      await this.setAlbumArtImage(image);
    } catch (err) {
      this.error(JSON.stringify(err));
    }
  }

  private async getImage(): Promise<Homey.Image> {
    if (!this._image) {
      this._image = await this.homey.images.createImage();
    }
    return this._image;
  }

  private _image: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  private async subscribeStatus(): Promise<void> {
    const url = await this.getNotificationUrl();
    const getResponse = await fetch(`${this.ip4Address}/api/v1/pushNotificationUrls`);
    if (!getResponse.ok) {
      this.log(JSON.stringify(getResponse));
      throw new Error(this.homey.__('volumioPlayerError'));
    }
    const notificationUrls = await getResponse.json();

    if (!notificationUrls.includes(url)) {
      this.log(`subscribe status ${this.getName()}`);
      const body = `url=${url}`;
      const postResponse = await fetch(`${this.ip4Address}/api/v1/pushNotificationUrls`, {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      if (!postResponse.ok) {
        this.log(JSON.stringify(postResponse));
        throw new Error(this.homey.__('volumioPlayerError'));
      }
    }
  }

  private async unSubscribeStatus(): Promise<void> {
    this.log(`unsubscribe status ${this.getName()}`);
    const notificationUrl = await this.getNotificationUrl();
    const response = await fetch(
      `${this.ip4Address}/api/v1/pushNotificationUrls?url=${notificationUrl}`,
      {
        method: 'DELETE'
      }
    );
    if (!response.ok) {
      this.log(JSON.stringify(response));
      throw new Error(this.homey.__('volumioPlayerError'));
    }
  }

  // Get Url for notification REST call
  private async getNotificationUrl(): Promise<string> {
    const { id } = this.getData();
    const homeyAddress = await this.homey.cloud.getLocalAddress();
    const homeyUrl = homeyAddress.split(':');
    let homeyUrlProtocol = 'http';
    let homeyUrlIp4: string;
    let homeyUrlPort: string;
    switch (true) {
      case homeyUrl[0] === 'http':
      case homeyUrl[0] === 'https':
        homeyUrlProtocol = homeyUrl[0];
        homeyUrlIp4 = homeyUrl[1];
        homeyUrlPort = homeyUrl.length === 3 && homeyUrl[2] !== '80' ? `:${homeyUrl[2]}` : '';
        break;
      default:
        homeyUrlIp4 = `//${homeyUrl[0]}`;
        homeyUrlPort = homeyUrl.length === 2 && homeyUrl[1] !== '80' ? `:${homeyUrl[1]}` : '';
        break;
    }
    return `${homeyUrlProtocol}:${homeyUrlIp4}/api/app/org.volumio.remote/${id}${homeyUrlPort}`;
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
  async onSettings({ oldSettings: {}, newSettings: {}, changedKeys: {} }): Promise<string | void> {
    this.log('Volumio music player settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name: string) {
    // eslint-disable-line @typescript-eslint/no-unused-vars
    this.log(`Volumio music player was renamed: ${name} `);
  }

  /*
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('Volumio music player has been deleted');
    await this.unSubscribeStatus();
    const image = await this.getImage();
    await image.unregister();
  }
}

module.exports = VolumioMusicPlayerDevice;
