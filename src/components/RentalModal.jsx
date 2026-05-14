import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, MessageCircle, Globe, Plus, ChevronLeft, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { findBarByName } from '../lib/BarLib';
import gangturnPhoto from '../assets/gangturn_photo.png';
import ggomaeyaPhoto from '../assets/ggomaeya_photo.jpg';
import noriterPhoto from '../assets/noriter_photo.png';
import latinPhoto from '../assets/latin_photo.png';
import macondoPhoto from '../assets/macondo_photo.png';
import bonitaPhoto from '../assets/bonita_photo.png';
import buenaPhoto from '../assets/buena_photo.png';
import hongturnPhoto from '../assets/hongturn_photo.png';
import bibigoPhoto from '../assets/bibigo_photo.png';

const REGIONS_ORDER = [
  '서울',
  '경기/인천',
  '경상도',
  '전라도',
  '충청도',
  '강원/제주'
];

export default function RentalModal({ onClose }) {
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBar, setSelectedBar] = useState(null);
  const [selectedRegionTab, setSelectedRegionTab] = useState('전체');
  
  // 지역별 펼쳐짐(더보기/전체보기) 상태 관리 객체
  const [expandedRegions, setExpandedRegions] = useState({});

  // 등록 폼 제어 상태
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    kakao_url: '',
    instagram_url: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const rawList = data || [];

      // 중복 제거: 이름 기준 정보가 가장 풍부하거나 최신인 레코드 1개만 병합 유지
      const uniqueMap = new Map();
      rawList.forEach(loc => {
        let key = (loc.name || '').replace(/\s+/g, '').toLowerCase();
        if (key.includes('강남턴') || key.includes('강턴')) key = '강턴';
        if (!key) return;

        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, loc);
        } else {
          const existing = uniqueMap.get(key);
          const score = (loc.image_url ? 2 : 0) + (loc.kakao_url ? 1 : 0) + (loc.instagram_url ? 1 : 0);
          const exScore = (existing.image_url ? 2 : 0) + (existing.kakao_url ? 1 : 0) + (existing.instagram_url ? 1 : 0);
          if (score > exScore || (score === exScore && loc.id > existing.id)) {
            uniqueMap.set(key, loc);
          }
        }
      });
      const deduplicatedList = Array.from(uniqueMap.values());

      // 주소(address) 컬럼 기준 지역 분류 로직
      const classified = deduplicatedList.map(loc => {
        const text = `${loc.address || ''}`.toLowerCase();
        let region = '기타';

        if (text.includes('서울')) region = '서울';
        else if (text.includes('경기') || text.includes('인천')) region = '경기/인천';
        else if (text.includes('부산') || text.includes('대구') || text.includes('경북') || text.includes('경남') || text.includes('울산') || text.includes('창원') || text.includes('포항') || text.includes('구미')) region = '경상도';
        else if (text.includes('광주') || text.includes('전북') || text.includes('전남') || text.includes('여수') || text.includes('순천') || text.includes('목포')) region = '전라도';
        else if (text.includes('대전') || text.includes('충북') || text.includes('충남') || text.includes('세종') || text.includes('청주') || text.includes('천안')) region = '충청도';
        else if (text.includes('강원') || text.includes('제주') || text.includes('춘천') || text.includes('원주')) region = '강원/제주';
        else {
          // 이름 등에도 지역 단서가 있는지 보조 체크
          const nameText = `${loc.name || ''}`.toLowerCase();
          if (nameText.includes('서울')) region = '서울';
          else if (nameText.includes('경기') || nameText.includes('인천')) region = '경기/인천';
          else if (nameText.includes('부산') || nameText.includes('대구')) region = '경상도';
          else region = '서울'; // 지정되지 않은 경우 기본값 서울 편입
        }

        const nameKey = `${loc.name || ''}`.replace(/\s+/g, '').toLowerCase();
        const isGangturn = nameKey.includes('강남턴') || nameKey.includes('강턴');
        const isGgomaeya = nameKey.includes('꼼애야');
        const isNoriter = nameKey.includes('놀이터');
        const isLatin = nameKey.includes('라틴') && region !== '경기/인천' && !nameKey.includes('라틴크루');
        const isMacondo = nameKey.includes('마콘도');
        const isBonita = nameKey.includes('보니따');
        const isBuena = nameKey.includes('부에나');
        const isHongturn = nameKey.includes('홍턴');
        const isBibigo = nameKey.includes('비비고');

        let finalImg = loc.image_url;
        if (isGangturn) finalImg = gangturnPhoto;
        else if (isGgomaeya) finalImg = ggomaeyaPhoto;
        else if (isNoriter) finalImg = noriterPhoto;
        else if (isLatin) finalImg = latinPhoto;
        else if (isMacondo) finalImg = macondoPhoto;
        else if (isBonita) finalImg = bonitaPhoto;
        else if (isBuena) finalImg = buenaPhoto;
        else if (isHongturn) finalImg = hongturnPhoto;
        else if (isBibigo) finalImg = bibigoPhoto;

        return { 
          ...loc, 
          region, 
          image_url: finalImg,
          instagram_url: isGangturn ? 'https://www.instagram.com/turn_latinclub_no.1?igsh=MW94ajh3OHZ3NDZ6bg%3D%3D' : loc.instagram_url
        };
      });

      classified.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setLocations(classified);
    } catch (err) {
      console.error('BAR 목록 로드 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKakaoClick = (url) => {
    if (!url || !url.trim()) {
      alert('해당 대관처의 개별 카카오톡 문의 링크가 아직 등록되지 않았습니다.');
      return;
    }
    window.open(url, '_blank');
  };

  const handleInstaClick = (url) => {
    if (!url || !url.trim()) {
      alert('해당 대관처의 개별 인스타그램 링크가 아직 등록되지 않았습니다.');
      return;
    }
    window.open(url, '_blank');
  };

  const handleGoogleMapClick = (bar) => {
    const query = bar.address || bar.name;
    if (!query) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
  };

  const handleKakaoMapClick = (bar) => {
    const query = bar.name || bar.address;
    if (!query) return;
    window.open(`https://map.kakao.com/link/search/${encodeURIComponent(query)}`, '_blank');
  };

  // 펼치기 토글 핸들러
  const toggleExpandRegion = (region) => {
    setExpandedRegions(prev => ({
      ...prev,
      [region]: !prev[region]
    }));
  };

  // 사진 파일 선택 핸들러
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // BAR 이름 입력 시 자동 주소 연동 핸들러
  const handleNameChange = (e) => {
    const val = e.target.value;
    setFormData(prev => {
      const next = { ...prev, name: val };
      if (val.length >= 1) {
        const match = findBarByName(val);
        if (match && match.address) {
          next.address = match.address;
        }
      }
      return next;
    });
  };

  // BAR 등록 제출 핸들러
  const handleSubmitRegister = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) {
      alert('BAR 이름과 주소를 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedImageUrl = null;

      // 1. 스토리지 이미지 업로드 처리
      if (selectedFile) {
        const ext = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from('posters')
          .upload(`posters/${fileName}`, selectedFile);

        if (uploadError) {
          console.warn('스토리지 업로드 실패:', uploadError.message);
        } else {
          const { data: pData } = supabase.storage
            .from('posters')
            .getPublicUrl(`posters/${fileName}`);
          uploadedImageUrl = pData?.publicUrl || null;
        }
      }

      // 2. DB insert 쿼리 실행
      const payload = {
        name: formData.name.trim(),
        address: formData.address.trim()
      };

      // 3개 추가 컬럼 데이터를 안전하게 부여
      if (uploadedImageUrl) payload.image_url = uploadedImageUrl;
      if (formData.kakao_url.trim()) payload.kakao_url = formData.kakao_url.trim();
      if (formData.instagram_url.trim()) payload.instagram_url = formData.instagram_url.trim();

      // DB insert 시도 (신규 컬럼 미존재 시 자동 복구 지원)
      let { error } = await supabase.from('locations').insert([payload]);

      if (error && (error.message?.includes('column') || error.message?.includes('does not exist'))) {
        console.warn('신규 컬럼이 DB에 없어 기본 컬럼(name, address)으로만 안전하게 등록합니다.');
        const safePayload = {
          name: formData.name.trim(),
          address: formData.address.trim()
        };
        const { error: retryError } = await supabase.from('locations').insert([safePayload]);
        if (retryError) throw retryError;
      } else if (error) {
        throw error;
      }

      alert('성공적으로 BAR 등록이 완료되었습니다!');
      // 초기화
      setFormData({ name: '', address: '', kakao_url: '', instagram_url: '' });
      setSelectedFile(null);
      setPreviewUrl(null);
      setShowRegisterForm(false);
      // 데이터 재조회
      fetchLocations();
    } catch (err) {
      console.error('등록 중 에러 발생:', err);
      alert(`BAR 등록에 실패했습니다: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 개별 BAR 카드 렌더링 함수
  const renderBarCard = (bar) => (
    <motion.div
      key={bar.id}
      whileTap={{ scale: 0.96 }}
      onClick={() => setSelectedBar(bar)}
      style={{
        flex: '0 0 auto',
        width: '88px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer'
      }}
    >
      <div style={{
        width: '76px',
        height: '76px',
        borderRadius: '50%',
        background: '#ffffff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        border: '2px solid #F1F5F9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        marginBottom: '8px',
        position: 'relative'
      }}>
        {bar.image_url ? (
          <img
            src={bar.image_url}
            alt={bar.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <img
            src="/logo.png"
            alt={bar.name}
            style={{ width: '65%', height: '65%', objectFit: 'contain', opacity: 0.85 }}
          />
        )}
      </div>
      <span style={{
        fontSize: '13px',
        fontWeight: 900,
        color: '#1E293B',
        textAlign: 'center',
        width: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {bar.name || '이름 없음'}
      </span>
    </motion.div>
  );

  return (
    <>
      {/* 백그라운드 오버레이 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 190000 }}
      />

      {/* 메인 모달 컨테이너 */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        style={{
          position: 'fixed', inset: 0, background: '#ffffff', zIndex: 190001,
          display: 'flex', flexDirection: 'column', height: '100dvh',
          paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        {/* 상단 헤더 */}
        <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}>
          <div style={{ color: '#1E293B', fontSize: '18px', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.5px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
            전국 파티 장소 · 대관 안내
          </div>
          <button
            onClick={onClose}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E293B', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* 프리미엄 웰컴 헤더 영역 */}
        <div style={{ padding: '24px 20px 12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#10B981', letterSpacing: '0.5px', textTransform: 'uppercase', background: '#ECFDF5', padding: '3px 8px', borderRadius: '6px' }}>
                Premium Guide
              </span>
              <h3 style={{ margin: '8px 0 0', fontSize: '22px', fontWeight: 950, color: '#0F172A', letterSpacing: '-0.5px', lineHeight: 1.3 }}>
                내 주변 파티 공간 찾기
              </h3>
            </div>
            <button
              onClick={() => setShowRegisterForm(true)}
              style={{
                background: '#F8FAFC',
                color: '#334155',
                border: '1px solid #E2E8F0',
                borderRadius: '100px',
                padding: '8px 14px',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <Plus size={14} strokeWidth={2.5} /> 공간 등재 신청
            </button>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#64748B', fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.2px' }}>
            사장님과 댄서분들이 함께 소통하는 전국 핫플레이스 위치 및 대관 안내 플랫폼입니다.
          </p>
        </div>

        {/* 메인 스크롤 콘텐츠 영역 (상단 지역 탭 탑재) */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
          {/* 수평 스크롤 지역 탭 바 */}
          <div style={{
            display: 'flex', overflowX: 'auto', gap: '8px', padding: '0 20px 16px',
            borderBottom: '1px solid #F1F5F9', flexShrink: 0, scrollbarWidth: 'none'
          }}>
            {['전체', ...REGIONS_ORDER].map((tab) => {
              const isSelected = selectedRegionTab === tab;
              const count = tab === '전체' ? locations.length : locations.filter(b => b.region === tab).length;

              return (
                <button
                  key={tab}
                  onClick={() => setSelectedRegionTab(tab)}
                  style={{
                    flexShrink: 0,
                    padding: '8px 16px',
                    background: isSelected ? '#FFF1F2' : '#F8FAFC',
                    color: isSelected ? '#E53935' : '#64748B',
                    border: isSelected ? '1px solid #FECDD3' : '1px solid #E2E8F0',
                    borderRadius: '100px',
                    fontWeight: isSelected ? 950 : 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>{tab}</span>
                  <span style={{
                    fontSize: '10px',
                    background: isSelected ? '#E53935' : '#E2E8F0',
                    color: isSelected ? '#ffffff' : '#475569',
                    padding: '1px 6px',
                    borderRadius: '100px',
                    fontWeight: 800
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 선택된 탭에 해당하는 리스트 그리드 출력 */}
          <div style={{ padding: '20px', flex: 1 }}>
            {isLoading ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94A3B8', fontWeight: 700 }}>
                전국 BAR 정보를 정렬하는 중...
              </div>
            ) : (
              (() => {
                const filteredBars = selectedRegionTab === '전체' 
                  ? locations 
                  : locations.filter(bar => bar.region === selectedRegionTab);

                if (filteredBars.length === 0) {
                  return (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8', fontSize: '13px', fontWeight: 600 }}>
                      해당 지역에 등록된 제휴 공간이 없습니다.
                    </div>
                  );
                }

                return (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={selectedRegionTab}
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(4, 1fr)', 
                      gap: '20px 8px'
                    }}
                  >
                    {filteredBars.map(renderBarCard)}
                  </motion.div>
                );
              })()
            )}
          </div>
        </div>
      </motion.div>

      {/* 팝업 1: BAR 등록 폼 모달 */}
      <AnimatePresence>
        {showRegisterForm && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 190010, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRegisterForm(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              style={{
                background: '#ffffff',
                borderRadius: '24px',
                padding: '24px',
                width: '100%',
                maxWidth: '360px',
                maxHeight: '85dvh',
                overflowY: 'auto',
                position: 'relative',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <button
                onClick={() => setShowRegisterForm(false)}
                style={{ position: 'absolute', top: '20px', right: '20px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>

              <div>
                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 950, color: '#1E293B' }}>신규 BAR 등재 신청</h4>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B' }}>모든 정보는 실시간 반영됩니다.</p>
              </div>

              <form onSubmit={handleSubmitRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>BAR 이름 *</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 홍대 턴바"
                    value={formData.name}
                    onChange={handleNameChange}
                    style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', fontWeight: 600, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>상세 주소 *</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 서울 마포구 동교동 123-4 B1"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', fontWeight: 600, outline: 'none' }}
                  />
                  <span style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px', display: 'block' }}>
                    입력하신 주소 키워드를 기반으로 지역 탭이 자동 배정됩니다.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>대표 이미지 사진</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ fontSize: '12px', width: '100%', padding: '8px', border: '1px dashed #CBD5E1', borderRadius: '12px', background: '#F8FAFC' }}
                  />
                  {previewUrl && (
                    <div style={{ marginTop: '8px', width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                      <img src={previewUrl} alt="미리보기" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>카카오톡 문의 링크</label>
                  <input
                    type="url"
                    placeholder="https://open.kakao.com/o/..."
                    value={formData.kakao_url}
                    onChange={e => setFormData({ ...formData, kakao_url: e.target.value })}
                    style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>인스타그램 링크</label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/..."
                    value={formData.instagram_url}
                    onChange={e => setFormData({ ...formData, instagram_url: e.target.value })}
                    style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    marginTop: '8px',
                    width: '100%',
                    padding: '14px',
                    background: '#E53935',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '14px',
                    fontWeight: 950,
                    fontSize: '15px',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'BAR 등록 완료하기'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 팝업 2: BAR 클릭 시 나타나는 미니 팝업 모달 */}
      <AnimatePresence>
        {selectedBar && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 190005, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBar(null)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}
            />

            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ type: 'spring', damping: 22, stiffness: 320 }}
              style={{
                background: '#ffffff',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '340px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #F1F5F9'
              }}
            >
              {/* 상단 커버 이미지 영역 (사진 크게, 어두운 오버레이 없음) */}
              <div style={{
                height: '180px',
                background: '#F8FAFC',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {selectedBar.image_url ? (
                  <img
                    src={selectedBar.image_url}
                    alt={selectedBar.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F1F5F9' }}>
                    <img src="/logo.png" alt="logo" style={{ width: '40%', objectFit: 'contain', opacity: 0.3 }} />
                  </div>
                )}

                {/* 닫기 원형 버튼 (우측 상단 플로팅, 밝고 명확하게) */}
                <button
                  onClick={() => setSelectedBar(null)}
                  style={{
                    position: 'absolute', top: '12px', right: '12px',
                    background: '#ffffff',
                    border: 'none', borderRadius: '50%', width: '30px', height: '30px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#1E293B', cursor: 'pointer', zIndex: 10,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>

              {/* 하단 텍스트 및 액션 버튼 영역 (흰색 배경, 가독성 극대화) */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#ffffff' }}>
                <div>
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', background: '#FFF1F2', color: '#E53935', fontWeight: 800, padding: '3px 8px', borderRadius: '6px' }}>
                      {selectedBar.region} 제휴 공간
                    </span>
                  </div>
                  <h4 style={{ margin: 0, fontSize: '22px', fontWeight: 950, color: '#1E293B', letterSpacing: '-0.5px', lineHeight: 1.3 }}>
                    {selectedBar.name}
                  </h4>
                  
                  {/* 주소 영역 (#E53935 포인트 아이콘 + 진한 회색 텍스트) */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginTop: '8px' }}>
                    <MapPin size={15} color="#E53935" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '13px', color: '#334155', fontWeight: 700, lineHeight: 1.4, letterSpacing: '-0.2px' }}>
                      {selectedBar.address || '등록된 상세 주소가 없습니다.'}
                    </span>
                  </div>
                </div>

                {/* 버튼 그룹 (최고급 세련된 UI 구성) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* 길찾기 2분할 버튼 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleGoogleMapClick(selectedBar)}
                      style={{
                        padding: '12px 6px',
                        background: '#F8FAFC',
                        color: '#1E293B',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        fontWeight: 800,
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyCenter: 'center',
                        gap: '5px'
                      }}
                    >
                      🗺️ 구글 길찾기
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleKakaoMapClick(selectedBar)}
                      style={{
                        padding: '12px 6px',
                        background: '#F8FAFC',
                        color: '#1E293B',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        fontWeight: 800,
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyCenter: 'center',
                        gap: '5px'
                      }}
                    >
                      📍 카카오 길찾기
                    </motion.button>
                  </div>

                  {/* 카카오톡 대관 문의 */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleKakaoClick(selectedBar.kakao_url)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: '#FEE500',
                      color: '#1E293B',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: 900,
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '7px'
                    }}
                  >
                    💬 카카오톡 대관 문의
                  </motion.button>

                  {/* 인스타그램 공간 구경하기 */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleInstaClick(selectedBar.instagram_url)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: '#1E293B',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: 900,
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '7px'
                    }}
                  >
                    📸 인스타그램 공간 구경
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
