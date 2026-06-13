import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { geocodeAddress } from '../lib/kakaoGeocode';
import { getKakaoApiKey } from '../lib/kakaoEnv';
import { loadKakaoMapsSdk } from '../lib/kakaoMapsSdk';

function KakaoMapPreview({ lat, lng, address, label, onOpenExternal }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const hasApiKey = Boolean(getKakaoApiKey());
  const hasTarget = Boolean(address?.trim()) || (Number.isFinite(lat) && Number.isFinite(lng));

  useEffect(() => {
    if (!hasTarget || !hasApiKey) return undefined;

    let cancelled = false;

    const mountMap = async () => {
      let centerLat = lat;
      let centerLng = lng;

      if (!Number.isFinite(centerLat) || !Number.isFinite(centerLng)) {
        const coords = await geocodeAddress(address);
        if (cancelled) return;
        if (!coords) {
          setFailed(true);
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
        setReady(true);
      } catch (err) {
        console.error('Kakao map preview error:', err);
        if (!cancelled) setFailed(true);
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
      {showFallback ? (
        <div className="vd-map-preview__placeholder">
          <MapPin size={18} aria-hidden />
          <span>{label || address || '위치'}</span>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="vd-map-preview__canvas"
          aria-label={label || address || 'BAR location map'}
        />
      )}
      {!ready && !showFallback && (
        <div className="vd-map-preview__loading" aria-hidden>
          지도 불러오는 중…
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
