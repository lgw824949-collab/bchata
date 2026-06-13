import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { geocodeAddress } from '../lib/kakaoGeocode';
import { getKakaoApiKey } from '../lib/kakaoEnv';
import { loadKakaoMapsSdk } from '../lib/kakaoMapsSdk';
import { buildOsmMapEmbedUrl } from '../lib/osmMapPreview';

function KakaoMapPreview({ lat, lng, address, label, onOpenExternal }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [resolvedCoords, setResolvedCoords] = useState(() => (
    Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
  ));
  const hasApiKey = Boolean(getKakaoApiKey());
  const hasTarget = Boolean(address?.trim()) || (Number.isFinite(lat) && Number.isFinite(lng));
  const previewCoords = resolvedCoords
    || (Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null);
  const osmPreviewUrl = (failed || !hasApiKey)
    ? buildOsmMapEmbedUrl(previewCoords?.lat, previewCoords?.lng)
    : null;
  const showPlaceholder = hasTarget && !osmPreviewUrl && (!hasApiKey || failed);

  useEffect(() => {
    if (!hasTarget || !hasApiKey) return undefined;

    let cancelled = false;
    setReady(false);
    setFailed(false);

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

      if (!cancelled) {
        setResolvedCoords({ lat: centerLat, lng: centerLng });
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
        console.error(
          'Kakao map preview error:',
          err?.message || err,
          '(카카오 개발자 콘솔에서 OPEN_MAP_AND_LOCAL · Web 도메인 등록 확인)',
        );
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

  return (
    <div className={`vd-map-preview${showPlaceholder ? ' vd-map-preview--fallback' : ''}`}>
      {osmPreviewUrl ? (
        <iframe
          className="vd-map-preview__embed"
          title={label || address || 'BAR location map'}
          src={osmPreviewUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div
          ref={containerRef}
          className="vd-map-preview__canvas"
          aria-hidden={showPlaceholder}
          aria-label={label || address || 'BAR location map'}
        />
      )}
      {showPlaceholder && (
        <div className="vd-map-preview__placeholder">
          <MapPin size={18} aria-hidden />
          <span>{label || address || '위치'}</span>
        </div>
      )}
      {hasApiKey && !ready && !failed && !osmPreviewUrl && (
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
