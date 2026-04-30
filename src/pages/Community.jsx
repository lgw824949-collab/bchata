import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Eye, Share2, Plus, X, Camera, MapPin, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

const Community = ({ setSelectedPoster }) => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', region: '서울', bar_name: '', image: null });
  const [uploading, setUploading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('전체');

  const regions = ['서울', '경기/인천', '경상도', '전라도', '충청도', '강원/제주'];

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (selectedRegion !== '전체') {
      query = query.eq('region', selectedRegion);
    }

    const { data, error } = await query;
    if (!error) setPosts(data || []);
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

  const handleLike = async (postId) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const newLikes = (post.likes_count || 0) + 1;
    setPosts(posts.map(p => p.id === postId ? { ...p, likes_count: newLikes } : p));
    await supabase.from('community_posts').update({ likes_count: newLikes }).eq('id', postId);
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

      let { error: uploadError } = await supabase.storage
        .from('posters')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('posters').getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      const { error: dbError } = await supabase.from('community_posts').insert([{
        image_url: publicUrl,
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
        <h1 style={{ fontSize: '24px', fontWeight: 950, color: '#1E293B', letterSpacing: '-0.02em', marginBottom: '8px' }}>
          <span style={{ color: '#E53935' }}>LIVE</span> PICK
        </h1>
        <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.5', fontWeight: 600 }}>
          "지금 거기 분위기 어때요?"<br />
          실시간 현장 사진을 보고 오늘 밤 목적지를 정해보세요!
        </p>
      </div>

      <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', marginBottom: '24px', paddingBottom: '5px' }} className="hide-scrollbar">
        {['전체', ...regions].map(r => (
          <button 
            key={r} 
            onClick={() => setSelectedRegion(r)}
            style={{ 
              padding: '10px 20px', 
              borderRadius: '20px', 
              fontSize: '13px', 
              fontWeight: 700, 
              whiteSpace: 'nowrap', 
              border: 'none', 
              background: r === selectedRegion ? '#E53935' : '#fff', 
              color: r === selectedRegion ? '#fff' : '#64748B', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
          >
            {r}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>현장 상황을 확인 중...</div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '24px', border: '1px dashed #E2E8F0' }}>
            <Camera size={40} color="#E2E8F0" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', marginBottom: '6px' }}>아직 리포트가 없어요</h3>
            <p style={{ fontSize: '13px', color: '#94A3B8' }}>{selectedRegion} 지역의 첫 번째 소식을 전해주세요!</p>
          </div>
        ) : (
          posts.map(post => (
            <motion.div 
              key={post.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
            >
              <div style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E53935', fontWeight: 800 }}>
                  <MapPin size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>{post.bar_name || '익명의 댄서'}</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                    {post.region} • <span style={{ color: '#E53935', fontWeight: 700 }}>{getRelativeTime(post.created_at)}</span>
                  </div>
                </div>
              </div>

              <div onClick={() => setSelectedPoster(post.image_url)} style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', background: '#F1F5F9' }}>
                <img src={post.image_url} alt="feed" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              <div style={{ padding: '15px' }}>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                  <button onClick={() => handleLike(post.id)} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '5px', color: '#E53935', fontWeight: 700 }}>
                    <Heart size={22} fill={(post.likes_count || 0) > 0 ? '#E53935' : 'none'} /> {post.likes_count || 0}
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748B', fontWeight: 700 }}>
                    <Eye size={22} /> {post.view_count || 0}
                  </div>
                  <button style={{ background: 'none', border: 'none', marginLeft: 'auto' }}>
                    <Share2 size={22} color="#64748B" />
                  </button>
                </div>
                <p style={{ fontSize: '14px', color: '#1E293B', lineHeight: '1.5', margin: 0 }}>
                  {post.content}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <motion.button 
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowUploadModal(true)}
        style={{ position: 'fixed', bottom: '100px', right: '20px', width: '60px', height: '60px', borderRadius: '50%', background: '#E53935', color: '#fff', border: 'none', boxShadow: '0 8px 25px rgba(229,57,53,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      >
        <Plus size={30} strokeWidth={3} />
      </motion.button>

      <AnimatePresence>
        {showUploadModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '32px', padding: '30px', position: 'relative' }}>
              <button onClick={() => setShowUploadModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#F1F5F9', border: 'none', borderRadius: '50%', padding: '8px' }}><X size={20} /></button>
              <h2 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '24px' }}>새로운 피드 올리기</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div onClick={() => document.getElementById('file-upload').click()} style={{ width: '100%', height: '200px', border: '2px dashed #E2E8F0', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#F8FAFC', overflow: 'hidden' }}>
                  {newPost.image ? (
                    <img src={URL.createObjectURL(newPost.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      <Camera size={40} color="#94A3B8" style={{ marginBottom: '10px' }} />
                      <span style={{ fontSize: '14px', color: '#64748B' }}>현장 사진 선택 (필수)</span>
                    </>
                  )}
                  <input id="file-upload" type="file" accept="image/*" hidden onChange={e => setNewPost({...newPost, image: e.target.files[0]})} />
                </div>

                {/* Quick Tags */}
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', marginBottom: '8px' }}>빠른 태그 선택</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {['🔥 핫해요', '💃 분위기 최고', '🎵 음악 맛집', '👨‍👩‍👧‍👦 북적북적', '✨ 쾌적해요', '🍹 칵테일 추천'].map(tag => (
                      <button 
                        key={tag}
                        onClick={() => setNewPost({...newPost, content: newPost.content ? `${newPost.content} ${tag}` : tag})}
                        style={{ padding: '6px 12px', borderRadius: '12px', background: '#F1F5F9', border: '1px solid #E2E8F0', fontSize: '12px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea 
                  placeholder="예: [보니따] 현재 분위기 정말 뜨거워요! 바차타 비율도 좋고 사람도 많아서 춤추기 딱입니다. 🔥"
                  value={newPost.content}
                  onChange={e => setNewPost({...newPost, content: e.target.value})}
                  style={{ width: '100%', height: '100px', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '15px', fontSize: '14px', outline: 'none', resize: 'none', lineHeight: '1.5' }}
                />

                <div style={{ display: 'flex', gap: '10px' }}>
                  <select 
                    value={newPost.region}
                    onChange={e => setNewPost({...newPost, region: e.target.value})}
                    style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '14px' }}
                  >
                    {regions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <input 
                    placeholder="장소명 (선택)"
                    value={newPost.bar_name}
                    onChange={e => setNewPost({...newPost, bar_name: e.target.value})}
                    style={{ flex: 2, padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '14px' }}
                  />
                </div>

                <button 
                  onClick={handleUpload}
                  disabled={uploading}
                  style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#E53935', color: '#fff', fontSize: '16px', fontWeight: 800, border: 'none', cursor: 'pointer', opacity: uploading ? 0.7 : 1 }}
                >
                  {uploading ? '업로드 중...' : '공유하기'}
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
