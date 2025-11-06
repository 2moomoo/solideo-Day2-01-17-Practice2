// TSP (Traveling Salesman Problem) 최적화 알고리즘
// 다중 도시 여행 경로를 최적화

import { calculateDistance, Coordinates } from './geocoding';

export interface City {
  id: string;
  name: string;
  coords: Coordinates;
  priority?: number;  // 우선순위 (1-10, 높을수록 중요)
  minStayHours?: number;  // 최소 체류 시간
}

export interface OptimizedRoute {
  cities: City[];
  totalDistance: number;
  order: number[];  // 방문 순서 인덱스
}

/**
 * TSP 해결: 2-opt 알고리즘 사용
 * O(n^2) 시간 복잡도로 로컬 최적해 찾기
 */
export class TSPOptimizer {
  /**
   * 거리 행렬 생성
   */
  private buildDistanceMatrix(cities: City[]): number[][] {
    const n = cities.length;
    const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dist = calculateDistance(
          cities[i].coords.lat,
          cities[i].coords.lon,
          cities[j].coords.lat,
          cities[j].coords.lon
        );
        matrix[i][j] = dist;
        matrix[j][i] = dist;
      }
    }

    return matrix;
  }

  /**
   * 경로의 총 거리 계산
   */
  private calculateTotalDistance(order: number[], distMatrix: number[][]): number {
    let total = 0;
    for (let i = 0; i < order.length - 1; i++) {
      total += distMatrix[order[i]][order[i + 1]];
    }
    return total;
  }

  /**
   * 2-opt 알고리즘: 경로 개선
   */
  private twoOptImprovement(order: number[], distMatrix: number[][]): number[] {
    let improved = true;
    let bestOrder = [...order];
    let bestDistance = this.calculateTotalDistance(bestOrder, distMatrix);

    while (improved) {
      improved = false;

      for (let i = 1; i < order.length - 2; i++) {
        for (let j = i + 1; j < order.length - 1; j++) {
          // 구간 [i, j]를 뒤집어봄
          const newOrder = [
            ...bestOrder.slice(0, i),
            ...bestOrder.slice(i, j + 1).reverse(),
            ...bestOrder.slice(j + 1)
          ];

          const newDistance = this.calculateTotalDistance(newOrder, distMatrix);

          if (newDistance < bestDistance) {
            bestOrder = newOrder;
            bestDistance = newDistance;
            improved = true;
          }
        }
      }
    }

    return bestOrder;
  }

  /**
   * Nearest Neighbor 휴리스틱: 초기 해 생성
   */
  private nearestNeighbor(
    startIdx: number,
    endIdx: number,
    distMatrix: number[][]
  ): number[] {
    const n = distMatrix.length;
    const visited = new Set<number>([startIdx]);
    const order = [startIdx];
    let current = startIdx;

    // 중간 도시들 방문
    while (visited.size < n - 1) {
      let nearest = -1;
      let minDist = Infinity;

      for (let i = 0; i < n; i++) {
        if (i === endIdx) continue; // 목적지는 마지막에
        if (visited.has(i)) continue;

        if (distMatrix[current][i] < minDist) {
          minDist = distMatrix[current][i];
          nearest = i;
        }
      }

      if (nearest === -1) break;
      visited.add(nearest);
      order.push(nearest);
      current = nearest;
    }

    // 목적지 추가
    order.push(endIdx);

    return order;
  }

  /**
   * 다중 도시 경로 최적화 (출발지 고정, 도착지 고정)
   */
  optimize(cities: City[], startCity: City, endCity: City): OptimizedRoute {
    if (cities.length <= 2) {
      return {
        cities: [startCity, endCity],
        totalDistance: calculateDistance(
          startCity.coords.lat,
          startCity.coords.lon,
          endCity.coords.lat,
          endCity.coords.lon
        ),
        order: [0, 1],
      };
    }

    // 전체 도시 리스트 (출발지 + 경유지 + 도착지)
    const allCities = [startCity, ...cities, endCity];
    const distMatrix = this.buildDistanceMatrix(allCities);

    const startIdx = 0;
    const endIdx = allCities.length - 1;

    // 1. Nearest Neighbor로 초기 해 생성
    let order = this.nearestNeighbor(startIdx, endIdx, distMatrix);

    // 2. 2-opt로 개선
    order = this.twoOptImprovement(order, distMatrix);

    // 3. 우선순위 적용 (높은 우선순위 도시를 앞으로)
    // 출발지와 도착지는 고정
    const middleOrder = order.slice(1, -1);
    middleOrder.sort((a, b) => {
      const priorityA = allCities[a].priority || 5;
      const priorityB = allCities[b].priority || 5;
      return priorityB - priorityA; // 내림차순
    });

    const finalOrder = [order[0], ...middleOrder, order[order.length - 1]];

    return {
      cities: finalOrder.map(idx => allCities[idx]),
      totalDistance: this.calculateTotalDistance(finalOrder, distMatrix),
      order: finalOrder,
    };
  }

  /**
   * 시간 제약을 고려한 최적화
   * (예: 각 도시별 최소 체류 시간, 총 여행 기간)
   */
  optimizeWithTimeConstraints(
    cities: City[],
    startCity: City,
    endCity: City,
    maxTotalHours: number
  ): OptimizedRoute | null {
    const baseResult = this.optimize(cities, startCity, endCity);

    // 시간 계산 (80km/h 평균 속도 가정)
    const travelTimeHours = baseResult.totalDistance / 80;
    const stayTimeHours = baseResult.cities
      .slice(1, -1)
      .reduce((sum, city) => sum + (city.minStayHours || 2), 0);

    const totalTimeHours = travelTimeHours + stayTimeHours;

    if (totalTimeHours > maxTotalHours) {
      // 시간 초과: 우선순위 낮은 도시 제거
      const sortedCities = cities
        .sort((a, b) => (b.priority || 5) - (a.priority || 5));

      for (let i = sortedCities.length - 1; i >= 0; i--) {
        const reducedCities = sortedCities.slice(0, i + 1);
        const reducedResult = this.optimize(reducedCities, startCity, endCity);

        const reducedTravelTime = reducedResult.totalDistance / 80;
        const reducedStayTime = reducedResult.cities
          .slice(1, -1)
          .reduce((sum, city) => sum + (city.minStayHours || 2), 0);

        if (reducedTravelTime + reducedStayTime <= maxTotalHours) {
          return reducedResult;
        }
      }

      return null; // 시간 내에 불가능
    }

    return baseResult;
  }
}

/**
 * 간단한 TSP 해결 (작은 규모용)
 */
export const optimizeRoute = (
  cities: City[],
  startCity: City,
  endCity: City
): OptimizedRoute => {
  const optimizer = new TSPOptimizer();
  return optimizer.optimize(cities, startCity, endCity);
};

/**
 * 시간 제약 포함 TSP
 */
export const optimizeRouteWithTime = (
  cities: City[],
  startCity: City,
  endCity: City,
  maxHours: number
): OptimizedRoute | null => {
  const optimizer = new TSPOptimizer();
  return optimizer.optimizeWithTimeConstraints(cities, startCity, endCity, maxHours);
};
