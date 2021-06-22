import Homey from 'homey'; // eslint-disable-line

class VolumioMusicPlayerDriver extends Homey.Driver {
  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('Driver Volumio music player has been initialized');

    const cardActionPlayPlaylist = this.homey.flow.getActionCard('play-playlist');
    cardActionPlayPlaylist.registerRunListener(async (args: any) => {
      // eslint-disable-line
      const { device, wildcard } = args;
      const tokens = { wildcard };
      try {
        const lists: string[] = await device.listPlayLists();
        if (lists.length !== 0) {
          const selected = lists.filter((i) => i.toLowerCase().includes(wildcard.toLowerCase()));
          if (selected.length !== 0) {
            const selectedPlaylist = selected.slice(
              Math.floor(Math.random() * selected.length) - 1
            )[0];
            await device.playPlayList(selectedPlaylist);
          } else {
            const cardTriggerNoPlaylistsFound =
              this.homey.flow.getDeviceTriggerCard('no-playlists-found');
            await cardTriggerNoPlaylistsFound.trigger(device, tokens);
          }
        } else {
          const cardTriggerNoPlaylistsFound =
            this.homey.flow.getDeviceTriggerCard('no-playlists-found');
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
        const result: any = await device.searchFor(wildcard);
        const tracks = result.navigation.lists
          .map((l: any) => l.items)
          .reduce((a: any, c: any) => a.items.concat(c.items))
          .filter(
            (i: any) => i.type === 'song' && i.title.toLowerCase().includes(wildcard.toLowerCase())
          );
        if (tracks.length !== 0) {
          const item = tracks[0];
          const list = tracks;
          const index = 0;
          await device.replaceAndPlay({ item, list, index });
        } else {
          const tokens = { wildcard };
          const cardTriggerNoTracksFound = this.homey.flow.getDeviceTriggerCard('no-tracks-found');
          await cardTriggerNoTracksFound.trigger(device, tokens);
        }
      } catch (err) {
        this.error(err);
      }
    });
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

  // Sends Volumio player state change notification to selected device
  async promoteState(deviceId: string, data: any): Promise<void> {
    const device: any = this.getDevices().find((d) => d.getData().id === deviceId);
    if (device) {
      await device.promoteState(data);
    } else {
      this.error(`promoteState: Device ${deviceId} not found`);
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
}

module.exports = VolumioMusicPlayerDriver;
