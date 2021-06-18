import sourceMapSupport from 'source-map-support'; // eslint-disable-line node/no-unsupported-features/es-syntax
import Homey from 'homey'; // eslint-disable-line

sourceMapSupport.install();

class VolumioApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit(): Promise<void> {
    this.log('Volumio app has been initialized');

    // const cardConditionDeviceIsPlaying = this.homey.flow.getConditionCard("device-is-playing");
    // cardConditionDeviceIsPlaying.registerRunListener(async () => {
    //   // true or false
    // });

    // const cardActionPlay = this.homey.flow.getActionCard("play");
    // cardActionPlay.registerRunListener(async (args: any) => {

    // });
  }
}

module.exports = VolumioApp;
