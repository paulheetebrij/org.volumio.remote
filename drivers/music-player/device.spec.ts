describe('MyDevice', () => {
  describe('onInit', () => {
    // this.log('MyDevice has been initialized');
  });
  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  describe('onAdded', () => {
    // this.log('MyDevice has been added');
  });
  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  describe('onSettings', () => {
    // this.log('MyDevice settings where changed');
  });

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  describe('onRenamed', () => {
    // this.log('MyDevice was renamed');
  });

  /**
   * onDeleted is called when the user deleted the device.
   */
  describe('onDeleted', () => {
    // this.log('MyDevice has been deleted');
  });
});
