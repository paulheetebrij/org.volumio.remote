/* eslint-disable node/no-unsupported-features/es-syntax */
/**
 * Wachttijd in milliseconden => 4 minuten. Als Volumio in de tussentijd geen bericht heeft verzonden, dan checkt app status Volumio
 * @type {number}
 * @internal
 */
export const POLLING_INTERVAL = 4 * 60 * 1000;
/**
 * @type {number}
 * @internal
 */
export const ARTISTS_URL = 'artists://';
/**
 * @type {number}
 * @internal
 */
export const ALBUMS_URL = 'albums://';
/**
 * @type {number}
 * @internal
 */
export const GENRES_URL = 'genres://';
/**
 * @type {number}
 * @internal
 */
export const FAVOURITES_URL = 'favourites';
/**
 * @type {number}
 * @internal
 */
export const WEBRADIOSTATION_FAVOURITES = 'radio/favourites';

/**
 * @interface
 * @property {string} uri
 * @property {string} title
 * @property {string} [service]
 * @property {string} [artist]
 * @property {string} [album]
 * @property {string} [type]
 * @property {string} [tracknumber]
 * @property {string} [duration]
 * @property {string} [trackType]
 */
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

/**
 * @interface
 * @property {string} status
 * @property {number} position
 * @property {string} title
 * @property {string} artist
 * @property {string} album
 * @property {string} albumart
 * @property {string} uri
 * @property {string} trackType
 * @property {number} seek
 * @property {number} duration
 * @property {string} samplerate
 * @property {string} bitdepth
 * @property {number} channels
 * @property {boolean} random
 * @property {boolean} repeat
 * @property {boolean} repeatSingle
 * @property {boolean} consume
 * @property {number} volume
 * @property {boolean} disableVolumeControl
 * @property {boolean} mute
 * @property {string} stream
 * @property {boolean} updatedb
 * @property {boolean} volatile
 * @property {string} service
 */
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

/**
 * @interface
 * @property {string} status
 * @property {number} position
 * @property {string} title
 * @property {string} artist
 * @property {string} album
 * @property {string} albumart
 * @property {string} uri
 * @property {string} trackType
 * @property {number} seek
 * @property {number} duration
 * @property {boolean} random
 * @property {boolean} repeat
 * @property {boolean} repeatSingle
 * @property {number} volume
 * @property {boolean} mute
 * @property {string} stream
 * @property {boolean} updatedb
 * @property {boolean} volatile
 * @property {string} service
 */
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
  stream: string;
  updatedb: boolean;
  volatile: boolean;
  service: string;
}

/**
 * @interface
 * @property {string} service
 * @property {string} [type] song / folder / webradio
 * @property {string} title
 * @property {string} [artist]
 * @property {string} [album]
 * @property {string} [year]
 * @property {string} uri
 * @property {string} [icon]
 * @property {string} albumart
 */
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

/**
 * @interface
 * @property {string} [type]
 * @property {string} [icon]
 * @property {string} title
 * @property {string[]} availableListViews
 * @property {ISearchResultItem[]} items
 */
export interface ISearchResultList {
  type?: string;
  icon?: string;
  title: string;
  availableListViews: string[];
  items: ISearchResultItem[];
}

/**
 * @interface
 * @property {boolean} isSearchResult
 * @property {ISearchResultList[]} lists
 */
export interface ISearchResult {
  navigation: {
    isSearchResult: boolean;
    lists: ISearchResultList[];
  };
}

/**
 * @interface
 * @property {string} artists
 * @property {string} albums
 * @property {string} songs
 * @property {string} playtime
 */
export interface ICollectionStats {
  artists: string;
  albums: string;
  songs: string;
  playtime: string;
}

/**
 * @interface
 * @property {string} id
 * @property {string} host
 * @property {string} name
 * @property {string} type
 * @property {string} serviceName
 * @property {object} state
 * @property {string} state.status
 * @property {number} state.volume
 * @property {boolean} state.mute
 * @property {string} state.artist
 * @property {string} state.track
 * @property {string} state.albumart
 * @property {string} systemversion
 * @property {string} builddate
 * @property {string} variant
 * @property {string} hardware
 */
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

/**
 * @interface
 * @property {function} tinyarturi
 * @property {function} play
 * @property {function} toggle
 * @property {function} pause
 * @property {function} stop
 * @property {function} next
 * @property {function} previous
 * @property {function} shuffle
 * @property {function} repeat
 * @property {function} setVolume
 * @property {function} increaseVolume
 * @property {function} decreaseVolume
 * @property {function} mute
 * @property {function} unmute
 * @property {function} playPlayList
 * @property {function} clearQueue
 * @property {function} replaceAndPlay
 * @property {function} addToQueue
 * @property {function} listPlayLists
 * @property {function} browse
 * @property {function} searchFor
 * @property {function} promoteState
 * @property {function} getCollectionStats
 * @property {function} getSystemInfo
 */
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
