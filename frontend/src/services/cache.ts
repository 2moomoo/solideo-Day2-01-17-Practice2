// API 결과 캐싱 레이어 - 불필요한 API 호출 방지

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class APICache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly defaultTTL = 3600000; // 1시간 (밀리초)

  /**
   * 캐시 키 생성
   */
  private generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    return `${prefix}:${sortedParams}`;
  }

  /**
   * 캐시에서 데이터 가져오기
   */
  get<T>(prefix: string, params: Record<string, any>): T | null {
    const key = this.generateKey(prefix, params);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // 만료 체크
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    console.log(`[Cache HIT] ${key}`);
    return entry.data as T;
  }

  /**
   * 캐시에 데이터 저장
   */
  set<T>(prefix: string, params: Record<string, any>, data: T, ttl?: number): void {
    const key = this.generateKey(prefix, params);
    const now = Date.now();

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + (ttl || this.defaultTTL),
    });

    console.log(`[Cache SET] ${key}`);
  }

  /**
   * 캐시 클리어
   */
  clear(prefix?: string): void {
    if (prefix) {
      // 특정 prefix만 삭제
      const keysToDelete: string[] = [];
      this.cache.forEach((_, key) => {
        if (key.startsWith(prefix)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => this.cache.delete(key));
      console.log(`[Cache CLEAR] ${prefix}* (${keysToDelete.length} entries)`);
    } else {
      // 전체 삭제
      this.cache.clear();
      console.log('[Cache CLEAR] All entries');
    }
  }

  /**
   * 만료된 항목 정리
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`[Cache CLEANUP] ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * 캐시 통계
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * 캐시와 함께 API 호출
   */
  async withCache<T>(
    prefix: string,
    params: Record<string, any>,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // 캐시 확인
    const cached = this.get<T>(prefix, params);
    if (cached !== null) {
      return cached;
    }

    // API 호출
    const data = await fetcher();

    // 캐시 저장
    this.set(prefix, params, data, ttl);

    return data;
  }
}

// 전역 캐시 인스턴스
export const globalCache = new APICache();

// 주기적 클린업 (5분마다)
if (typeof window !== 'undefined') {
  setInterval(() => {
    globalCache.cleanup();
  }, 300000);
}

/**
 * 캐시 데코레이터 함수
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  prefix: string,
  ttl?: number
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const params = { args };
      return globalCache.withCache(
        `${prefix}:${propertyKey}`,
        params,
        () => originalMethod.apply(this, args),
        ttl
      );
    };

    return descriptor;
  };
}
