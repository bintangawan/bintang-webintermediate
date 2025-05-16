import { openDB } from 'idb';

const DATABASE_NAME = 'story-app-db';
const DATABASE_VERSION = 1;
const OBJECT_STORE_NAME = 'favorite-stories';

const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(database) {
    database.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
  },
});

const FavoriteStoryIdb = {
  async getStory(id) {
    if (!id) {
      return null;
    }
    
    return (await dbPromise).get(OBJECT_STORE_NAME, id);
  },

  async getAllStories() {
    return (await dbPromise).getAll(OBJECT_STORE_NAME);
  },

  async putStory(story) {
    if (!story.id) {
      return null;
    }
    
    return (await dbPromise).put(OBJECT_STORE_NAME, story);
  },

  async deleteStory(id) {
    return (await dbPromise).delete(OBJECT_STORE_NAME, id);
  },

  async searchStories(query) {
    const allStories = await this.getAllStories();
    return allStories.filter((story) => {
      const loweredCaseQuery = query.toLowerCase();
      return story.name.toLowerCase().includes(loweredCaseQuery) || 
             story.description.toLowerCase().includes(loweredCaseQuery);
    });
  },
};

export default FavoriteStoryIdb;