/**
 * Haversine formula to calculate the great-circle distance
 * between two points on Earth given their lat/lng in degrees.
 * Returns distance in kilometers.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371 // Earth's radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Format distance for display.
 * Shows "< 1 km" for very close, otherwise rounds to nearest km.
 */
export function formatDistance(km: number): string {
  if (km < 1) return '< 1 km'
  return `${Math.round(km)} km`
}
