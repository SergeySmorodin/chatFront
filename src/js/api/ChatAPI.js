import createRequest from './createRequest';

export default class ChatAPI {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
  }

  async registerUser(name) {
    return createRequest({
      url: `${this.baseUrl}/new-user`,
      method: 'POST',
      body: { name },
    });
  }
}
