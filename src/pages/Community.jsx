import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Eye, Share2, Plus, X, Camera, MapPin, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

const Community = ({ setSelectedPoster }) => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', region: '서울', bar_name: '', image: null });
  const [uploading, setUploading] = useState(false);

  const regions = ['서울', '경기/인천', '경상도', '전라도', '충청도', '강원/제주'];

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setPosts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleLike = async (postId) => {
    // 좋아요 로직 (단순화: 클라이언트 사이드 업데이트 우선)
    setPosts(posts.map(p => p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p));
    await supabase.rpc('increment_likes', { post_id: postId });
  };

  const handleUpload = async () => {
    if (!newPost.image || !newPost.content) {
      alert('사진과 내용을 입력해주세요!');
      return;
    }
    setUploading(true);
    try {
      // 1. 이미지 업로드 (Storage)
      const file = newPost.image;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `community/${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('posters') // 기존 posters 버킷 활용 또는 신규 생성 필요
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('posters').getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      // 2. DB 저장
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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 950, color: '#1E293B', letterSpacing: '-0.02em' }}>
          운명의 <span style={{ color: '#E53935' }}>좌표</span> 피드
        </h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '8px' }}>
            <Search size={20} color="#64748B" />
          </button>
        </div>
      </div>

      {/* Region Filter */}
      <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', marginBottom: '20px', paddingBottom: '5px' }} className="hide-scrollbar">
        {['전체', ...regions].map(r => (
          <button key={r} style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', border: 'none', background: r === '전체' ? '#E53935' : '#fff', color: r === '전체' ? '#fff' : '#64748B', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            {r}
          </button>
        ))}
      </div>

      {/* Feed List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
        ) : (
          posts.map(post => (
            <motion.div 
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
            >
              {/* Post Header */}
              <div style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#E53935', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>B</div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B' }}>{post.bar_name || '오늘밤빠 멤버'}</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={10} /> {post.region} • {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Image */}
              <div onClick={() => setSelectedPoster(post.image_url)} style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', background: '#F1F5F9' }}>
                <img src={post.image_url} alt="feed" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              {/* Actions */}
              <div style={{ padding: '15px' }}>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                  <button onClick={() => handleLike(post.id)} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '5px', color: '#E53935', fontWeight: 700 }}>
                    <Heart size={22} fill={post.likes_count > 0 ? '#E53935' : 'none'} /> {post.likes_count}
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748B', fontWeight: 700 }}>
                    <Eye size={22} /> {post.view_count}
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

      {/* Floating Action Button */}
      <motion.button 
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowUploadModal(true)}
        style={{ position: 'fixed', bottom: '100px', right: '20px', width: '60px', height: '60px', borderRadius: '50%', background: '#E53935', color: '#fff', border: 'none', boxShadow: '0 8px 25px rgba(229,57,53,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      >
        <Plus size={30} strokeWidth={3} />
      </motion.button>

      {/* Upload Modal */}
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
                      <span style={{ fontSize: '14px', color: '#64748B' }}>현장 사진 선택</span>
                    </>
                  )}
                  <input id="file-upload" type="file" accept="image/*" hidden onChange={e => setNewPost({...newPost, image: e.target.files[0]})} />
                </div>

                <textarea 
                  placeholder="지금 현장의 분위기는 어떤가요? (예: 보니따 바차타 분위기 최고!)"
                  value={newPost.content}
                  onChange={e => setNewPost({...newPost, content: e.target.value})}
                  style={{ width: '100%', height: '100px', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '15px', fontSize: '14px', outline: 'none', resize: 'none' }}
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
