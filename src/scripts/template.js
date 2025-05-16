export const createStoryItemTemplate = (story) => {
  // Gunakan ID asli dari API untuk view transition
  const storyId = story.id;
  // Bersihkan ID untuk map container
  const mapId = story.id.replace('story-', '');
  const formattedDate = new Date(story.createdAt).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
      <article class="story-item" style="view-transition-name: ${story.id}">
        <img
          class="story-item__image"
          src="${story.photoUrl}"
          alt="${story.description}"
          loading="lazy"
        />
        <div class="story-item__content">
          <div class="story-detail__date">
            <i class="fas fa-calendar-alt"></i> ${formattedDate}
          </div>
          <h3 class="story-item__title">${story.name}</h3>
          <p class="story-item__description">${story.description}</p>
          <a href="#/stories/${story.id}" class="story-item__link">Read More</a>
        </div>
      </article>
    `;
};

export const createStoryDetailTemplate = (story) => {
  const storyId = story.id;
  const mapId = story.id.replace('story-', '');
  const formattedDate = new Date(story.createdAt).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
        <article class="story-detail" style="view-transition-name: ${story.id}">
          <div class="story-detail__header">
            <h2 class="text-center">${story.name}</h2>
            <div class="story-detail__meta">
              <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(story.name)}&background=random" alt="${story.name}" class="author-avatar">
              <div class="story-detail__date">
                <i class="fas fa-calendar-alt"></i> ${formattedDate}
              </div>
              <button id="bookmark-btn" class="bookmark-btn" data-id="${story.id}" aria-label="Bookmark cerita ini">
                <i class="fas fa-bookmark"></i> Bookmark
              </button>
            </div>
          </div>
          
          <div class="story-detail__image-container">
            <img
              src="${story.photoUrl}"
              alt="${story.description}"
              class="story-detail__image"
              onerror="this.onerror=null; this.src='src/public/images/placeholder.jpg';"
            />
          </div>
          
          <div class="story-detail__content">
            <div class="story-detail__description-container text-center">
              <p class="story-detail__description">${story.description}</p>
            </div>
            
            ${story.lat && story.lon
                ? `
              <div class="story-detail__location">
                <h3 class="text-center"><i class="fas fa-map-marker-alt"></i> Location</h3>
                <div class="location-info text-center">
                  <span id="location-${mapId}">Getting location...</span>
                </div>
                <div id="map-${mapId}" class="story-detail__map" role="complementary" aria-label="Story location on map"></div>
              </div>
            `
                : ''}
            
            <div class="text-center">
              <a href="#/home" class="btn-back-home">Back to Home</a>
            </div>
          </div>
        </article>
    `;
};

// Template untuk item bookmark di halaman bookmark
export const createBookmarkItemTemplate = (story) => {
  const formattedDate = new Date(story.createdAt).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
      <article class="story-item bookmark-item">
        <img
          class="story-item__image"
          src="${story.photoUrl}"
          alt="${story.description}"
          loading="lazy"
        />
        <div class="story-item__content">
          <div class="story-detail__date">
            <i class="fas fa-calendar-alt"></i> ${formattedDate}
          </div>
          <h3 class="story-item__title">${story.name}</h3>
          <p class="story-item__description">${story.description}</p>
          <div class="bookmark-actions">
            <a href="#/stories/${story.id}" class="story-item__link">Read More</a>
            <button class="remove-bookmark-btn" data-id="${story.id}" aria-label="Hapus dari bookmark">
              <i class="fas fa-trash"></i> Hapus
            </button>
          </div>
        </div>
      </article>
    `;
};
