import { Router, Request, Response } from 'express';
import { RouteSearchService } from '../services/routeSearchService';
import { TravelRequest } from '../types';

const router = Router();
const searchService = new RouteSearchService();

/**
 * POST /api/search
 * 여행 경로 검색 API
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const travelRequest: TravelRequest = req.body;

    // 기본 유효성 검증
    if (!travelRequest.departure || !travelRequest.destination) {
      return res.status(400).json({
        error: 'departure and destination are required'
      });
    }

    if (!travelRequest.budget || travelRequest.budget <= 0) {
      return res.status(400).json({
        error: 'budget must be a positive number'
      });
    }

    if (!travelRequest.duration || travelRequest.duration <= 0) {
      return res.status(400).json({
        error: 'duration must be a positive number'
      });
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('🚀 New search request received');
    console.log(`${'='.repeat(60)}`);

    const result = await searchService.search(travelRequest);

    console.log(`${'='.repeat(60)}\n`);

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/health
 * 헬스체크 엔드포인트
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;
