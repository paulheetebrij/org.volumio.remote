import { Driver } from 'homey';
import fetch, { Request } from 'node-fetch';
import { IDeviceCapabilities } from './interfaces';

class MyDriver extends Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('MyDriver has been initialized');
    const cardConditionIsPlaying = this.homey.flow.getConditionCard('is-playing');
    cardConditionIsPlaying.registerRunListener(async (args: any) => {
      const { device } = args;
      return await (device as IDeviceCapabilities).isPlaying().catch(this.error);
    });

    const cardActionPlay = this.homey.flow.getActionCard('play');
    cardActionPlay.registerRunListener(async (args: any) => {
      this.log(`play => ${JSON.stringify(args)}`);
      const { device } = args;
      await (device as IDeviceCapabilities).play().catch(this.error);
    });

    const cardActionPause = this.homey.flow.getActionCard('pause-player');
    cardActionPause.registerRunListener(async (args: any) => {
      this.log(`pause-player => ${JSON.stringify(args)}`);
      const { device } = args;
      await (device as IDeviceCapabilities).pause().catch(this.error);
    });

    const cardActionNextTrack = this.homey.flow.getActionCard('next-track');
    cardActionNextTrack.registerRunListener(async (args: any) => {
      this.log(`next-track => ${JSON.stringify(args)}`);
      const { device } = args;
      await (device as IDeviceCapabilities).next().catch(this.error);
    });

    const cardActionPreviousTrack = this.homey.flow.getActionCard('previous-track');
    cardActionPreviousTrack.registerRunListener(async (args: any) => {
      this.log(`previous-track => ${JSON.stringify(args)}`);
      const { device } = args;
      await (device as IDeviceCapabilities).previous().catch(this.error);
    });

    const cardActionShuffleOn = this.homey.flow.getActionCard('shuffle-on');
    cardActionShuffleOn.registerRunListener(async (args: any) => {
      this.log(`shuffle-on => ${JSON.stringify(args)}`);
      const { device } = args;
      await (device as IDeviceCapabilities).shuffle(true).catch(this.error);
    });

    const cardActionShuffleOff = this.homey.flow.getActionCard('shuffle-off');
    cardActionShuffleOff.registerRunListener(async (args: any) => {
      this.log(`shuffle-off => ${JSON.stringify(args)}`);
      const { device } = args;
      await (device as IDeviceCapabilities).shuffle(false).catch(this.error);
    });

    const cardActionSetVolume = this.homey.flow.getActionCard('set-volume');
    cardActionSetVolume.registerRunListener(async (args: any) => {
      this.log(`set-volume => ${JSON.stringify(args)}`);
      const { device, level } = args;
      await (device as IDeviceCapabilities).setVolume(level).catch(this.error);
    });

    const cardActionMute = this.homey.flow.getActionCard('mute');
    cardActionMute.registerRunListener(async (args: any) => {
      this.log(`mute => ${JSON.stringify(args)}`);
      const { device } = args;
      await (device as IDeviceCapabilities).mute().catch(this.error);
    });

    const cardActionUnmute = this.homey.flow.getActionCard('unmute');
    cardActionUnmute.registerRunListener(async (args: any) => {
      this.log(`unmute => ${JSON.stringify(args)}`);
      const { device } = args;
      await (device as IDeviceCapabilities).unmute().catch(this.error);
    });
  }

  /**
   * onPairListDevices is called when a user is adding a device and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    const response: any = await fetch(new Request("http://192.168.178.26/api/v1/getzones", { method: "get" }));
    if (!response.ok) {
      throw new Error(JSON.stringify({ name: response.status, message: response.statusText }));
    }
    const json = response.json();
    return json.then((doc: any) => {
      const { id, name, host: address } = doc;
      return {
        name, data: { id }, store: { address }
      }
    })
  }
}

module.exports = MyDriver;