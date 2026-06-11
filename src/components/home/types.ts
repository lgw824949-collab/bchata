export type HomeDarkHeroSlide = {
  id: string;
  kind: 'social' | 'bootcamp' | 'festival' | 'party';
  poster_url: string;
  title: string;
  venue: string;
  start_time?: string;
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
