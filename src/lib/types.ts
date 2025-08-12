export interface Song {
  id: string;
  title: string;
  artist: string;
  lyricsWithChords: string;
  transpose: number;
  scrollSpeed: number;
}

export interface Setlist {
  id: string;
  name: string;
  songs: Song[];
}
