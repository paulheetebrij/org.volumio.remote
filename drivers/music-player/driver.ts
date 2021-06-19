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
      try {
        const lists: string[] = await device.listPlayLists();
        if (lists.length === 0) {
          throw new Error(this.homey.__('volumioNoPlaylistsOnDevice'));
        }
        const selected = lists.filter((i) => i.toLowerCase().includes(wildcard.toLowerCase()));
        if (selected.length === 0) {
          throw new Error(this.homey.__('volumioNoPlaylistsOnDeviceMatchingWildcard'));
        }
        const selectedPlaylist = selected.slice(Math.floor(Math.random() * selected.length) - 1)[0];
        await device.playPlayList(selectedPlaylist);
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
