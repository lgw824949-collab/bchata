import type { LucideIcon } from 'lucide-react';

export type HomeDarkHeroSlide = {
  id: string;
  kind: 'social' | 'bootcamp' | 'festival' | 'party' | 'venueLesson';
  poster_url: string;
  title: string;
  venue: string;
  start_time?: string;
  date_label?: string;
  subtitleKo: string;
  subtitleEn: string;
  raw: unknown;
};

export type HomeDarkParty = {
  id: string | number;
  poster_url?: string;
  title?: string;
  locationName?: string;
  location_name?: string;
  venue?: string;
  start_time?: string;
  time?: string;
  date?: string;
  fee?: string;
  region?: string;
  broadRegion?: string;
};

export type HomeDarkInstructor = {
  id: string | number;
  name?: string;
  genre?: unknown;
  photo_url?: string;
};

export type HomeDarkBar = {
  id: string | number;
  name?: string;
  image_url?: string;
  address?: string;
  region?: string;
};

export type HomeDarkRegionPill = {
  id: string;
  labelKo: string;
  labelEn: string;
};

export type HomeDarkMoreAction = {
  id: string;
  labelKo: string;
  labelEn: string;
  icon: LucideIcon;
  tier?: 'primary' | 'secondary';
  badge?: string;
  onClick: () => void;
};

export type HomeDarkQuickMenuItem = {
  id: string;
  emoji: string;
  labelKo: string;
  labelEn: string;
  onClick: () => void;
};
