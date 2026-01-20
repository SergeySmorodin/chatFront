const createRequest = async (options) => {
    const { url, method = 'GET', body = null, headers = {} } = options;
  
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };
  
    if (body) {
      config.body = JSON.stringify(body);
    }
  
    try {
      const response = await fetch(url, config);
      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (error) {
      console.error('Request failed:', error);
      return { ok: false, status: 0, data: null };
    }
  };
  
  export default createRequest;
