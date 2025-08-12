"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Setlist, Song } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface AppContextType {
  setlists: Setlist[];
  addSetlist: (name: string) => void;
  updateSetlist: (setlistId: string, updatedSetlist: Partial<Setlist>) => void;
  deleteSetlist: (setlistId: string) => void;
  activeSetlist: Setlist | null;
  setActiveSetlistId: (id: string | null) => void;
  addSong: (setlistId: string, song: Omit<Song, 'id' | 'transpose' | 'scrollSpeed'>) => void;
  updateSong: (setlistId: string, songId: string, updatedSong: Partial<Song>) => void;
  deleteSong: (setlistId: string, songId: string) => void;
  activeSong: Song | null;
  setActiveSongId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultSetlists: Setlist[] = [
    {
        id: '1',
        name: 'Acoustic Gig',
        songs: [
            { id: 's1', title: 'Wonderwall', artist: 'Oasis', lyricsWithChords: "[Em]Today is gonna be the day that they're gonna throw it back to you\n[G]By now you should've somehow realized what you gotta do\n[D]I don't believe that anybody feels the way I do\n[A]About you now", transpose: 0, scrollSpeed: 20 },
            { id: 's2', title: 'Creep', artist: 'Radiohead', lyricsWithChords: "[G]When you were here before\n[B]Couldn't look you in the eye\n[C]You're just like an angel\n[Cm]Your skin makes me cry", transpose: 0, scrollSpeed: 15 },
        ]
    }
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [setlists, setSetlists] = useLocalStorage<Setlist[]>('setlists', defaultSetlists);
  const [activeSetlistId, setActiveSetlistId] = useState<string | null>(null);
  const [activeSongId, setActiveSongId] = useState<string | null>(null);

  const addSetlist = (name: string) => {
    const newSetlist: Setlist = {
      id: Date.now().toString(),
      name,
      songs: [],
    };
    setSetlists([...setlists, newSetlist]);
  };

  const updateSetlist = (setlistId: string, updatedSetlist: Partial<Setlist>) => {
    setSetlists(setlists.map(s => s.id === setlistId ? { ...s, ...updatedSetlist } : s));
  };
  
  const deleteSetlist = (setlistId: string) => {
    setSetlists(setlists.filter(s => s.id !== setlistId));
    if (activeSetlistId === setlistId) {
      setActiveSetlistId(null);
      setActiveSongId(null);
    }
  };

  const addSong = (setlistId: string, songData: Omit<Song, 'id' | 'transpose' | 'scrollSpeed'>) => {
    const newSong: Song = {
      ...songData,
      id: Date.now().toString(),
      transpose: 0,
      scrollSpeed: 20,
    };
    const updatedSetlists = setlists.map(s => {
      if (s.id === setlistId) {
        return { ...s, songs: [...s.songs, newSong] };
      }
      return s;
    });
    setSetlists(updatedSetlists);
  };

  const updateSong = (setlistId: string, songId: string, updatedSong: Partial<Song>) => {
    const updatedSetlists = setlists.map(s => {
      if (s.id === setlistId) {
        const songs = s.songs.map(song => song.id === songId ? { ...song, ...updatedSong } : song);
        return { ...s, songs };
      }
      return s;
    });
    setSetlists(updatedSetlists);
  };
  
  const deleteSong = (setlistId: string, songId: string) => {
    setSetlists(setlists.map(s => {
      if (s.id === setlistId) {
        return { ...s, songs: s.songs.filter(song => song.id !== songId) };
      }
      return s;
    }));
     if (activeSongId === songId) {
      setActiveSongId(null);
    }
  };

  const activeSetlist = setlists.find(s => s.id === activeSetlistId) || null;
  const activeSong = activeSetlist?.songs.find(s => s.id === activeSongId) || null;

  const value = {
    setlists,
    addSetlist,
    updateSetlist,
    deleteSetlist,
    activeSetlist,
    setActiveSetlistId: (id: string | null) => {
      setActiveSetlistId(id);
      setActiveSongId(null);
    },
    addSong,
    updateSong,
    deleteSong,
    activeSong,
    setActiveSongId,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
