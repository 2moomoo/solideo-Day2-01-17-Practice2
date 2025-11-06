// Enhanced Route Search with Google APIs, TSP, Time Validation, and Caching

import { TravelRequest, RouteCandidate, SearchResult, ScoringWeights, TransportOption, AccommodationOption, AttractionOption } from '../types';
import { geocode, calculateDistance, Coordinates } from './geocoding';
import { googleGeocode, googleDirections, googlePlacesNearby, mapPreferencesToGoogleTypes } from './googleMaps';
import { getRoute } from './routing';
import { searchAttractions, mapPreferencesToKinds } from './attractions';
import { calculateTransportCost, calculateTransportDuration, calculateAccommodationCost, estimateAttractionFee, recommendTransportMode, TransportMode, AccommodationType } from './costCalculator';
import { TSPOptimizer, City } from './tspOptimizer';
import { validateTransportChain, ScheduleGenerator } from './timeValidator';
import { globalCache } from './cache';
import { hasGoogleMapsKey } from '../config/api';

const MAX_ITERATIONS = 4;
const TOP_N_CANDIDATES = 8;
const MIN_SCORE_THRESHOLD = 0.55;

export class EnhancedRouteSearchService {
  private tspOptimizer = new TSPOptimizer();
  private scheduleGenerator = new ScheduleGenerator();

  /**
   * 메인 검색 함수 (고도화 버전)
   */
  async search(request: TravelRequest, onProgress?: (message: string) => void): Promise<SearchResult> {
    let iterations = 0;
    let weights: ScoringWeights = {
      cost: 0.45,
      time: 0.3,
      preference: 0.2,
      fatigue: 0.05,
    };
    let bestCandidates: RouteCandidate[] = [];

    const log = (msg: string) => {
      console.log(msg);
      onProgress?.(msg);
    };

    log(`🚀 Enhanced Search 시작: ${request.departure} → ${request.destination}`);

    try {
      // === STEP 1: 지오코딩 (Google API 우선) ===
      log('📍 지오코딩 중... (Google Maps / Nominatim)');

      const [departureCoords, destinationCoords] = await Promise.all([
        this.smartGeocode(request.departure, log),
        this.smartGeocode(request.destination, log),
      ]);

      if (!departureCoords || !destinationCoords) {
        throw new Error('위치를 찾을 수 없습니다');
      }

      log(`✅ 출발: ${departureCoords.display_name}`);
      log(`✅ 도착: ${destinationCoords.display_name}`);

      // === STEP 2: 경로 계산 (Google Directions 우선) ===
      log('🗺️ 경로 계산 중... (Google Maps / OpenRouteService)');

      const routeInfo = await this.smartRouteCalculation(
        departureCoords,
        destinationCoords,
        log
      );

      log(`✅ 거리: ${routeInfo.distance.toFixed(1)}km, 소요시간: ${Math.floor(routeInfo.duration / 60)}시간 ${routeInfo.duration % 60}분`);

      // === STEP 3: 명소 검색 (Google Places 우선) ===
      log('🎯 명소 검색 중... (Google Places / OpenTripMap)');

      const attractions = await this.smartAttractionSearch(
        destinationCoords,
        request.preferences,
        log
      );

      log(`✅ ${attractions.length}개 명소 발견`);

      // === STEP 4: 다단계 최적화 루프 ===
      do {
        iterations++;
        log(`\n🔄 최적화 Cycle ${iterations}/${MAX_ITERATIONS}`);
        log(`   가중치: cost=${(weights.cost * 100).toFixed(0)}% time=${(weights.time * 100).toFixed(0)}% pref=${(weights.preference * 100).toFixed(0)}%`);

        // 교통 옵션 생성 (다양한 시간대)
        const transportOptions = this.generateSmartTransportOptions(
          request.departure,
          request.destination,
          departureCoords,
          destinationCoords,
          routeInfo.distance,
          routeInfo.duration,
          request.startDate
        );

        // 숙박 옵션 생성
        const accommodationOptions = this.generateAccommodationOptions(
          request.destination,
          request.duration,
          request.budget
        );

        // 명소 옵션 필터링 및 정렬
        const topAttractions = this.selectBestAttractions(
          attractions,
          request.preferences,
          Math.min(request.duration * 3, 10)
        );

        log(`   • 교통: ${transportOptions.length}개 옵션`);
        log(`   • 숙박: ${accommodationOptions.length}개 등급`);
        log(`   • 명소: ${topAttractions.length}개 선택`);

        // 조합 생성 (시간 검증 포함)
        const combinations = this.generateValidCombinations(
          transportOptions,
          accommodationOptions,
          topAttractions,
          request
        );

        log(`   • 유효 조합: ${combinations.length}개 생성`);

        if (combinations.length === 0) {
          log('   ⚠️ 유효한 조합이 없습니다. 조건을 완화합니다.');
          weights.cost = Math.max(0.3, weights.cost - 0.1);
          continue;
        }

        // 스코어링
        bestCandidates = this.scoreAndRank(combinations, request, weights);

        const topScore = bestCandidates[0]?.score || 0;
        log(`   • 최고 점수: ${(topScore * 100).toFixed(1)}점`);

        // 종료 조건
        if (topScore >= MIN_SCORE_THRESHOLD) {
          log(`\n✅ 목표 점수 달성! (>= ${(MIN_SCORE_THRESHOLD * 100).toFixed(0)}점)`);
          break;
        }

        // 가중치 조정
        weights = this.smartWeightAdjustment(weights, bestCandidates, request, iterations);

      } while (iterations < MAX_ITERATIONS);

      log(`\n🎉 탐색 완료! ${bestCandidates.length}개 경로 발견 (${iterations}회 반복)`);

      return {
        candidates: bestCandidates.slice(0, TOP_N_CANDIDATES),
        iterations,
        weights,
      };

    } catch (error) {
      console.error('Enhanced search error:', error);
      throw error;
    }
  }

  /**
   * 스마트 지오코딩 (Google API → Nominatim fallback)
   */
  private async smartGeocode(address: string, log: (msg: string) => void): Promise<Coordinates | null> {
    return globalCache.withCache(
      'geocode',
      { address },
      async () => {
        // Google API 우선 시도
        if (hasGoogleMapsKey()) {
          const googleResult = await googleGeocode(address);
          if (googleResult) {
            log(`   • Google: ${address}`);
            return googleResult;
          }
        }

        // Nominatim fallback
        const nominatimResult = await geocode(address);
        if (nominatimResult) {
          log(`   • Nominatim: ${address}`);
        }
        return nominatimResult;
      },
      3600000 // 1시간
    );
  }

  /**
   * 스마트 경로 계산 (Google Directions → OpenRouteService fallback)
   */
  private async smartRouteCalculation(
    start: Coordinates,
    end: Coordinates,
    log: (msg: string) => void
  ): Promise<{ distance: number; duration: number }> {
    return globalCache.withCache(
      'route',
      { start, end },
      async () => {
        // Google Directions API 시도
        if (hasGoogleMapsKey()) {
          const googleResult = await googleDirections(start, end);
          if (googleResult) {
            log(`   • Google Directions 사용`);
            return {
              distance: googleResult.distance,
              duration: Math.round(googleResult.duration / 60), // 초 → 분
            };
          }
        }

        // OpenRouteService fallback
        const orsResult = await getRoute(start, end);
        if (orsResult) {
          log(`   • OpenRouteService 사용`);
          return {
            distance: orsResult.distance,
            duration: Math.round(orsResult.duration / 60),
          };
        }

        // 최후의 수단: 직선 거리 × 1.3
        const straightDistance = calculateDistance(start.lat, start.lon, end.lat, end.lon);
        log(`   • 직선 거리 기반 추정`);
        return {
          distance: straightDistance * 1.3,
          duration: Math.round((straightDistance * 1.3) / 80 * 60), // 80km/h 가정
        };
      },
      3600000
    );
  }

  /**
   * 스마트 명소 검색 (Google Places → OpenTripMap fallback)
   */
  private async smartAttractionSearch(
    location: Coordinates,
    preferences: string[],
    log: (msg: string) => void
  ): Promise<Array<{ name: string; location: string; types: string[]; rating: number }>> {
    return globalCache.withCache(
      'attractions',
      { location, preferences },
      async () => {
        const results: Array<{ name: string; location: string; types: string[]; rating: number }> = [];

        // Google Places API 시도
        if (hasGoogleMapsKey()) {
          const googleTypes = mapPreferencesToGoogleTypes(preferences);

          for (const type of googleTypes.slice(0, 3)) { // 최대 3개 타입
            const places = await googlePlacesNearby(location, 15000, type);

            places.forEach(place => {
              if (place.rating && place.rating >= 3.5) {
                results.push({
                  name: place.name,
                  location: place.vicinity,
                  types: place.types,
                  rating: place.rating,
                });
              }
            });
          }

          if (results.length > 0) {
            log(`   • Google Places: ${results.length}개`);
            return results;
          }
        }

        // OpenTripMap fallback
        const kinds = mapPreferencesToKinds(preferences);
        const otmPlaces = await searchAttractions(location, 15, kinds);

        otmPlaces.forEach(place => {
          results.push({
            name: place.name,
            location: `${place.point.lat.toFixed(4)}, ${place.point.lon.toFixed(4)}`,
            types: place.kinds.split(','),
            rating: (place.rate || 3) / 7 * 5, // 7점 척도 → 5점
          });
        });

        log(`   • OpenTripMap: ${results.length}개`);
        return results;
      },
      3600000
    );
  }

  /**
   * 스마트 교통 옵션 생성 (다양한 출발 시간)
   */
  private generateSmartTransportOptions(
    from: string,
    to: string,
    fromCoords: Coordinates,
    toCoords: Coordinates,
    distance: number,
    durationMinutes: number,
    startDate: string
  ): TransportOption[] {
    const options: TransportOption[] = [];
    const modes = recommendTransportMode(distance);
    const baseDate = new Date(startDate);

    // 다양한 출발 시간대 (아침, 점심, 저녁)
    const departureHours = [7, 10, 14, 17];

    modes.forEach(mode => {
      departureHours.forEach(hour => {
        const cost = calculateTransportCost(distance, mode);
        const duration = durationMinutes > 0 ? durationMinutes : calculateTransportDuration(distance, mode);

        const depTime = new Date(baseDate);
        depTime.setHours(hour, 0, 0, 0);

        const arrTime = new Date(depTime);
        arrTime.setMinutes(arrTime.getMinutes() + duration);

        options.push({
          type: mode,
          from,
          to,
          cost,
          duration,
          departureTime: depTime.toISOString(),
          arrivalTime: arrTime.toISOString(),
        });
      });
    });

    return options;
  }

  /**
   * 숙박 옵션 생성
   */
  private generateAccommodationOptions(
    location: string,
    duration: number,
    budget: number
  ): AccommodationOption[] {
    const options: AccommodationOption[] = [];
    const types: AccommodationType[] = ['budget', 'standard', 'premium'];
    const popularCities = ['서울', '부산', '제주', '경주', '강릉', '여수'];
    const isPopular = popularCities.some(city => location.includes(city));

    types.forEach(type => {
      const totalCost = calculateAccommodationCost(type, duration, isPopular);

      if (totalCost > budget * 0.5) return; // 예산의 50% 초과하면 제외

      const names: Record<AccommodationType, string> = {
        budget: `${location} 게스트하우스`,
        standard: `${location} 비즈니스 호텔`,
        premium: `${location} 프리미엄 리조트`,
      };

      const ratings: Record<AccommodationType, number> = {
        budget: 3.8,
        standard: 4.3,
        premium: 4.8,
      };

      const tags: Record<AccommodationType, string[]> = {
        budget: ['가성비', '깔끔', '친절'],
        standard: ['편안', '조식 포함', '와이파이'],
        premium: ['럭셔리', '오션뷰', '스파'],
      };

      options.push({
        name: names[type],
        location,
        costPerNight: Math.round(totalCost / duration),
        rating: ratings[type],
        tags: tags[type],
      });
    });

    return options;
  }

  /**
   * 최적 명소 선택 (취향 매칭 + 평점)
   */
  private selectBestAttractions(
    attractions: Array<{ name: string; location: string; types: string[]; rating: number }>,
    preferences: string[],
    count: number
  ): AttractionOption[] {
    // 취향 매칭 점수 계산
    const scored = attractions.map(attr => {
      let matchScore = 0;

      // 타입 매칭
      preferences.forEach(pref => {
        if (attr.types.some(type => type.toLowerCase().includes(pref.toLowerCase()))) {
          matchScore += 1;
        }
      });

      return {
        ...attr,
        matchScore,
        totalScore: matchScore * 0.6 + attr.rating * 0.4,
      };
    });

    // 정렬 및 선택
    scored.sort((a, b) => b.totalScore - a.totalScore);

    return scored.slice(0, count).map(item => ({
      name: item.name,
      location: item.location,
      entranceFee: estimateAttractionFee(item.types.join(','), item.rating),
      duration: 90, // 기본 1.5시간
      tags: item.types.slice(0, 3),
      rating: item.rating,
    }));
  }

  /**
   * 유효한 조합 생성 (시간 검증 포함)
   */
  private generateValidCombinations(
    transports: TransportOption[],
    accommodations: AccommodationOption[],
    attractions: AttractionOption[],
    request: TravelRequest
  ): RouteCandidate[] {
    const candidates: RouteCandidate[] = [];

    // 교통/숙박 조합 제한 (성능)
    const maxTransport = Math.min(transports.length, 6);
    const maxAccommodation = Math.min(accommodations.length, 3);

    for (let i = 0; i < maxTransport; i++) {
      const outbound = transports[i];

      // 왕복 교통편 (돌아올 때는 다른 시간대)
      for (let j = 0; j < maxTransport; j++) {
        const returnTrip = transports[j];

        // 시간 검증: 복귀 편은 출발 후 최소 12시간 이후
        const outboundArrival = new Date(outbound.arrivalTime);
        const returnDeparture = new Date(returnTrip.departureTime);
        const gap = (returnDeparture.getTime() - outboundArrival.getTime()) / 3600000;

        if (gap < request.duration * 12) continue; // 최소 여행 기간 미달

        for (let k = 0; k < maxAccommodation; k++) {
          const accommodation = accommodations[k];

          const transportCost = (outbound.cost + returnTrip.cost);
          const accommodationCost = accommodation.costPerNight * request.duration;
          const attractionsCost = attractions.reduce((sum, a) => sum + a.entranceFee, 0);
          const totalCost = transportCost + accommodationCost + attractionsCost;

          // 예산 체크
          if (totalCost > request.budget * 1.1) continue; // 10% 초과까지 허용

          const totalDuration =
            outbound.duration +
            returnTrip.duration +
            attractions.reduce((sum, a) => sum + a.duration, 0);

          candidates.push({
            id: `${i}-${j}-${k}`,
            transports: [outbound, returnTrip],
            accommodations: [accommodation],
            attractions: attractions.slice(0, Math.min(request.duration * 2, 6)),
            totalCost,
            totalDuration,
            score: 0,
            breakdown: {
              transport: transportCost,
              accommodation: accommodationCost,
              attractions: attractionsCost,
              total: totalCost,
            },
          });
        }
      }
    }

    return candidates;
  }

  /**
   * 스코어링 및 랭킹
   */
  private scoreAndRank(
    candidates: RouteCandidate[],
    request: TravelRequest,
    weights: ScoringWeights
  ): RouteCandidate[] {
    candidates.forEach(candidate => {
      const costScore = Math.max(0, 1 - candidate.totalCost / request.budget);
      const timeScore = 0.7; // 기본 값
      const preferenceScore = this.calculatePreferenceScore(candidate, request.preferences);
      const fatigueScore = 1 - (candidate.transports.length / 10);

      candidate.score = Math.max(
        0,
        Math.min(
          1,
          costScore * weights.cost +
            timeScore * weights.time +
            preferenceScore * weights.preference +
            fatigueScore * weights.fatigue
        )
      );
    });

    return candidates.sort((a, b) => b.score - a.score);
  }

  /**
   * 취향 일치도 계산
   */
  private calculatePreferenceScore(candidate: RouteCandidate, preferences: string[]): number {
    if (preferences.length === 0) return 0.5;

    const allTags = [
      ...candidate.accommodations.flatMap(a => a.tags),
      ...candidate.attractions.flatMap(a => a.tags),
    ];

    const matchCount = allTags.filter(tag =>
      preferences.some(pref => tag.toLowerCase().includes(pref.toLowerCase()))
    ).length;

    return allTags.length > 0 ? Math.min(matchCount / allTags.length * 2, 1) : 0;
  }

  /**
   * 스마트 가중치 조정
   */
  private smartWeightAdjustment(
    weights: ScoringWeights,
    candidates: RouteCandidate[],
    request: TravelRequest,
    iteration: number
  ): ScoringWeights {
    if (candidates.length === 0) return weights;

    const topCandidate = candidates[0];
    const budgetUsage = topCandidate.totalCost / request.budget;

    // 예산 90% 이상 사용 → 비용 가중치 증가
    if (budgetUsage > 0.9) {
      return {
        cost: Math.min(0.6, weights.cost + 0.08),
        time: weights.time - 0.04,
        preference: weights.preference - 0.04,
        fatigue: weights.fatigue,
      };
    }

    // 예산 60% 미만 사용 → 취향 가중치 증가
    if (budgetUsage < 0.6) {
      return {
        cost: Math.max(0.3, weights.cost - 0.08),
        time: weights.time,
        preference: Math.min(0.35, weights.preference + 0.08),
        fatigue: weights.fatigue,
      };
    }

    // 중간 → 점진적 조정
    return {
      cost: weights.cost - 0.02,
      time: weights.time,
      preference: weights.preference + 0.02,
      fatigue: weights.fatigue,
    };
  }
}
