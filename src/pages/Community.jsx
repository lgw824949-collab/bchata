import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Eye, Share2, Plus, X, Camera, MapPin, Search, Home as HomeIcon, Star } from 'lucide-react';
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
  const [selectedRegion, setSelectedRegion] = useState('전체');

  const regions = ['서울', '경기/인천', '경상도', '전라도', '충청도', '강원/제주'];

  // --- 뒤로가기(Back) 핸들링 ---
  useEffect(() => {
    if (selectedPost || showUploadModal) {
      window.history.pushState({ subView: 'community_overlay' }, '');
    }
  }, [selectedPost, showUploadModal]);

  useEffect(() => {
    const handlePopState = () => {
      if (selectedPost) {
        setSelectedPost(null);
      } else if (showUploadModal) {
        setShowUploadModal(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedPost, showUploadModal]);

  const fetchPosts = async () => {
    setLoading(true);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    let { data, error } = await supabase
      .from('community_posts')
      .select('*')
      .gt('created_at', oneDayAgo); // 최근 24시간 데이터만 조회
    
    if (!error && data) {
      let filteredData = selectedRegion === '전체' 
        ? [...data] 
        : data.filter(p => p.region === selectedRegion);

      if (filteredData.length > 0) {
        const sortedByPopularity = [...filteredData].sort((a, b) => (b.likes_count + b.view_count) - (a.likes_count + a.view_count));
        const top3 = sortedByPopularity.slice(0, 3);
        const top3Ids = new Set(top3.map(p => p.id));
        
        const restOfData = filteredData
          .filter(p => !top3Ids.has(p.id))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // 전체는 2x3(6개), 지역은 3x5(15개)
        const limit = selectedRegion === '전체' ? 3 : 12;
        const rest = restOfData.slice(0, limit);
        
        setPosts([...top3, ...rest]);
      } else {
        setPosts([]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedRegion]);

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
    const likesKey = `likes_${postId}`;
    const currentLikes = parseInt(localStorage.getItem(likesKey) || '0');
    if (currentLikes >= 3) {
      alert('이미 충분히 응원하셨습니다!');
      return;
    }
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const newLikes = (post.likes_count || 0) + 1;
    localStorage.setItem(likesKey, (currentLikes + 1).toString());
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
      text: `[오늘밤빠] ${post.bar_name || '현장'} 분위기 확인하세요! : ${post.content}`,
      url: window.location.href
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('링크가 복사되었습니다!');
      }
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const handleUpload = async () => {
    if (!newPost.image || !newPost.content) {
      alert('사진과 내용을 입력해주세요!');
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
      alert('게시물이 등록되었습니다!');
      setShowUploadModal(false);
      setNewPost({ content: '', region: '서울', bar_name: '', image: null });
      fetchPosts();
    } catch (err) {
      alert('업로드 실패: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '10px 4px 100px', color: '#fff' }}>
      {/* Header */}
      <div style={{ padding: '10px 10px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em' }}>
            <span style={{ color: '#E53935' }}>LIVE</span> PICK
          </h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setView('home')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer' }}>
              <HomeIcon size={20} color="#fff" />
            </button>
            <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px', padding: '8px' }}>
              <Search size={20} color="#fff" />
            </button>
          </div>
        </div>
      </div>

      {/* Region Filter */}
      <div style={{ display: 'flex', overflowX: 'auto', gap: '6px', marginBottom: '15px', padding: '0 10px 5px' }} className="hide-scrollbar">
        {['전체', ...regions].map(r => (
          <button 
            key={r} 
            onClick={() => setSelectedRegion(r)} 
            style={{ 
              padding: '6px 12px', 
              borderRadius: '8px', 
              fontSize: '12px', 
              fontWeight: 800, 
              whiteSpace: 'nowrap', 
              border: r === selectedRegion ? 'none' : '1px solid rgba(255,255,255,0.2)', 
              background: r === selectedRegion ? '#E53935' : 'transparent', 
              color: '#fff', 
              transition: 'all 0.2s' 
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Strategic Grid System */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: selectedRegion === '전체' ? '1fr 1fr' : '1fr 1fr 1fr', 
        gap: '2px' 
      }}>
        {loading ? (
          <div style={{ gridColumn: selectedRegion === '전체' ? 'span 2' : 'span 3', textAlign: 'center', padding: '60px', color: '#94A3B8' }}>로딩 중...</div>
        ) : posts.length === 0 ? (
          <div style={{ gridColumn: selectedRegion === '전체' ? 'span 2' : 'span 3', textAlign: 'center', padding: '80px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', margin: '10px' }}>
            <Camera size={40} color="rgba(255,255,255,0.1)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>리포트가 없습니다</h3>
          </div>
        ) : (
          posts.map((post, index) => (
            <motion.div 
              key={post.id} 
              whileTap={{ scale: 0.96 }} 
              onClick={() => setSelectedPost(post)} 
              style={{ position: 'relative', aspectRatio: selectedRegion === '전체' ? '1/1.2' : '3/4', background: '#000', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <img src={post.image_url} alt="feed" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              
              <div style={{ position: 'absolute', top: '6px', left: '6px' }}>
                {index < 3 && (
                  <div style={{ background: '#FFD700', color: '#000', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 900 }}>{index + 1}위</div>
                )}
                {index >= 3 && (
                  <div style={{ background: '#3B82F6', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 900 }}>LIVE</div>
                )}
              </div>

              <div style={{ position: 'absolute', bottom: '6px', left: '6px', display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(0,0,0,0.3)', padding: '2px 5px', borderRadius: '4px' }}>
                <Eye size={10} color="#fff" />
                <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>{post.view_count > 999 ? `${(post.view_count/1000).toFixed(1)}K` : post.view_count}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 3000, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <button onClick={() => setSelectedPost(null)} style={{ background: 'none', border: 'none', color: '#fff' }}><X size={24} /></button>
              <div style={{ fontSize: '15px', fontWeight: 800 }}>현장 리포트</div>
              <div style={{ width: '24px' }}></div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <img src={selectedPost.image_url} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} />
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E53935' }}><MapPin size={20} /></div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 900 }}>{selectedPost.bar_name || '익명의 댄서'}</h3>
                    <p style={{ fontSize: '12px', color: '#94A3B8' }}>{selectedPost.region} • {getRelativeTime(selectedPost.created_at)}</p>
                  </div>
                </div>
                <p style={{ fontSize: '15px', color: '#E2E8F0', lineHeight: '1.6', marginBottom: '20px' }}>{selectedPost.content}</p>
                <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                  <button onClick={(e) => handleLike(selectedPost.id, e)} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', color: '#E53935', fontWeight: 800 }}>
                    <Heart size={24} fill={(selectedPost.likes_count || 0) > 0 ? '#E53935' : 'none'} /> {selectedPost.likes_count || 0}
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8', fontWeight: 800 }}>
                    <Eye size={24} /> {selectedPost.view_count || 0}
                  </div>
                  <button onClick={(e) => handleShare(selectedPost, e)} style={{ background: 'none', border: 'none', marginLeft: 'auto' }}>
                    <Share2 size={24} color="#94A3B8" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowUploadModal(true)} style={{ position: 'fixed', bottom: '30px', right: '20px', width: '56px', height: '56px', borderRadius: '50%', background: '#E53935', color: '#fff', border: 'none', boxShadow: '0 8px 25px rgba(229,57,53,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <Plus size={28} strokeWidth={3} />
      </motion.button>

      <AnimatePresence>
        {showUploadModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} style={{ background: '#111', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '25px', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
              <button onClick={() => setShowUploadModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', padding: '6px', color: '#fff' }}><X size={18} /></button>
              <h2 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '20px' }}>새로운 피드</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div onClick={() => document.getElementById('file-upload').click()} style={{ width: '100%', height: '140px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', overflow: 'hidden' }}>
                  {newPost.image ? <img src={URL.createObjectURL(newPost.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <><Camera size={30} color="rgba(255,255,255,0.3)" /><span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>사진 선택</span></>}
                  <input id="file-upload" type="file" accept="image/*" hidden onChange={e => setNewPost({...newPost, image: e.target.files[0]})} />
                </div>
                <textarea placeholder="현장 분위기를 적어주세요..." value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} style={{ width: '100%', height: '70px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', fontSize: '14px', outline: 'none', resize: 'none', background: '#000', color: '#fff' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select value={newPost.region} onChange={e => setNewPost({...newPost, region: e.target.value})} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px', background: '#000', color: '#fff' }}>
                    {regions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <input placeholder="장소명" value={newPost.bar_name} onChange={e => setNewPost({...newPost, bar_name: e.target.value})} style={{ flex: 2, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px', background: '#000', color: '#fff' }} />
                </div>
                <button onClick={handleUpload} disabled={uploading} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#E53935', color: '#fff', fontSize: '15px', fontWeight: 800, border: 'none', cursor: 'pointer', opacity: uploading ? 0.7 : 1 }}>{uploading ? '업로드 중...' : '공유하기'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Community;
