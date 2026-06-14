import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { fetchBarStatsMap } from '../lib/barStatsQuery'
import { isApprovedParty } from '../lib/dateNorm'
import { buildLiveBarSpotlights } from '../lib/liveBannerBars'
import {
  LOCATIONS_WITH_REGION_NAME,
  logSupabaseError,
  resolveLocationRegionLabel,
} from '../lib/locationsQuery'
import {
  PARTIES_SELECT,
  PARTIES_WITH_LOCATION,
  enrichPartiesWithVenues,
  logPartiesFetchError,
  stripPlatformSuffixFromTitle,
} from '../lib/partiesQuery'
import { filterSocialPartyRows } from '../lib/postKind'
import { partiesTodayOrWeeklyOrFilter, partyMatchesCalendarDate, isWeeklyRecurringParty } from '../lib/partyRecurrence'

const SPOTLIGHT_ROTATE_MS = 5000
const LIVE_QUEUE_REFRESH_MS = 10 * 60 * 1000
const LIVE_WINDOW_MS = 24 * 60 * 60 * 1000
const LIVE_PROMO_PATH = '#community'
const LIVE_FALLBACK_LINE_KO = '전국 파티 진행중'
const LIVE_FALLBACK_LINE_EN = 'Nationwide parties live'

function getCommunityPostLine(row) {
  const content = String(row?.content || '').trim()
  const bar = String(row?.bar_name || '').trim()
  return content || bar || ''
}

function getRecentActivityTs(p) {
  const ts = new Date(p.updated_at || p.created_at || 0).getTime()
  return Number.isFinite(ts) ? ts : 0
}

/** 오늘(KST) 날짜에 등록·승인된 파티 — 포스터 있으면 LIVE 바에 모두 순환 */
function pickTodayPartyPool(list, todayStr) {
  const rows = filterSocialPartyRows(list || [])
    .filter(isApprovedParty)
    .filter((p) => String(p.poster_url || p.imageUrl || '').trim())
    .filter((p) => partyMatchesCalendarDate(p, todayStr))

  const seen = new Set()
  const unique = []
  for (const p of rows.sort((a, b) => getRecentActivityTs(b) - getRecentActivityTs(a))) {
    if (p?.id == null || seen.has(p.id)) continue
    seen.add(p.id)
    unique.push(p)
  }
  return unique
}

function getKSTWeekdayShort(isEn) {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const ko = ['일', '월', '화', '수', '목', '금', '토']
  const en = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return isEn ? en[kst.getDay()] : ko[kst.getDay()]
}

function formatTodayPartyBannerLine(party, isEn) {
  const wd = getKSTWeekdayShort(isEn)
  const titleRaw = isEn && party.title_en ? party.title_en : party.title
  const title = stripPlatformSuffixFromTitle(titleRaw)
  const venue = party.locationName || party.location_name || ''
  if (isEn) {
    return `Today (${wd}) · ${title}${venue ? ` · ${venue}` : ''}`
  }
  return `오늘(${wd}) · ${title}${venue ? ` · ${venue}` : ''}`
}

function buildSocialBarLine(barSpotlights, isEn) {
  const latin = barSpotlights.find((r) => r.label === '라틴')
  const cadiz = barSpotlights.find((r) => r.label === '카디즈')
  if (!latin || !cadiz) return ''
  if (isEn) {
    return `Latin ${latin.liveCount} / Cadiz ${cadiz.liveCount} · Social live`
  }
  return `라틴 ${latin.liveCount}명 / 카디즈 ${cadiz.liveCount}명 · 소셜 즐기는중`
}

const LiveCount = ({
  parties: partiesProp,
  locations: locationsProp,
  barStatsMap: barStatsMapProp,
  onPartyClick,
  onBarClick,
  onPromoClick,
  isGate = false,
}) => {
  const { t, i18n } = useTranslation()
  const [counts, setCounts] = useState({})
  const [todayPartyPool, setTodayPartyPool] = useState([])
  const [lineIndex, setLineIndex] = useState(0)
  const [livePosts, setLivePosts] = useState([])
  const [internalBarStats, setInternalBarStats] = useState({})
  const [queryFailed, setQueryFailed] = useState(() => !supabase)

  const isEn = i18n.language.startsWith('en')
  const nationwideFallbackLine = isEn ? LIVE_FALLBACK_LINE_EN : LIVE_FALLBACK_LINE_KO
  const statsMap = barStatsMapProp ?? internalBarStats

  const barSpotlights = useMemo(
    () => buildLiveBarSpotlights(locationsProp, statsMap),
    [locationsProp, statsMap],
  )

  const socialBarLine = useMemo(
    () => buildSocialBarLine(barSpotlights, isEn),
    [barSpotlights, isEn],
  )

  const isNowInPartyTime = useCallback((dateStr, startTime) => {
    if (!dateStr || !startTime) return false
    const now = new Date()
    const start = new Date(`${dateStr}T${startTime}:00`)
    const startWithBuffer = new Date(start.getTime() - 30 * 60 * 1000)
    const end = new Date(start.getTime())
    end.setDate(end.getDate() + 1)
    end.setHours(3, 0, 0, 0)
    return now >= startWithBuffer && now <= end
  }, [])

  const getTodayKST = () => {
    const kst = new Date(Date.now() + (9 * 60 * 60 * 1000))
    if (kst.getHours() < 5) kst.setDate(kst.getDate() - 1)
    return kst.toISOString().split('T')[0]
  }

  const applyTodayPartyPool = useCallback((list) => {
    const todayStr = getTodayKST()
    setTodayPartyPool(pickTodayPartyPool(list, todayStr))
    setLineIndex(0)
  }, [])

  const loadBarStats = useCallback(async () => {
    if (!supabase || barStatsMapProp) return
    try {
      setInternalBarStats(await fetchBarStatsMap(supabase))
    } catch (err) {
      console.warn('[LiveCount] bar stats failed:', err)
    }
  }, [barStatsMapProp])

  const fetchLivePostsToday = async () => {
    if (!supabase) {
      setLivePosts([])
      return
    }
    const today = getTodayKST()
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('content, bar_name')
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        logSupabaseError('LiveCount.community_posts', error)
        setLivePosts([])
        return
      }
      setLivePosts((data || []).filter((row) => getCommunityPostLine(row)))
    } catch (err) {
      logSupabaseError('LiveCount.community_posts', err)
      setLivePosts([])
    }
  }

  const fetchCounts = async () => {
    if (!supabase) {
      setQueryFailed(true)
      return
    }
    const todayStr = getTodayKST()
    try {
      const [partiesRes, locationsRes] = await Promise.all([
        supabase
          .from('parties')
          .select(PARTIES_SELECT)
          .eq('status', 'approved')
          .or(partiesTodayOrWeeklyOrFilter(todayStr))
          .not('poster_url', 'is', null),
        supabase.from('locations').select(LOCATIONS_WITH_REGION_NAME),
      ])

      if (partiesRes.error) {
        logPartiesFetchError(partiesRes.error)
        throw partiesRes.error
      }
      if (locationsRes.error) {
        logSupabaseError('LiveCount.locations', locationsRes.error)
        throw locationsRes.error
      }

      const parties = partiesRes.data
      const locations = locationsRes.data

      if (!parties || parties.length === 0) {
        setCounts({})
        applyTodayPartyPool([])
        setQueryFailed(false)
        return
      }

      const enriched = enrichPartiesWithVenues(parties, locations || [])
      applyTodayPartyPool(enriched)

      const locationMap = (locations || []).reduce((acc, loc) => {
        acc[loc.id] = {
          name: loc.name,
          region: resolveLocationRegionLabel(loc),
        }
        return acc
      }, {})

      const liveParties = filterSocialPartyRows(parties).filter((p) => {
        if (!isNowInPartyTime(isWeeklyRecurringParty(p) ? todayStr : p.date, p.time)) return false
        return getRecentActivityTs(p) >= Date.now() - LIVE_WINDOW_MS
      })
      if (liveParties.length === 0) {
        setCounts({})
        setQueryFailed(false)
        return
      }

      const grouped = liveParties.reduce((acc, p) => {
        const loc = locationMap[p.location_id]
        const region = loc?.region || '전국'
        const key = `${region}|파티`
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})
      grouped['전국|total'] = liveParties.length
      setCounts(grouped)
      setQueryFailed(false)
    } catch (err) {
      logPartiesFetchError(err)
      console.error('[LiveCount] fetchCounts failed:', err)
      setQueryFailed(true)
      setCounts({})
    }
  }

  const fetchTodayPartiesFromDb = async () => {
    if (!supabase) {
      setQueryFailed(true)
      return
    }
    const todayStr = getTodayKST()
    try {
      let partiesRes = await supabase
        .from('parties')
        .select(PARTIES_WITH_LOCATION)
        .eq('status', 'approved')
        .or(partiesTodayOrWeeklyOrFilter(todayStr))
        .not('poster_url', 'is', null)

      if (partiesRes.error) {
        logPartiesFetchError(partiesRes.error)
        partiesRes = await supabase
          .from('parties')
          .select(PARTIES_SELECT)
          .eq('status', 'approved')
          .or(partiesTodayOrWeeklyOrFilter(todayStr))
          .not('poster_url', 'is', null)
      }

      if (partiesRes.error) throw partiesRes.error

      const locationsRes = await supabase.from('locations').select(LOCATIONS_WITH_REGION_NAME)
      if (locationsRes.error) {
        logSupabaseError('LiveCount.locations', locationsRes.error)
      }
      const locations = locationsRes.error ? [] : (locationsRes.data || [])
      const enriched = enrichPartiesWithVenues(partiesRes.data || [], locations)
      applyTodayPartyPool(enriched)
      setQueryFailed(false)
    } catch (err) {
      logPartiesFetchError(err)
      console.error('[LiveCount] fetchTodayPartiesFromDb failed:', err)
      setQueryFailed(true)
    }
  }

  useEffect(() => {
    if (!partiesProp?.length) return
    const pool = pickTodayPartyPool(partiesProp, getTodayKST())
    if (pool.length) {
      setTodayPartyPool((prev) => (prev.length ? prev : pool))
    }
  }, [partiesProp])

  const refreshLiveBanner = useCallback(() => {
    fetchLivePostsToday()
    fetchCounts()
    fetchTodayPartiesFromDb()
    loadBarStats()
  }, [loadBarStats])

  const bannerRotateLines = useMemo(() => {
    const items = []
    if (socialBarLine) {
      items.push({ type: 'social', text: socialBarLine, party: null })
    }
    todayPartyPool.forEach((p) => {
      items.push({
        type: 'party',
        text: formatTodayPartyBannerLine(p, isEn),
        party: p,
      })
    })
    return items
  }, [socialBarLine, todayPartyPool, isEn])

  const currentBanner = bannerRotateLines[lineIndex] || bannerRotateLines[0] || null

  useEffect(() => {
    refreshLiveBanner()
    const refreshTimer = setInterval(refreshLiveBanner, LIVE_QUEUE_REFRESH_MS)

    if (!supabase) {
      return () => clearInterval(refreshTimer)
    }

    const channel = supabase
      .channel('live-dynamic-banner')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parties' }, refreshLiveBanner)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, refreshLiveBanner)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bar_checkins' }, refreshLiveBanner)
      .subscribe()

    return () => {
      clearInterval(refreshTimer)
      supabase.removeChannel(channel)
    }
  }, [refreshLiveBanner])

  useEffect(() => {
    if (bannerRotateLines.length < 2) return undefined
    const timer = setInterval(() => {
      setLineIndex((v) => (v + 1) % bannerRotateLines.length)
    }, SPOTLIGHT_ROTATE_MS)
    return () => clearInterval(timer)
  }, [bannerRotateLines.length])

  const abbreviateRegion = (region) => {
    const maps = {
      서울특별시: '서울',
      인천광역시: '인천',
      부산광역시: '부산',
      경기도: '경기',
      충청도: '충청',
      전라도: '전라',
      경상도: '경상',
      강원도: '강원',
    }
    const short = maps[region] || region
    const translationKeys = {
      서울: 'region_seoul',
      인천: 'region_incheon',
      부산: 'region_busan',
      경기: 'region_gyeonggi_incheon',
      충청: 'region_chungcheong',
      전라: 'region_jeolla',
      경상: 'region_gyeongsang',
      전국: 'Nationwide',
    }
    return t(translationKeys[short] || short)
  }

  const displayTitle = useMemo(() => {
    if (!livePosts?.length) return ''
    return getCommunityPostLine(livePosts[0])
  }, [livePosts])

  const hasNationwideCounts = Boolean(counts['전국|total'])
  const hasBannerContent = Boolean(
    bannerRotateLines.length || displayTitle || hasNationwideCounts || queryFailed,
  )

  const handleBannerClick = () => {
    if (currentBanner?.type === 'party' && currentBanner.party && typeof onPartyClick === 'function') {
      onPartyClick(currentBanner.party)
      return
    }
    if (currentBanner?.type === 'social') {
      const hotBar = barSpotlights.find((r) => r.liveCount > 0 && r.venue)
      if (hotBar?.venue && typeof onBarClick === 'function') {
        onBarClick(hotBar.venue)
        return
      }
      const firstParty = todayPartyPool[0]
      if (firstParty && typeof onPartyClick === 'function') {
        onPartyClick(firstParty)
        return
      }
    }
    if (typeof onPromoClick === 'function') {
      onPromoClick()
      return
    }
    if (window.location.hash !== LIVE_PROMO_PATH) {
      window.history.pushState({}, '', LIVE_PROMO_PATH)
    }
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  if (!hasBannerContent) {
    return null
  }

  const mainLine =
    currentBanner?.text
    || displayTitle
    || (queryFailed && !hasNationwideCounts && !todayPartyPool.length
      ? nationwideFallbackLine
      : '')

  const bannerLineKey = currentBanner
    ? `${currentBanner.type}-${currentBanner.party?.id || lineIndex}`
    : 'fallback'

  return (
    <div
      className={`live-dynamic-banner${isGate ? ' live-dynamic-banner--gate' : ''}`}
      role="button"
      tabIndex={0}
      onClick={handleBannerClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleBannerClick()
        }
      }}
      aria-label={mainLine || (isEn ? 'Live banner' : '실시간 파티 배너')}
    >
      <div className="live-dynamic-banner__inner">
        <span className="lc-tag">LIVE</span>
        <span className="lc-dot" />
        {hasNationwideCounts && !socialBarLine ? (
          <div className="live-dynamic-banner__track">
            <span className="lc-default lc-default--hot">
              {'전국 '}{counts['전국|total']}{'개 파티 진행중'}
            </span>
            <div className="live-dynamic-banner__regions">
              <span className="live-dynamic-banner__sep">|</span>
              {Object.entries(counts)
                .filter(([k]) => !k.includes('전국'))
                .map(([k, v]) => {
                  const region = abbreviateRegion(k.split('|')[0])
                  return (
                    <span key={k} className="live-dynamic-banner__region">
                      {region} <strong>{v}</strong>
                    </span>
                  )
                })}
            </div>
            {mainLine ? (
              <>
                <span className="live-dynamic-banner__sep live-dynamic-banner__sep--before-spotlight">|</span>
                <span
                  key={bannerLineKey}
                  className="live-dynamic-banner__spotlight live-banner-text-clip"
                  title={mainLine}
                >
                  {mainLine}
                </span>
              </>
            ) : null}
          </div>
        ) : mainLine ? (
          <span
            key={bannerLineKey}
            className="live-dynamic-banner__spotlight live-dynamic-banner__spotlight--solo live-banner-text-clip"
            title={mainLine}
          >
            {mainLine}
          </span>
        ) : (
          <span className="lc-default lc-default--hot">{nationwideFallbackLine}</span>
        )}
      </div>
    </div>
  )
}

export default LiveCount
