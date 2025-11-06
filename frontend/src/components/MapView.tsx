import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { RouteCandidate } from '../types';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  selectedRoute: RouteCandidate | null;
}

// 도시별 좌표 (Mock 데이터)
const CITY_COORDINATES: Record<string, [number, number]> = {
  '서울': [37.5665, 126.9780],
  '김포공항': [37.5583, 126.7906],
  '서울역': [37.5547, 126.9707],
  '서울고속버스터미널': [37.5045, 127.0043],
  '부산': [35.1796, 129.0756],
  '김해공항': [35.1796, 128.9386],
  '부산역': [35.1150, 129.0418],
  '부산종합버스터미널': [35.1597, 129.0599],
  '해운대': [35.1586, 129.1603],
  '자갈치 시장': [35.0966, 129.0306],
  '감천문화마을': [35.0974, 129.0105],
  '남포동': [35.0978, 129.0289],
  '경주': [35.8562, 129.2247],
  '경주역': [35.8562, 129.2247],
  '불국사': [35.7900, 129.3319],
  '석굴암': [35.7953, 129.3478],
  '첨성대': [35.8344, 129.2192],
};

export const MapView: React.FC<MapViewProps> = ({ selectedRoute }) => {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current && selectedRoute) {
      // 경로에 포함된 모든 위치의 좌표 수집
      const bounds: [number, number][] = [];

      selectedRoute.transports.forEach(transport => {
        const fromCoord = CITY_COORDINATES[transport.from];
        const toCoord = CITY_COORDINATES[transport.to];
        if (fromCoord) bounds.push(fromCoord);
        if (toCoord) bounds.push(toCoord);
      });

      selectedRoute.accommodations.forEach(acc => {
        const coord = CITY_COORDINATES[acc.location] || CITY_COORDINATES[acc.location.split(' ')[1]];
        if (coord) bounds.push(coord);
      });

      selectedRoute.attractions.forEach(attr => {
        const coord = CITY_COORDINATES[attr.name] || CITY_COORDINATES[attr.location];
        if (coord) bounds.push(coord);
      });

      if (bounds.length > 0) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [selectedRoute]);

  if (!selectedRoute) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center h-[500px] flex items-center justify-center">
        <p className="text-gray-500">경로를 선택하면 지도에 표시됩니다</p>
      </div>
    );
  }

  // 경로 라인 생성
  const routeLines: [number, number][][] = [];
  selectedRoute.transports.forEach(transport => {
    const from = CITY_COORDINATES[transport.from];
    const to = CITY_COORDINATES[transport.to];
    if (from && to) {
      routeLines.push([from, to]);
    }
  });

  // 마커 생성
  const markers: Array<{ position: [number, number], label: string, type: string }> = [];

  selectedRoute.transports.forEach(transport => {
    const fromCoord = CITY_COORDINATES[transport.from];
    const toCoord = CITY_COORDINATES[transport.to];
    if (fromCoord) {
      markers.push({ position: fromCoord, label: transport.from, type: 'transport' });
    }
    if (toCoord) {
      markers.push({ position: toCoord, label: transport.to, type: 'transport' });
    }
  });

  selectedRoute.accommodations.forEach(acc => {
    const coord = CITY_COORDINATES[acc.location] || CITY_COORDINATES[acc.location.split(' ')[1]];
    if (coord) {
      markers.push({ position: coord, label: `🏨 ${acc.name}`, type: 'accommodation' });
    }
  });

  selectedRoute.attractions.forEach(attr => {
    const coord = CITY_COORDINATES[attr.name] || CITY_COORDINATES[attr.location];
    if (coord) {
      markers.push({ position: coord, label: `📍 ${attr.name}`, type: 'attraction' });
    }
  });

  // 중복 제거
  const uniqueMarkers = markers.filter((marker, index, self) =>
    index === self.findIndex(m => m.position[0] === marker.position[0] && m.position[1] === marker.position[1])
  );

  const centerPosition: [number, number] = markers.length > 0 ? markers[0].position : [37.5665, 126.9780];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h3 className="font-semibold text-gray-800">경로 지도</h3>
        <p className="text-sm text-gray-600">
          총 {selectedRoute.totalCost.toLocaleString()}원 •
          {' '}{Math.floor(selectedRoute.totalDuration / 60)}시간 {selectedRoute.totalDuration % 60}분
        </p>
      </div>

      <div className="h-[500px]">
        <MapContainer
          center={centerPosition}
          zoom={7}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* 경로 라인 */}
          {routeLines.map((line, idx) => (
            <Polyline
              key={`line-${idx}`}
              positions={line}
              color="blue"
              weight={3}
              opacity={0.6}
            />
          ))}

          {/* 마커 */}
          {uniqueMarkers.map((marker, idx) => (
            <Marker key={`marker-${idx}`} position={marker.position}>
              <Popup>{marker.label}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* 범례 */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="flex gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>교통 경로</span>
          </div>
          <div className="flex items-center gap-2">
            <span>📍</span>
            <span>명소</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🏨</span>
            <span>숙소</span>
          </div>
        </div>
      </div>
    </div>
  );
};
