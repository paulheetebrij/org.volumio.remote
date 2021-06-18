import Homey from 'homey';

class VolumioApi extends Homey.Api {
  async volumiostatus(parameters: { homey: any, params: any, body: any }) {
    const { homey, params, body } = parameters;
    // access the post body and perform some action on it.
    return homey.app.volumiostatus(params.id, body);
  }
}

module.exports = VolumioApi;
