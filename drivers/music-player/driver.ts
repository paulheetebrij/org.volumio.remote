import { Driver } from 'homey';
import fetch, { Request } from 'node-fetch';

class MyDriver extends Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('MyDriver has been initialized');

    // const cardActionStatusChanged = this.homey.flow.getTriggerCard('the-status-has-been-changed');
    // cardActionStatusChanged.

    //args.device = reference instance => 

    // const cardActionStop = this.homey.flow.getActionCard('stop');
    // const cardActionToggleRepeat = this.homey.flow.getActionCard('toggle-repeat');
    // const cardActionToggleShuffle = this.homey.flow.getActionCard('toggle-shuffle');
    // const cardActionSetVolume = this.homey.flow.getActionCard('set-volume');
    // const cardActionMute = this.homey.flow.getActionCard('mute');
    // const cardActionUnmute = this.homey.flow.getActionCard('unmute');
    const cardActionPlay = this.homey.flow.getActionCard('play');
    cardActionPlay.registerRunListener(async (args: any) => {
      this.log(`play => ${JSON.stringify(args)}`);
      const { device } = args;
      const request = `${device.store.address}/api/v1/commands/?cmd=play`;
      this.log(JSON.stringify(request));
      await fetch(request).catch(this.error);
    });
    const cardActionPause = this.homey.flow.getActionCard('pause-player');
    cardActionPause.registerRunListener(async (args: any) => {
      this.log(`pause-player => ${JSON.stringify(args)}`);
      const { device } = args;
      const request = `${device.store.address}/api/v1/commands/?cmd=pause`;
      this.log(JSON.stringify(request));
      await fetch(request).catch(this.error);
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