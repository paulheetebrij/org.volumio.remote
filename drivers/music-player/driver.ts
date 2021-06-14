import { Driver } from 'homey';
import fetch, { Request } from 'node-fetch';

class MyDriver extends Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('MyDriver has been initialized');
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