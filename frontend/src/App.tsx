import React, { useState } from 'react';
import { SearchForm } from './components/SearchForm';
import { ResultsList } from './components/ResultsList';
import { MapView } from './components/MapView';
import { searchRoutes } from './services/api';
import { TravelRequest, SearchResult, RouteCandidate } from './types';

function App() {
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMessages, setProgressMessages] = useState<string[]>([]);

  const handleSearch = async (request: TravelRequest) => {
    setIsLoading(true);
    setError(null);
    setSearchResult(null);
    setSelectedRouteId(null);
    setProgressMessages([]);

    try {
      console.log('Searching with request:', request);

      const result = await searchRoutes(request, (message: string) => {
        setProgressMessages(prev => [...prev, message]);
      });

      console.log('Search result:', result);
      setSearchResult(result);

      // 자동으로 첫 번째 경로 선택
      if (result.candidates.length > 0) {
        setSelectedRouteId(result.candidates[0].id);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRoute = searchResult?.candidates.find(c => c.id === selectedRouteId) || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌍</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                여행 경로 추천
              </h1>
              <p className="text-sm text-gray-600">
                비용·시간·취향을 고려한 최적 경로 찾기
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Search Form */}
          <div className="lg:col-span-1">
            <SearchForm onSearch={handleSearch} isLoading={isLoading} />

            {/* Error Message */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">
                  <strong>오류:</strong> {error}
                </p>
              </div>
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="flex items-center gap-3 mb-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <div className="text-sm text-blue-700">
                    <p className="font-semibold">경로 탐색 중...</p>
                    <p className="text-xs">실시간 API로 최적 경로를 찾고 있습니다</p>
                  </div>
                </div>
                {progressMessages.length > 0 && (
                  <div className="text-xs text-blue-600 space-y-1 font-mono">
                    {progressMessages.map((msg, idx) => (
                      <div key={idx}>{msg}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Results and Map */}
          <div className="lg:col-span-2 space-y-8">
            {/* Map View */}
            <MapView selectedRoute={selectedRoute} />

            {/* Results List */}
            <ResultsList
              result={searchResult}
              onSelectRoute={setSelectedRouteId}
              selectedRouteId={selectedRouteId}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            다단계 사이클 기반 여행 경로 최적화 시스템 • MVP Version
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
