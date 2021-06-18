module.exports = {
  async volumiostatus({ homey, params, body }) {
    // access the post body and perform some action on it.
    return homey.app.volumiostatus(params.id, body);
  }
};
