import Homey from 'homey'; // eslint-disable-line

interface IPlayerState {
  status: string;
  title: string;
  artist: string;
  album: string;
  volume: number;
}

class VolumioMusicPlayerDriver extends Homey.Driver {
  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('Driver Volumio music player has been initialized');

    const cardActionPlayPlaylist = this.homey.flow.getActionCard('play-playlist');
    cardActionPlayPlaylist.registerRunListener(async (args: any) => {
      // eslint-disable-line
      const { device, title } = args;
      await device.playPlayList(title).catch(this.error);
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
      if (this.playerStates[deviceId]) {
        await this.compareStates(device, data, this.playerStates[deviceId]);
      }
      this.playerStates[deviceId] = data;
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

  private get playerStates(): { [device: string]: IPlayerState } {
    return this._playerStates;
  }
  private _playerStates: { [device: string]: IPlayerState } = {};
  private async compareStates(device: any, newState: IPlayerState, oldState: IPlayerState): Promise<void> {
    const { status, artist, title, album, volume } = newState;
    if (newState.status !== oldState.status) {
      if (newState.status === 'play') {
        const cardTrigger = this.homey.flow.getDeviceTriggerCard('started-playing');
        cardTrigger.trigger(device, { artist, title, album, volume });
      } else {
        const cardTrigger = this.homey.flow.getDeviceTriggerCard('stopped-playing');
        cardTrigger.trigger(device, { artist, title, album, volume });
      }
    }
    if (newState.artist !== oldState.artist) {
      const cardTrigger = this.homey.flow.getDeviceTriggerCard('artist-changed');
      cardTrigger.trigger(device, { artist, title, album, volume });
    }
    if (newState.title !== oldState.title) {
      const cardTrigger = this.homey.flow.getDeviceTriggerCard('track-changed');
      cardTrigger.trigger(device, { artist, title, album, volume });
    }
    if (newState.album !== oldState.album) {
      const cardTrigger = this.homey.flow.getDeviceTriggerCard('album-changed');
      cardTrigger.trigger(device, { artist, title, album, volume });
    }
    if (newState.volume !== oldState.volume) {
      const cardTrigger = this.homey.flow.getDeviceTriggerCard('volume-changed');
      cardTrigger.trigger(device, { artist, title, album, volume });
    }
  }

}

module.exports = VolumioMusicPlayerDriver;
