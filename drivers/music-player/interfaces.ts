export interface IPlayerState {
  status: string,
  position: number,
  title: string,
  artist: string,
  album: string,
  albumart: string,
  uri: string,
  trackType: string,
  seek: number,
  duration: number,
  random: boolean,
  repeat: boolean,
  repeatSingle: boolean,
  volume: number,
  mute: boolean,
  stream: boolean,
  updatedb: boolean,
  volatile: boolean,
  service: string,
};

export interface IDeviceCapabilities {
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
  isPlaying(): Promise<boolean>;
  playList(title: string): Promise<void>;
}