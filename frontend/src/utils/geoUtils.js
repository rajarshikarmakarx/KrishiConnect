/**
 * KrishiConnect Geographic & Routing Utilities
 * West Bengal coordinates dataset, OSRM road geometry fetching,
 * Haversine calculations, vehicle transit models, and Google Maps deep linking.
 */

export const WB_LOCATIONS = {
  'Howrah': [
    { village: 'Haripur', latitude: 22.5833, longitude: 88.3333 },
    { village: 'Bagnan', latitude: 22.4731, longitude: 87.9719 },
    { village: 'Uluberia', latitude: 22.4681, longitude: 88.1075 },
    { village: 'Amta', latitude: 22.5961, longitude: 87.9791 },
    { village: 'Shyampur', latitude: 22.3333, longitude: 88.0167 },
    { village: 'Domjur', latitude: 22.6394, longitude: 88.2217 },
    { village: 'Panchla', latitude: 22.5400, longitude: 88.1400 },
    { village: 'Jagatballavpur', latitude: 22.6800, longitude: 88.1000 },
    { village: 'Sankrail', latitude: 22.5694, longitude: 88.2417 },
    { village: 'Bally', latitude: 22.6500, longitude: 88.3400 },
  ],
  'Hooghly': [
    { village: 'Singur', latitude: 22.8100, longitude: 88.2300 },
    { village: 'Tarakeswar', latitude: 22.8900, longitude: 88.0200 },
    { village: 'Pandua', latitude: 23.0800, longitude: 88.2800 },
    { village: 'Polba', latitude: 22.9600, longitude: 88.3000 },
    { village: 'Arambagh', latitude: 22.8800, longitude: 87.7800 },
    { village: 'Chinsurah', latitude: 22.9000, longitude: 88.3900 },
    { village: 'Chandannagar', latitude: 22.8700, longitude: 88.3700 },
    { village: 'Serampore', latitude: 22.7500, longitude: 88.3400 },
    { village: 'Haripal', latitude: 22.8300, longitude: 88.1200 },
    { village: 'Balagarh', latitude: 23.1200, longitude: 88.4600 },
  ],
  'Purba Bardhaman': [
    { village: 'Memari', latitude: 23.1800, longitude: 88.1200 },
    { village: 'Kalna', latitude: 23.2200, longitude: 88.3700 },
    { village: 'Katwa', latitude: 23.6400, longitude: 88.1300 },
    { village: 'Galsi', latitude: 23.3300, longitude: 87.6900 },
    { village: 'Jamalpur', latitude: 23.0500, longitude: 88.0000 },
    { village: 'Raina', latitude: 23.0800, longitude: 87.9000 },
    { village: 'Bardhaman Sadar', latitude: 23.2400, longitude: 87.8600 },
    { village: 'Bardhaman', latitude: 23.2400, longitude: 87.8600 },
    { village: 'Monteswar', latitude: 23.4200, longitude: 88.1100 },
    { village: 'Bhatar', latitude: 23.4200, longitude: 87.9100 },
  ],
  'Nadia': [
    { village: 'Krishnanagar', latitude: 23.4000, longitude: 88.5000 },
    { village: 'Ranaghat', latitude: 23.1800, longitude: 88.5800 },
    { village: 'Shantipur', latitude: 23.2500, longitude: 88.4300 },
    { village: 'Chakdaha', latitude: 23.0800, longitude: 88.5200 },
    { village: 'Nakashipara', latitude: 23.5800, longitude: 88.3500 },
    { village: 'Tehatta', latitude: 23.7500, longitude: 88.5200 },
    { village: 'Kalyani', latitude: 22.9750, longitude: 88.4344 },
    { village: 'Chapra', latitude: 23.5300, longitude: 88.5500 },
    { village: 'Karimpur', latitude: 23.9700, longitude: 88.6200 },
  ],
  'North 24 Parganas': [
    { village: 'Barasat', latitude: 22.7200, longitude: 88.4800 },
    { village: 'Basirhat', latitude: 22.6600, longitude: 88.8900 },
    { village: 'Habra', latitude: 22.8300, longitude: 88.6300 },
    { village: 'Bongaon', latitude: 23.0400, longitude: 88.8200 },
    { village: 'Deganga', latitude: 22.7000, longitude: 88.6300 },
    { village: 'Amdanga', latitude: 22.8100, longitude: 88.5200 },
    { village: 'Gaighata', latitude: 22.9300, longitude: 88.7300 },
    { village: 'Swarupnagar', latitude: 22.8300, longitude: 88.8700 },
    { village: 'Baduria', latitude: 22.7400, longitude: 88.7900 },
  ],
  'South 24 Parganas': [
    { village: 'Baruipur', latitude: 22.3600, longitude: 88.4300 },
    { village: 'Diamond Harbour', latitude: 22.1900, longitude: 88.1900 },
    { village: 'Canning', latitude: 22.3100, longitude: 88.6600 },
    { village: 'Kakdwip', latitude: 21.8800, longitude: 88.1900 },
    { village: 'Joynagar', latitude: 22.1700, longitude: 88.4200 },
    { village: 'Gosaba', latitude: 22.1600, longitude: 88.8000 },
    { village: 'Sonarpur', latitude: 22.4400, longitude: 88.4300 },
    { village: 'Amtala', latitude: 22.3700, longitude: 88.2600 },
    { village: 'Kulpi', latitude: 22.0800, longitude: 88.2400 },
  ],
}

// Fallback District Centroids
export const DISTRICT_CENTROIDS = {
  'Howrah': { latitude: 22.5937, longitude: 88.2636 },
  'Hooghly': { latitude: 22.8963, longitude: 88.2461 },
  'Purba Bardhaman': { latitude: 23.2324, longitude: 87.8615 },
  'Nadia': { latitude: 23.4710, longitude: 88.5565 },
  'North 24 Parganas': { latitude: 22.7200, longitude: 88.4800 },
  'South 24 Parganas': { latitude: 22.1800, longitude: 88.4000 },
  'Kolkata': { latitude: 22.5726, longitude: 88.3639 },
}

/**
 * Resolve coordinates for a village / district from local dataset
 */
export function findVillageCoordinates(village, district) {
  const cleanV = village?.trim()?.toLowerCase()
  const cleanD = district?.trim()?.toLowerCase()

  if (!cleanV && !cleanD) {
    return { village: 'Haripur', district: 'Howrah', latitude: 22.5833, longitude: 88.3333 }
  }

  // 1. Direct search in district if provided
  if (cleanD) {
    for (const [distName, vList] of Object.entries(WB_LOCATIONS)) {
      if (distName.toLowerCase() === cleanD || cleanD.includes(distName.toLowerCase())) {
        if (cleanV) {
          const match = vList.find(v => v.village.toLowerCase() === cleanV || cleanV.includes(v.village.toLowerCase()))
          if (match) return { ...match, district: distName }
        }
        if (vList.length > 0) return { ...vList[0], district: distName }
      }
    }
  }

  // 2. Global search across all districts for village match
  if (cleanV) {
    for (const [distName, vList] of Object.entries(WB_LOCATIONS)) {
      const match = vList.find(v => v.village.toLowerCase() === cleanV || cleanV.includes(v.village.toLowerCase()))
      if (match) return { ...match, district: distName }
    }
  }

  // 3. Fallback to district centroid or default Howrah
  if (cleanD) {
    for (const [distName, coords] of Object.entries(DISTRICT_CENTROIDS)) {
      if (distName.toLowerCase() === cleanD || cleanD.includes(distName.toLowerCase())) {
        return { village: village || distName, district: distName, ...coords }
      }
    }
  }

  return { village: village || 'Haripur', district: district || 'Howrah', latitude: 22.5833, longitude: 88.3333 }
}

/**
 * Haversine Great-Circle Distance (in km)
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 10) / 10
}

/**
 * Generate a subtle curved polyline between origin and destination for graceful fallback rendering
 */
export function generateCurvedPolyline(origin, dest, numPoints = 12) {
  const [lat1, lon1] = origin
  const [lat2, lon2] = dest
  const points = []

  // Midpoint with a small lateral offset perpendicular to the line
  const midLat = (lat1 + lat2) / 2
  const midLon = (lon1 + lon2) / 2

  const dLat = lat2 - lat1
  const dLon = lon2 - lon1
  const offset = 0.008 // subtle geodesic curve

  const ctrlLat = midLat - dLon * offset
  const ctrlLon = midLon + dLat * offset

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints
    // Quadratic Bezier interpolation
    const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * ctrlLat + t * t * lat2
    const lon = (1 - t) * (1 - t) * lon1 + 2 * (1 - t) * t * ctrlLon + t * t * lon2
    points.push([lat, lon])
  }

  return points
}

/**
 * Fetch true road route geometry from public OSRM Routing API with fallback
 */
export async function fetchRoadRoute(originLat, originLon, destLat, destLon) {
  const origin = [originLat, originLon]
  const dest = [destLat, destLon]
  const straightDistance = calculateHaversineDistance(originLat, originLon, destLat, destLon)

  // Default fallback if OSRM is unreachable
  const fallbackResult = {
    coordinates: generateCurvedPolyline(origin, dest),
    distanceKm: Math.max(1, Math.round(straightDistance * 1.28 * 10) / 10),
    durationMinutes: Math.max(2, Math.round(((straightDistance * 1.28) / 32) * 60)),
    isRoadRoute: false,
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2800)

    const url = `https://router.project-osrm.org/route/v1/driving/${originLon},${originLat};${destLon},${destLat}?overview=full&geometries=geojson`
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!res.ok) return fallbackResult

    const data = await res.json()
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0]
      // GeoJSON coordinates are [lon, lat], Leaflet polyline expects [lat, lon]
      const coords = route.geometry.coordinates.map(([lon, lat]) => [lat, lon])
      const distKm = Math.round((route.distance / 1000) * 10) / 10
      const durMins = Math.round(route.duration / 60)

      return {
        coordinates: coords,
        distanceKm: distKm,
        durationMinutes: durMins,
        isRoadRoute: true,
      }
    }
  } catch (err) {
    // Graceful fallback to geodesic curve
  }

  return fallbackResult
}

/**
 * Calculate transit time estimates across standard rural transport modes
 */
export function calculateTransitEstimates(distanceKm) {
  const dist = Math.max(0.5, distanceKm || 1)

  return {
    tractorMinutes: Math.max(1, Math.round((dist / 22) * 60)), // ~22 km/h heavy trolley
    tempoMinutes: Math.max(1, Math.round((dist / 32) * 60)),   // ~32 km/h cargo tempo
    bikeMinutes: Math.max(1, Math.round((dist / 40) * 60)),    // ~40 km/h motorbike
  }
}

/**
 * Generate Google Maps navigation deep link URL
 */
export function getGoogleMapsNavigationUrl(originLat, originLon, destLat, destLon) {
  return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLon}&destination=${destLat},${destLon}&travelmode=driving`
}
