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
  const [displayText, setDisplayText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  const isEn = i18n.language.startsWith('en')
  const spotlight = spotlightPool[poolIndex] || spotlightPool[0] || null
  const hasLiveQueue = spotlightPool.length > 0

  const liveMessages = useMemo(() => [], [])

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
    const queue = pickSpotlightPool(list, todayStr, '', isNowInPartyTime)
    console.log('[LiveBanner] queue check', {
      todayStr,
      totalInput: Array.isArray(list) ? list.length : 0,
      queueCount: queue.length,
      queueIds: queue.map((p) => p.id),
    })
    return queue
  }, [isNowInPartyTime])

  const applySpotlightPool = useCallback((list) => {
    const todayStr = getTodayKST()
    const pool = getLiveBannerData(list, todayStr)
    setSpotlightPool(pool)
    setPoolIndex(0)
  }, [getLiveBannerData])

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

  useEffect(() => {
    fetchCounts()
    fetchSpotlightFromDb()
    const refreshTimer = setInterval(() => {
      fetchCounts()
      fetchSpotlightFromDb()
    }, LIVE_QUEUE_REFRESH_MS)

    if (!supabase) {
      return () => clearInterval(refreshTimer)
    }

    const channel = supabase
      .channel('live-dynamic-banner')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'parties' },
        () => {
          fetchCounts()
          fetchSpotlightFromDb()
        },
      )
      .subscribe()

    return () => {
      clearInterval(refreshTimer)
      supabase.removeChannel(channel)
    }
  }, [])

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

  const regionalReports = useMemo(() => {
    if (Object.keys(counts).length === 0) return liveMessages

    const byRegion = {}
    Object.entries(counts).forEach(([key, count]) => {
      const [region, name] = key.split('|')
      const translatedRegion = abbreviateRegion(region)
      if (!byRegion[translatedRegion]) byRegion[translatedRegion] = []
      byRegion[translatedRegion].push(`${name} ${count}`)
    })

    return Object.entries(byRegion).map(([reg, venues]) => `[${reg}] ${venues.join(', ')}`)
  }, [counts, liveMessages, t])

  useEffect(() => {
    if (spotlight) return undefined
    let timeout
    const currentFullText = regionalReports[currentIndex] || ''

    if (isTyping) {
      if (displayText.length < currentFullText.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentFullText.slice(0, displayText.length + 1))
        }, 80)
      } else {
        setIsTyping(false)
        timeout = setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % regionalReports.length)
          setDisplayText('')
          setIsTyping(true)
        }, 4000)
      }
    }
    return () => clearTimeout(timeout)
  }, [displayText, isTyping, currentIndex, regionalReports, spotlight])

  const dynamicBannerText = useMemo(() => {
    if (!spotlight) return isEn ? 'No live posters today' : '??? ???? ????'
    const titleRaw = isEn && spotlight.title_en ? spotlight.title_en : spotlight.title
    const title = stripPlatformSuffixFromTitle(titleRaw)
    const rank = poolIndex + 1
    return rank === 1 ? `?? ?? 1?! ${title}` : `? ?? ?? ?! ${title}`
  }, [spotlight, poolIndex, isEn])

  const handleBannerClick = () => {
    if (!hasLiveQueue) return
    const target = spotlightPool[poolIndex] || spotlight
    if (target && typeof onPartyClick === 'function') {
      onPartyClick(target)
      return
    }
  }

  const mainLine = spotlight ? dynamicBannerText : displayText

  if (!hasLiveQueue) {
    return null
  }

  return (
    <div
      className={`live-dynamic-banner${isGate ? ' live-dynamic-banner--gate' : ''}`}
      role={hasLiveQueue ? 'button' : 'status'}
      tabIndex={hasLiveQueue ? 0 : -1}
      onClick={handleBannerClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleBannerClick()
        }
      }}
      aria-label={
        hasLiveQueue
          ? (isEn ? 'Open live party detail' : '??? ??? ?? ??')
          : (isEn ? 'No live posters today' : '??? ???? ????')
      }
    >
      <div className="live-dynamic-banner__inner">
        <span className="lc-tag">LIVE</span>
        <span className="lc-dot" />
        {counts['\uc804\uad6d|total'] ? (
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
            {spotlight ? (
              <>
                <span className="live-dynamic-banner__sep live-dynamic-banner__sep--before-spotlight">|</span>
                <span key={spotlight.id} className="live-dynamic-banner__spotlight live-banner-text-clip" title={dynamicBannerText}>
                  {dynamicBannerText}
                </span>
              </>
            ) : null}
          </div>
        ) : (
          <span
            key={spotlight?.id || `fallback-${poolIndex}`}
            className="live-dynamic-banner__spotlight live-dynamic-banner__spotlight--solo live-banner-text-clip"
            title={mainLine}
          >
            {mainLine}
          </span>
        )}
      </div>
    </div>
  )
}

export default LiveCount
