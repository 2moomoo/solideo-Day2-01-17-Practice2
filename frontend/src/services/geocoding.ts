// Nominatim (OpenStreetMap) 지오코딩 서비스

import { API_CONFIG, getHeaders } from '../config/api';

export interface Coordinates {
  lat: number;
  lon: number;
  display_name: string;
}

/**
 * 주소/도시명을 좌표로 변환 (Geocoding)
 */
export const geocode = async (address: string): Promise<Coordinates | null> => {
  try {
    const url = `${API_CONFIG.NOMINATIM_BASE_URL}/search?` + new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
      'accept-language': 'ko',
    });

    const response = await fetch(url, {
      headers: {
        ...getHeaders(),
        'User-Agent': 'TravelRouteApp/1.0', // Nominatim 필수
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.length === 0) {
      console.warn(`No results found for address: ${address}`);
      return null;
    }

    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      display_name: result.display_name,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

/**
 * 좌표를 주소로 변환 (Reverse Geocoding)
 */
export const reverseGeocode = async (lat: number, lon: number): Promise<string | null> => {
  try {
    const url = `${API_CONFIG.NOMINATIM_BASE_URL}/reverse?` + new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      format: 'json',
      'accept-language': 'ko',
    });

    const response = await fetch(url, {
      headers: {
        ...getHeaders(),
        'User-Agent': 'TravelRouteApp/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.display_name || null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};

/**
 * 두 좌표 간 거리 계산 (Haversine formula, km)
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // 지구 반경 (km)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg: number): number => {
  return deg * (Math.PI / 180);
};
