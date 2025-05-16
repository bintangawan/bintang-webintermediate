import { MAP_SERVICE_API_KEY } from '../config';

export const getLocationName = async (lat, lon) => {
  try {
    const response = await fetch(
      `https://api.maptiler.com/geocoding/${lon},${lat}.json?key=${MAP_SERVICE_API_KEY}`,
    );
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const place = data.features[0];
      // MapTiler mengembalikan data dalam format yang berbeda
      const city = place.place_name?.split(',')[0] || '';
      const country =
        place.context?.find((c) => c.id.startsWith('country'))?.text ||
        place.place_name?.split(',').pop().trim() ||
        '';

      return `${city}${city && country ? ', ' : ''}${country}`;
    }
    return 'Location not available';
  } catch (error) {
    console.error('Error getting location name:', error);
    return 'Error getting location';
  }
};
