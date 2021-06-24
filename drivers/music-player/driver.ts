/* eslint-disable node/no-unsupported-features/es-syntax */
import Homey from 'homey'; // eslint-disable-line
import {
  ARTISTS_URL,
  GENRES_URL,
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
        if (lists.length !== 0) {
          const selected = lists.filter((i) => i.toLowerCase().includes(wildcard.toLowerCase()));
          if (selected.length !== 0) {
            const selectedPlaylist = this.pickOne(selected);
            await device.playPlayList(selectedPlaylist);
          } else {
            const cardTriggerNoPlaylistsFound = this.homey.flow.getDeviceTriggerCard('no-results');
            await cardTriggerNoPlaylistsFound.trigger(device, tokens);
          }
        } else {
          const cardTriggerNoPlaylistsFound = this.homey.flow.getDeviceTriggerCard('no-results');
          await cardTriggerNoPlaylistsFound.trigger(device, tokens);
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
        if (items.length !== 0) {
          await d.replaceAndPlay({ items });
        } else {
          const tokens = { wildcard, class: this.homey.__('tracks') };
          const cardTriggerNoTracksFound = this.homey.flow.getDeviceTriggerCard('no-results');
          await cardTriggerNoTracksFound.trigger(device, tokens);
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
        await d.replaceAndPlay({ items });
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
        if (items.length !== 0) {
          await d.addToQueue(items);
        } else {
          // Een genre/stijl wordt dus weergegeven in Volumio terwijl er geen albums/artiesten zijn. Vreemd...
          const tokens = { wildcard: genre.name, class: this.homey.__('tracks') };
          const cardTriggerNoTracksFound = this.homey.flow.getDeviceTriggerCard('no-results');
          await cardTriggerNoTracksFound.trigger(device, tokens);
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
        if (items.length !== 0) {
          await d.addToQueue(items);
        } else {
          // Een genre/stijl wordt dus weergegeven in Volumio terwijl er geen albums/artiesten zijn. Vreemd...
          const tokens = { wildcard: genre.name, class: this.homey.__('tracks') };
          const cardTriggerNoTracksFound = this.homey.flow.getDeviceTriggerCard('no-results');
          await cardTriggerNoTracksFound.trigger(device, tokens);
        }
      } catch (err) {
        this.error(err);
      }
    });
  }

  private async getArtistByQuery(device: IVolumioMusicPlayerDevice, query: string): Promise<any> {
    if (query.length !== 0) {
      try {
        const result = await device.browse(ARTISTS_URL);
        return withResult(result)
          .filter.titleStartsWithOrContains(query)
          .items.map((i: ISearchResultItem) => {
            return { name: i.title, uri: i.uri };
          });
      } catch (err) {
        this.error(err);
      }
    }
    return [];
  }

  private async getGenreByQuery(device: IVolumioMusicPlayerDevice, query: string): Promise<any> {
    if (query.length !== 0) {
      try {
        const result = await device.browse(GENRES_URL);
        return withResult(result)
          .filter.titleStartsWithOrContains(query)
          .items.map((i: ISearchResultItem) => {
            return { name: i.title, uri: i.uri };
          });
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

  private pickOne<T>(all: T[]): T {
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
