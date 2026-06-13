import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { geocodeAddress } from '../lib/kakaoGeocode';
import { getKakaoApiKey } from '../lib/kakaoEnv';
import { loadKakaoMapsSdk } from '../lib/kakaoMapsSdk';

const KAKAO_MAP_SETUP_HINT =
  'developers.kakao.com → 오늘밤빠 앱 → 제품 설정 → 카카오맵 → 사용 설정 ON';

function KakaoMapPreview({ lat, lng, address, label, onOpenExternal }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const hasApiKey = Boolean(getKakaoApiKey());
  const hasTarget = Boolean(address?.trim()) || (Number.isFinite(lat) && Number.isFinite(lng));

  useEffect(() => {
    if (!hasTarget || !hasApiKey) return undefined;

    let cancelled = false;
    setReady(false);
    setFailed(false);
    setErrorMessage('');

    const mountMap = async () => {
      let centerLat = lat;
      let centerLng = lng;

      if (!Number.isFinite(centerLat) || !Number.isFinite(centerLng)) {
        const coords = await geocodeAddress(address);
        if (cancelled) return;
        if (!coords) {
          setFailed(true);
          setErrorMessage('주소 좌표를 찾지 못했습니다.');
          return;
        }
        centerLat = coords.lat;
        centerLng = coords.lng;
      }

      try {
        const maps = await loadKakaoMapsSdk();
        if (cancelled || !containerRef.current) return;

        const center = new maps.LatLng(centerLat, centerLng);
        const map = new maps.Map(containerRef.current, {
          center,
          level: 3,
          draggable: false,
          scrollwheel: false,
          disableDoubleClick: true,
          disableDoubleClickZoom: true,
        });
        mapRef.current = map;
        new maps.Marker({ map, position: center });

        requestAnimationFrame(() => {
          if (cancelled || !mapRef.current) return;
          mapRef.current.relayout();
          setReady(true);
        });
      } catch (err) {
        const message = String(err?.message || err || 'Kakao Maps SDK error');
        console.error('Kakao map preview error:', message);
        if (!cancelled) {
          setFailed(true);
          setErrorMessage(message);
        }
      }
    };

    mountMap();

    return () => {
      cancelled = true;
      mapRef.current = null;
    };
  }, [address, hasApiKey, hasTarget, lat, lng]);

  if (!hasTarget) return null;

  const showFallback = !hasApiKey || failed;

  return (
    <div className={`vd-map-preview${showFallback ? ' vd-map-preview--fallback' : ''}`}>
      <div
        ref={containerRef}
        className="vd-map-preview__canvas"
        aria-hidden={showFallback}
        aria-label={label || address || 'BAR location map'}
      />
      {showFallback && (
        <div className="vd-map-preview__placeholder">
          <MapPin size={18} aria-hidden />
          <span>{label || address || '위치'}</span>
          {!hasApiKey ? (
            <small className="vd-map-preview__hint">VITE_KAKAO_API_KEY 를 .env 에 넣어 주세요.</small>
          ) : (
            <small className="vd-map-preview__hint">
              {errorMessage.includes('disabled OPEN_MAP_AND_LOCAL')
                ? '카카오맵 API가 아직 OFF 입니다. 제품 설정 → 카카오맵 → 사용 설정 ON'
                : errorMessage || KAKAO_MAP_SETUP_HINT}
            </small>
          )}
        </div>
      )}
      {hasApiKey && !ready && !failed && (
        <div className="vd-map-preview__loading" aria-hidden>
          카카오맵 불러오는 중…
        </div>
      )}
      <button type="button" className="vd-map-preview__open" onClick={onOpenExternal}>
        <MapPin size={14} aria-hidden />
        <span>카카오맵에서 열기</span>
      </button>
    </div>
  );
}

export default KakaoMapPreview;
