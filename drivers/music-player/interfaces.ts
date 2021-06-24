/* eslint-disable node/no-unsupported-features/es-syntax */
export const POLLING_INTERVAL = 15000;
export const ARTISTS_URL = 'artists://';
export const ALBUMS_URL = 'albums://';
export const GENRES_URL = 'genres://';
export const FAVOURITES_URL = 'favourites';

export interface IQueueItem {
  uri: string;
  title: string;
  service?: string;
  artist?: string;
  album?: string;
  type?: string;
  tracknumber?: number;
  duration?: number;
  trackType?: string;
}

/* eslint-disable node/no-unsupported-features/es-syntax */
export interface IPushNotificationStateData {
  status: string;
  position: number;
  title: string;
  artist: string;
  album: string;
  albumart: string;
  uri: string;
  trackType: string;
  seek: number;
  duration: number;
  samplerate: string;
  bitdepth: string;
  channels: number;
  random: boolean;
  repeat: boolean;
  repeatSingle: boolean;
  consume: boolean;
  volume: number;
  disableVolumeControl: boolean;
  mute: boolean;
  stream: string;
  updatedb: boolean;
  volatile: boolean;
  service: string;
}

/* eslint-disable node/no-unsupported-features/es-syntax */
export interface IPlayerState {
  status: string;
  position: number;
  title: string;
  artist: string;
  album: string;
  albumart: string;
  uri: string;
  trackType: string;
  seek: number;
  duration: number;
  random: boolean;
  repeat: boolean;
  repeatSingle: boolean;
  volume: number;
  mute: boolean;
  stream: boolean;
  updatedb: boolean;
  volatile: boolean;
  service: string;
}

export interface ISearchResultItem {
  service: string;
  type?: string; // song / folder / webradio
  title: string;
  artist?: string;
  album?: string;
  year?: string; // Bij albums. Bevat soms jaar, soms complete datum incl. tijdstip...
  uri: string; // artists://... => artiest = ..., albums..., genres...
  icon?: string;
  albumart: string;
}

export interface ISearchResultList {
  type?: string;
  icon?: string;
  title: string;
  availableListViews: string[];
  items: ISearchResultItem[];
}

/* eslint-disable node/no-unsupported-features/es-syntax */
export interface ISearchResult {
  navigation: {
    isSearchResult: boolean;
    lists: ISearchResultList[];
  };
}

/* eslint-disable node/no-unsupported-features/es-syntax */
export interface ICollectionStats {
  artists: string;
  albums: string;
  songs: string;
  playtime: string;
}

/* eslint-disable node/no-unsupported-features/es-syntax */
export interface ISystemInfo {
  id: string;
  host: string;
  name: string;
  type: string;
  serviceName: string;
  state: {
    status: string;
    volume: number;
    mute: boolean;
    artist: string;
    track: string;
    albumart: string;
  };
  systemversion: string;
  builddate: string;
  variant: string;
  hardware: string;
}

export interface IVolumioMusicPlayerDevice {
  tinyarturi(artist: string): string;
  play(): Promise<void>;
  toggle(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
  shuffle(value: boolean): Promise<void>;
  repeat(value: boolean): Promise<void>;
  setVolume(value: number): Promise<void>;
  increaseVolume(): Promise<void>;
  decreaseVolume(): Promise<void>;
  mute(): Promise<void>;
  unmute(): Promise<void>;
  playPlayList(title: string): Promise<void>;
  clearQueue(): Promise<void>;
  replaceAndPlay(parameters: { items: IQueueItem[]; startAt?: number }): Promise<void>;
  addToQueue(item: IQueueItem | IQueueItem[]): Promise<void>;
  listPlayLists(): Promise<string[]>;
  browse(uri: string): Promise<ISearchResult>;
  searchFor(wildcard: string): Promise<ISearchResult>;
  promoteState(data: IPlayerState): Promise<void>;
  getCollectionStats(): Promise<ICollectionStats>;
  getSystemInfo(): Promise<ISystemInfo>;
}
