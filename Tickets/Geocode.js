export const reverseGeocode = async (latitude, longitude) => {
  if (!latitude || !longitude) return 'Location data not available';

  try {
    const url = new URL(
      'https://api.bigdatacloud.net/data/reverse-geocode-client',
    );
    url.searchParams.set('latitude', latitude);
    url.searchParams.set('longitude', longitude);
    url.searchParams.set('localityLanguage', 'en');

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.log('Reverse geocode HTTP error:', response.status);
      return 'Location unknown';
    }

    const data = await response.json();
    if (!data) return 'Location unknown';

    const addressParts = [
      data.city,
      data.locality,
      data.principalSubdivision,
      data.countryName,
    ].filter(Boolean);

    return addressParts.join(', ') || 'Location unknown';
  } catch (error) {
    console.log('Reverse geocode fetch error:', error);
    return 'Location unknown';
  }
};
