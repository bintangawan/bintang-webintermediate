import ApiService from '../data/api-service';

class StoryModel {
  constructor() {
    this._stories = [];
  }

  async getStories(page = 1, size = 10, withLocation = 1) {
    const response = await ApiService.getAllStories(page, size, withLocation);
    this._stories = response.listStory;
    return this._stories;
  }

  async getDetail(id) {
    // ID digunakan apa adanya, tidak perlu dibersihkan
    const response = await ApiService.getStoryDetail(id);
    return response.story;
  }

  async addStory(storyData) {
    return await ApiService.addStory(storyData);
  }
}

export default StoryModel;
