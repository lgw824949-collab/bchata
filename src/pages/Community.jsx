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

  const fetchPosts = async () => {
    setLoading(true);
    let { data, error } = await supabase
      .from('community_posts')
      .select('*');
    
    if (!error && data) {
      if (selectedRegion === '전체') {
        const sortedByPopularity = [...data].sort((a, b) => (b.likes_count + b.view_count) - (a.likes_count + a.view_count));
        const top3 = sortedByPopularity.slice(0, 3);
        const top3Ids = new Set(top3.map(p => p.id));
        const rest = data
          .filter(p => !top3Ids.has(p.id))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 3);
        setPosts([...top3, ...rest]);
      } else {
        const filtered = data
          .filter(p => p.region === selectedRegion)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setPosts(filtered);
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
    
    // 로컬 스토리지에서 좋아요 기록 확인
    const likesKey = `likes_${postId}`;
    const currentLikes = parseInt(localStorage.getItem(likesKey) || '0');
    
    if (currentLikes >= 3) {
      alert('이미 충분히 응원하셨습니다! (최대 3회)');
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const newLikes = (post.likes_count || 0) + 1;
    
    // 기기 로컬에 기록 저장
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
    <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '15px 15px 100px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 950, color: '#1E293B', letterSpacing: '-0.02em' }}>
            <span style={{ color: '#E53935' }}>LIVE</span> PICK
          </h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setView('home')} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '8px', cursor: 'pointer' }}>
              <HomeIcon size={20} color="#64748B" />
            </button>
            <button style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '8px' }}>
              <Search size={20} color="#64748B" />
            </button>
          </div>
        </div>
        <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.5', fontWeight: 600 }}>
          "지금 거기 분위기 어때요?"<br />
          실시간 현장 사진을 보고 오늘 밤 목적지를 정해보세요!
        </p>
      </div>

      {/* Region Filter */}
      <div style={{ display: 'flex', overflowX: 'auto', gap: '6px', marginBottom: '16px', paddingBottom: '5px' }} className="hide-scrollbar">
        {['전체', ...regions].map(r => (
          <button 
            key={r} 
            onClick={() => setSelectedRegion(r)}
            style={{ 
              padding: '6px 14px', 
              borderRadius: '10px', 
              fontSize: '12px', 
              fontWeight: 800, 
              whiteSpace: 'nowrap', 
              border: 'none', 
              background: r === selectedRegion ? '#E53935' : '#fff', 
              color: r === selectedRegion ? '#fff' : '#64748B', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
          >
            {r}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {loading ? (
          <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '60px', color: '#64748B' }}>현장 상황을 확인 중...</div>
        ) : posts.length === 0 ? (
          <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '24px', border: '1px dashed #E2E8F0' }}>
            <Camera size={40} color="#E2E8F0" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', marginBottom: '6px' }}>아직 리포트가 없어요</h3>
            <p style={{ fontSize: '13px', color: '#94A3B8' }}>{selectedRegion} 지역의 첫 번째 소식을 전해주세요!</p>
          </div>
        ) : (
          posts.map((post, index) => (
            <motion.div key={post.id} whileTap={{ scale: 0.98 }} onClick={() => setSelectedPost(post)} style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', aspectRatio: '1/1.2', background: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <img src={post.image_url} alt="feed" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {selectedRegion === '전체' && index < 3 && (
                <div style={{ position: 'absolute', top: '10px', left: '10px', background: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32', color: '#fff', padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 900, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Star size={12} fill="#fff" />
                  {index + 1}위
                </div>
              )}
              {selectedRegion === '전체' && index >= 3 && index < 6 && (
                <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#3B82F6', color: '#fff', padding: '4px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: 900, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                  실시간
                </div>
              )}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <div style={{ color: '#fff', fontSize: '12px', fontWeight: 800, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{post.bar_name || post.region}</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '10px' }}>{getRelativeTime(post.created_at)}</div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {selectedPost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '32px', overflow: 'hidden', position: 'relative' }}>
              <button onClick={() => setSelectedPost(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', padding: '8px', zIndex: 10 }}><X size={20} /></button>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1' }}>
                <img src={selectedPost.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E53935' }}><MapPin size={20} /></div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 900 }}>{selectedPost.bar_name || '익명의 댄서'}</h3>
                    <p style={{ fontSize: '12px', color: '#64748B' }}>{selectedPost.region} • {getRelativeTime(selectedPost.created_at)}</p>
                  </div>
                </div>
                <p style={{ fontSize: '15px', color: '#1E293B', lineHeight: '1.6', marginBottom: '24px' }}>{selectedPost.content}</p>
                <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid #F1F5F9', paddingTop: '20px' }}>
                  <button onClick={(e) => handleLike(selectedPost.id, e)} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', color: '#E53935', fontWeight: 800 }}>
                    <Heart size={24} fill={(selectedPost.likes_count || 0) > 0 ? '#E53935' : 'none'} /> {selectedPost.likes_count || 0}
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', fontWeight: 800 }}>
                    <Eye size={24} /> {selectedPost.view_count || 0}
                  </div>
                  <button onClick={(e) => handleShare(selectedPost, e)} style={{ background: 'none', border: 'none', marginLeft: 'auto' }}>
                    <Share2 size={24} color="#64748B" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowUploadModal(true)} style={{ position: 'fixed', bottom: '30px', right: '20px', width: '60px', height: '60px', borderRadius: '50%', background: '#E53935', color: '#fff', border: 'none', boxShadow: '0 8px 25px rgba(229,57,53,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <Plus size={30} strokeWidth={3} />
      </motion.button>

      <AnimatePresence>
        {showUploadModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '32px', padding: '30px', position: 'relative' }}>
              <button onClick={() => setShowUploadModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#F1F5F9', border: 'none', borderRadius: '50%', padding: '8px' }}><X size={20} /></button>
              <h2 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '24px' }}>새로운 피드 올리기</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div onClick={() => document.getElementById('file-upload').click()} style={{ width: '100%', height: '150px', border: '2px dashed #E2E8F0', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#F8FAFC', overflow: 'hidden' }}>
                  {newPost.image ? (
                    <img src={URL.createObjectURL(newPost.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      <Camera size={30} color="#94A3B8" style={{ marginBottom: '8px' }} />
                      <span style={{ fontSize: '13px', color: '#64748B' }}>현장 사진 선택 (필수)</span>
                    </>
                  )}
                  <input id="file-upload" type="file" accept="image/*" hidden onChange={e => setNewPost({...newPost, image: e.target.files[0]})} />
                </div>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', marginBottom: '8px' }}>빠른 태그 선택</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {['🔥 핫해요', '💃 분위기 최고', '🎵 음악 맛집', '👨‍👩‍👧‍👦 북적북적', '✨ 쾌적해요', '🍹 칵테일 추천'].map(tag => (
                      <button key={tag} onClick={() => setNewPost({...newPost, content: newPost.content ? `${newPost.content} ${tag}` : tag})} style={{ padding: '6px 10px', borderRadius: '10px', background: '#F1F5F9', border: '1px solid #E2E8F0', fontSize: '11px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}>{tag}</button>
                    ))}
                  </div>
                </div>
                <textarea placeholder="예: [보니따] 현재 분위기 정말 뜨거워요! 바차타 비율도 좋고 사람도 많아서 춤추기 딱입니다. 🔥" value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} style={{ width: '100%', height: '80px', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '15px', fontSize: '14px', outline: 'none', resize: 'none', lineHeight: '1.5' }} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select value={newPost.region} onChange={e => setNewPost({...newPost, region: e.target.value})} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '14px' }}>
                    {regions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <input placeholder="장소명 (선택)" value={newPost.bar_name} onChange={e => setNewPost({...newPost, bar_name: e.target.value})} style={{ flex: 2, padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '14px' }} />
                </div>
                <button onClick={handleUpload} disabled={uploading} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#E53935', color: '#fff', fontSize: '16px', fontWeight: 800, border: 'none', cursor: 'pointer', opacity: uploading ? 0.7 : 1 }}>{uploading ? '업로드 중...' : '공유하기'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Community;
