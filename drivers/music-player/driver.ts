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
      const { device, title } = args;
      await device.playList(title).catch(this.error);
    });
  }

  /**
   * onPairListDevices is called when a user is adding a device
   * and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    // bron: http://192.168.178.26/api/v1/getzones
    // const id = '58f94020-bb96-477b-b0dc-a30b4eb64c0e';
    // const address = 'http://192.168.178.26';
    // const name = 'Dionysus';
    // return [{ name, data: { id }, store: { address } }];

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

  async promoteState(deviceId: string, data: any): Promise<void> {
    const device: any = this.getDevices().find(d => d.getData().id === deviceId);
    if (device) {
      await device.promoteState(data);
    } else {
      this.log(`Device ${deviceId} not found`);
    }
  }
}

module.exports = VolumioMusicPlayerDriver;
