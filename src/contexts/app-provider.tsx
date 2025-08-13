
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Setlist, Song } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  setlists: Setlist[];
  addSetlist: (name: string) => void;
  updateSetlist: (setlistId: string, updatedSetlist: Partial<Setlist>) => void;
  deleteSetlist: (setlistId: string) => void;
  activeSetlist: Setlist | null;
  setActiveSetlistId: (id: string | null) => void;
  activeSetlistId: string | null;
  addSong: (setlistId: string, song: Omit<Song, 'id' | 'transpose' | 'scrollSpeed'>) => void;
  updateSong: (setlistId: string, songId: string, updatedSong: Partial<Song>) => void;
  deleteSong: (setlistId: string, songId: string) => void;
  activeSong: Song | null;
  setActiveSongId: (id: string | null) => void;
  activeSongId: string | null;
  importSetlists: (importedSetlists: Setlist[]) => void;
  reorderSongs: (setlistId: string, songs: Song[]) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultSetlists: Setlist[] = [];

export function AppProvider({ children }: { children: ReactNode }) {
  const [setlists, setSetlists] = useLocalStorage<Setlist[]>('setlists', defaultSetlists);
  const [activeSetlistId, setActiveSetlistId] = useLocalStorage<string | null>('activeSetlistId', null);
  const [activeSongId, setActiveSongId] = useLocalStorage<string | null>('activeSongId', null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // When the component mounts, the useLocalStorage hook will have read the initial value.
    // We can now safely set isLoading to false.
    setIsLoading(false);
  }, []);
  
  const handleSetActiveSetlistId = useCallback((id: string | null) => {
    setActiveSetlistId(id);
    setActiveSongId(null);
  }, [setActiveSetlistId, setActiveSongId]);

  const addSetlist = (name: string) => {
    const newSetlist: Setlist = {
      id: Date.now().toString(),
      name,
      songs: [],
    };
    setSetlists(prev => [...prev, newSetlist]);
  };

  const updateSetlist = (setlistId: string, updatedSetlist: Partial<Setlist>) => {
    setSetlists(prev => prev.map(s => s.id === setlistId ? { ...s, ...updatedSetlist } : s));
  };
  
  const deleteSetlist = (setlistId: string) => {
    setSetlists(prev => prev.filter(s => s.id !== setlistId));
    if (activeSetlistId === setlistId) {
      handleSetActiveSetlistId(null);
    }
  };

  const addSong = (setlistId: string, songData: Omit<Song, 'id' | 'transpose' | 'scrollSpeed'>) => {
    const newSong: Song = {
      ...songData,
      id: Date.now().toString(),
      transpose: 0,
      scrollSpeed: 20,
    };
    setSetlists(prev => prev.map(s => {
      if (s.id === setlistId) {
        return { ...s, songs: [...s.songs, newSong] };
      }
      return s;
    }));
  };

  const updateSong = (setlistId: string, songId: string, updatedSong: Partial<Song>) => {
    setSetlists(prev => prev.map(s => {
      if (s.id === setlistId) {
        const songs = s.songs.map(song => song.id === songId ? { ...song, ...updatedSong } : song);
        return { ...s, songs };
      }
      return s;
    }));
  };
  
  const deleteSong = (setlistId: string, songId: string) => {
    setSetlists(prev => prev.map(s => {
      if (s.id === setlistId) {
        return { ...s, songs: s.songs.filter(song => song.id !== songId) };
      }
      return s;
    }));
     if (activeSongId === songId) {
      setActiveSongId(null);
    }
  };
  
  const importSetlists = (importedSetlists: Setlist[]) => {
    setSetlists(currentSetlists => {
      const currentIds = new Set(currentSetlists.map(s => s.id));
      const newSetlists = importedSetlists.filter(s => !currentIds.has(s.id));
      
      if (newSetlists.length === 0) {
        toast({
          title: "No new setlists to import",
          description: "All setlists from the file already exist in your library.",
        });
        return currentSetlists;
      }

      return [...currentSetlists, ...newSetlists];
    });
  };

  const reorderSongs = (setlistId: string, songs: Song[]) => {
    setSetlists(prev => prev.map(s => {
      if (s.id === setlistId) {
        return { ...s, songs: songs };
      }
      return s;
    }));
  };

  const activeSetlist = isLoading ? null : setlists.find(s => s.id === activeSetlistId) || null;
  const activeSong = isLoading ? null : activeSetlist?.songs.find(s => s.id === activeSongId) || null;

  const value = {
    setlists,
    addSetlist,
    updateSetlist,
    deleteSetlist,
    activeSetlist,
    setActiveSetlistId: handleSetActiveSetlistId,
    activeSetlistId,
    addSong,
    updateSong,
    deleteSong,
    activeSong,
    setActiveSongId,
    activeSongId,
    importSetlists,
    reorderSongs,
    isLoading,
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
