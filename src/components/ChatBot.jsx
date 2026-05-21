import React, { useState, useRef, useEffect } from 'react';
import { Z } from '../constants/zLayers';
import { supabase } from '../lib/supabase'
import { LOCATIONS_SELECT } from '../lib/locationsQuery'
import {
  CHAT_GENRE_BY_NUM,
  logPartiesFetchError,
  enrichPartiesWithVenues,
  fetchPartiesForChat,
  filterPartiesForChat,
  buildLocationCoordMap,
  curatePartiesForChat,
  inferUserRegionFromCoords,
  partyMatchesUserRegion,
  resolvePartyVenueName,
  stripPlatformSuffixFromTitle,
  formatPartyDateWithWeekday,
  formatPartyFeeLabel,
} from '../lib/partiesQuery'
import { getKSTCalendarTodayStr } from '../lib/dateNorm';
import { getUserCoords, isGeoDenied, readCachedCoords } from '../lib/geoCache';
import { formatDistanceLabel } from '../lib/geoDistance';
import { DEFAULT_CARD_IMAGE, imgFallbackHandler } from '../constants/imageAssets';

// 관리자가 수동으로 동호회/빠 변동 사항을 기록하는 공간
const ADMIN_KNOWLEDGE = `
[관리자 실시간 팩트 체크]
- 입장료: 서울권 약 1.2만원, 지방권 약 1만원, 파티/이벤트는 1.5~3만원 수준입니다.
- 음악 비율: 일반적으로 바차타 4 : 살사 2 또는 바차타 3 : 살사 3 비율로 나옵니다.
- 동호회 명칭: 특정 동호회 이름 대신 각 빠(Bar)의 '동호회'라고만 지칭하세요. 특정 이름 언급은 피합니다.
`;

const MENU_MSG = '오늘 뭘 찾으세요?\n1. 파티\n2. 강습\n3. 부트캠프\n4. 페스티벌';
const GENRE_MSG = '장르는?\n1. 바차타\n2. 살사\n3. 쥬크\n4. 키좀바';
const RESTART_MSG = '다시 찾으시겠어요?\n1. 예  2. 아니오';

const buildLocationIntroMessage = (region) => {
  if (!region || region === '전국') {
    return '📍 현재 위치를 확인하지 못했어요.\n전국 기준으로 안내해 드릴게요.';
  }
  return `📍 **현재 위치는 ${region}지역**입니다.\n**${region}지역** 행사를 우선으로 안내해 드릴게요!`;
};

const CONCIERGE_HOME_GUIDE =
  '💡 이 행사의 상세 정보와 예매는 [홈 화면] ➡️ 하단 [소셜/부트캠프/페스티벌] 탭 이동 ➡️ 해당 포스터를 클릭하시면 확인하실 수 있습니다!';

const normalizeChoice = (raw) =>
  String(raw || '')
    .trim()
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));

const renderFormattedContent = (content) => {
  const imgRegex = /!\[poster\]\((.*?)\)/;
  const match = typeof content === 'string' ? content.match(imgRegex) : null;
  let text = typeof content === 'string' ? content : '';

  if (match) {
    text = text.replace(imgRegex, '').trim();
  }

  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  const body = parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} style={{ fontWeight: 800, color: '#0f172a' }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });

  if (match) {
    return (
      <>
        {body}
        <img
          src={match[1]}
          alt="Party Poster"
          style={{ width: '100%', borderRadius: '12px', marginTop: '10px', display: 'block' }}
        />
      </>
    );
  }
  return body;
};

const resolvePosterSrc = (url) => {
  const src = url && String(url).trim();
  return src || DEFAULT_CARD_IMAGE;
};

const inferRegionFromText = (text) => {
  const t = String(text || '');
  if (/서울|강남|홍대|잠실|건대|성수/.test(t)) return '서울';
  if (/인천|경기|수원|부천|분당|일산|경인/.test(t)) return '경인';
  if (/부산|대구|울산|경상|창원|포항/.test(t)) return '경상도';
  if (/광주|전라|전주|목포|여수/.test(t)) return '전라도';
  if (/대전|충청|천안|청주|세종/.test(t)) return '충청도';
  if (/강원|제주|춘천|원주/.test(t)) return '강원/제주';
  return '전국';
};

const GENRE_MSG_NATIONWIDE =
  '부트캠프·페스티벌은 **전국**에서 모이는 행사예요. 지역과 관계없이 포스터를 안내해 드릴게요.\n장르는?\n1. 바차타\n2. 살사\n3. 쥬크\n4. 키좀바';

const formatNationwideVenueLine = (row) => {
  const place = row?.venue || row?.region || row?.address || row?.location;
  return place ? `📍 ${place}` : '📍 장소·일정은 포스터에서 확인';
};

/** 부트캠프·페스티벌 — 지역 필터 없이 장르 우선, 없으면 전국 프로그램 */
const pickNationwideGenreEvents = (rows, genreName, { todayStr, limit = 5 } = {}) => {
  const upcoming = (rows || []).filter((r) => {
    const d = String(r.start_date || r.date || '').slice(0, 10);
    return !todayStr || !d || d >= todayStr;
  });
  const genreHits = upcoming.filter((r) => String(r.genre || '').includes(genreName));
  const pool = genreHits.length ? genreHits : upcoming;
  const withPoster = pool.filter((r) => String(r.poster_url || '').trim());
  const sorted = [...(withPoster.length ? withPoster : pool)].sort((a, b) =>
    String(a.start_date || a.date || '').localeCompare(String(b.start_date || b.date || '')),
  );
  return {
    list: sorted.slice(0, limit),
    usedGenreFallback: genreHits.length === 0 && sorted.length > 0,
  };
};

const mapBootcampConciergeItem = (b) => ({
  headline: `🎓 부트캠프 · ${b.instructor || b.title || '부트캠프'}`,
  lines: [
    `📅 시작: ${String(b.start_date || '').slice(0, 10)}`,
    formatNationwideVenueLine(b),
    `💰 비용: ${b.fee || b.price_info || '문의'}`,
  ],
  posterUrl: b.poster_url || null,
});

const mapFestivalConciergeItem = (f) => ({
  headline: `🎉 페스티벌 · ${f.title || f.name || '페스티벌'}`,
  lines: [
    `📅 일정: ${String(f.start_date || f.date || '').slice(0, 10)}`,
    formatNationwideVenueLine(f),
    `💰 참가비: ${f.fee || f.price || '확인 필요'}`,
  ],
  posterUrl: f.poster_url || null,
});

const ConciergeResultCard = ({ item }) => {
  const posterSrc = resolvePosterSrc(item.posterUrl);

  return (
    <div className="concierge-result-card">
      <div className="concierge-result-card__body">
        {item.headline ? (
          <div className="concierge-result-card__headline">{item.headline}</div>
        ) : null}
        {(item.lines || []).map((line, li) => (
          <div key={li} className="concierge-result-card__line">{line}</div>
        ))}
      </div>
      <div className="concierge-result-card__poster-wrap">
        <img
          src={posterSrc}
          alt=""
          loading="lazy"
          className="concierge-result-card__poster"
          onError={imgFallbackHandler(DEFAULT_CARD_IMAGE)}
        />
      </div>
      <p className="concierge-result-card__guide">{CONCIERGE_HOME_GUIDE}</p>
    </div>
  );
};

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('open-chatbot', handler);
    return () => window.removeEventListener('open-chatbot', handler);
  }, []);
  const [messages, setMessages] = useState([
    { role: 'model', content: "안녕하세요! 밤빠 컨시어지예요.\n오늘 밤, 당신의 완벽한 댄스 파티를 함께 찾아드릴게요!" },
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const [dbData, setDbData] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [geoRegion, setGeoRegion] = useState(null);
  const [geoRegionReady, setGeoRegionReady] = useState(false);
  const locationIntroShownRef = useRef(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  /** step 0=위치 확인, 1=카테고리, 2=장르, 3=재검색 */
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState(null);
  const [genre, setGenre] = useState(null);

  // 키보드 대응: 비주얼 뷰포트 높이 감지
  useEffect(() => {
    if (!window.visualViewport) return;

    const handleResize = () => {
      setViewportHeight(window.visualViewport.height);
      // 키보드가 올라올 때 스크롤 최하단 유지
      if (isOpen) {
        setTimeout(scrollToBottom, 100);
      }
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);

    return () => {
      window.visualViewport.removeEventListener('resize', handleResize);
      window.visualViewport.removeEventListener('scroll', handleResize);
    };
  }, [isOpen]);

  // 위치: 캐시 우선 → GPS (컨시어지 열릴 때 현재 지역 확정)
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const applyCoords = (coords) => {
      if (cancelled) return;
      const region = coords ? inferUserRegionFromCoords(coords) : '전국';
      setUserLocation(coords ? { lat: coords.lat, lng: coords.lng } : null);
      setGeoRegion(region);
      setGeoRegionReady(true);
    };

    const resolveGeo = async () => {
      const cached = readCachedCoords();
      if (cached) {
        applyCoords(cached);
        return;
      }
      if (isGeoDenied()) {
        applyCoords(null);
        return;
      }
      try {
        const fresh = await getUserCoords({ enableHighAccuracy: true, maxAgeMs: 60_000 });
        applyCoords(fresh);
      } catch {
        applyCoords(null);
      }
    };

    setGeoRegionReady(false);
    setGeoRegion(null);
    locationIntroShownRef.current = false;
    setStep(0);
    setCategory(null);
    setGenre(null);
    setMessages([
      { role: 'model', content: "안녕하세요! 밤빠 컨시어지예요.\n오늘 밤, 당신의 완벽한 댄스 파티를 함께 찾아드릴게요!" },
    ]);
    resolveGeo();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !geoRegionReady || locationIntroShownRef.current) return;
    locationIntroShownRef.current = true;
    setMessages((prev) => [
      ...prev,
      { role: 'model', content: buildLocationIntroMessage(geoRegion) },
      { role: 'model', content: MENU_MSG },
    ]);
    setStep(1);
  }, [isOpen, geoRegionReady, geoRegion]);

  // 챗봇 오픈 시 플랫폼 실시간 데이터 로드
  useEffect(() => {
    if (isOpen && !isDataLoaded) {
      const fetchData = async () => {
        try {
          const todayStr = getKSTCalendarTodayStr();

          const [partiesRes, locationsRes, instructorsRes, bootcampsRes, festivalsRes] =
            await Promise.all([
              fetchPartiesForChat(supabase, { todayStr, limit: 50 }),
              supabase.from('locations').select(LOCATIONS_SELECT),
              supabase.from('instructors').select('*').eq('status', 'active'),
              supabase.from('bootcamps').select('*').eq('status', 'active').order('start_date', { ascending: true }),
              supabase.from('festivals').select('*').eq('status', 'active').order('start_date', { ascending: true }),
            ]);

          if (partiesRes.error) {
            logPartiesFetchError(partiesRes.error);
            throw partiesRes.error;
          }

          const locationsList = locationsRes.error ? [] : locationsRes.data || [];
          const partiesWithVenue = enrichPartiesWithVenues(partiesRes.data || [], locationsList);

          setDbData({
            parties: filterPartiesForChat(partiesWithVenue, { todayStr }),
            locations: locationsList,
            locationCoordMap: buildLocationCoordMap(locationsList),
            instructors: instructorsRes.data || [],
            bootcamps: bootcampsRes.data || [],
            festivals: festivalsRes.data || [],
          });
        } catch (e) {
          logPartiesFetchError(e);
          console.error('Failed to fetch DB data for ChatBot', e);
        } finally {
          setIsDataLoaded(true);
        }
      };
      fetchData();
    }
  }, [isOpen, isDataLoaded]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /* [OLD] handleSend — Groq AI 호출 방식 (주석 처리)
  const handleSend = async () => {
    if (!input.trim()) return;

    const lowerInput = input.trim().toLowerCase();
    const isYes = lowerInput === 'y' || lowerInput === 'ㅛ' || lowerInput === '네' || lowerInput === 'yes';

    if (isYes && dbData?.parties?.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const upcoming = dbData.parties.filter(p => p.date >= today).slice(0, 2);
      const reply = upcoming.length > 0
        ? upcoming.map(p => `🎵 ${p.title} | ${p.time?.split('-')[0].trim()} | ${p.fee}`).join('\n')
        : '현재 등록된 파티가 없어요 😢';
      setMessages(prev => [...prev, { role: 'user', content: input }, { role: 'model', content: reply }]);
      setInput('');
      setIsLoading(false);
      return;
    }

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!groqApiKey) throw new Error('Groq API key is missing');
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const getRegionName = (loc) => {
        if (!loc) return null;
        const { lat, lng } = loc;
        if (lat > 37.3 && lat < 37.7 && lng > 126.8 && lng < 127.3) return '서울';
        if (lat > 37.2 && lat < 37.6 && lng > 126.4 && lng < 126.8) return '인천';
        if (lat > 37.0 && lat < 37.8 && lng > 126.5 && lng < 127.8) return '수도권/경기';
        if (lat > 34.9 && lat < 35.4 && lng > 128.8 && lng < 129.4) return '부산';
        if (lat > 35.6 && lat < 36.1 && lng > 128.4 && lng < 128.8) return '대구';
        return '지방권';
      };
      const currentRegion = getRegionName(userLocation);
      let dataContext = "현재 실시간 데이터베이스 정보가 없습니다.";
      if (dbData) {
        const partiesInfo = dbData.parties.map(p => {
          const venue = p.locationName || p.location_name || p.studio_name || '장소 확인 필요';
          return `- 파티명: ${p.title} | 장소: ${venue} | 날짜: ${p.date} | 입장료: ${p.fee || '정보 없음'} | 지역: ${p.broadRegion || p.region || '전국'} | 이미지: ${p.imageUrl || '없음'}`;
        }).join('\n');
        const instructorsInfo = dbData.instructors.map(i => `- 강사명: ${i.name} | 장르: ${i.genres || '정보 없음'} | 지역: ${i.region || i.broadRegion || '정보 없음'} | SNS: ${i.instagram_id || i.sns_id || '없음'} | 가격: ${i.price || '문의'}`).join('\n');
        dataContext = `\n\n[실시간 플랫폼 정보]\n오늘 날짜: ${todayStr}\n* 파티:\n${partiesInfo}\n* 강사:\n${instructorsInfo}\n${ADMIN_KNOWLEDGE}`;
      }
      const systemPrompt = `당신은 밤빠 컨시어지입니다. 아래 규칙을 절대 준수하세요.\n[절대 규칙]\n1. 답변은 무조건 3줄 이내\n2. 첫 질문: "어떤 장르요? 1.바차타 2.살사 3.쥬크 4.키좀바"\n3. 장르 선택 후: "오늘 근처 파티 찾을까요? Y/N"\n4. Y면 DB에서 가까운 파티 최대 2개만 출력 (형식: "🎵 파티명 | 시간 | 입장료")\n5. 설명, 인사말, 긴 문장 절대 금지\n[데이터 규칙 - 절대 준수]\n- 파티 추천 시 반드시 위에서 전달된 [실시간 플랫폼 정보] 데이터만 사용\n- DB에 없는 파티명, 장소, 시간, 금액은 절대 지어내지 말 것\n- DB 데이터가 없으면 "현재 근처 파티 정보가 없어요 😢" 한 줄로 끝\n${dataContext}`;
      const apiMessages = [
        { role: "system", content: systemPrompt },
        ...newMessages.slice(-8).map(msg => ({ role: msg.role === 'model' ? 'assistant' : 'user', content: msg.content }))
      ];
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: apiMessages, temperature: 0.7, max_tokens: 1024 })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Groq API request failed');
      if (data.choices && data.choices.length > 0) {
        setMessages(prev => [...prev, { role: 'model', content: data.choices[0].message.content }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', content: "죄송합니다, 답변을 생성하지 못했습니다." }]);
      }
    } catch (error) {
      console.error('Groq API Error:', error);
      const errorMessage = error.message?.includes('429') || error.message?.includes('quota')
        ? "지금 대화가 너무 많아 밤빠가 조금 힘들어하네요! 😅\n약 1분 뒤에 다시 말을 걸어주시면 감사하겠습니다! ✨"
        : "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      setMessages(prev => [...prev, { role: 'model', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };
  */

  /* [OLD] getResultItems — 결과를 카드 타입으로 반환 (주석 보존)
  const getResultItems = (catNum, genreName) => {
    if (!dbData) return [];

    if (catNum === '1') {
      return (dbData.parties || [])
        .filter(p => (p.genre || '').includes(genreName))
        .slice(0, 3)
        .map(p => ({
          label: `🎵 ${p.title} | ${p.date} | ${p.fee || '무료'}`,
          posterUrl: p.imageUrl || p.poster_url || null
        }));
    }
    if (catNum === '2') {
      return (dbData.instructors || [])
        .filter(i => (Array.isArray(i.genre) ? i.genre.join(' ') : (i.genre || '')).includes(genreName))
        .slice(0, 3)
        .map(i => ({
          label: `🎵 ${i.name} | ${Array.isArray(i.genre) ? i.genre.join('/') : (i.genre || genreName)} | ${i.price || i.fee || '문의'}`,
          posterUrl: i.photo_url || null
        }));
    }
    if (catNum === '3') {
      return (dbData.bootcamps || [])
        .filter(b => (b.genre || '').includes(genreName))
        .slice(0, 3)
        .map(b => ({
          label: `🎵 ${b.instructor} | ${b.start_date?.slice(0, 10)} | ${b.fee || b.price_info || '문의'}`,
          posterUrl: b.poster_url || null
        }));
    }
    if (catNum === '4') {
      return (dbData.festivals || [])
        .filter(f => (f.genre || '').includes(genreName))
        .slice(0, 3)
        .map(f => ({
          label: `🎵 ${f.title || f.name} | ${(f.start_date || f.date)?.slice(0, 10)} | ${f.fee || '확인 필요'}`,
          posterUrl: f.poster_url || null
        }));
    }
    return [];
  };
  */
  const buildPartyResultItems = (genreName, coords = userLocation, region = geoRegion) => {
    const todayStr = getKSTCalendarTodayStr();
    const coordMap = dbData?.locationCoordMap || buildLocationCoordMap(dbData?.locations);
    const hasCoords = coords?.lat != null && coords?.lng != null;
    const regionLabel = region && region !== '전국' ? region : null;
    const matched = curatePartiesForChat(dbData?.parties || [], {
      todayStr,
      genreName,
      userCoords: coords,
      coordMap,
      userRegion: regionLabel,
      limit: 5,
    });

    if (matched.length === 0) {
      const regionHint = regionLabel
        ? `**${regionLabel}지역**에 오늘(${todayStr}) 등록된 **${genreName}** 파티가 없어요.`
        : `오늘(${todayStr}) 등록된 **${genreName}** 파티가 없어요.`;
      return {
        empty: `${regionHint}\n다른 장르 번호를 골라보시거나 메인 화면 **오늘의 파티**를 확인해 주세요.`,
        headline: null,
        items: [],
      };
    }

    const headline = regionLabel
      ? `✨ 오늘(${todayStr}) [${regionLabel}] ${genreName} 추천 ${matched.length}건`
      : hasCoords
        ? `✨ 오늘(${todayStr}) ${genreName} 근처 추천 ${matched.length}건`
        : `✨ 오늘(${todayStr}) ${genreName} 추천 ${matched.length}건`;

    const items = matched.map((p) => {
      const venue = resolvePartyVenueName(p, coordMap);
      const title = stripPlatformSuffixFromTitle(p.title);
      const lines = [
        `📅 ${formatPartyDateWithWeekday(p.date)}`,
        `💰 ${formatPartyFeeLabel(p.fee)}`,
      ];
      if (hasCoords && p._distanceKm != null) {
        lines.push(`📍 ${formatDistanceLabel(p._distanceKm)}`);
      }
      return {
        headline: `🎵 ${venue} · ${title}`,
        lines,
        posterUrl: p.imageUrl || p.poster_url || null,
      };
    });

    return { empty: null, headline, items };
  };

  const buildOtherCategoryItems = (catNum, genreName, region = geoRegion) => {
    if (!dbData) {
      return { empty: '현재 등록된 정보가 없어요 😢', headline: null, items: [] };
    }

    const targetRegion = region && region !== '전국' ? region : inferUserRegionFromCoords(userLocation);

    if (catNum === '2') {
      const instructors = dbData.instructors || [];
      const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const sourceRows = [...(dbData.parties || []), ...(dbData.bootcamps || []), ...(dbData.festivals || [])];
      const isGenreMatched = (value) => String(value || '').includes(genreName);
      const genreFiltered = instructors.filter((i) =>
        isGenreMatched(Array.isArray(i.genre) ? i.genre.join(' ') : i.genre || i.genres),
      );
      const scored = genreFiltered.map((inst) => {
        const normalizedName = String(inst.name || '').replace(/\s+/g, '').toLowerCase();
        const rows = sourceRows.filter((row) => {
          const poster = String(row.poster_url || row.imageUrl || '').trim();
          if (!poster) return false;
          const ts = new Date(row.created_at || row.start_date || row.date || 0).getTime();
          if (!Number.isFinite(ts) || ts < since) return false;
          const rid = String(row.instructor_id || row.contributor_id || '').trim();
          const byId = rid && String(inst.id) && rid === String(inst.id);
          const rName = String(row.instructor || row.teacher || row.name || '').replace(/\s+/g, '').toLowerCase();
          const byName = normalizedName && rName && normalizedName === rName;
          if (!byId && !byName) return false;
          return isGenreMatched(row.genre || row.title || row.description);
        });

        const latestTs = rows.reduce((max, row) => {
          const ts = new Date(row.created_at || row.start_date || row.date || 0).getTime();
          return Number.isFinite(ts) && ts > max ? ts : max;
        }, 0);
        const regionMatched =
          targetRegion &&
          targetRegion !== '전국' &&
          rows.some((row) =>
            partyMatchesUserRegion(
              {
                title: row.title,
                address: row.address,
                locationName: row.locationName || row.venue || row.region,
              },
              targetRegion,
            ),
          );
        const bestPoster =
          rows.find((r) => String(r.poster_url || r.imageUrl || '').trim())?.poster_url ||
          inst.photo_url ||
          inst.poster_url ||
          null;
        return {
          inst,
          rows,
          regionMatched,
          activityScore: rows.length,
          latestTs,
          bestPoster,
        };
      });

      const list = scored
        .filter((s) => s.activityScore > 0)
        .sort((a, b) => {
          if (a.regionMatched !== b.regionMatched) return a.regionMatched ? -1 : 1;
          if (a.activityScore !== b.activityScore) return b.activityScore - a.activityScore;
          return b.latestTs - a.latestTs;
        })
        .slice(0, 2);

      if (!list.length) return { empty: `**${genreName}** 강사 정보가 없어요.`, headline: null, items: [], isTop2Instructors: true };
      return {
        empty: null,
        headline: `현재 [${targetRegion}] 지역에서 [${genreName}]를 가장 활발하게 리드하고 계신 마스터 2분을 추천해 드립니다!`,
        isTop2Instructors: true,
        items: list.map(({ inst, activityScore, regionMatched, latestTs, bestPoster }) => ({
          headline: `🎵 ${inst.name || '강사'}`,
          lines: [
            `📍 지역 일치: ${regionMatched ? '예' : '아니오'}`,
            `📊 최근 30일 포스터: ${activityScore}건`,
            `🕒 최근 등록: ${latestTs ? new Date(latestTs).toISOString().slice(0, 10) : '-'}`,
            `💬 연락: ${inst.instagram_id || inst.sns_id || inst.phone || '문의'}`,
          ],
          posterUrl: bestPoster,
        })),
      };
    }

    if (catNum === '3') {
      const todayStr = getKSTCalendarTodayStr();
      const bootPick = pickNationwideGenreEvents(dbData.bootcamps, genreName, { todayStr, limit: 3 });
      const festPick = pickNationwideGenreEvents(dbData.festivals, genreName, { todayStr, limit: 2 });
      const items = [
        ...bootPick.list.map(mapBootcampConciergeItem),
        ...festPick.list.map(mapFestivalConciergeItem),
      ];
      if (!items.length) {
        return {
          empty:
            '**전국**에 등록된 부트캠프·페스티벌이 아직 없어요.\n홈 화면 **부트캠프**·**페스티벌** 탭에서 곧 확인해 주세요.',
          headline: null,
          items: [],
        };
      }
      const genreNote =
        bootPick.usedGenreFallback || festPick.usedGenreFallback
          ? ' · 요청 장르 외 전국 프로그램 포함'
          : '';
      return {
        empty: null,
        headline: `✨ 전국 ${genreName} · 부트캠프 & 페스티벌 ${items.length}건${genreNote}`,
        items,
      };
    }

    if (catNum === '4') {
      const todayStr = getKSTCalendarTodayStr();
      const festPick = pickNationwideGenreEvents(dbData.festivals, genreName, { todayStr, limit: 5 });
      if (!festPick.list.length) {
        return {
          empty:
            '**전국**에 등록된 페스티벌이 아직 없어요.\n홈 화면 **페스티벌** 탭에서 포스터를 확인해 주세요.',
          headline: null,
          items: [],
        };
      }
      const genreNote = festPick.usedGenreFallback ? ' · 요청 장르 외 전국 행사 포함' : '';
      return {
        empty: null,
        headline: `✨ 전국 ${genreName} 페스티벌 ${festPick.list.length}건${genreNote}`,
        items: festPick.list.map(mapFestivalConciergeItem),
      };
    }

    return { empty: '현재 등록된 정보가 없어요 😢', headline: null, items: [] };
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userInput = normalizeChoice(input);
    setInput('');
    setIsLoading(false);
    const userMsg = { role: 'user', content: userInput };

    if (step === 0) {
      setMessages((prev) => [...prev, userMsg, { role: 'model', content: '잠시만요, 현재 위치를 확인하고 있어요…' }]);
      return;
    }

    if (step === 1) {
      if (!['1', '2', '3', '4'].includes(userInput)) {
        setMessages((prev) => [...prev, userMsg, { role: 'model', content: '번호로 선택해주세요 😊' }]);
        return;
      }
      setCategory(userInput);
      setStep(2);
      const genrePrompt = userInput === '3' || userInput === '4' ? GENRE_MSG_NATIONWIDE : GENRE_MSG;
      setMessages((prev) => [...prev, userMsg, { role: 'model', content: genrePrompt }]);
      return;
    }

    if (step === 2) {
      if (!['1', '2', '3', '4'].includes(userInput)) {
        setMessages((prev) => [...prev, userMsg, { role: 'model', content: '번호로 선택해주세요 😊' }]);
        return;
      }
      const selectedGenre = CHAT_GENRE_BY_NUM[userInput];
      setGenre(userInput);
      setStep(3);

      let coords = userLocation;
      if (category === '1') {
        try {
          const fresh = await getUserCoords({ enableHighAccuracy: true, maxAgeMs: 60_000 });
          coords = { lat: fresh.lat, lng: fresh.lng };
          setUserLocation(coords);
        } catch {
          /* 캐시·기존 좌표로 정렬 */
        }
      }

      const resultBundle =
        category === '1'
          ? buildPartyResultItems(selectedGenre, coords)
          : buildOtherCategoryItems(category, selectedGenre);

      if (resultBundle.empty) {
        setMessages((prev) => [
          ...prev,
          userMsg,
          { role: 'model', content: resultBundle.empty },
          ...(resultBundle.isTop2Instructors
            ? [{ role: 'model', content: '📣 우리 지역 장르별 TOP 2에 들려면, 가장 최근에, 자주 포스터를 등록하십시오.' }]
            : []),
          { role: 'model', content: RESTART_MSG },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          userMsg,
          { role: 'model', type: 'results', headline: resultBundle.headline, items: resultBundle.items },
          ...(resultBundle.isTop2Instructors
            ? [{ role: 'model', content: '📣 우리 지역 장르별 TOP 2에 들려면, 가장 최근에, 자주 포스터를 등록하십시오.' }]
            : []),
          { role: 'model', content: RESTART_MSG },
        ]);
      }
      return;
    }

    if (step === 3) {
      if (userInput === '1') {
        setStep(1);
        setCategory(null);
        setGenre(null);
        setMessages((prev) => [...prev, userMsg, { role: 'model', content: MENU_MSG }]);
        return;
      }
      if (userInput === '2') {
        setStep(1);
        setCategory(null);
        setGenre(null);
        setMessages((prev) => [...prev, userMsg, { role: 'model', content: '즐거운 댄스 되세요! 🎶' }]);
        return;
      }
      setMessages((prev) => [...prev, userMsg, { role: 'model', content: '번호로 선택해주세요 😊' }]);
    }
  };

  const startVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("음성 인식을 지원하지 않는 브라우저입니다.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const handleClose = () => {
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('close-chatbot'));
  };

  return (
    <>
      {isOpen && (
        <>
        <style>{`
          @keyframes slideUpChat {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          .concierge-result-card {
            background: #fff;
            border: 1px solid #eaeaea;
            border-radius: 16px;
            padding: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          }
          .concierge-result-card__headline {
            font-size: 15px;
            font-weight: 800;
            color: #0f172a;
            line-height: 1.45;
            margin-bottom: 6px;
          }
          .concierge-result-card__line {
            font-size: 13px;
            font-weight: 600;
            color: #475569;
            line-height: 1.5;
          }
          .concierge-result-card__poster-wrap {
            display: block;
            width: 100%;
            margin-top: 12px;
            border-radius: 12px;
            overflow: hidden;
          }
          .concierge-result-card__poster {
            display: block;
            width: 100%;
            max-height: 320px;
            object-fit: cover;
            object-position: center top;
            border-radius: 12px;
            background: #111;
          }
          .concierge-result-card__guide {
            margin: 12px 0 0;
            padding: 10px 12px;
            font-size: 12px;
            font-weight: 600;
            line-height: 1.55;
            color: #475569;
            background: #f8fafc;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
          }
        `}</style>
        {/* 챗봇: visualViewport 높이에 맞게 조정 → 키보드 올라와도 딱 맞음 */}
        <div style={{
          position: 'fixed',
          top: window.visualViewport ? window.visualViewport.offsetTop : 0,
          left: 0,
          width: '100%',
          height: `${viewportHeight}px`,
          zIndex: Z.modalBackdrop,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'white',
          animation: 'slideUpChat 0.25s ease-out'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
          >
          
          <div style={{
            backgroundColor: '#FFFFFF',
            color: '#333',
            padding: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #F0F0F0'
          }}>
            <div>
              <div style={{ fontWeight: '850', fontSize: '19px', color: '#FF8A80', letterSpacing: '-0.5px' }}>밤빠 컨시어지</div>
              <div style={{ fontSize: '13px', color: '#64748B', marginTop: '3px', fontWeight: '600' }}>
                {!geoRegionReady
                  ? '현재 위치 확인 중...'
                  : isDataLoaded
                    ? geoRegion && geoRegion !== '전국'
                      ? `${geoRegion}지역 우선 안내`
                      : '실시간 AI 가이드 가동 중'
                    : '정보를 불러오는 중...'}
              </div>
            </div>
            <button 
              onClick={handleClose}
              style={{ background: '#F5F5F5', border: 'none', color: '#888', cursor: 'pointer', fontSize: '18px', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>
          </div>

          <div style={{
            flex: 1,
            padding: '20px 16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            backgroundColor: '#FAFAFA'
          }}>
            {messages.map((msg, idx) => {
              // Results type: list of items with optional [포스터 보기] button
              if (msg.type === 'results') {
                return (
                  <div key={idx} style={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 'min(100%, 420px)', width: '100%' }}>
                    {msg.headline ? (
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', lineHeight: 1.45, padding: '0 2px' }}>
                        {renderFormattedContent(msg.headline)}
                      </div>
                    ) : null}
                    {msg.items.map((item, i) => (
                      <ConciergeResultCard key={`result-${i}-${item.headline || ''}`} item={item} />
                    ))}
                  </div>
                );
              }

              return (
                <div key={idx} style={{
                  alignSelf: msg.role === 'model' ? 'flex-start' : 'flex-end',
                  backgroundColor: msg.role === 'model' ? '#FFFFFF' : '#FF8A80',
                  padding: '12px 18px',
                  borderRadius: '20px',
                  borderTopLeftRadius: msg.role === 'model' ? '4px' : '20px',
                  borderTopRightRadius: msg.role === 'user' ? '4px' : '20px',
                  border: msg.role === 'model' ? '1px solid #EAEAEA' : 'none',
                  maxWidth: '88%',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  boxShadow: msg.role === 'model' ? '0 2px 5px rgba(0,0,0,0.03)' : '0 4px 10px rgba(255, 138, 128, 0.25)',
                  fontSize: '16px',
                  lineHeight: '1.65',
                  fontWeight: '600',
                  color: msg.role === 'model' ? '#1E293B' : '#FFFFFF',
                }}>
                  {renderFormattedContent(msg.content)}
                </div>
              );
            })}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', fontSize: '12px', color: '#AAA', marginLeft: '8px', fontStyle: 'italic' }}>
                밤빠봇이 생각 중입니다...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: 'white',
            borderTop: '1px solid #eee',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom))'
          }}>
            <button
              onClick={startVoiceRecognition}
              style={{
                background: isRecording ? '#ffebee' : '#F5F5F5',
                border: 'none',
                cursor: 'pointer',
                fontSize: '20px',
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                color: isRecording ? '#E53935' : '#777',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              title="음성 입력"
            >
              🎤
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={
                !geoRegionReady || !isDataLoaded ? '위치·데이터 확인 중...' : '메시지를 입력하세요...'
              }
              disabled={!isDataLoaded || !geoRegionReady || step < 1}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #EEE',
                borderRadius: '24px',
                outline: 'none',
                fontSize: '15px',
                backgroundColor: isDataLoaded ? '#F9F9F9' : '#F5F5F5'
              }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim() || !isDataLoaded || !geoRegionReady || step < 1}
              style={{
                background: (isLoading || !input.trim() || !isDataLoaded || !geoRegionReady || step < 1) ? '#EEE' : '#FF8A80',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '24px',
                cursor: (isLoading || !input.trim() || !isDataLoaded || !geoRegionReady || step < 1) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '800',
                transition: 'all 0.2s',
                boxShadow: (isLoading || !input.trim() || !isDataLoaded || !geoRegionReady || step < 1) ? 'none' : '0 4px 12px rgba(255, 138, 128, 0.3)',
                flexShrink: 0
              }}
            >
              전송
            </button>
          </div>
          </div>
        </div>
        </>
      )}
    </>
  );
};

export default ChatBot;
