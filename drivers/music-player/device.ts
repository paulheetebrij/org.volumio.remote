import EventEmitter from 'events';
import { Device } from 'homey';

class MyDevice extends Device {
  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('MyDevice has been initialized');

    // this.registerCapabilityListener("speaker_repeat", async (value: any) => {
    //   this.log("speaker_repeat", value);
    // });
    // this.registerCapabilityListener("speaker_prev", async (value: any) => {
    //   this.log("speaker_prev", value);
    // });
    // this.registerCapabilityListener("speaker_position", async (value: any) => {
    //   this.log("speaker_position", value);
    // });
    this.registerCapabilityListener("speaker_playing", async (value: any) => {
      this.log("speaker_playing", value);
    });
    // this.registerCapabilityListener("volume_set", async (value: any) => {
    //   this.log("volume_set", value);
    // });
    // this.registerCapabilityListener("volume_down", async (value: any) => {
    //   this.log("volume_down", value);
    // });
    // this.registerCapabilityListener("volume_mute", async (value: any) => {
    //   this.log("volume_mute", value);
    // });
    // this.registerCapabilityListener("volume_up", async (value: any) => {
    //   this.log("volume_up", value);
    // });

    // this.registerCapabilityListener("speaker_artist", async (value: any) => {
    //   this.log("speaker_artist", value);
    // });
    // this.registerCapabilityListener("speaker_album", async (value: any) => {
    //   this.log("speaker_album", value);
    // });
    // this.registerCapabilityListener("speaker_track", async (value: any) => {
    //   this.log("speaker_track", value);
    // });

    // this.setCapabilityValue("speaker_artist", async (value: any) => {
    //   this._speakerArtist = value;
    // });
    // this.setCapabilityValue("speaker_album", async (value: any) => {
    //   this._speakerAlbum = value;
    // });
    // this.setCapabilityValue("speaker_track", async (value: any) => {
    //   this._speakerTrack = value;
    // });

  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('MyDevice has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({ oldSettings: { }, newSettings: { }, changedKeys: { } }): Promise<string | void> {
    this.log('MyDevice settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name: string) {
    this.log('MyDevice was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('MyDevice has been deleted');
  }


  private _speakerShuffle: string = "";
  private _speakerRepeat: string = "";
  private _speakerArtist: string = "";
  private _speakerTrack: string = "";
  private _speakerAlbum: string = "";
}

module.exports = MyDevice;
