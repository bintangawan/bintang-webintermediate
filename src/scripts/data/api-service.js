import { ACCESS_TOKEN_KEY, BASE_URL } from '../config';

class ApiService {
  static async register({ name, email, password }) {
    const response = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });
    const responseJson = await response.json();
    return responseJson;
  }

  static async login({ email, password }) {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const responseJson = await response.json();
    return responseJson;
  }

  static async getAllStories(page = 1, size = 10, location = 0) {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    const response = await fetch(
      `${BASE_URL}/stories?page=${page}&size=${size}&location=${location}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const responseJson = await response.json();
    return responseJson;
  }

  static getToken() {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      throw new Error('Silakan login terlebih dahulu');
    }
    return token;
  }

  static async getStoryDetail(id) {
    try {
      const token = this.getToken();
      // Gunakan ID apa adanya
      const url = `${BASE_URL}/stories/${id}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error response:', errorData);

        if (response.status === 401) {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          throw new Error('Sesi telah berakhir, silakan login kembali');
        } else if (response.status === 404) {
          throw new Error('Cerita tidak ditemukan');
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const responseJson = await response.json();
      console.log('Story detail response:', responseJson);
      return responseJson;
    } catch (error) {
      console.error('Error in getStoryDetail:', error);
      if (
        error.message === 'Silakan login terlebih dahulu' ||
        error.message === 'Sesi telah berakhir, silakan login kembali'
      ) {
        window.location.hash = '#/login';
      }
      throw error;
    }
  }

  static async addStory({ description, photo, lat, lon }) {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    const formData = new FormData();
    formData.append('description', description);
    formData.append('photo', photo);
    if (lat) formData.append('lat', lat);
    if (lon) formData.append('lon', lon);

    const response = await fetch(`${BASE_URL}/stories`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const responseJson = await response.json();
    return responseJson;
  }

  static async subscribeNotification({ endpoint, keys }) {
    const token = this.getToken();
    const response = await fetch(`${BASE_URL}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint,
        keys,
      }),
    });
    const responseJson = await response.json();
    return responseJson;
  }

  static async unsubscribeNotification(endpoint) {
    const token = this.getToken();
    const response = await fetch(`${BASE_URL}/notifications/subscribe`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ endpoint }),
    });
    const responseJson = await response.json();
    return responseJson;
  }
}

export default ApiService;
