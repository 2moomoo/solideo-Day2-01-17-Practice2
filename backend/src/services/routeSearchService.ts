// Core route search algorithm with multi-cycle optimization

import {
  TravelRequest,
  RouteCandidate,
  SearchResult,
  ScoringWeights,
  TransportOption,
  AccommodationOption,
  AttractionOption,
  CostBreakdown
} from '../types';
import { mockTransports, mockAccommodations, mockAttractions } from '../data/mockData';

const MAX_ITERATIONS = 5;
const TOP_N_CANDIDATES = 5;
const MIN_SCORE_THRESHOLD = 0.6;

export class RouteSearchService {
  /**
   * 메인 검색 함수 - 다단계 사이클 탐색
   */
  async search(request: TravelRequest): Promise<SearchResult> {
    let iterations = 0;
    let weights: ScoringWeights = {
      cost: 0.5,
      time: 0.3,
      preference: 0.15,
      fatigue: 0.05
    };
    let bestCandidates: RouteCandidate[] = [];

    console.log(`🔍 Starting route search for ${request.departure} → ${request.destination}`);

    do {
      iterations++;
      console.log(`\n📍 Iteration ${iterations}/${MAX_ITERATIONS}`);
      console.log(`   Weights: cost=${weights.cost}, time=${weights.time}, preference=${weights.preference}, fatigue=${weights.fatigue}`);

      // 1단계: 데이터 수집 (Mock API)
      const rawData = this.fetchRawData(request);

      // 2단계: 1차 필터 (예산, 기간 기반)
      const filtered = this.filterByConstraints(rawData, request);
      console.log(`   ✓ Filtered: ${filtered.transports.length} transports, ${filtered.accommodations.length} accommodations`);

      // 3단계: 조합 생성
      const combinations = this.generateCombinations(filtered, request);
      console.log(`   ✓ Generated ${combinations.length} route combinations`);

      // 4단계: 시뮬레이션 (비용, 시간 계산)
      const simulated = combinations.map(combo => this.simulateCostAndTime(combo, request));

      // 5단계: 평가·스코어링
      bestCandidates = this.scoreAndRank(simulated, request, weights);
      console.log(`   ✓ Top score: ${bestCandidates[0]?.score.toFixed(3) || 'N/A'}`);

      // 종료 조건 체크
      if (bestCandidates.length > 0 && bestCandidates[0].score >= MIN_SCORE_THRESHOLD) {
        console.log(`\n✅ Found satisfactory routes (score >= ${MIN_SCORE_THRESHOLD})`);
        break;
      }

      // 6단계: 가중치 조정
      weights = this.adjustWeights(weights, bestCandidates, request, iterations);

    } while (iterations < MAX_ITERATIONS);

    console.log(`\n🎯 Search completed: ${bestCandidates.length} candidates in ${iterations} iterations`);

    return {
      candidates: bestCandidates.slice(0, TOP_N_CANDIDATES),
      iterations,
      weights
    };
  }

  /**
   * 1단계: Mock 데이터 수집
   */
  private fetchRawData(_request: TravelRequest) {
    return {
      transports: mockTransports,
      accommodations: mockAccommodations,
      attractions: mockAttractions
    };
  }

  /**
   * 2단계: 예산, 기간 기반 필터링
   */
  private filterByConstraints(
    data: { transports: TransportOption[], accommodations: AccommodationOption[], attractions: AttractionOption[] },
    request: TravelRequest
  ) {
    const maxTransportCost = request.budget * 0.4; // 예산의 40% 이하
    const maxAccommodationCostPerNight = request.budget * 0.3 / request.duration; // 예산의 30% / 일수

    return {
      transports: data.transports.filter(t => t.cost <= maxTransportCost),
      accommodations: data.accommodations.filter(a => a.costPerNight <= maxAccommodationCostPerNight),
      attractions: data.attractions
    };
  }

  /**
   * 3단계: 조합 생성
   */
  private generateCombinations(
    filtered: { transports: TransportOption[], accommodations: AccommodationOption[], attractions: AttractionOption[] },
    request: TravelRequest
  ): Partial<RouteCandidate>[] {
    const combinations: Partial<RouteCandidate>[] = [];
    const { transports, accommodations, attractions } = filtered;

    // 간단한 조합 생성 (MVP)
    // 실제로는 더 복잡한 조합 로직 필요 (경로 연결성, 시간대 등)
    for (const transport of transports.slice(0, 3)) { // 성능을 위해 제한
      for (const accommodation of accommodations.slice(0, 3)) {
        // 취향에 맞는 명소 선택
        const selectedAttractions = this.selectAttractionsByPreference(
          attractions,
          request.preferences,
          Math.min(request.duration * 2, 4) // 하루에 최대 2개
        );

        combinations.push({
          transports: [transport],
          accommodations: [accommodation],
          attractions: selectedAttractions
        });
      }
    }

    return combinations;
  }

  /**
   * 취향 기반 명소 선택
   */
  private selectAttractionsByPreference(
    attractions: AttractionOption[],
    preferences: string[],
    count: number
  ): AttractionOption[] {
    // 취향 태그와 매칭되는 명소 우선
    const scored = attractions.map(attr => ({
      attraction: attr,
      matchScore: attr.tags.filter(tag => preferences.includes(tag)).length
    }));

    scored.sort((a, b) => b.matchScore - a.matchScore || b.attraction.rating - a.attraction.rating);

    return scored.slice(0, count).map(s => s.attraction);
  }

  /**
   * 4단계: 비용 및 시간 시뮬레이션
   */
  private simulateCostAndTime(
    combo: Partial<RouteCandidate>,
    request: TravelRequest
  ): RouteCandidate {
    const transportCost = combo.transports?.reduce((sum, t) => sum + t.cost, 0) || 0;
    const accommodationCost = combo.accommodations?.reduce((sum, a) => sum + a.costPerNight * request.duration, 0) || 0;
    const attractionCost = combo.attractions?.reduce((sum, a) => sum + a.entranceFee, 0) || 0;

    const totalCost = transportCost + accommodationCost + attractionCost;
    const totalDuration =
      (combo.transports?.reduce((sum, t) => sum + t.duration, 0) || 0) +
      (combo.attractions?.reduce((sum, a) => sum + a.duration, 0) || 0);

    return {
      id: Math.random().toString(36).substr(2, 9),
      transports: combo.transports || [],
      accommodations: combo.accommodations || [],
      attractions: combo.attractions || [],
      totalCost,
      totalDuration,
      score: 0, // 다음 단계에서 계산
      breakdown: {
        transport: transportCost,
        accommodation: accommodationCost,
        attractions: attractionCost,
        total: totalCost
      }
    };
  }

  /**
   * 5단계: 스코어링 및 랭킹
   */
  private scoreAndRank(
    candidates: RouteCandidate[],
    request: TravelRequest,
    weights: ScoringWeights
  ): RouteCandidate[] {
    // 정규화를 위한 최대값 찾기
    const maxCost = Math.max(...candidates.map(c => c.totalCost), 1);
    const maxTime = Math.max(...candidates.map(c => c.totalDuration), 1);

    candidates.forEach(candidate => {
      // 비용 점수 (낮을수록 좋음)
      const costScore = 1 - (candidate.totalCost / request.budget);

      // 시간 점수 (짧을수록 좋음)
      const timeScore = 1 - (candidate.totalDuration / maxTime);

      // 취향 일치도 점수
      const preferenceScore = this.calculatePreferenceScore(candidate, request.preferences);

      // 이동 피로도 점수 (이동 횟수가 적을수록 좋음)
      const fatigueScore = 1 - (candidate.transports.length / 10);

      // 가중치 적용
      candidate.score = Math.max(0, Math.min(1,
        costScore * weights.cost +
        timeScore * weights.time +
        preferenceScore * weights.preference +
        fatigueScore * weights.fatigue
      ));
    });

    // 점수 기준 내림차순 정렬
    return candidates.sort((a, b) => b.score - a.score);
  }

  /**
   * 취향 일치도 계산
   */
  private calculatePreferenceScore(candidate: RouteCandidate, preferences: string[]): number {
    if (preferences.length === 0) return 0.5;

    const allTags = [
      ...candidate.accommodations.flatMap(a => a.tags),
      ...candidate.attractions.flatMap(a => a.tags)
    ];

    const matchCount = allTags.filter(tag => preferences.includes(tag)).length;
    const totalTags = allTags.length;

    return totalTags > 0 ? matchCount / totalTags : 0;
  }

  /**
   * 6단계: 가중치 자동 조정
   */
  private adjustWeights(
    currentWeights: ScoringWeights,
    candidates: RouteCandidate[],
    request: TravelRequest,
    iteration: number
  ): ScoringWeights {
    if (candidates.length === 0) return currentWeights;

    const topCandidate = candidates[0];
    const budgetUtilization = topCandidate.totalCost / request.budget;

    // 예산을 너무 많이 사용하면 비용 가중치 증가
    if (budgetUtilization > 0.9) {
      return {
        cost: Math.min(0.7, currentWeights.cost + 0.1),
        time: currentWeights.time - 0.05,
        preference: currentWeights.preference - 0.05,
        fatigue: currentWeights.fatigue
      };
    }

    // 예산 여유가 많으면 취향 가중치 증가
    if (budgetUtilization < 0.7) {
      return {
        cost: Math.max(0.3, currentWeights.cost - 0.1),
        time: currentWeights.time,
        preference: Math.min(0.4, currentWeights.preference + 0.1),
        fatigue: currentWeights.fatigue
      };
    }

    return currentWeights;
  }
}
