import createRequest from './createRequest';

export default class ChatAPI {
  constructor() {
    this.baseUrl = 'https://chatbackend-w37r.onrender.com';
  }

  async registerUser(name) {
    return createRequest({
      url: `${this.baseUrl}/new-user`,
      method: 'POST',
      body: { name },
    });
  }
}
