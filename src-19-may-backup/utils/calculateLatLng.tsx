export const calculateDistance = (
  userLat: number,
  userLng: number,
  mecLatitude: number,
  mecLongitude: number
): number => {
  // Convert latitude and longitude from degrees to radians
  const userLatRad = (userLat * Math.PI) / 180;
  const mecLatRad = (mecLatitude * Math.PI) / 180;
  const latDiffRad = ((mecLatitude - userLat) * Math.PI) / 180;
  const lngDiffRad = ((mecLongitude - userLng) * Math.PI) / 180;

  // Earth's radius in kilometers
  const R = 6371;

  // Haversine formula
  const a =
    Math.sin(latDiffRad / 2) * Math.sin(latDiffRad / 2) +
    Math.cos(userLatRad) *
      Math.cos(mecLatRad) *
      Math.sin(lngDiffRad / 2) *
      Math.sin(lngDiffRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Calculate distance in kilometers and convert to miles
  const distanceInMiles = R * c * 0.621371;

  // Return distance rounded to 1 decimal place
  return Math.round(distanceInMiles * 10) / 10;
};
