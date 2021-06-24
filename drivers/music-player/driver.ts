/* eslint-disable node/no-unsupported-features/es-syntax */
import Homey from 'homey'; // eslint-disable-line
import {
  ARTISTS_URL,
  FAVOURITES_URL,
  GENRES_URL,
  ISearchResult,
  ISearchResultItem,
  IVolumioMusicPlayerDevice
} from './interfaces'; // eslint-disable-line
import { withResult } from './withResult'; // eslint-disable-line

class VolumioMusicPlayerDriver extends Homey.Driver {
  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('Driver Volumio music player has been initialized');
    const cardActionClearQueue = this.homey.flow.getActionCard('clear-queue');
    cardActionClearQueue.registerRunListener(async (args: any) => {
      const { device } = args;
      try {
        await device.clearQueue();
      } catch (err) {
        this.error(err);
      }
    });

    const cardActionPlayPlaylist = this.homey.flow.getActionCard('play-playlist');
    cardActionPlayPlaylist.registerRunListener(async (args: any) => {
      // eslint-disable-line
      const { device, wildcard } = args;
      const tokens = { wildcard, class: this.homey.__('playlists') };
      try {
        const d = device as IVolumioMusicPlayerDevice;
        const lists: string[] = await d.listPlayLists();
        if (lists.filter((i) => i.toLowerCase().includes(wildcard.toLowerCase())).length !== 0) {
          await device.playPlayList(
            this.pickRandomOne(
              lists.filter((i) => i.toLowerCase().includes(wildcard.toLowerCase()))
            )
          );
        } else {
          await this.notifyNoResults(device, tokens);
        }
      } catch (err) {
        this.error(err);
      }
    });

    const cardActionPlayTracksByTitle = this.homey.flow.getActionCard('play-tracks-by-title');
    cardActionPlayTracksByTitle.registerRunListener(async (args: any) => {
      // eslint-disable-line
      const { device, wildcard } = args;
      try {
        const d = device as IVolumioMusicPlayerDevice;
        const result = await d.searchFor(wildcard);
        const { items } = withResult(result).all.filter.songs.titleContains(wildcard);
        const tokens = { wildcard, class: this.homey.__('tracks') };
        if (items.length !== 0) {
          await d.replaceAndPlay({ items });
        } else {
          await this.notifyNoResults(device, tokens);
        }
      } catch (err) {
        this.error(err);
      }
    });

    const cardActionPlayFavourites = this.homey.flow.getActionCard('play-favourites');
    cardActionPlayFavourites.registerRunListener(async (args: any) => {
      const { device } = args;
      try {
        const d = device as IVolumioMusicPlayerDevice;
        const result = await d.browse(FAVOURITES_URL);
        const { items } = withResult(result);
        const tokens = { wildcard: this.homey.__('favourites'), class: this.homey.__('tracks') };
        if (items.length !== 0) {
          await d.replaceAndPlay({ items });
        } else {
          await this.notifyNoResults(device, tokens);
        }
      } catch (err) {
        this.error(err);
      }
    });

    const cardActionPlayAllFromArtist = this.homey.flow.getActionCard('play-all-from-artist');
    cardActionPlayAllFromArtist.registerArgumentAutocompleteListener(
      'artist',
      async (query, args) => this.getArtistByQuery(args.device, query)
    );
    cardActionPlayAllFromArtist.registerRunListener(async (args: any) => {
      const { device, artist } = args;
      try {
        const d = device as IVolumioMusicPlayerDevice;
        const result = await d.browse(artist.uri);
        const { items } = withResult(result);
        const tokens = { wildcard: artist.name, class: this.homey.__('tracks') };
        if (items.length !== 0) {
          await d.replaceAndPlay({ items });
        } else {
          await this.notifyNoResults(device, tokens);
        }
      } catch (err) {
        this.error(err);
      }
    });

    const cardActionQueueAllArtistsFromGenre = this.homey.flow.getActionCard(
      'queue-all-artists-from-genre'
    );
    cardActionQueueAllArtistsFromGenre.registerArgumentAutocompleteListener(
      'genre',
      async (query, args) => this.getGenreByQuery(args.device, query)
    );
    cardActionQueueAllArtistsFromGenre.registerRunListener(async (args: any) => {
      const { device, genre } = args;
      try {
        const d = device as IVolumioMusicPlayerDevice;
        this.log(JSON.stringify(genre));
        const result = await d.browse(genre.uri);
        // 1e lijst = Albums, 2e lijst = Artiesten.
        const { items } = result.navigation.lists[1];
        const tokens = { wildcard: genre.name, class: this.homey.__('artists') };
        if (items.length !== 0) {
          await d.addToQueue(items);
        } else {
          await this.notifyNoResults(device, tokens);
        }
      } catch (err) {
        this.error(err);
      }
    });

    const cardActionQueueAllAlbumsFromGenre = this.homey.flow.getActionCard(
      'queue-all-albums-from-genre'
    );
    cardActionQueueAllAlbumsFromGenre.registerArgumentAutocompleteListener(
      'genre',
      async (query, args) => this.getGenreByQuery(args.device, query)
    );
    cardActionQueueAllAlbumsFromGenre.registerRunListener(async (args: any) => {
      const { device, genre } = args;
      try {
        const d = device as IVolumioMusicPlayerDevice;
        this.log(JSON.stringify(genre));
        const result = await d.browse(genre.uri);
        // 1e lijst = Albums, 2e lijst = Artiesten.
        const { items } = result.navigation.lists[0];
        const tokens = { wildcard: genre.name, class: this.homey.__('albums') };
        if (items.length !== 0) {
          await d.addToQueue(items);
        } else {
          await this.notifyNoResults(device, tokens);
        }
      } catch (err) {
        this.error(err);
      }
    });
  }

  private notifyNoResults(device: any, tokens: { wildcard: string; class: string }): Promise<void> {
    return this.homey.flow.getDeviceTriggerCard('no-results').trigger(device, tokens);
  }

  private resultToAutocomplete(
    result: ISearchResult,
    query: string
  ): { name: string; uri: string }[] {
    return withResult(result)
      .filter.titleStartsWithOrContains(query)
      .items.map((i: ISearchResultItem) => {
        return { name: i.title, uri: i.uri };
      });
  }

  private async getArtistByQuery(device: IVolumioMusicPlayerDevice, query: string): Promise<any> {
    if (query.length !== 0) {
      try {
        return this.resultToAutocomplete(await device.browse(ARTISTS_URL), query);
      } catch (err) {
        this.error(err);
      }
    }
    return [];
  }

  private async getGenreByQuery(device: IVolumioMusicPlayerDevice, query: string): Promise<any> {
    if (query.length !== 0) {
      try {
        return this.resultToAutocomplete(await device.browse(GENRES_URL), query);
      } catch (err) {
        this.error(err);
      }
    }
    return [];
  }

  // Sends Volumio player state change notification to selected device
  async promoteState(deviceId: string, data: any): Promise<void> {
    const device: any = this.getDevices().find((d) => d.getData().id === deviceId);
    if (device) {
      const d = device as IVolumioMusicPlayerDevice;
      await d.promoteState(data);
    } else {
      this.error(`${this.homey.__('volumioAudioPlayerNotFound')}: ${deviceId}`);
    }
  }

  // Sends Volumio player queue change notification to selected device
  async promoteQueue(deviceId: string, data: any): Promise<void> {
    //
  }

  // Sends Volumio player zones change notification to selected device
  async promoteZones(deviceId: string, data: any): Promise<void> {
    //
  }

  private pickRandomOne<T>(all: T[]): T {
    return all.slice(Math.floor(Math.random() * all.length) - 1)[0];
  }

  /**
   * onPairListDevices is called when a user is adding a device
   * and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    const discoveryStrategy = this.getDiscoveryStrategy();
    const discoveryResults = discoveryStrategy.getDiscoveryResults();

    const devices = Object.values(discoveryResults).map((discoveryResult: any) => {
      const { id, address, txt } = discoveryResult;
      return {
        name: txt.name,
        data: {
          id
        },
        store: {
          address
        }
      };
    });
    return devices;
  }
}

module.exports = VolumioMusicPlayerDriver;
