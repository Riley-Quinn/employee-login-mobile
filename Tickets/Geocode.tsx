export const reverseGeocode = async (latitude: any, longitude: any) => {
  const latNum = Number(latitude);
  const lonNum = Number(longitude);

  if (!latNum || !lonNum) return 'Location data not available';

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latNum}&lon=${lonNum}&zoom=18&addressdetails=1`;
    console.log('Reverse geocode URL:', url);

    const response = await fetch(url, {
      headers: {
        Referer: 'myapp://',
        'Accept-Language': 'en',
      },
    });

    if (!response.ok) {
      console.log('Reverse geocode HTTP error:', response.status);
      return 'Location unknown';
    }

    const data = await response.json();
    console.log('Reverse geocode response data:', data);

    if (data.error) {
      return 'Location unknown';
    }

    const address = data.address || {};
    const locationParts = [
      address.road,
      address.suburb,
      address.neighbourhood,
      address.city_district,
      address.city,
      address.state,
    ].filter(Boolean);

    return locationParts.join(', ') || 'Location unknown';
  } catch (error) {
    console.log('Reverse geocode fetch error:', error);
    return 'Location unknown';
  }
};
