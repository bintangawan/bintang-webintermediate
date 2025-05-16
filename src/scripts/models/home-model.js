import ApiService from '../data/api-service';

class HomeModel {
  constructor() {
    this._stories = [];
  }

  async getStories(page = 1, size = 10, withLocation = 1) {
    try {
      const response = await ApiService.getAllStories(page, size, withLocation);

      if (response.error) {
        throw new Error(response.message || 'Gagal memuat cerita');
      }

      this._stories = response.listStory;
      return this._stories;
    } catch (error) {
      console.error('Error in getStories:', error);
      throw error;
    }
  }

  async getDetail(id) {
    try {
      const response = await ApiService.getStoryDetail(id);

      if (response.error) {
        throw new Error(response.message || 'Gagal memuat detail cerita');
      }

      return response.story;
    } catch (error) {
      console.error('Error in getStoryDetail:', error);
      throw error;
    }
  }
}

export default HomeModel;
