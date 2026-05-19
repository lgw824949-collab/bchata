import React, { useState, useEffect, useMemo } from 'react';
import { Z } from '../constants/zLayers';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Eye, Share2, Plus, X, Camera, MapPin, Search, Home as HomeIcon, Star, Info, CheckCircle2, Trophy, Award, Zap, TrendingUp, Clock, Flame } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

const Community = ({ setSelectedPoster, setView }) => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPost, setNewPost] = useState({ content: '', region: '서울', bar_name: '', image: null });
  const [uploading, setUploading] = useState(false);
  const [showRewardCelebration, setShowRewardCelebration] = useState(false);
  const [isFullView, setIsFullView] = useState(false);
  
  // Reward System State
  const [userPoints, setUserPoints] = useState(() => parseInt(localStorage.getItem('reporter_points') || '0'));
  const [isVerified, setIsVerified] = useState(() => localStorage.getItem('is_verified_reporter') === 'true');

  const quickTags = ['#분위기최고👍', '#음악맛집🎵', '#사람많음🔥', '#여유로움☕', '#살사맛집💃', '#바차타맛집🕺', '#키좀바맛집✨', '#주크맛집🎶', '#미모포텐🎈', '#훈남훈녀가득🌟', '#패션왕등판🕶️', '#안호강중🔥', '#인생샷성지📸', '#에너지폭발⚡', '#냉방빵빵🧊'];

  // Calculate Hot Bars from posts
  const hotBars = useMemo(() => {
    if (!posts || posts.length === 0) return [];
    const barCounts = posts.reduce((acc, post) => {
      if (post.bar_name) {
        acc[post.bar_name] = (acc[post.bar_name] || 0) + 1;
      }
      return acc;
    }, {});
    
    return Object.entries(barCounts)
      .map(([name, count]) => ({
        name,
        count,
        latestImage: posts.find(p => p.bar_name === name)?.image_url
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [posts]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      let { data, error } = await supabase
        .from('community_posts')
        .select('id, image_url, content, region, bar_name, likes_count, view_count, created_at')
        .gt('created_at', threeDaysAgo)
        .order('created_at', { ascending: false });
      
      if (!error && (!data || data.length === 0)) {
        const { data: allData, error: allErr } = await supabase
          .from('community_posts')
          .select('id, image_url, content, region, bar_name, likes_count, view_count, created_at')
          .order('created_at', { ascending: false })
          .limit(20);
        data = allData;
        error = allErr;
      }
      
      if (!error && data) {
        setPosts(data);
      }
    } catch (err) {
      console.error('fetchPosts error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const getRelativeTime = (dateStr) => {
    const now = new Date();
    const past = new Date(dateStr);
    const diff = Math.floor((now - past) / 1000 / 60);
    if (diff < 1) return '방금 전';
    if (diff < 60) return `${diff}분 전`;
    if (diff < 1440) return `${Math.floor(diff/60)}시간 전`;
    return `${Math.floor(diff/1440)}일 전`;
  };

  const isLive = (dateStr) => {
    const now = new Date();
    const past = new Date(dateStr);
    const diff = Math.floor((now - past) / 1000 / 60);
    return diff < 60; // Live if within 60 mins
  };

  useEffect(() => {
    const handleOpenUpload = () => setShowUploadModal(true);
    window.addEventListener('open-community-upload', handleOpenUpload);
    return () => window.removeEventListener('open-community-upload', handleOpenUpload);
  }, []);


  const handleShare = async (post, e) => {
    if (e) e.stopPropagation();
    const shareData = {
      title: 'LIVE PICK 현장 리포트',
      text: `[오늘밤빠] ${post.bar_name || '현장'} 분위기 확인하세요!`,
      url: window.location.href
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('링크가 복사되었습니다.');
      }
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const handleUpload = async () => {
    if (!newPost.image) {
      alert('사진을 선택해주세요!');
      return;
    }
    setUploading(true);
    try {
      const file = newPost.image;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `community/${fileName}`;
      let { error: uploadError } = await supabase.storage.from('posters').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('posters').getPublicUrl(filePath);
      const { error: dbError } = await supabase.from('community_posts').insert([{
        image_url: urlData.publicUrl,
        content: newPost.content,
        region: newPost.region,
        bar_name: newPost.bar_name,
        likes_count: 0,
        view_count: 0
      }]);
      if (dbError) throw dbError;
      
      // Reward Point Grant
      setUserPoints(prev => prev + 10);
      setShowRewardCelebration(true);
      
      setTimeout(() => {
        setShowRewardCelebration(false);
        setShowUploadModal(false);
        setNewPost({ content: '', region: '서울', bar_name: '', image: null });
        fetchPosts();
      }, 2000);
      
    } catch (err) {
      alert('업로드 실패: ' + err.message);
      setUploading(false);
    }
  };

  const handleQuickTag = (tag) => {
    setNewPost({ ...newPost, content: newPost.content + (newPost.content ? ' ' : '') + tag });
  };

  const handleLike = async (postId, e) => {
    if (e) e.stopPropagation();
    const likesKey = `likes_${postId}`;
    const currentLikesCount = parseInt(localStorage.getItem(likesKey) || '0');
    if (currentLikesCount >= 3) return;
    
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const newLikes = (post.likes_count || 0) + 1;
    localStorage.setItem(likesKey, (currentLikesCount + 1).toString());
    
    // Track liked posts for sidebar
    try {
      const likedPostsRaw = localStorage.getItem('community_liked_posts');
      let likedPosts = likedPostsRaw ? JSON.parse(likedPostsRaw) : [];
      if (!likedPosts.includes(postId)) {
        likedPosts = [postId, ...likedPosts].slice(0, 30);
        localStorage.setItem('community_liked_posts', JSON.stringify(likedPosts));
      }
    } catch (err) { console.error('Error tracking liked posts:', err); }

    setPosts(posts.map(p => p.id === postId ? { ...p, likes_count: newLikes } : p));
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost({ ...selectedPost, likes_count: newLikes });
    }
    await supabase.from('community_posts').update({ likes_count: newLikes }).eq('id', postId);
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingBottom: '100px' }}>
      {/* Header Section */}
      <div style={{ padding: '20px 20px 10px', position: 'sticky', top: 0, zIdentity: 100, background: 'var(--color-bg)', backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 1000, color: 'var(--color-text-main)', letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              LIVE PICK <Flame size={24} color="#E53935" fill="#E53935" />
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--color-text-sub)', fontWeight: 600 }}>지금 전국에서 가장 뜨거운 현장 리포트</p>
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setView('home')} 
            style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'var(--color-card)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <HomeIcon size={20} color="var(--color-text-main)" />
          </motion.button>
        </div>

        {/* Hot Bars Horizontal Row */}
        {hotBars.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <TrendingUp size={14} color="#E53935" />
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#E53935', textTransform: 'uppercase' }}>Hot Venues Now</span>
            </div>
            <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '5px' }} className="hide-scrollbar">
              {hotBars.map((bar, idx) => (
                <motion.div 
                  key={idx} 
                  whileTap={{ scale: 0.95 }}
                  style={{ flexShrink: 0, textAlign: 'center', width: '70px' }}
                >
                  <div style={{ 
                    width: '64px', height: '64px', borderRadius: '22px', 
                    padding: '3px', background: 'linear-gradient(135deg, #E53935, #FFD700)', 
                    marginBottom: '8px', position: 'relative'
                  }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '19px', overflow: 'hidden', background: '#111' }}>
                      <img src={bar.latestImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    {idx === 0 && (
                      <div className="animate-pulse-red" style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#E53935', color: 'white', fontSize: '8px', fontWeight: 1000, padding: '2px 6px', borderRadius: '10px' }}>1ST</div>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-text-main)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bar.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Feed Layout - 2 Column Card */}
      <div style={{ padding: '0 15px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
        {loading ? (
          [1,2,3,4].map(i => (
            <div key={i} style={{ height: '240px', borderRadius: '24px', background: 'var(--color-card)', animation: 'pulse 1.5s infinite' }} />
          ))
        ) : (
          posts.map((post) => (
            <motion.div 
              key={post.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedPost(post)}
              className="reveal-card"
              style={{ 
                borderRadius: '24px', 
                overflow: 'hidden', 
                background: 'var(--color-card)', 
                border: '1px solid var(--color-border)',
                position: 'relative',
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ position: 'relative', aspectRatio: '4/5' }}>
                <img src={post.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                
                {/* Glassmorphism Overlays */}
                <div style={{ 
                  position: 'absolute', top: '10px', left: '10px', right: '10px', 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' 
                }}>
                  <div style={{ 
                    padding: '6px 12px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', 
                    borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)' 
                  }}>
                    <span style={{ color: 'white', fontSize: '11px', fontWeight: 900 }}>{post.bar_name || '현장'}</span>
                  </div>
                  
                  {isLive(post.created_at) && (
                    <div style={{ 
                      display: 'flex', alignItems: 'center', gap: '4px', 
                      padding: '6px 10px', background: 'rgba(229, 57, 53, 0.8)', 
                      borderRadius: '12px', boxShadow: '0 4px 10px rgba(229, 57, 53, 0.3)' 
                    }}>
                      <div className="animate-pulse-red" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} />
                      <span style={{ color: 'white', fontSize: '10px', fontWeight: 1000 }}>LIVE</span>
                    </div>
                  )}
                </div>

                <div style={{ 
                  position: 'absolute', bottom: '10px', right: '10px',
                  padding: '4px 8px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)',
                  borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <Clock size={10} color="white" />
                  <span style={{ color: 'white', fontSize: '10px', fontWeight: 700 }}>{getRelativeTime(post.created_at)}</span>
                </div>
              </div>

              <div style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Heart size={14} color="#E53935" fill={localStorage.getItem(`likes_${post.id}`) ? "#E53935" : "none"} />
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-text-main)' }}>{post.likes_count || 0}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Eye size={14} color="var(--color-text-sub)" />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-sub)' }}>{post.view_count || 0}</span>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={(e) => handleLike(post.id, e)}
                  style={{ background: 'none', border: 'none', padding: 0 }}
                >
                  <Plus size={20} color="var(--color-text-main)" />
                </motion.button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* FAB - Upload */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowUploadModal(true)}
        style={{ 
          position: 'fixed', bottom: '100px', right: '20px', 
          width: '64px', height: '64px', borderRadius: '22px', 
          background: 'linear-gradient(135deg, #E53935, #FF1744)', 
          color: 'white', border: 'none', 
          boxShadow: '0 10px 30px rgba(229, 57, 53, 0.4)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          zIndex: 1000 
        }}
      >
        <Camera size={28} strokeWidth={2.5} />
      </motion.button>

      {/* Upload Modal & Post Detail Modal Logic stays same but with refined styling... */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: Z.modal, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <img src={selectedPost.image_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              <button onClick={() => setSelectedPost(null)} style={{ position: 'absolute', top: '40px', right: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', padding: '10px', color: 'white' }}><X size={24} /></button>
              
              <div style={{ position: 'absolute', bottom: '40px', left: '20px', right: '20px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)', borderRadius: '30px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ marginBottom: '20px' }}>
                  <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 1000, marginBottom: '8px' }}>{selectedPost.bar_name || '현장 리포트'}</h2>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.6 }}>{selectedPost.content}</p>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <button onClick={(e) => handleLike(selectedPost.id, e)} style={{ flex: 1, padding: '16px', borderRadius: '18px', background: '#E53935', border: 'none', color: 'white', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <Heart size={20} fill="white" /> {selectedPost.likes_count || 0}
                  </button>
                  <button onClick={() => {}} style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Share2 size={24} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUploadModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: Z.modal, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ background: 'var(--color-bg)', width: '100%', maxWidth: '400px', borderRadius: '32px', padding: '30px', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--color-text-main)' }}>현장 리포트 등록</h2>
                <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-sub)' }}><X size={24} /></button>
              </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div onClick={() => document.getElementById('file-upload').click()} style={{ width: '100%', height: '200px', borderRadius: '24px', background: 'var(--color-card)', border: '2px dashed var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
                  {newPost.image ? <img src={URL.createObjectURL(newPost.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center' }}><Camera size={40} color="var(--color-text-sub)" style={{ marginBottom: '10px' }} /><p style={{ color: 'var(--color-text-sub)', fontSize: '13px', fontWeight: 700 }}>현장 사진을 선택하세요</p></div>}
                  <input id="file-upload" type="file" accept="image/*" hidden onChange={e => setNewPost({...newPost, image: e.target.files[0]})} />
                </div>

                <div>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-main)', fontWeight: 900, marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.9 }}>
                    <Flame size={15} color="#E53935" fill="#E53935" /> 지금 이 순간의 현장 텐션 (필수)
                  </p>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: '10px',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '5px',
                    borderRadius: '20px'
                  }}>
                    {quickTags.map(tag => (
                      <motion.button 
                        key={tag} 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleQuickTag(tag)} 
                        style={{ 
                          height: '42px',
                          borderRadius: '14px', 
                          border: '1px solid',
                          borderColor: newPost.content.includes(tag) ? '#E53935' : 'var(--color-border)', 
                          background: newPost.content.includes(tag) ? 'linear-gradient(135deg, #E53935, #FF1744)' : 'var(--color-card)', 
                          color: newPost.content.includes(tag) ? '#fff' : 'var(--color-text-sub)', 
                          fontSize: '11px', 
                          fontWeight: 1000, 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: newPost.content.includes(tag) ? '0 4px 12px rgba(229, 57, 53, 0.3)' : 'none'
                        }}
                      >
                        {tag}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    placeholder="현재 바(Bar) 이름을 적어주세요" 
                    value={newPost.bar_name} 
                    onChange={e => setNewPost({...newPost, bar_name: e.target.value})} 
                    style={{ width: '100%', padding: '18px', borderRadius: '18px', background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', fontWeight: 800, fontSize: '15px' }} 
                  />
                </div>

                <button 
                  onClick={() => {
                    if (!newPost.content.trim()) {
                      alert('분위기 태그를 최소 하나 선택해주세요!');
                      return;
                    }
                    handleUpload();
                  }}
                  disabled={uploading}
                  style={{ width: '100%', padding: '18px', borderRadius: '18px', background: 'linear-gradient(135deg, #E53935, #FF1744)', color: 'white', fontSize: '17px', fontWeight: 1000, border: 'none', boxShadow: '0 8px 25px rgba(229, 57, 53, 0.4)', marginTop: '10px' }}
                >
                  {uploading ? '전송 중...' : '현장 리포트 올리기'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Community;
