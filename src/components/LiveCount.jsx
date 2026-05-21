import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { isApprovedParty } from '../lib/dateNorm'
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

const SPOTLIGHT_ROTATE_MS = 5000
const LIVE_QUEUE_REFRESH_MS = 10 * 60 * 1000
const LIVE_WINDOW_MS = 24 * 60 * 60 * 1000
const LIVE_PROMO_PATH = '#community'

/** community_posts — content 또는 bar_name을 배너 한 줄로 */
function getCommunityPostLine(row) {
  const content = String(row?.content || '').trim()
  const bar = String(row?.bar_name || '').trim()
  return content || bar || ''
}

function getRecentActivityTs(p) {
  const ts = new Date(p.updated_at || p.created_at || 0).getTime()
  return Number.isFinite(ts) ? ts : 0
}

function getLiveViewScore(p) {
  const clicks = Number(p.click_count) || 0
  const views = Number(p.view_count) || 0
  return Math.max(clicks, views)
}

function pickSpotlightPool(list, todayStr, yesterdayStr, isNowInPartyTime) {
  const rows = (list || [])
    .filter(isApprovedParty)
    .filter((p) => String(p.poster_url || p.imageUrl || '').trim())
    .filter((p) => String(p.date || '').slice(0, 10) === todayStr)
    .filter((p) => getLiveViewScore(p) > 0)
    .filter((p) => getRecentActivityTs(p) >= Date.now() - LIVE_WINDOW_MS)
  if (!rows.length) return []
  const ranked = rows
    .slice()
    .sort((a, b) => {
      const scoreGap = getLiveViewScore(b) - getLiveViewScore(a)
      if (scoreGap !== 0) return scoreGap
      return getRecentActivityTs(b) - getRecentActivityTs(a)
    })

  const seen = new Set()
  const unique = []
  for (const p of ranked) {
    if (p?.id == null || seen.has(p.id)) continue
    seen.add(p.id)
    unique.push(p)
    if (unique.length >= 5) break
  }
  return unique
}

const LiveCount = ({ parties: partiesProp, onPartyClick, onPromoClick, isGate = false }) => {
  const { t, i18n } = useTranslation()
  const [counts, setCounts] = useState({})
  const [spotlightPool, setSpotlightPool] = useState([])
  const [poolIndex, setPoolIndex] = useState(0)
  const [livePosts, setLivePosts] = useState([])

  const isEn = i18n.language.startsWith('en')
  const spotlight = spotlightPool[poolIndex] || spotlightPool[0] || null

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

  const getLiveBannerData = useCallback((list, todayStr) => {
    return pickSpotlightPool(list, todayStr, '', isNowInPartyTime)
  }, [isNowInPartyTime])

  const applySpotlightPool = useCallback((list) => {
    const todayStr = getTodayKST()
    const pool = getLiveBannerData(list, todayStr)
    setSpotlightPool(pool)
    setPoolIndex(0)
  }, [getLiveBannerData])

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
    if (!supabase) return
    const todayStr = getTodayKST()
    try {
      const [partiesRes, locationsRes] = await Promise.all([
        supabase
          .from('parties')
          .select(PARTIES_SELECT)
          .eq('status', 'approved')
          .eq('date', todayStr)
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
        applySpotlightPool([])
        return
      }

      const enriched = enrichPartiesWithVenues(parties, locations || [])
      applySpotlightPool(enriched)

      const locationMap = (locations || []).reduce((acc, loc) => {
        acc[loc.id] = {
          name: loc.name,
          region: resolveLocationRegionLabel(loc),
        }
        return acc
      }, {})

      const liveParties = parties.filter((p) => {
        if (!isNowInPartyTime(p.date, p.time)) return false
        return getRecentActivityTs(p) >= Date.now() - LIVE_WINDOW_MS
      })
      if (liveParties.length === 0) {
        setCounts({})
        return
      }

      const grouped = liveParties.reduce((acc, p) => {
        const loc = locationMap[p.location_id]
        const region = loc?.region || '\uc804\uad6d'
        const key = `${region}|\ud30c\ud2f0`
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})
      grouped['\uc804\uad6d|total'] = liveParties.length
      setCounts(grouped)
    } catch (err) {
      logPartiesFetchError(err)
      console.error('[LiveCount] fetchCounts failed:', err)
    }
  }

  const fetchSpotlightFromDb = async () => {
    if (!supabase) return
    const todayStr = getTodayKST()
    try {
      let partiesRes = await supabase
        .from('parties')
        .select(PARTIES_WITH_LOCATION)
        .eq('status', 'approved')
        .eq('date', todayStr)
        .not('poster_url', 'is', null)
        .limit(40)

      if (partiesRes.error) {
        logPartiesFetchError(partiesRes.error)
        partiesRes = await supabase
          .from('parties')
          .select(PARTIES_SELECT)
          .eq('status', 'approved')
          .eq('date', todayStr)
          .not('poster_url', 'is', null)
          .limit(40)
      }

      if (partiesRes.error) throw partiesRes.error

      const locationsRes = await supabase.from('locations').select(LOCATIONS_WITH_REGION_NAME)
      const locations = locationsRes.error ? [] : (locationsRes.data || [])
      const enriched = enrichPartiesWithVenues(partiesRes.data || [], locations)
      applySpotlightPool(enriched)
    } catch (err) {
      logPartiesFetchError(err)
    }
  }

  useEffect(() => {
    if (!partiesProp?.length) return
    const todayStr = getTodayKST()
    const pool = getLiveBannerData(partiesProp, todayStr)
    if (pool.length) {
      setSpotlightPool((prev) => (prev.length ? prev : pool))
    }
  }, [partiesProp, getLiveBannerData])

  const refreshLiveBanner = useCallback(() => {
    fetchLivePostsToday()
    fetchCounts()
    fetchSpotlightFromDb()
  }, [])

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
      .subscribe()

    return () => {
      clearInterval(refreshTimer)
      supabase.removeChannel(channel)
    }
  }, [refreshLiveBanner])

  useEffect(() => {
    if (spotlightPool.length < 2) return undefined
    const timer = setInterval(() => {
      setPoolIndex((v) => (v + 1) % spotlightPool.length)
    }, SPOTLIGHT_ROTATE_MS)
    return () => clearInterval(timer)
  }, [spotlightPool.length])

  const abbreviateRegion = (region) => {
    const maps = {
      '\uc11c\uc6b8\ud2b9\ubcc4\uc2dc': '\uc11c\uc6b8',
      '\uc778\ucc9c\uad11\uc5ed\uc2dc': '\uc778\ucc9c',
      '\ubd80\uc0b0\uad11\uc5ed\uc2dc': '\ubd80\uc0b0',
      '\uacbd\uae30\ub3c4': '\uacbd\uae30',
      '\ucda9\uccad\ub3c4': '\ucda9\uccad',
      '\uc804\ub77c\ub3c4': '\uc804\ub77c',
      '\uacbd\uc0c1\ub3c4': '\uacbd\uc0c1',
      '\uac15\uc6d0\ub3c4': '\uac15\uc6d0',
    }
    const short = maps[region] || region
    const translationKeys = {
      '\uc11c\uc6b8': 'region_seoul',
      '\uc778\ucc9c': 'region_incheon',
      '\ubd80\uc0b0': 'region_busan',
      '\uacbd\uae30': 'region_gyeonggi_incheon',
      '\ucda9\uccad': 'region_chungcheong',
      '\uc804\ub77c': 'region_jeolla',
      '\uacbd\uc0c1': 'region_gyeongsang',
      '\uc804\uad6d': 'Nationwide',
    }
    return t(translationKeys[short] || short)
  }

  const displayTitle = useMemo(() => {
    if (!livePosts?.length) return ''
    return getCommunityPostLine(livePosts[0])
  }, [livePosts])

  const dynamicBannerText = useMemo(() => {
    if (!spotlight) return ''
    const titleRaw = isEn && spotlight.title_en ? spotlight.title_en : spotlight.title
    const title = stripPlatformSuffixFromTitle(titleRaw)
    const rank = poolIndex + 1
    return rank === 1
      ? (isEn ? `?? #1 tonight! ${title}` : `?? ?? 1?! ${title}`)
      : (isEn ? `? Trending now! ${title}` : `? ?? ?? ?! ${title}`)
  }, [spotlight, poolIndex, isEn])

  const hasNationwideCounts = Boolean(counts['\uc804\uad6d|total'])
  const hasBannerContent = Boolean(displayTitle || hasNationwideCounts || spotlight)

  const handleBannerClick = () => {
    const target = spotlightPool[poolIndex] || spotlight
    if (target && typeof onPartyClick === 'function') {
      onPartyClick(target)
      return
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

  const mainLine = displayTitle || dynamicBannerText

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
      aria-label={mainLine || (isEn ? 'Live banner' : '??? ??')}
    >
      <div className="live-dynamic-banner__inner">
        <span className="lc-tag">LIVE</span>
        <span className="lc-dot" />
        {hasNationwideCounts ? (
          <div className="live-dynamic-banner__track">
            <span className="lc-default lc-default--hot">
              {'\uc804\uad6d '}{counts['\uc804\uad6d|total']}{'\uac1c \ud30c\ud2f0 \uc9c4\ud589\uc911'}
            </span>
            <div className="live-dynamic-banner__regions">
              <span className="live-dynamic-banner__sep">|</span>
              {Object.entries(counts)
              .filter(([k]) => !k.includes('\uc804\uad6d'))
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
                  key={displayTitle || spotlight?.id}
                  className="live-dynamic-banner__spotlight live-banner-text-clip"
                  title={mainLine}
                >
                  {mainLine}
                </span>
              </>
            ) : null}
          </div>
        ) : (
          mainLine ? (
            <span
              key={displayTitle || spotlight?.id || 'live-line'}
              className="live-dynamic-banner__spotlight live-dynamic-banner__spotlight--solo live-banner-text-clip"
              title={mainLine}
            >
              {mainLine}
            </span>
          ) : null
        )}
      </div>
    </div>
  )
}

export default LiveCount
