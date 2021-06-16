import sourceMapSupport from 'source-map-support';
import Homey from 'homey';

sourceMapSupport.install();

class MyApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit(): Promise<void> {
    this.log('MyApp has been initialized');

    // const cardConditionDeviceIsPlaying = this.homey.flow.getConditionCard("device-is-playing");
    // cardConditionDeviceIsPlaying.registerRunListener(async () => {
    //   // true or false
    // });

    // const cardActionPlay = this.homey.flow.getActionCard("play");
    // cardActionPlay.registerRunListener(async (args: any) => {

    // });
  }

}

module.exports = MyApp;
