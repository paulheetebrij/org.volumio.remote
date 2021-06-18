import sourceMapSupport from 'source-map-support'; // eslint-disable-line node/no-unsupported-features/es-syntax
import Homey from 'homey'; // eslint-disable-line

sourceMapSupport.install();

class VolumioApp extends Homey.App {
  /**
   * onInit is called when the app is initialized.
   */
  async onInit(): Promise<void> {
    this.log('Volumio app has been initialized');
  }

  // Sends Volumio change notification to Volumio driver
  async volumiostatus(deviceId: string, body: any): Promise<void> {
    const driver: any = this.homey.drivers.getDriver('music-player');
    if (driver) {
      const { item, data } = body;
      switch (item) {
        case 'state':
          await driver.promoteState(deviceId, data);
          break;
        case 'queue':
          await driver.promoteQueue(deviceId, data);
          break;
        case 'zones':
          await driver.promoteZones(deviceId, data);
          break;
        default:
          this.error(`volumiostatus: unknown item ${item}`);
          break;
      }
    } else {
      this.error('volumiostatus: Driver not found');
    }
  }
}

module.exports = VolumioApp;
