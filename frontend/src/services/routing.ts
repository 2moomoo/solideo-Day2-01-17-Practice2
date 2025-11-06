// OpenRouteService 경로 탐색 API

import { API_CONFIG } from '../config/api';
import { Coordinates } from './geocoding';

export interface RouteSegment {
  distance: number;      // km
  duration: number;      // 초
  steps: RouteStep[];
}

export interface RouteStep {
  distance: number;
  duration: number;
  instruction: string;
  name?: string;
}

/**
 * 두 지점 간 최적 경로 조회 (자동차 기준)
 */
export const getRoute = async (
  start: Coordinates,
  end: Coordinates,
  profile: 'driving-car' | 'foot-walking' | 'cycling-regular' = 'driving-car'
): Promise<RouteSegment | null> => {
  try {
    const url = `${API_CONFIG.OPENROUTE_BASE_URL}/directions/${profile}`;

    const body = {
      coordinates: [
        [start.lon, start.lat],
        [end.lon, end.lat],
      ],
      instructions: true,
      units: 'km',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': API_CONFIG.OPENROUTE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Route API error:', error);
      return null;
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return null;
    }

    const route = data.routes[0];
    const segment = route.segments[0];

    return {
      distance: route.summary.distance, // km
      duration: route.summary.duration, // 초
      steps: segment.steps.map((step: any) => ({
        distance: step.distance,
        duration: step.duration,
        instruction: step.instruction,
        name: step.name,
      })),
    };
  } catch (error) {
    console.error('Route calculation error:', error);
    return null;
  }
};

/**
 * 여러 지점을 경유하는 경로 조회
 */
export const getMultiPointRoute = async (
  points: Coordinates[],
  profile: 'driving-car' | 'foot-walking' | 'cycling-regular' = 'driving-car'
): Promise<RouteSegment | null> => {
  try {
    if (points.length < 2) {
      throw new Error('At least 2 points required');
    }

    const url = `${API_CONFIG.OPENROUTE_BASE_URL}/directions/${profile}`;

    const body = {
      coordinates: points.map(p => [p.lon, p.lat]),
      instructions: true,
      units: 'km',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': API_CONFIG.OPENROUTE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Multi-point route API error:', error);
      return null;
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return null;
    }

    const route = data.routes[0];

    // 모든 세그먼트의 스텝 합치기
    const allSteps: RouteStep[] = [];
    route.segments.forEach((segment: any) => {
      segment.steps.forEach((step: any) => {
        allSteps.push({
          distance: step.distance,
          duration: step.duration,
          instruction: step.instruction,
          name: step.name,
        });
      });
    });

    return {
      distance: route.summary.distance,
      duration: route.summary.duration,
      steps: allSteps,
    };
  } catch (error) {
    console.error('Multi-point route calculation error:', error);
    return null;
  }
};
