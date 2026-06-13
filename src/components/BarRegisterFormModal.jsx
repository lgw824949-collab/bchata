import React, { useEffect, useState } from 'react';
import { Z } from '../constants/zLayers';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { findBarByName } from '../lib/BarLib';
import { canonicalizeVenueRow } from '../lib/venueCanonical';

const emptyForm = () => ({
  name: '',
  address: '',
  kakao_url: '',
  instagram_url: '',
});

export default function BarRegisterFormModal({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState(emptyForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setFormData(emptyForm());
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  }, [open]);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => {
      const next = { ...prev, name: val };
      if (val.length >= 1) {
        const match = findBarByName(val);
        if (match?.address) next.address = match.address;
      }
      return next;
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) {
      alert('BAR 이름과 주소를 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedImageUrl = null;
      if (selectedFile) {
        const ext = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('posters')
          .upload(`posters/${fileName}`, selectedFile);
        if (!uploadError) {
          const { data: pData } = supabase.storage.from('posters').getPublicUrl(`posters/${fileName}`);
          uploadedImageUrl = pData?.publicUrl || null;
        }
      }

      const canonical = canonicalizeVenueRow({
        name: formData.name.trim(),
        address: formData.address.trim(),
      });

      const payload = {
        name: canonical.name,
        address: canonical.address,
      };
      if (uploadedImageUrl) payload.image_url = uploadedImageUrl;
      if (formData.kakao_url.trim()) payload.kakao_url = formData.kakao_url.trim();
      if (formData.instagram_url.trim()) payload.instagram_url = formData.instagram_url.trim();

      let { error } = await supabase.from('locations').insert([payload]);
      if (error && (error.message?.includes('column') || error.message?.includes('does not exist'))) {
        const { error: retryError } = await supabase.from('locations').insert([
          { name: payload.name, address: payload.address },
        ]);
        if (retryError) throw retryError;
      } else if (error) {
        throw error;
      }

      alert('공간 등록이 완료되었습니다.');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      alert(`등록에 실패했습니다: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: Z.modal,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 360,
            maxHeight: '88dvh',
            overflowY: 'auto',
            background: '#fff',
            borderRadius: 24,
            padding: 24,
            boxShadow: '0 20px 48px rgba(0,0,0,0.18)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: '#F1F5F9',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} color="#64748B" />
          </button>

          <h4 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 950, color: '#1E293B' }}>공간 등재 신청</h4>
          <p style={{ margin: '0 0 16px', fontSize: 12, color: '#64748B' }}>BAR 정보를 등록해 주세요.</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>BAR 이름 *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={handleNameChange}
                placeholder="예: 강남턴"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>상세 주소 *</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="예: 서울 강남구 ..."
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>대표 이미지 (선택)</label>
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ fontSize: 12, width: '100%' }} />
              {previewUrl && (
                <img src={previewUrl} alt="" style={{ marginTop: 8, width: 72, height: 72, borderRadius: 12, objectFit: 'cover' }} />
              )}
            </div>

            <div style={{ paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, color: '#475569' }}>SNS · 문의 (선택)</p>
              <label style={labelStyle}>카카오톡 링크</label>
              <input
                type="url"
                value={formData.kakao_url}
                onChange={(e) => setFormData({ ...formData, kakao_url: e.target.value })}
                placeholder="https://open.kakao.com/o/..."
                style={{ ...inputStyle, marginBottom: 10 }}
              />
              <label style={labelStyle}>인스타그램 링크</label>
              <input
                type="url"
                value={formData.instagram_url}
                onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                placeholder="https://instagram.com/..."
                style={inputStyle}
              />
            </div>

            <button type="submit" disabled={isSubmitting} style={submitStyle}>
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : '등록 완료'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 800,
  color: '#475569',
  marginBottom: 4,
};

const inputStyle = {
  width: '100%',
  padding: 12,
  border: '1px solid #E2E8F0',
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 600,
  outline: 'none',
  boxSizing: 'border-box',
};

const submitStyle = {
  marginTop: 4,
  width: '100%',
  padding: 14,
  background: '#E53935',
  color: '#fff',
  border: 'none',
  borderRadius: 14,
  fontWeight: 950,
  fontSize: 15,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};
