import Homey from 'homey'; // eslint-disable-line
import fetch from 'node-fetch'; // eslint-disable-line

/* eslint-disable node/no-unsupported-features/es-syntax */
export interface IQueueItem {
  uri: string;
  service: string;
  title: string;
  artist: string;
  album: string;
  type: string;
  tracknumber: number;
  duration: number;
  trackType: string;
}

/* eslint-disable node/no-unsupported-features/es-syntax */
export interface IPushNotificationStateData {
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
  samplerate: string;
  bitdepth: string;
  channels: number;
  random: boolean;
  repeat: boolean;
  repeatSingle: boolean;
  consume: boolean;
  volume: number;
  disableVolumeControl: boolean;
  mute: boolean;
  stream: string;
  updatedb: boolean;
  volatile: boolean;
  service: string;
}

/* eslint-disable node/no-unsupported-features/es-syntax */
export interface IPlayerState {
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

/* eslint-disable node/no-unsupported-features/es-syntax */
export interface ISearchResult {
  navigation: {
    isSearchResult: boolean;
    lists: {
      type?: string;
      icon?: string;
      title: string;
      availableListViews: string[];
      items: {
        service: string;
        type?: string; // song / folder / webradio
        title: string;
        artist?: string;
        album?: string;
        uri: string; // artists://... => artiest = ..., albums..., genres...
        icon?: string;
        albumart: string;
      }[];
    }[];
  };
}

/* eslint-disable node/no-unsupported-features/es-syntax */
export interface ICollectionStats {
  artists: string;
  albums: string;
  songs: string;
  playtime: string;
}

/* eslint-disable node/no-unsupported-features/es-syntax */
export interface ISystemInfo {
  id: string;
  host: string;
  name: string;
  type: string;
  serviceName: string;
  state: {
    status: string;
    volume: number;
    mute: boolean;
    artist: string;
    track: string;
    albumart: string;
  };
  systemversion: string;
  builddate: string;
  variant: string;
  hardware: string;
}

interface IVolumioMusicPlayerDevice {
  tinyarturi(artist: string): string;
  play(): Promise<void>;
  toggle(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
  shuffle(value: boolean): Promise<void>;
  repeat(value: boolean): Promise<void>;
  setVolume(value: number): Promise<void>;
  increaseVolume(): Promise<void>;
  decreaseVolume(): Promise<void>;
  mute(): Promise<void>;
  unmute(): Promise<void>;
  playPlayList(title: string): Promise<void>;
  clearQueue(): Promise<void>;
  replaceAndPlay(parameters: { items: IQueueItem[]; startAt?: number }): Promise<void>;
  addToQueue(item: IQueueItem | IQueueItem[]): Promise<void>;
  listPlayLists(): Promise<string[]>;
  browse(uri: string): Promise<ISearchResult>;
  searchFor(wildcard: string): Promise<ISearchResult>;
  promoteState(data: IPlayerState): Promise<void>;
  getCollectionStats(): Promise<ICollectionStats>;
  getSystemInfo(): Promise<ISystemInfo>;
}

class VolumioMusicPlayerDevice extends Homey.Device implements IVolumioMusicPlayerDevice {
  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('Volumio music player device init');
    this.log('Name:', this.getName());
    this.log('Class:', this.getClass());

    await this.tryConnect({ firstTime: true });
    this.poller(() => this.tryConnect({}).catch(this.error));

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

  async tryConnect(parameters: { firstTime?: boolean }): Promise<void> {
    try {
      const playerState = await this.getPlayerState();
      if (parameters.firstTime === true) {
        await this.setPlayerState(playerState);
        await this.subscribeStatus();
      } else if (!this.getAvailable()) {
        await this.setPlayerState(playerState);
        await this.subscribeStatus();
        await this.setAvailable();
      }
    } catch (err) {
      this.error(err);
      this.setUnavailable(this.homey.__('volumioDeviceUnavailable'));
    }
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
    await this.setPlayerState(data);
  }

  private async setPlayerState(state: IPlayerState): Promise<void> {
    await this.setCapabilityValue('speaker_playing', state.status === 'play').catch(this.error);
    await this.setCapabilityValue('speaker_artist', state.artist).catch(this.error);
    await this.setCapabilityValue('speaker_album', state.album).catch(this.error);
    await this.setCapabilityValue('speaker_track', state.title).catch(this.error);
    await this.setCapabilityValue('speaker_duration', state.duration).catch(this.error);
    await this.setCapabilityValue('speaker_position', state.position).catch(this.error);
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
    this.log(`subscribe status ${this.getName()}`);
    const url = await this.getNotificationUrl();
    const getResponse = await fetch(`${this.ip4Address}/api/v1/pushNotificationUrls`);
    if (!getResponse.ok) {
      this.log(JSON.stringify(getResponse));
      throw new Error(this.homey.__('volumioPlayerError'));
    }
    const notificationUrls = await getResponse.json();

    if (!notificationUrls.includes(url)) {
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

  private poller(pollingFunction: () => Promise<void>): NodeJS.Timeout {
    if (!this._poller) {
      this._poller === setInterval(pollingFunction, 15000); // eslint-disable-line
    }
    return this._poller as NodeJS.Timeout;
  }

  private clearPoller(): void {
    if (this._poller) {
      clearInterval(this._poller);
    }
  }

  private _poller: any; // eslint-disable-line @typescript-eslint/no-explicit-any

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
    await this.clearPoller();
  }
}

module.exports = VolumioMusicPlayerDevice;
