import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Eye, Share2, Plus, X, Camera, MapPin, Search, Home as HomeIcon, Star, Info, CheckCircle2, Trophy, Award, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

const Community = ({ setSelectedPoster, setView }) => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPost, setNewPost] = useState({ content: '', region: '서울', bar_name: '', image: null, is_live: true });
  const [uploading, setUploading] = useState(false);
  const [showRewardCelebration, setShowRewardCelebration] = useState(false);
  const [isFullView, setIsFullView] = useState(false);
  
  // Reward System State
  const [userPoints, setUserPoints] = useState(() => parseInt(localStorage.getItem('reporter_points') || '0'));
  const [isVerified, setIsVerified] = useState(() => localStorage.getItem('is_verified_reporter') === 'true');

  const quickTags = ['#분위기최고👍', '#음악맛집🎵', '#사람많음🔥', '#여유로움☕', '#살사맛집💃', '#바차타맛집🕺', '#키좀바맛집✨', '#주크맛집🎶', '#미모포텐🎈', '#훈남훈녀가득🌟', '#패션왕등판🕶️', '#안호강중🔥'];

const demoPosts = [
  { id: 'real1', image_url: '/Photo/%ED%99%94%EB%A9%B4%20%EC%BA%A1%EC%B2%98%202026-05-07%20225729.png', bar_name: '', likes_count: 312, view_count: 4200, region: '서울', content: '오늘 분위기 미쳤습니다! #사람많음🔥 #분위기최고👍', created_at: new Date().toISOString(), is_live: true },
  { id: 'real2', image_url: '/Photo/%ED%99%94%EB%A9%B4%20%EC%BA%A1%EC%B2%98%202026-05-07%20225828.png', bar_name: '', likes_count: 245, view_count: 3100, region: '서울', content: '바차타 맛집 인정.. 노래 셀렉 미쳤네요. #음악맛집🎵 #바차타맛집🕺', created_at: new Date().toISOString(), is_live: true },
  { id: 'real3', image_url: '/Photo/%ED%99%94%EB%A9%B4%20%EC%BA%A1%EC%B2%98%202026-05-07%20225905.png', bar_name: '', likes_count: 189, view_count: 2400, region: '서울', content: '쪽 오시는 분들 참고하세요! 지금 피크입니다. #미모포텐🎈 #훈남훈녀가득🌟', created_at: new Date().toISOString(), is_live: true }
];

  useEffect(() => {
    localStorage.setItem('reporter_points', userPoints.toString());
    if (userPoints >= 50 && !isVerified) {
      setIsVerified(true);
      localStorage.setItem('is_verified_reporter', 'true');
    }
  }, [userPoints]);

  // Modal History Management
  useEffect(() => {
    const handlePopState = (e) => {
      // Safely check if we are navigating back to the base community state
      if (!e.state || (e.state.type !== 'post' && e.state.type !== 'upload')) {
        setSelectedPost(null);
        setShowUploadModal(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openPost = (post) => {
    window.history.pushState({ type: 'post' }, '');
    setSelectedPost(post);
  };

  const closePost = () => {
    setSelectedPost(null);
    if (window.history.state?.type === 'post') {
      window.history.back();
    }
  };

  const openUpload = () => {
    window.history.pushState({ type: 'upload' }, '');
    setShowUploadModal(true);
  };

  const closeUpload = () => {
    setShowUploadModal(false);
    if (window.history.state?.type === 'upload') {
      window.history.back();
    }
  };

  useEffect(() => {
    const handleOpenUpload = () => openUpload();
    window.addEventListener('open-community-upload', handleOpenUpload);
    return () => window.removeEventListener('open-community-upload', handleOpenUpload);
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      let { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .eq('status', 'active')
        .gt('created_at', threeDaysAgo)
        .order('created_at', { ascending: false });
      
      if (!error && (!data || data.length === 0)) {
        const { data: allData, error: allErr } = await supabase
          .from('community_posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        data = allData;
        error = allErr;
      }
      
      if (!error && data && data.length > 0) {
        if (isFullView) {
          // ALL PICK: Chronological order, show everything
          setPosts(data);
        } else {
          // LIVE PICK: Popularity order (Likes + Views), strictly Top 15
          const sortedByPopularity = [...data].sort((a, b) => 
            ((b.likes_count || 0) + (b.view_count || 0)) - ((a.likes_count || 0) + (a.view_count || 0))
          );
          setPosts(sortedByPopularity.slice(0, 15));
        }
      } else {
        setPosts(demoPosts.slice(0, isFullView ? undefined : 15));
      }
    } catch (err) {
      console.error('fetchPosts error:', err);
      setPosts(demoPosts);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [isFullView]);

  const getRelativeTime = (dateStr) => {
    const now = new Date();
    const past = new Date(dateStr);
    const diff = Math.floor((now - past) / 1000 / 60);
    if (diff < 1) return '방금 전';
    if (diff < 60) return `${diff}분 전`;
    if (diff < 1440) return `${Math.floor(diff/60)}시간 전`;
    return `${Math.floor(diff/1440)}일 전`;
  };

  const handleLike = async (postId, e) => {
    if (e) e.stopPropagation();
    if (postId.toString().startsWith('real')) return;
    const likesKey = `likes_${postId}`;
    const currentLikesCount = parseInt(localStorage.getItem(likesKey) || '0');
    if (currentLikesCount >= 3) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const newLikes = (post.likes_count || 0) + 1;
    localStorage.setItem(likesKey, (currentLikesCount + 1).toString());
    setPosts(posts.map(p => p.id === postId ? { ...p, likes_count: newLikes } : p));
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost({ ...selectedPost, likes_count: newLikes });
    }
    await supabase.from('community_posts').update({ likes_count: newLikes }).eq('id', postId);
  };

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
        view_count: 0,
        is_live: newPost.is_live
      }]);
      if (dbError) throw dbError;
      
      // Reward Point Grant
      setUserPoints(prev => prev + 10);
      setShowRewardCelebration(true);
      
      setTimeout(() => {
        setShowRewardCelebration(false);
        closeUpload();
        setNewPost({ content: '', region: '서울', bar_name: '', image: null, is_live: true });
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

  return (
    <div style={{ background: '#fff', minHeight: '100vh', padding: '10px 4px 80px', color: '#111', transition: 'all 0.3s' }}>
      {/* Header */}
      <div style={{ padding: '10px 10px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em', color: '#111' }}>
            <span style={{ 
              color: '#E53935',
              animation: isFullView ? 'none' : 'pulse-text 2s infinite'
            }}>
              {isFullView ? 'ALL' : 'LIVE'}
            </span> PICK
          </h1>
          <style>{`
            @keyframes pulse-text {
              0% { opacity: 1; text-shadow: 0 0 5px rgba(229, 57, 53, 0.5); }
              50% { opacity: 0.7; text-shadow: 0 0 15px rgba(229, 57, 53, 0.8); }
              100% { opacity: 1; text-shadow: 0 0 5px rgba(229, 57, 53, 0.5); }
            }
          `}</style>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* View All Button replaces Points */}
            <button 
              onClick={() => setIsFullView(!isFullView)} 
              style={{ 
                background: isFullView ? '#E53935' : '#F3F4F6', 
                border: 'none', 
                padding: '6px 14px', 
                borderRadius: '20px', 
                color: isFullView ? '#fff' : '#64748B', 
                fontSize: '12px', 
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {isFullView ? '실시간' : '전체보기'}
            </button>
            
            <button onClick={() => setView('home')} style={{ background: '#F3F4F6', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer' }}>
              <HomeIcon size={20} color="#111" />
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '6px', marginBottom: '10px' }}>
          <Info size={12} color="#94A3B8" />
          <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>
            현장 리포트 업로드 시 10포인트 적립! 주간 베스트는 추가 혜택이 있습니다.
          </p>
        </div>
      </div>

      {/* High-Density 3-Column Grid (Instagram Style) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '2px',
        padding: '0 2px'
      }}>
        {loading ? (
          <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '60px', color: '#94A3B8' }}>로딩 중..</div>
        ) : posts.length === 0 ? (
          <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '80px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
            <Camera size={30} color="rgba(255,255,255,0.1)" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>리포트가 없습니다</h3>
          </div>
        ) : (
          posts.map((post) => {
            // 우리가 정의한 퀵태그 리스트
            const officialTags = ['#분위기최고👍', '#음악맛집🎵', '#사람많음🔥', '#여유로움☕', '#살사맛집💃', '#바차타맛집🕺', '#키좀바맛집✨', '#주크맛집🎶', '#미모포텐🎈', '#훈남훈녀가득🌟', '#패션왕등판🕶️', '#안호강중🔥'];
            const matchedTags = officialTags.filter(tag => post.content?.includes(tag));
            const displayTag = matchedTags.length > 0 ? matchedTags.join(' ') : '';

            return (
              <motion.div 
                key={post.id} 
                whileTap={{ scale: 0.98 }} 
                onClick={() => openPost(post)} 
                style={{ 
                  background: '#F9FAFB', 
                  overflow: 'hidden', 
                  display: 'flex',
                  flexDirection: 'column',
                  aspectRatio: '1/1',
                  position: 'relative',
                  border: '1px solid #F3F4F6'
                }}
              >
                <img src={post.image_url} alt="feed" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                
                {/* 하단 정보 오버레이 (밝은 배경에 어울리는 투명도 조정) */}
                <div style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  right: 0, 
                  padding: '10px 8px', 
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 100%)',
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  minHeight: '40px',
                  zIndex: 10
                }}>
                  {isFullView ? (
                    /* [실시간 모드] 공식 퀵태그 노출 */
                    <div style={{ 
                      color: '#FFD700', 
                      fontSize: '11px', 
                      fontWeight: 900, 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      textAlign: 'center',
                      textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                    }}>
                      {displayTag}
                    </div>
                  ) : (
                    /* [전체보기 모드] 하트와 뷰포인트 노출 */
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Heart size={12} color="#FF3B30" fill="#FF3B30" />
                        <span style={{ color: '#fff', fontSize: '12px', fontWeight: 900 }}>{post.likes_count || 0}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Eye size={12} color="#fff" />
                        <span style={{ color: '#fff', fontSize: '12px', fontWeight: 900 }}>{post.view_count || 0}</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: '80px', background: '#fff', zIndex: 3000, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', background: '#fff' }}>
              <button onClick={closePost} style={{ background: 'none', border: 'none', color: '#111' }}><X size={24} /></button>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#111' }}>현장 리포트</div>
              <div style={{ width: '24px' }}></div>
            </div>
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              {/* 사진이 영역을 꽉 채우도록 수정 */}
              <img 
                src={selectedPost.image_url} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  display: 'block' 
                }} 
              />
              
              {/* 통계 및 액션 오버레이 (하단에 배치) */}
              <div style={{ 
                position: 'absolute', 
                bottom: 0, 
                left: 0, 
                right: 0, 
                padding: '40px 24px 24px', 
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                <div style={{ display: 'flex', gap: '30px', justifyContent: 'center' }}>
                  <button 
                    onClick={(e) => handleLike(selectedPost.id, e)} 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      color: '#fff', 
                      fontWeight: 900, 
                      fontSize: '20px',
                      textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}
                  >
                    <Heart size={32} color="#E53935" fill={(selectedPost.likes_count || 0) > 0 ? '#E53935' : 'none'} /> 
                    {selectedPost.likes_count || 0}
                  </button>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    color: '#fff', 
                    fontWeight: 900, 
                    fontSize: '20px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                  }}>
                    <Eye size={32} /> 
                    {selectedPost.view_count || 0}
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <button 
                    onClick={(e) => handleShare(selectedPost, e)} 
                    style={{ 
                      background: 'rgba(255,255,255,0.15)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)', 
                      padding: '14px 32px', 
                      borderRadius: '16px', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      color: '#fff', 
                      fontSize: '15px', 
                      fontWeight: 800,
                      boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                    }}
                  >
                    <Share2 size={20} /> 리포트 공유하기
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUploadModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.9)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}>
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '30px', padding: '25px', position: 'relative', border: '1px solid #E5E7EB', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
              
              {showRewardCelebration ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ type: 'spring', damping: 10 }}>
                    <Zap size={60} color="#FFD700" fill="#FFD700" style={{ margin: '0 auto 20px' }} />
                  </motion.div>
                  <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', marginBottom: '10px' }}>리포트 성공!</h2>
                  <p style={{ fontSize: '18px', color: '#FFD700', fontWeight: 900 }}>+10 Points Earned</p>
                </div>
              ) : (
                <>
                  <button onClick={closeUpload} style={{ position: 'absolute', top: '15px', right: '15px', background: '#F3F4F6', border: 'none', borderRadius: '50%', padding: '6px', color: '#111' }}><X size={18} /></button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#111' }}>새로운 리포트</h2>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div 
                      onClick={() => setNewPost({...newPost, is_live: !newPost.is_live})} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '10px', 
                        padding: '12px', 
                        background: newPost.is_live ? 'rgba(229, 57, 53, 0.05)' : '#F9FAFB', 
                        borderRadius: '16px', 
                        border: newPost.is_live ? '1px solid #E53935' : '1px solid #E5E7EB', 
                        cursor: 'pointer', 
                        transition: 'all 0.2s' 
                      }}
                    >
                      <Camera size={24} color={newPost.is_live ? '#E53935' : '#64748B'} />
                      <span style={{ fontSize: '14px', fontWeight: 800, color: newPost.is_live ? '#E53935' : '#64748B' }}>
                        {newPost.is_live ? '실시간 인증 활성화' : '실시간 인증 비활성'}
                      </span>
                    </div>

                    <div onClick={() => document.getElementById('file-upload').click()} style={{ width: '100%', height: '160px', border: '1px dashed #E5E7EB', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#F9FAFB', overflow: 'hidden' }}>
                      {newPost.image ? <img src={URL.createObjectURL(newPost.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <><Camera size={30} color="#94A3B8" /><span style={{ fontSize: '12px', color: '#64748B', marginTop: '8px' }}>현장 사진 찍기</span></>}
                      <input id="file-upload" type="file" accept="image/*" hidden onChange={e => setNewPost({...newPost, image: e.target.files[0]})} />
                    </div>

                    <div style={{ marginTop: '5px' }}>
                      <p style={{ fontSize: '12px', color: '#111', fontWeight: 800, marginBottom: '8px' }}>상황 태그 선택</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '100px', overflowY: 'auto' }} className="hide-scrollbar">
                        {quickTags.map(tag => (
                          <button 
                            key={tag} 
                            onClick={() => handleQuickTag(tag)} 
                            style={{ 
                              padding: '6px 12px', 
                              borderRadius: '20px', 
                              border: '1px solid #E5E7EB', 
                              background: newPost.content.includes(tag) ? '#E53935' : '#fff', 
                              color: newPost.content.includes(tag) ? '#fff' : '#64748B', 
                              fontSize: '11px', 
                              fontWeight: 700
                            }}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input placeholder="바 이름 (예: 보니따)" value={newPost.bar_name} onChange={e => setNewPost({...newPost, bar_name: e.target.value})} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '14px', background: '#fff', color: '#111' }} />
                    </div>
                    
                    <button onClick={handleUpload} disabled={uploading} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#E53935', color: '#fff', fontSize: '16px', fontWeight: 900, border: 'none', cursor: 'pointer', opacity: uploading ? 0.7 : 1, marginTop: '10px' }}>{uploading ? '업로드 중..' : '등록하기'}</button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Community;
