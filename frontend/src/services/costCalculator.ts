// 동적 비용 계산 - 거리 기반 (하드코딩 없음)

import { COST_CONSTANTS } from '../config/api';

export type TransportMode = 'flight' | 'train' | 'bus' | 'car';
export type AccommodationType = 'budget' | 'standard' | 'premium';

/**
 * 거리와 교통수단으로 비용 계산
 */
export const calculateTransportCost = (
  distanceKm: number,
  mode: TransportMode
): number => {
  const costPerKm = COST_CONSTANTS.TRANSPORT[mode];

  // 거리별 할인 적용 (장거리일수록 km당 단가 감소)
  let discount = 1.0;
  if (distanceKm > 500) discount = 0.85;
  else if (distanceKm > 300) discount = 0.9;
  else if (distanceKm > 100) discount = 0.95;

  const baseCost = distanceKm * costPerKm * discount;

  // 항공은 기본 요금 추가 (공항세 등)
  const airportFee = mode === 'flight' ? 15000 : 0;

  return Math.round(baseCost + airportFee);
};

/**
 * 거리와 교통수단으로 이동 시간 계산 (분)
 */
export const calculateTransportDuration = (
  distanceKm: number,
  mode: TransportMode
): number => {
  const speedKmH = COST_CONSTANTS.SPEED[mode];
  const travelTimeHours = distanceKm / speedKmH;

  // 대기/체크인 시간 추가
  let waitingTime = 0;
  if (mode === 'flight') waitingTime = 120;      // 2시간 (체크인+보딩)
  else if (mode === 'train') waitingTime = 30;   // 30분
  else if (mode === 'bus') waitingTime = 20;     // 20분

  const totalMinutes = (travelTimeHours * 60) + waitingTime;

  return Math.round(totalMinutes);
};

/**
 * 숙박 비용 계산 (지역, 등급, 박수 기반)
 */
export const calculateAccommodationCost = (
  type: AccommodationType,
  nights: number,
  isPopularDestination: boolean = false
): number => {
  const basePrice = COST_CONSTANTS.ACCOMMODATION[type];

  // 인기 지역은 30% 할증
  const popularityMultiplier = isPopularDestination ? 1.3 : 1.0;

  // 장기 숙박 할인 (3박 이상 5% 할인)
  const longStayDiscount = nights >= 3 ? 0.95 : 1.0;

  const totalCost = basePrice * nights * popularityMultiplier * longStayDiscount;

  return Math.round(totalCost);
};

/**
 * 명소 입장료 추정 (카테고리 기반)
 */
export const estimateAttractionFee = (
  kinds: string,
  rate: number = 3
): number => {
  const kindsLower = kinds.toLowerCase();

  // 무료 카테고리
  const freeCategories = ['parks', 'natural', 'beaches', 'view_points', 'squares'];
  if (freeCategories.some(cat => kindsLower.includes(cat))) {
    return 0;
  }

  // 저렴한 카테고리
  const cheapCategories = ['churches', 'monuments', 'memorials'];
  if (cheapCategories.some(cat => kindsLower.includes(cat))) {
    return COST_CONSTANTS.ATTRACTION_FEE.cheap;
  }

  // 고급 카테고리
  const premiumCategories = ['amusements', 'theatres', 'zoos', 'aquariums'];
  if (premiumCategories.some(cat => kindsLower.includes(cat))) {
    return COST_CONSTANTS.ATTRACTION_FEE.premium;
  }

  // 일반 카테고리 (박물관, 궁전 등) - 인기도 기반
  if (rate >= 5) {
    return COST_CONSTANTS.ATTRACTION_FEE.premium;
  } else if (rate >= 3) {
    return COST_CONSTANTS.ATTRACTION_FEE.standard;
  } else {
    return COST_CONSTANTS.ATTRACTION_FEE.cheap;
  }
};

/**
 * 총 여행 비용 계산
 */
export interface TripCost {
  transport: number;
  accommodation: number;
  attractions: number;
  meals: number;          // 식비
  miscellaneous: number;  // 기타 (10%)
  total: number;
}

export const calculateTotalTripCost = (
  transportCost: number,
  accommodationCost: number,
  attractionsCost: number,
  duration: number
): TripCost => {
  // 식비: 1일 3만원 기준
  const meals = duration * 30000;

  // 기타 비용: (교통+숙박+명소+식비)의 10%
  const subtotal = transportCost + accommodationCost + attractionsCost + meals;
  const miscellaneous = Math.round(subtotal * 0.1);

  const total = subtotal + miscellaneous;

  return {
    transport: transportCost,
    accommodation: accommodationCost,
    attractions: attractionsCost,
    meals,
    miscellaneous,
    total,
  };
};

/**
 * 교통수단 추천 (거리 기반)
 */
export const recommendTransportMode = (distanceKm: number): TransportMode[] => {
  const modes: TransportMode[] = [];

  // 항공 (300km 이상)
  if (distanceKm >= 300) {
    modes.push('flight');
  }

  // 기차 (50km 이상)
  if (distanceKm >= 50) {
    modes.push('train');
  }

  // 버스 (30km 이상)
  if (distanceKm >= 30) {
    modes.push('bus');
  }

  // 자가용 (500km 이하 권장)
  if (distanceKm <= 500) {
    modes.push('car');
  }

  return modes;
};
