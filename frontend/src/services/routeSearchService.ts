// Client-side route search algorithm with real APIs

import { TravelRequest, RouteCandidate, SearchResult, ScoringWeights, TransportOption, AccommodationOption, AttractionOption } from '../types';
import { geocode, calculateDistance, Coordinates } from './geocoding';
import { getRoute } from './routing';
import { searchAttractions, mapPreferencesToKinds, getAttractionDetail } from './attractions';
import {
  calculateTransportCost,
  calculateTransportDuration,
  calculateAccommodationCost,
  estimateAttractionFee,
  recommendTransportMode,
  TransportMode,
  AccommodationType,
} from './costCalculator';

const MAX_ITERATIONS = 3; // 실제 API 호출이므로 횟수 제한
const TOP_N_CANDIDATES = 5;
const MIN_SCORE_THRESHOLD = 0.5;

export class ClientRouteSearchService {
  /**
   * 메인 검색 함수 - 실제 API 사용
   */
  async search(request: TravelRequest, onProgress?: (message: string) => void): Promise<SearchResult> {
    let iterations = 0;
    let weights: ScoringWeights = {
      cost: 0.5,
      time: 0.3,
      preference: 0.15,
      fatigue: 0.05,
    };
    let bestCandidates: RouteCandidate[] = [];

    const log = (msg: string) => {
      console.log(msg);
      onProgress?.(msg);
    };

    log(`🔍 여행 경로 탐색 시작: ${request.departure} → ${request.destination}`);

    try {
      // 1. 지오코딩 (출발지, 도착지)
      log('📍 위치 정보 조회 중...');
      const departureCoords = await geocode(request.departure);
      const destinationCoords = await geocode(request.destination);

      if (!departureCoords || !destinationCoords) {
        throw new Error('출발지 또는 도착지를 찾을 수 없습니다');
      }

      log(`✓ ${departureCoords.display_name}`);
      log(`✓ ${destinationCoords.display_name}`);

      // 2. 거리 계산
      const distance = calculateDistance(
        departureCoords.lat,
        departureCoords.lon,
        destinationCoords.lat,
        destinationCoords.lon
      );

      log(`📏 직선 거리: ${distance.toFixed(1)}km`);

      // 3. 경로 조회 (OpenRouteService)
      log('🛣️ 최적 경로 계산 중...');
      const routeInfo = await getRoute(departureCoords, destinationCoords);

      const actualDistance = routeInfo ? routeInfo.distance : distance * 1.3; // 1.3은 직선 대비 실제 도로 거리 계수
      const routeDuration = routeInfo ? Math.round(routeInfo.duration / 60) : 0; // 초 → 분

      log(`✓ 실제 경로: ${actualDistance.toFixed(1)}km`);

      // 4. 명소 검색 (도착지 중심)
      log('🎯 명소 정보 수집 중...');
      const kinds = mapPreferencesToKinds(request.preferences);
      const attractionsRaw = await searchAttractions(destinationCoords, 20, kinds);

      log(`✓ ${attractionsRaw.length}개 명소 발견`);

      // 5. 반복 탐색
      do {
        iterations++;
        log(`\n🔄 최적화 사이클 ${iterations}/${MAX_ITERATIONS}`);

        // 교통 옵션 생성
        const transportOptions = this.generateTransportOptions(
          request.departure,
          request.destination,
          departureCoords,
          destinationCoords,
          actualDistance,
          routeDuration
        );

        // 숙박 옵션 생성
        const accommodationOptions = this.generateAccommodationOptions(
          request.destination,
          destinationCoords,
          request.duration,
          request.budget
        );

        // 명소 옵션 생성
        const attractionOptions = await this.generateAttractionOptions(
          attractionsRaw,
          request.preferences,
          Math.min(request.duration * 3, 6)
        );

        log(`  • 교통 옵션: ${transportOptions.length}개`);
        log(`  • 숙박 옵션: ${accommodationOptions.length}개`);
        log(`  • 명소 옵션: ${attractionOptions.length}개`);

        // 조합 생성
        const combinations = this.generateCombinations(
          transportOptions,
          accommodationOptions,
          attractionOptions,
          request
        );

        log(`  • 경로 조합: ${combinations.length}개 생성`);

        // 스코어링
        bestCandidates = this.scoreAndRank(combinations, request, weights);

        if (bestCandidates.length > 0) {
          log(`  • 최고 점수: ${(bestCandidates[0].score * 100).toFixed(1)}점`);
        }

        // 종료 조건
        if (bestCandidates.length > 0 && bestCandidates[0].score >= MIN_SCORE_THRESHOLD) {
          log(`\n✅ 만족스러운 경로 발견!`);
          break;
        }

        // 가중치 조정
        weights = this.adjustWeights(weights, bestCandidates, request);

      } while (iterations < MAX_ITERATIONS);

      log(`\n🎉 탐색 완료: ${bestCandidates.length}개 경로, ${iterations}회 반복`);

      return {
        candidates: bestCandidates.slice(0, TOP_N_CANDIDATES),
        iterations,
        weights,
      };

    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  /**
   * 교통 옵션 생성 (실제 거리 기반)
   */
  private generateTransportOptions(
    departure: string,
    destination: string,
    departureCoords: Coordinates,
    destinationCoords: Coordinates,
    distance: number,
    routeDuration: number
  ): TransportOption[] {
    const options: TransportOption[] = [];
    const modes = recommendTransportMode(distance);

    const now = new Date();

    modes.forEach(mode => {
      const cost = calculateTransportCost(distance, mode);
      const duration = routeDuration > 0 ? routeDuration : calculateTransportDuration(distance, mode);

      // 출발 시간 (오전 7시, 10시, 오후 2시)
      [7, 10, 14].forEach(hour => {
        const departureTime = new Date(now);
        departureTime.setHours(hour, 0, 0, 0);

        const arrivalTime = new Date(departureTime);
        arrivalTime.setMinutes(arrivalTime.getMinutes() + duration);

        options.push({
          type: mode,
          from: departure,
          to: destination,
          cost,
          duration,
          departureTime: departureTime.toISOString(),
          arrivalTime: arrivalTime.toISOString(),
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
    coords: Coordinates,
    duration: number,
    budget: number
  ): AccommodationOption[] {
    const options: AccommodationOption[] = [];
    const types: AccommodationType[] = ['budget', 'standard', 'premium'];

    // 인기 관광지 여부 (간단히 한국 주요 도시로 판단)
    const popularCities = ['서울', '부산', '제주', '경주', '강릉', '여수'];
    const isPopular = popularCities.some(city => location.includes(city));

    types.forEach(type => {
      const totalCost = calculateAccommodationCost(type, duration, isPopular);

      // 예산의 40% 이내만
      if (totalCost > budget * 0.4) return;

      const ratings: Record<AccommodationType, number> = {
        budget: 3.5,
        standard: 4.2,
        premium: 4.7,
      };

      const names: Record<AccommodationType, string> = {
        budget: `${location} 게스트하우스`,
        standard: `${location} 비즈니스 호텔`,
        premium: `${location} 프리미엄 호텔`,
      };

      const tags: Record<AccommodationType, string[]> = {
        budget: ['가성비', '깔끔한', '친절한'],
        standard: ['편안한', '시설 좋은', '조식 포함'],
        premium: ['럭셔리', '뷰 좋은', '부대시설 완비'],
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
   * 명소 옵션 생성 (실제 OpenTripMap 데이터)
   */
  private async generateAttractionOptions(
    rawAttractions: any[],
    preferences: string[],
    count: number
  ): Promise<AttractionOption[]> {
    const options: AttractionOption[] = [];

    // 상위 명소만 (rate 기준 정렬)
    const sortedAttractions = rawAttractions
      .filter(a => a.rate && a.rate > 2)
      .sort((a, b) => (b.rate || 0) - (a.rate || 0))
      .slice(0, count * 2); // 여유있게 가져오기

    for (const attraction of sortedAttractions) {
      if (options.length >= count) break;

      const entranceFee = estimateAttractionFee(attraction.kinds, attraction.rate);

      // 취향 매칭
      const tags = this.extractTags(attraction.kinds, preferences);

      options.push({
        name: attraction.name,
        location: `위도 ${attraction.point.lat.toFixed(4)}, 경도 ${attraction.point.lon.toFixed(4)}`,
        entranceFee,
        duration: this.estimateVisitDuration(attraction.kinds),
        tags,
        rating: Math.min((attraction.rate || 3) / 7 * 5, 5), // 7점 척도 → 5점 척도
      });
    }

    return options;
  }

  /**
   * 조합 생성
   */
  private generateCombinations(
    transports: TransportOption[],
    accommodations: AccommodationOption[],
    attractions: AttractionOption[],
    request: TravelRequest
  ): RouteCandidate[] {
    const candidates: RouteCandidate[] = [];

    // 최대 조합 수 제한 (성능)
    const maxTransports = Math.min(transports.length, 3);
    const maxAccommodations = Math.min(accommodations.length, 3);

    for (let i = 0; i < maxTransports; i++) {
      for (let j = 0; j < maxAccommodations; j++) {
        const transport = transports[i];
        const accommodation = accommodations[j];

        const transportCost = transport.cost * 2; // 왕복
        const accommodationCost = accommodation.costPerNight * request.duration;
        const attractionsCost = attractions.reduce((sum, a) => sum + a.entranceFee, 0);
        const totalCost = transportCost + accommodationCost + attractionsCost;

        const totalDuration =
          transport.duration * 2 + // 왕복
          attractions.reduce((sum, a) => sum + a.duration, 0);

        candidates.push({
          id: Math.random().toString(36).substr(2, 9),
          transports: [transport],
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
    const maxCost = Math.max(...candidates.map(c => c.totalCost), 1);
    const maxTime = Math.max(...candidates.map(c => c.totalDuration), 1);

    candidates.forEach(candidate => {
      const costScore = 1 - candidate.totalCost / request.budget;
      const timeScore = 1 - candidate.totalDuration / maxTime;
      const preferenceScore = this.calculatePreferenceScore(candidate, request.preferences);
      const fatigueScore = 1 - candidate.transports.length / 10;

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

    const matchCount = allTags.filter(tag => preferences.includes(tag)).length;
    return allTags.length > 0 ? matchCount / allTags.length : 0;
  }

  /**
   * 가중치 조정
   */
  private adjustWeights(
    currentWeights: ScoringWeights,
    candidates: RouteCandidate[],
    request: TravelRequest
  ): ScoringWeights {
    if (candidates.length === 0) return currentWeights;

    const topCandidate = candidates[0];
    const budgetUtilization = topCandidate.totalCost / request.budget;

    if (budgetUtilization > 0.9) {
      return {
        cost: Math.min(0.7, currentWeights.cost + 0.1),
        time: currentWeights.time - 0.05,
        preference: currentWeights.preference - 0.05,
        fatigue: currentWeights.fatigue,
      };
    }

    if (budgetUtilization < 0.6) {
      return {
        cost: Math.max(0.3, currentWeights.cost - 0.1),
        time: currentWeights.time,
        preference: Math.min(0.4, currentWeights.preference + 0.1),
        fatigue: currentWeights.fatigue,
      };
    }

    return currentWeights;
  }

  /**
   * kinds에서 태그 추출
   */
  private extractTags(kinds: string, preferences: string[]): string[] {
    const kindsArray = kinds.toLowerCase().split(',');
    const tags: string[] = [];

    const mapping: Record<string, string> = {
      natural: '자연',
      beaches: '바다',
      historic: '역사',
      cultural: '문화',
      museums: '예술',
      food: '맛집',
      shops: '쇼핑',
      sport: '액티비티',
      parks: '휴식',
    };

    kindsArray.forEach(kind => {
      Object.entries(mapping).forEach(([key, value]) => {
        if (kind.includes(key)) {
          tags.push(value);
        }
      });
    });

    return [...new Set(tags)];
  }

  /**
   * 방문 시간 추정 (kinds 기반)
   */
  private estimateVisitDuration(kinds: string): number {
    const kindsLower = kinds.toLowerCase();

    if (kindsLower.includes('museums') || kindsLower.includes('galleries')) {
      return 120; // 2시간
    }

    if (kindsLower.includes('amusements') || kindsLower.includes('zoos')) {
      return 180; // 3시간
    }

    if (kindsLower.includes('churches') || kindsLower.includes('monuments')) {
      return 45; // 45분
    }

    return 90; // 기본 1.5시간
  }
}
