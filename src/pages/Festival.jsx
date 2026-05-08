import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Ticket, X, Home as HomeIcon, Share2, Filter, ChevronDown, ChevronUp, Star, Flame, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

const Festival = ({ setView }) => {
  const { t } = useTranslation();
  const [festivals, setFestivals] = useState([]);
  const [filteredFestivals, setFilteredFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFestival, setSelectedFestival] = useState(null);

  // SEPARATED REGIONS AS REQUESTED
  const regions = ['전체', '서울', '경기', '인천', '강원', '제주', '부산', '대구', '충청', '전라'];

  useEffect(() => {
    fetchFestivals();
  }, []);

  useEffect(() => {
    if (selectedRegion === '전체') {
      setFilteredFestivals(festivals);
    } else {
      setFilteredFestivals(festivals.filter(f => f.region === selectedRegion));
    }
  }, [selectedRegion, festivals]);

  const fetchFestivals = async () => {
    try {
      const { data, error } = await supabase
        .from('festivals')
        .select('*')
        .eq('status', 'active')
        .order('start_date', { ascending: true });
      
      if (!error && data) {
        setFestivals(data);
      }
    } catch (err) {
      console.error('fetchFestivals error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  const getDDay = (startDate) => {
    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    const diff = start - today;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'D-Day';
    return days > 0 ? `D-${days}` : `D+${Math.abs(days)}`;
  };

  return (
    <div style={{ background: '#fff', minHeight: '100vh', padding: '0 0 100px', color: '#111', fontFamily: "'Pretendard', sans-serif", position: 'relative' }}>
      
      {/* Background Glow */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.3 }}>
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(229, 57, 53, 0.2) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      {/* Header */}
      <div style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 2000, 
        background: 'rgba(0,0,0,0.9)', 
        backdropFilter: 'blur(20px)',
        padding: '12px 20px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <h1 style={{ fontSize: '18px', fontWeight: 950, color: '#fff', margin: 0, letterSpacing: '1px' }}>
          <span style={{ color: '#E53935' }}>FESTIVAL</span>
        </h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '20px', 
              padding: '6px 14px', 
              color: '#fff', 
              fontSize: '11px', 
              fontWeight: 900, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px'
            }}
          >
            {selectedRegion} <ChevronDown size={12} color="#E53935" />
          </button>
          <button onClick={() => setView('home')} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', padding: '8px' }}>
            <HomeIcon size={18} color="#fff" />
          </button>
        </div>
      </div>

      {/* 2-Row Filter Grid (Aligned) */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden', background: '#0a0a0a' }}>
            <div style={{ padding: '15px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
              {regions.map(r => (
                <button 
                  key={r} 
                  onClick={() => { setSelectedRegion(r); setShowFilters(false); }}
                  style={{ 
                    padding: '12px 0', 
                    borderRadius: '8px', 
                    background: selectedRegion === r ? '#E53935' : 'rgba(255,255,255,0.02)', 
                    border: '1px solid', 
                    borderColor: selectedRegion === r ? '#E53935' : 'rgba(255,255,255,0.05)', 
                    color: '#fff', 
                    fontSize: '10px', 
                    fontWeight: 900 
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Festival List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px' }}>로딩 중..</div>
        ) : filteredFestivals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', color: '#64748B', fontWeight: 800 }}>준비 중인 일정이 없습니다.</div>
        ) : (
          filteredFestivals.map((fest) => (
            <motion.div 
              key={fest.id} 
              initial={{ opacity: 0 }} 
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              onClick={() => setSelectedFestival(fest)}
              style={{ width: '100%', cursor: 'pointer', background: '#F9FAFB' }}
            >
              {/* Poster with D-DAY Badge (No HOT PICK) */}
              <div style={{ width: '100%', position: 'relative' }}>
                <img src={fest.poster_url} style={{ width: '100%', height: 'auto', display: 'block' }} />
                <div style={{ 
                  position: 'absolute', 
                  top: '15px', 
                  right: '15px', 
                  background: 'rgba(229, 57, 53, 0.9)', 
                  color: '#fff', 
                  padding: '6px 12px', 
                  borderRadius: '10px', 
                  fontSize: '13px', 
                  fontWeight: 950,
                  boxShadow: '0 4px 15px rgba(229, 57, 53, 0.4)'
                }}>
                  {getDDay(fest.start_date)}
                </div>
              </div>
              
              {/* Structured Info Area (Perfect Alignment) */}
              <div style={{ padding: '25px 20px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '15px', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <h3 style={{ fontSize: '22px', fontWeight: 950, color: '#111', margin: 0, lineHeight: 1.2 }}>
                    {fest.title}
                  </h3>
                  <div style={{ background: '#FEE2E2', padding: '6px 12px', borderRadius: '8px', textAlign: 'right' }}>
                    <span style={{ fontSize: '15px', fontWeight: 950, color: '#E53935' }}>₩{fest.price?.toLocaleString()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', color: '#94A3B8', fontSize: '12px', fontWeight: 800 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <Calendar size={14} color="#E53935" />
                    <span>{formatDate(fest.start_date)} - {formatDate(fest.end_date)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="#E53935" />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fest.region} {fest.location}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedFestival && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 6000, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', background: '#fff', color: '#111' }}>
              <X size={32} onClick={() => setSelectedFestival(null)} style={{ cursor: 'pointer' }} />
              <span style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '1px' }}>FESTIVAL DETAIL</span>
              <div style={{ width: '32px' }}></div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <img src={selectedFestival.poster_url} style={{ width: '100%', height: 'auto' }} />
              <div style={{ padding: '30px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: 950, marginBottom: '24px' }}>{selectedFestival.title}</h2>
                <div style={{ background: '#E53935', padding: '24px', borderRadius: '24px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 20px rgba(229, 57, 53, 0.4)' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontWeight: 800, marginBottom: '4px' }}>RESERVATION</p>
                    <h3 style={{ fontSize: '24px', fontWeight: 950 }}>₩{selectedFestival.price?.toLocaleString()}</h3>
                  </div>
                  <button style={{ background: '#fff', border: 'none', padding: '14px 24px', borderRadius: '16px', color: '#E53935', fontWeight: 950 }}>예매하기</button>
                </div>
                <p style={{ color: '#94A3B8', lineHeight: 1.8, fontSize: '16px' }}>{selectedFestival.description}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Festival;
