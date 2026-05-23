import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Z } from '../constants/zLayers';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { adminDbMutate } from '../lib/adminApi';
import { X, Calendar, Clock, MapPin, DollarSign, Users, Info, User, Sparkles, Plus, MessageCircle, Camera, Trash2 } from 'lucide-react';
import { DEFAULT_CARD_IMAGE, imgFallbackHandler } from '../constants/imageAssets';
import { appendLessonPublisherMeta, LESSON_PUBLISHER } from '../lib/lessonPublisher';

const GENRE_LIST = ['바차타', '살사', '쥬크', '키좀바'];
const LATIN_MIX = ['바차타', '살사'];
const CLASS_TYPES = ['1:1', '그룹', '온라인'];
const CITY_OPTIONS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '제주', '기타'];

const emptyForm = (instructorName = '') => ({
  instructorName,
  bio: '',
  career: '',
  awards: '',
  classType: '',
  city: '',
  instagram: '',
  kakaoLink: '',
  photoUrl: '',
  title: '',
  titleTouched: false,
  genres: [],
  level: '',
  startDate: '',
  endDate: '',
  startTime: '20:00',
  endTime: '22:00',
  genreMinutes: {},
  location: '',
  fee: '',
  capacity: '',
  description: '',
});

const findInstructorByName = (list, name) => {
  const clean = String(name || '').trim().toLowerCase().replace(/\s+/g, '');
  if (!clean) return null;
  return (
    list.find((i) => i.name.toLowerCase().replace(/\s+/g, '') === clean) ||
    list.find((i) => clean.includes(i.name.toLowerCase().replace(/\s+/g, ''))) ||
    null
  );
};

const profileFieldsFromInstructor = (inst) => ({
  bio: inst?.bio || '',
  career: inst?.career || '',
  awards: inst?.awards != null && inst.awards !== '' ? String(inst.awards) : '',
  classType: inst?.class_type || '',
  city: inst?.city || '',
  instagram: inst?.instagram || '',
  kakaoLink: inst?.kakao_link || '',
  photoUrl: inst?.photo_url || '',
});

const suggestTitle = (genres, level) => {
  if (!genres.length || !level) return '';
  const g = genres.join(' · ');
  return genres.length >= 2 ? `${g} 혼합 ${level}반` : `${g} ${level}반`;
};

const padTimeInput = (raw) => {
  const m = String(raw || '').trim().match(/(\d{1,2}):(\d{2})/);
  if (!m) return '';
  return `${String(Number(m[1])).padStart(2, '0')}:${m[2]}`;
};

const parseGenresFromStored = (genreStr) => {
  const parts = String(genreStr || '')
    .split(/[·,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const fromList = parts.filter((g) => GENRE_LIST.includes(g));
  return fromList.length ? fromList : parts.filter((g) => GENRE_LIST.includes(g));
};

const parseDescriptionFields = (description) => {
  let body = String(description || '').trim();
  const genreMinutes = {};
  const compLine = body.match(/^\[장르 구성\]\s*(.+?)(?:\n|$)/m);
  if (compLine) {
    compLine[1].split('·').forEach((part) => {
      const m = part.trim().match(/^(.+?)\s*(\d+)\s*분/);
      if (m && GENRE_LIST.includes(m[1].trim())) genreMinutes[m[1].trim()] = Number(m[2]);
    });
    body = body.replace(/^\[장르 구성\][^\n]*\n?/, '').trim();
  }
  return { description: body, genreMinutes };
};

const parseScheduleFields = (scheduleStr) => {
  const sched = String(scheduleStr || '');
  const rangeM = sched.match(
    /(\d{4}-\d{2}-\d{2})\s*~\s*(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})~(\d{1,2}:\d{2})/,
  );
  if (rangeM) {
    return {
      startDate: rangeM[1],
      endDate: rangeM[2],
      startTime: padTimeInput(rangeM[3]) || '20:00',
      endTime: padTimeInput(rangeM[4]) || '22:00',
    };
  }
  const singleM = sched.match(/(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})~(\d{1,2}:\d{2})/);
  if (singleM) {
    return {
      startDate: singleM[1],
      endDate: singleM[1],
      startTime: padTimeInput(singleM[2]) || '20:00',
      endTime: padTimeInput(singleM[3]) || '22:00',
    };
  }
  const dateOnly = sched.match(/(\d{4}-\d{2}-\d{2})/)?.[1];
  return {
    startDate: dateOnly || '',
    endDate: dateOnly || '',
    startTime: '20:00',
    endTime: '22:00',
  };
};

const classRowToForm = (row, instructor) => {
  const genres = parseGenresFromStored(row?.genre);
  const { description, genreMinutes } = parseDescriptionFields(row?.description);
  const schedule = parseScheduleFields(row?.schedule);
  const instructorName = row?.instructor_name || instructor?.name || '';
  return {
    ...emptyForm(instructorName),
    ...(instructor ? profileFieldsFromInstructor(instructor) : {}),
    instructorName,
    title: row?.title || '',
    titleTouched: true,
    genres,
    level: row?.level || '',
    ...schedule,
    genreMinutes,
    location: row?.location || '',
    fee: row?.fee != null ? String(row.fee) : '',
    capacity: row?.capacity != null ? String(row.capacity) : '',
    description,
    photoUrl: instructor?.photo_url || '',
  };
};

const parseTimeToMinutes = (hhmm) => {
  if (!hhmm || !hhmm.includes(':')) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
};

const getSessionMinutes = (startTime, endTime) => {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start == null || end == null) return 0;
  let diff = end - start;
  if (diff <= 0) diff += 24 * 60;
  return diff;
};

const formatDurationLabel = (minutes) => {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}시간 ${m}분`;
  if (h) return `${h}시간`;
  return `${m}분`;
};

const chipStyle = (active) => ({
  padding: '12px',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: 700,
  cursor: 'pointer',
  background: active ? '#C9A84C' : 'rgba(255,255,255,0.03)',
  color: active ? '#000' : '#A1A1AA',
  border: `1px solid ${active ? '#C9A84C' : 'rgba(255,255,255,0.08)'}`,
  transition: 'all 0.2s',
});

const ClassRegisterModal = ({
  isOpen = true,
  onClose,
  instructorId = '',
  editClassItem = null,
  onSaved = null,
  isAdminMode = false,
  adminApiSecret = '',
}) => {
  const isEditMode = Boolean(editClassItem?.id);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [instructors, setInstructors] = useState([]);
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [posterRemoved, setPosterRemoved] = useState(false);
  const posterInputRef = useRef(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [doneSummary, setDoneSummary] = useState(null);
  const [form, setForm] = useState(emptyForm());

  const isMixedClass = form.genres.length >= 2;
  const genreLabel = form.genres.join(' · ');
  const sessionMinutes = useMemo(
    () => getSessionMinutes(form.startTime, form.endTime),
    [form.startTime, form.endTime],
  );

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setDoneSummary(null);
      setPosterFile(null);
      setPosterPreview(null);
      setPosterRemoved(false);
      setProfilePhotoFile(null);
      setProfilePhotoPreview(null);
      setForm(emptyForm());
      return;
    }
    const fetchInstructors = async () => {
      try {
        const { data } = await supabase
          .from('instructors')
          .select('id, name, city, bio, career, awards, class_type, genre, instagram, kakao_link, photo_url')
          .eq('status', 'active')
          .order('follower_count', { ascending: false });
        let list = data || [];

        if (isEditMode && editClassItem?.instructor_id) {
          let linked = list.find((i) => i.id === editClassItem.instructor_id);
          if (!linked) {
            const { data: extra } = await supabase
              .from('instructors')
              .select('id, name, city, bio, career, awards, class_type, genre, instagram, kakao_link, photo_url')
              .eq('id', editClassItem.instructor_id)
              .maybeSingle();
            if (extra) {
              linked = extra;
              list = [extra, ...list.filter((i) => i.id !== extra.id)];
            }
          }
          const fallbackInst = linked || (editClassItem.instructors?.name
            ? { id: editClassItem.instructor_id, name: editClassItem.instructors.name }
            : null);
          setInstructors(list);
          setForm(classRowToForm(editClassItem, fallbackInst));
          setPosterPreview(editClassItem.poster_url || null);
          setPosterRemoved(false);
          setPosterFile(null);
          setProfilePhotoFile(null);
          setProfilePhotoPreview(null);
          setStep(1);
          return;
        }

        if (list.length) {
          setInstructors(list);
          if (instructorId) {
            const target = list.find((i) => i.id === instructorId);
            if (target) {
              setForm((prev) => ({
                ...prev,
                instructorName: target.name,
                ...profileFieldsFromInstructor(target),
              }));
            }
          } else {
            setForm((prev) =>
              prev.instructorName ? prev : { ...prev, instructorName: list[0].name },
            );
          }
        }
      } catch (err) {
        console.error('Instructors fetch error:', err);
      }
    };
    fetchInstructors();
  }, [isOpen, instructorId, isEditMode, editClassItem]);

  if (!isOpen) return null;

  const applyTitleSuggestion = (genres, level, titleTouched, currentTitle) => {
    if (titleTouched || !genres.length || !level) return currentTitle;
    return suggestTitle(genres, level);
  };

  const toggleGenre = (genre) => {
    setForm((prev) => {
      const has = prev.genres.includes(genre);
      const genres = has ? prev.genres.filter((g) => g !== genre) : [...prev.genres, genre];
      const genreMinutes = { ...prev.genreMinutes };
      if (!has) genreMinutes[genre] = genreMinutes[genre] || 60;
      else delete genreMinutes[genre];
      return {
        ...prev,
        genres,
        genreMinutes,
        title: applyTitleSuggestion(genres, prev.level, prev.titleTouched, prev.title),
      };
    });
  };

  const applyLatinMix = () => {
    setForm((prev) => {
      const genres = [...LATIN_MIX];
      const genreMinutes = { 바차타: 60, 살사: 60 };
      const level = prev.level || '초급';
      return {
        ...prev,
        genres,
        genreMinutes,
        level,
        title: prev.titleTouched ? prev.title : suggestTitle(genres, level),
      };
    });
  };

  const splitGenreMinutesEvenly = () => {
    const total = sessionMinutes;
    if (!total || !form.genres.length) return;
    const base = Math.floor(total / form.genres.length);
    const remainder = total % form.genres.length;
    const genreMinutes = {};
    form.genres.forEach((g, idx) => {
      genreMinutes[g] = base + (idx === form.genres.length - 1 ? remainder : 0);
    });
    setForm((prev) => ({ ...prev, genreMinutes }));
  };

  const buildGenreCompositionNote = () => {
    if (!isMixedClass) return '';
    const parts = form.genres
      .map((g) => `${g} ${Number(form.genreMinutes[g]) || 0}분`)
      .filter(Boolean);
    if (!parts.length) return '';
    return `[장르 구성] ${parts.join(' · ')}`;
  };

  const buildDescription = () => {
    const note = buildGenreCompositionNote();
    const body = form.description.trim();
    if (!note) return body;
    return body ? `${note}\n\n${body}` : note;
  };

  const buildScheduleText = () => {
    const base =
      form.startDate === form.endDate
        ? `${form.startDate} ${form.startTime}~${form.endTime}`
        : `${form.startDate} ~ ${form.endDate} ${form.startTime}~${form.endTime}`;
    const note = buildGenreCompositionNote();
    return note ? `${base} (${note.replace('[장르 구성] ', '')})` : base;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!form.instructorName.trim()) {
        alert('강사명을 입력해주세요.');
        return;
      }
      if (!form.title.trim()) {
        alert('수업명을 입력해주세요.');
        return;
      }
      if (!form.genres.length) {
        alert('장르를 1개 이상 선택해주세요.');
        return;
      }
      if (!form.level) {
        alert('레벨을 선택해주세요.');
        return;
      }
      if (!form.bio.trim()) {
        alert('강사 BIO(소개)를 입력해주세요. 강사 프로필에 표시됩니다.');
        return;
      }
      if (!form.city.trim()) {
        alert('활동 지역을 선택해주세요.');
        return;
      }
      if (!isEditMode && !profilePhotoFile && !form.photoUrl?.trim()) {
        alert('강사 프로필 사진을 등록해주세요. (필수)');
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!form.startDate || !form.endDate) {
        alert('시작일과 마치는 날을 선택해주세요.');
        return;
      }
      if (form.endDate < form.startDate) {
        alert('마치는 날은 시작일과 같거나 이후여야 합니다.');
        return;
      }
      if (!form.startTime || !form.endTime) {
        alert('시작 시간과 종료 시간을 설정해주세요.');
        return;
      }
      if (isMixedClass && sessionMinutes > 0) {
        const base = Math.floor(sessionMinutes / form.genres.length);
        const remainder = sessionMinutes % form.genres.length;
        const genreMinutes = {};
        form.genres.forEach((g, idx) => {
          genreMinutes[g] = base + (idx === form.genres.length - 1 ? remainder : 0);
        });
        setForm((prev) => ({ ...prev, genreMinutes }));
      }
      setStep(3);
    }
  };

  const handlePrev = () => setStep((s) => Math.max(1, s - 1));

  const handlePosterChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPosterRemoved(false);
    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
  };

  const handlePosterRemove = () => {
    if (posterPreview && String(posterPreview).startsWith('blob:')) {
      URL.revokeObjectURL(posterPreview);
    }
    setPosterFile(null);
    setPosterPreview(null);
    setPosterRemoved(true);
    if (posterInputRef.current) posterInputRef.current.value = '';
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePhotoFile(file);
    setProfilePhotoPreview(URL.createObjectURL(file));
  };

  const profilePhotoDisplaySrc = profilePhotoPreview || form.photoUrl || '';

  const registerAnotherClass = () => {
    const keep = {
      instructorName: form.instructorName,
      bio: form.bio,
      career: form.career,
      awards: form.awards,
      classType: form.classType,
      city: form.city,
      instagram: form.instagram,
      kakaoLink: form.kakaoLink,
      photoUrl: form.photoUrl,
      location: form.location,
      fee: form.fee,
      capacity: form.capacity,
    };
    setForm({ ...emptyForm(keep.instructorName), ...keep });
    setPosterFile(null);
    setPosterPreview(null);
    setDoneSummary(null);
    setStep(1);
  };

  const uploadInstructorProfilePhoto = async (file) => {
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `instructors/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('posters').upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from('posters').getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!form.location.trim()) {
      alert('장소를 입력해주세요.');
      return;
    }
    if (!isEditMode && !posterFile) {
      alert('포스터 이미지를 등록해주세요. (필수)');
      return;
    }
    if (isEditMode && !posterFile && !posterRemoved && !editClassItem?.poster_url) {
      alert('포스터 이미지를 등록해주세요.');
      return;
    }

    setLoading(true);
    try {
      const matchedInst = findInstructorByName(instructors, form.instructorName);
      const targetInstId =
        matchedInst?.id || editClassItem?.instructor_id || instructorId || null;

      if (!targetInstId) {
        alert('등록된 강사명과 일치하는 프로필이 없습니다. 강사명을 확인해주세요.');
        setLoading(false);
        return;
      }

      let photoUrl = form.photoUrl?.trim() || null;
      if (profilePhotoFile) {
        photoUrl = await uploadInstructorProfilePhoto(profilePhotoFile);
      }
      if (!photoUrl && !isEditMode) {
        alert('강사 프로필 사진을 등록해주세요. (필수)');
        setLoading(false);
        return;
      }

      const profilePatch = {
        bio: form.bio.trim(),
        career: form.career.trim() || null,
        awards: form.awards.trim() || null,
        class_type: form.classType || null,
        city: form.city.trim() || null,
        instagram: form.instagram.trim() || null,
        kakao_link: form.kakaoLink.trim() || null,
      };
      if (photoUrl) profilePatch.photo_url = photoUrl;

      const mutateProfile = async () => {
        if (isAdminMode && adminApiSecret) {
          const { data, error } = await adminDbMutate({
            adminSecret: adminApiSecret,
            table: 'instructors',
            action: 'update',
            id: targetInstId,
            payload: profilePatch,
          });
          if (error) throw error;
          return data;
        }
        const { data: updatedProfile, error: profileError } = await supabase
          .from('instructors')
          .update(profilePatch)
          .eq('id', targetInstId)
          .select('id')
          .maybeSingle();
        if (profileError) throw profileError;
        if (!updatedProfile) {
          throw new Error('강사 프로필이 DB에 반영되지 않았습니다. RLS·권한을 확인해 주세요.');
        }
        return updatedProfile;
      };

      await mutateProfile();
      if (photoUrl) setForm((prev) => ({ ...prev, photoUrl }));

      let posterUrl = null;
      if (posterRemoved) {
        posterUrl = null;
      } else if (posterFile) {
        const ext = posterFile.name.split('.').pop();
        const fileName = `classes/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('posters').upload(fileName, posterFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('posters').getPublicUrl(fileName);
        posterUrl = urlData.publicUrl;
      } else if (isEditMode) {
        posterUrl = editClassItem?.poster_url || null;
      }

      const classPayload = {
        instructor_id: targetInstId,
        instructor_name: form.instructorName.trim(),
        title: form.title.trim(),
        genre: genreLabel,
        level: form.level,
        schedule: buildScheduleText(),
        location: form.location.trim(),
        fee: form.fee,
        capacity: form.capacity,
        description: isEditMode
          ? buildDescription()
          : appendLessonPublisherMeta(buildDescription(), LESSON_PUBLISHER.INSTRUCTOR, targetInstId),
        poster_url: posterUrl,
      };

      if (isEditMode) {
        if (isAdminMode && adminApiSecret) {
          const { data, error } = await adminDbMutate({
            adminSecret: adminApiSecret,
            table: 'instructor_classes',
            action: 'update',
            id: editClassItem.id,
            payload: classPayload,
          });
          if (error) throw error;
          if (!data) {
            throw new Error('클래스 수정이 DB에 반영되지 않았습니다.');
          }
        } else {
          const { data: updatedClass, error } = await supabase
            .from('instructor_classes')
            .update(classPayload)
            .eq('id', editClassItem.id)
            .select()
            .maybeSingle();
          if (error) throw error;
          if (!updatedClass) {
            throw new Error('클래스 수정이 DB에 반영되지 않았습니다. ID·RLS 권한을 확인해 주세요.');
          }
        }
      } else {
        const { data: insertedClass, error } = await supabase
          .from('instructor_classes')
          .insert({ ...classPayload, status: 'active' })
          .select('id')
          .maybeSingle();
        if (error) throw error;
        if (!insertedClass) {
          throw new Error('클래스 등록이 DB에 반영되지 않았습니다.');
        }
      }

      setDoneSummary({
        title: form.title.trim(),
        genre: genreLabel,
        schedule: buildScheduleText(),
        location: form.location.trim(),
      });
      setStep('done');
      if (isEditMode) onSaved?.();
      else window.dispatchEvent(new CustomEvent('apply-instructor-filter'));
    } catch (err) {
      console.error('Class insert error:', err);
      alert(`등록 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z.modal,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{
          background: '#121212',
          border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '440px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div style={{ fontSize: '18px', fontWeight: 900 }}>
              {isEditMode ? '강사 수업 수정 ✏️' : '강사 수업 등록 👑'}
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: 600 }}>
              VIP 강사 전용 · BAR 수업과 별도로 저장됩니다
            </div>
            <div
              style={{
                fontSize: '13px',
                color: '#C9A84C',
                fontWeight: 800,
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ opacity: step === 1 ? 1 : 0.3 }}>① 기본 정보</span>
              <span style={{ color: '#444' }}>›</span>
              <span style={{ opacity: step === 2 ? 1 : 0.3 }}>② 일정</span>
              <span style={{ color: '#444' }}>›</span>
              <span style={{ opacity: step === 3 ? 1 : 0.3 }}>③ 장소/가격</span>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#8E8E93', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.05)' }}>
          <motion.div
            animate={{ width: `${step === 'done' ? 100 : (Number(step) / 3) * 100}%` }}
            transition={{ duration: 0.3 }}
            style={{ height: '100%', background: '#C9A84C' }}
          />
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          <AnimatePresence mode="wait">
            {step === 'done' && doneSummary ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '12px 0 8px' }}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
                <div style={{ fontSize: '20px', fontWeight: 900, marginBottom: '8px' }}>
                  {isEditMode ? '수정 완료!' : '등록 완료!'}
                </div>
                <div style={{ fontSize: '13px', color: '#A1A1AA', lineHeight: 1.6, marginBottom: '20px' }}>
                  {isEditMode ? '강사 프로필 CLASSES 탭에 반영됩니다.' : '마스터 리스트에 바로 노출됩니다.'}
                </div>
                <div
                  style={{
                    textAlign: 'left',
                    background: 'rgba(201,168,76,0.08)',
                    border: '1px solid rgba(201,168,76,0.25)',
                    borderRadius: '16px',
                    padding: '16px',
                    fontSize: '13px',
                    lineHeight: 1.7,
                    marginBottom: '20px',
                  }}
                >
                  <div style={{ fontWeight: 800, color: '#C9A84C', marginBottom: '6px' }}>{doneSummary.title}</div>
                  <div>{doneSummary.genre}</div>
                  <div style={{ color: '#94A3B8' }}>{doneSummary.schedule}</div>
                  <div style={{ color: '#94A3B8' }}>{doneSummary.location}</div>
                </div>
                {!isEditMode ? (
                  <button
                    type="button"
                    onClick={registerAnotherClass}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      background: '#C9A84C',
                      color: '#000',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Plus size={16} /> 다른 장르 클래스도 등록
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#fff',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  닫기
                </button>
              </motion.div>
            ) : null}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
              >
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#A1A1AA', marginBottom: '8px' }}>
                    <User size={14} /> 강사명 (직접 입력) *
                  </label>
                  <input
                    type="text"
                    value={form.instructorName}
                    onChange={(e) => {
                      const instructorName = e.target.value;
                      const matched = findInstructorByName(instructors, instructorName);
                      setProfilePhotoFile(null);
                      setProfilePhotoPreview(null);
                      setForm((prev) => ({
                        ...prev,
                        instructorName,
                        ...(matched ? profileFieldsFromInstructor(matched) : { photoUrl: '' }),
                      }));
                    }}
                    placeholder="예: 남궁건 & 클레어"
                    style={inputStyle}
                  />
                </div>

                <div
                  style={{
                    padding: '14px',
                    borderRadius: '14px',
                    background: 'rgba(201,168,76,0.06)',
                    border: '1px solid rgba(201,168,76,0.22)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: '#C9A84C', marginBottom: '4px' }}>
                      강사 BIO (프로필에 표시) *
                    </div>
                    <p style={{ margin: 0, fontSize: '11px', color: '#8E8E93', lineHeight: 1.45 }}>
                      TOP 5 · 프로필 상단 · BIO 탭에 노출됩니다.
                    </p>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#A1A1AA', marginBottom: '8px' }}>
                      프로필 사진 (필수)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <label style={{ cursor: 'pointer', flexShrink: 0 }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePhotoChange}
                          style={{ display: 'none' }}
                        />
                        <div
                          style={{
                            width: '88px',
                            height: '88px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: '2px dashed rgba(201,168,76,0.45)',
                            background: 'rgba(255,255,255,0.04)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {profilePhotoDisplaySrc ? (
                            <img
                              src={profilePhotoDisplaySrc}
                              alt="프로필 미리보기"
                              onError={imgFallbackHandler(DEFAULT_CARD_IMAGE)}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <Camera size={28} color="#C9A84C" />
                          )}
                        </div>
                      </label>
                      <div style={{ fontSize: '11px', color: '#8E8E93', lineHeight: 1.5 }}>
                        <div style={{ fontWeight: 700, color: '#E5E5EA', marginBottom: '4px' }}>탭하여 사진 선택</div>
                        정면·상반신 권장 · JPG/PNG
                      </div>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#A1A1AA', marginBottom: '6px' }}>
                      활동 지역 *
                    </label>
                    <select
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      style={{ ...inputStyle, padding: '12px' }}
                    >
                      <option value="">지역 선택</option>
                      {CITY_OPTIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#A1A1AA', marginBottom: '6px' }}>
                      한 줄 소개 (BIO) *
                    </label>
                    <textarea
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      placeholder="예: 바차타·살사 전문, 국내외 대회 수상, 초급부터 센슈얼까지"
                      rows={3}
                      style={{ ...inputStyle, resize: 'none', minHeight: '72px' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#A1A1AA', marginBottom: '6px' }}>
                        경력
                      </label>
                      <input
                        type="text"
                        value={form.career}
                        onChange={(e) => setForm({ ...form, career: e.target.value })}
                        placeholder="예: 10년"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#A1A1AA', marginBottom: '6px' }}>
                        수상
                      </label>
                      <input
                        type="text"
                        value={form.awards}
                        onChange={(e) => setForm({ ...form, awards: e.target.value })}
                        placeholder="예: 3회"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#A1A1AA', marginBottom: '6px' }}>
                      수업방식
                    </label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {CLASS_TYPES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setForm({ ...form, classType: form.classType === t ? '' : t })}
                          style={chipStyle(form.classType === t)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#A1A1AA', marginBottom: '6px' }}>
                      인스타그램
                    </label>
                    <input
                      type="text"
                      value={form.instagram}
                      onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                      placeholder="@아이디 또는 프로필 URL"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#A1A1AA', marginBottom: '6px' }}>
                      <MessageCircle size={13} /> 카카오톡 (오픈채팅)
                    </label>
                    <input
                      type="url"
                      value={form.kakaoLink}
                      onChange={(e) => setForm({ ...form, kakaoLink: e.target.value })}
                      placeholder="https://open.kakao.com/..."
                      style={inputStyle}
                    />
                    <p style={{ margin: '6px 0 0', fontSize: '10px', color: '#8E8E93', lineHeight: 1.4 }}>
                      프로필 BIO 탭 · 수업 문의 버튼에 연결됩니다.
                    </p>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#A1A1AA', marginBottom: '8px' }}>
                    수업명 *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value, titleTouched: true })}
                    placeholder={form.genres.length ? suggestTitle(form.genres, form.level || '초급') : '예: 바차타 센슈얼 초급반'}
                    style={inputStyle}
                  />
                  {!form.titleTouched && form.genres.length && form.level ? (
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          title: suggestTitle(prev.genres, prev.level),
                        }))
                      }
                      style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px dashed rgba(201,168,76,0.45)',
                        background: 'transparent',
                        color: '#C9A84C',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        width: '100%',
                      }}
                    >
                      ✨ 추천 수업명 넣기: {suggestTitle(form.genres, form.level)}
                    </button>
                  ) : null}
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#A1A1AA', margin: 0 }}>
                      장르 선택 * <span style={{ color: '#8E8E93', fontWeight: 600 }}>(여러 개 가능)</span>
                    </label>
                    <button
                      type="button"
                      onClick={applyLatinMix}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '999px',
                        border: '1px solid rgba(201,168,76,0.35)',
                        background: 'rgba(201,168,76,0.1)',
                        color: '#C9A84C',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ⚡ 바차타+살사
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {GENRE_LIST.map((g) => (
                      <button key={g} type="button" onClick={() => toggleGenre(g)} style={chipStyle(form.genres.includes(g))}>
                        {form.genres.includes(g) ? `✓ ${g}` : g}
                      </button>
                    ))}
                  </div>
                  {form.genres.length ? (
                    <div
                      style={{
                        marginTop: '10px',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: isMixedClass ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isMixedClass ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        fontSize: '12px',
                        fontWeight: 700,
                        color: isMixedClass ? '#C9A84C' : '#A1A1AA',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {isMixedClass ? <Sparkles size={14} /> : null}
                      {isMixedClass ? `혼합 클래스 · ${genreLabel}` : `선택: ${genreLabel}`}
                    </div>
                  ) : null}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#A1A1AA', marginBottom: '8px' }}>
                    레벨 선택 *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {['초급', '중급', '상급'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            level: lvl,
                            title: applyTitleSuggestion(prev.genres, lvl, prev.titleTouched, prev.title),
                          }))
                        }
                        style={chipStyle(form.level === lvl)}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
              >
                {isMixedClass ? (
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: 'rgba(201,168,76,0.08)',
                      border: '1px solid rgba(201,168,76,0.22)',
                      fontSize: '12px',
                      color: '#C9A84C',
                      fontWeight: 700,
                      lineHeight: 1.5,
                    }}
                  >
                    ✨ 혼합 수업이에요. 시간만 정하면 장르 시간은 <strong>반반 나누기</strong>로 자동 맞춰 드릴게요.
                  </div>
                ) : null}

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#A1A1AA', marginBottom: '8px' }}>
                    <Calendar size={14} /> 날짜 선택 *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', color: '#8E8E93', fontWeight: 700, marginBottom: '6px' }}>시작날</div>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => {
                          const startDate = e.target.value;
                          setForm((prev) => ({
                            ...prev,
                            startDate,
                            endDate: !prev.endDate || prev.endDate < startDate ? startDate : prev.endDate,
                          }));
                        }}
                        style={{ ...inputStyle, padding: '12px', colorScheme: 'dark' }}
                      />
                    </div>
                    <span style={{ color: '#8E8E93', fontWeight: 900, marginTop: '18px' }}>~</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', color: '#8E8E93', fontWeight: 700, marginBottom: '6px' }}>마치는날</div>
                      <input
                        type="date"
                        value={form.endDate}
                        min={form.startDate || undefined}
                        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                        style={{ ...inputStyle, padding: '12px', colorScheme: 'dark' }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#A1A1AA', marginBottom: '8px' }}>
                    <Clock size={14} /> 시간대 설정 *
                    {sessionMinutes > 0 ? (
                      <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#C9A84C' }}>
                        총 {formatDurationLabel(sessionMinutes)}
                      </span>
                    ) : null}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      style={{ ...inputStyle, flex: 1, padding: '12px', colorScheme: 'dark' }}
                    />
                    <span style={{ color: '#8E8E93', fontWeight: 900 }}>~</span>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      style={{ ...inputStyle, flex: 1, padding: '12px', colorScheme: 'dark' }}
                    />
                  </div>

                  <div style={{ marginTop: '14px' }}>
                    <div style={{ fontSize: '11px', color: '#8E8E93', fontWeight: 700, marginBottom: '6px' }}>
                      ⚡ 원터치 시간대 (클릭 한 번)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {[
                        { label: '🌞 주말 오후 (14~16시)', start: '14:00', end: '16:00' },
                        { label: '🌆 퇴근 직후 (19~21시)', start: '19:00', end: '21:00' },
                        { label: '⭐ 황금 시간 (20~22시)', start: '20:00', end: '22:00' },
                        { label: '🌙 심야 (21~23시)', start: '21:00', end: '23:00' },
                      ].map((preset) => {
                        const isSelected = form.startTime === preset.start && form.endTime === preset.end;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setForm({ ...form, startTime: preset.start, endTime: preset.end })}
                            style={{
                              padding: '10px',
                              borderRadius: '10px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              background: isSelected ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.02)',
                              color: isSelected ? '#C9A84C' : '#A1A1AA',
                              border: `1px solid ${isSelected ? '#C9A84C' : 'rgba(255,255,255,0.05)'}`,
                              textAlign: 'center',
                              lineHeight: 1.3,
                            }}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {isMixedClass ? (
                    <div
                      style={{
                        marginTop: '4px',
                        padding: '14px',
                        borderRadius: '14px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#E5E5EA' }}>장르별 시간 (선택)</span>
                        <button
                          type="button"
                          onClick={splitGenreMinutesEvenly}
                          disabled={!sessionMinutes}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: 'none',
                            background: sessionMinutes ? '#C9A84C' : '#444',
                            color: sessionMinutes ? '#000' : '#888',
                            fontSize: '11px',
                            fontWeight: 900,
                            cursor: sessionMinutes ? 'pointer' : 'not-allowed',
                          }}
                        >
                          ⚡ 반반 나누기
                        </button>
                      </div>
                      {form.genres.map((g) => (
                        <div key={g} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ flex: 1, fontSize: '13px', fontWeight: 700, color: '#C9A84C' }}>{g}</span>
                          <input
                            type="number"
                            min={15}
                            max={300}
                            step={15}
                            value={form.genreMinutes[g] ?? ''}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                genreMinutes: { ...prev.genreMinutes, [g]: Number(e.target.value) || 0 },
                              }))
                            }
                            style={{
                              width: '72px',
                              padding: '8px',
                              borderRadius: '8px',
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.12)',
                              color: '#fff',
                              fontSize: '14px',
                              textAlign: 'center',
                            }}
                          />
                          <span style={{ fontSize: '12px', color: '#8E8E93' }}>분</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '14px',
                    background: 'rgba(201,168,76,0.06)',
                    border: '1px solid rgba(201,168,76,0.2)',
                    fontSize: '12px',
                    lineHeight: 1.6,
                  }}
                >
                  <div style={{ fontWeight: 900, color: '#fff', marginBottom: '4px' }}>{form.title || '수업명'}</div>
                  <div style={{ color: '#C9A84C', fontWeight: 700 }}>{genreLabel || '장르'} · {form.level || '레벨'}</div>
                  <div style={{ color: '#94A3B8', marginTop: '4px' }}>
                    {form.startDate && form.endDate
                      ? `${form.startDate}${form.startDate !== form.endDate ? ` ~ ${form.endDate}` : ''} · ${form.startTime}~${form.endTime}`
                      : '일정 입력 중'}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#A1A1AA', marginBottom: '8px' }}>
                    <MapPin size={14} /> 장소 입력 *
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="예: 서울 강남구 댄스스튜디오"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#A1A1AA', marginBottom: '8px' }}>
                    <DollarSign size={14} /> 가격 입력
                  </label>
                  <input
                    type="text"
                    value={form.fee}
                    onChange={(e) => setForm({ ...form, fee: e.target.value })}
                    placeholder="예: 4회 12만원"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#A1A1AA', marginBottom: '8px' }}>
                    <Users size={14} /> 정원 입력
                  </label>
                  <input
                    type="text"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    placeholder="예: 20명 선착순"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#A1A1AA', marginBottom: '8px' }}>
                    <Info size={14} /> 설명 입력
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="커리큘럼, 준비물 및 안내사항"
                    rows={3}
                    style={{ ...inputStyle, resize: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#A1A1AA', marginBottom: '8px' }}>
                    포스터 이미지 {isEditMode ? '(교체 시 선택)' : '(필수)'}
                  </label>
                  <input
                    ref={posterInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePosterChange}
                    style={{ ...inputStyle, padding: '12px', fontSize: '13px' }}
                  />
                  {posterPreview ? (
                    <div style={{ position: 'relative', marginTop: '10px' }}>
                      <img
                        src={posterPreview}
                        alt="포스터 미리보기"
                        style={{ width: '100%', borderRadius: '12px', maxHeight: '200px', objectFit: 'cover', display: 'block' }}
                      />
                      <button
                        type="button"
                        onClick={handlePosterRemove}
                        aria-label="포스터 삭제"
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'rgba(0,0,0,0.72)',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={14} /> 삭제
                      </button>
                    </div>
                  ) : posterRemoved && isEditMode ? (
                    <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#8E8E93' }}>
                      포스터가 삭제됩니다. 저장하면 이미지가 제거됩니다.
                    </p>
                  ) : null}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {step !== 'done' ? (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              background: '#171717',
              display: 'flex',
              gap: '12px',
            }}
          >
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                이전
              </button>
            ) : null}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                style={{
                  flex: 2,
                  padding: '14px',
                  borderRadius: '12px',
                  background: '#C9A84C',
                  color: '#000',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                다음 단계
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  flex: 2,
                  padding: '14px',
                  borderRadius: '12px',
                  background: '#C9A84C',
                  color: '#000',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading
                  ? isEditMode
                    ? '저장 중...'
                    : '등록 중...'
                  : isEditMode
                    ? '수정 저장 ✓'
                    : '클래스 최종 등록 🚀'}
              </button>
            )}
          </div>
        ) : null}
      </motion.div>
    </div>
  );
};

export default ClassRegisterModal;
