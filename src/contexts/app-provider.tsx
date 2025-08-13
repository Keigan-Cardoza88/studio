
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Setlist, Song, Workbook } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  workbooks: Workbook[];
  addWorkbook: (name: string) => void;
  deleteWorkbook: (workbookId: string) => void;
  updateWorkbook: (workbookId: string, updatedWorkbook: Partial<Workbook>) => void;
  moveSetlistToWorkbook: (setlistId: string, fromWorkbookId: string, toWorkbookId: string) => void;

  activeWorkbook: Workbook | null;
  setActiveWorkbookId: (id: string | null) => void;
  activeWorkbookId: string | null;

  setlists: Setlist[];
  addSetlist: (workbookId: string, name: string) => void;
  updateSetlist: (workbookId: string, setlistId: string, updatedSetlist: Partial<Setlist>) => void;
  deleteSetlist: (workbookId: string, setlistId: string) => void;
  
  activeSetlist: Setlist | null;
  setActiveSetlistId: (id: string | null) => void;
  activeSetlistId: string | null;
  
  addSong: (workbookId: string, setlistId: string, song: Omit<Song, 'id' | 'transpose' | 'scrollSpeed'>) => void;
  updateSong: (workbookId: string, setlistId: string, songId: string, updatedSong: Partial<Song>) => void;
  deleteSong: (workbookId: string, setlistId: string, songId: string) => void;
  
  activeSong: Song | null;
  setActiveSongId: (id: string | null) => void;
  activeSongId: string | null;
  
  importSetlists: (workbookId: string, importedSetlists: Setlist[]) => void;
  reorderSongs: (workbookId: string, setlistId: string, songs: Song[]) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultWorkbooks: Workbook[] = [{ id: 'default', name: 'My First Workbook', setlists: [] }];

export function AppProvider({ children }: { children: ReactNode }) {
  const [workbooks, setWorkbooks] = useLocalStorage<Workbook[]>('workbooks_v2', defaultWorkbooks);
  const [activeWorkbookId, setActiveWorkbookId] = useLocalStorage<string | null>('activeWorkbookId_v2', 'default');
  const [activeSetlistId, setActiveSetlistId] = useLocalStorage<string | null>('activeSetlistId_v2', null);
  const [activeSongId, setActiveSongId] = useLocalStorage<string | null>('activeSongId_v2', null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (workbooks.length === 0) {
        setWorkbooks(defaultWorkbooks);
      }
      if (!activeWorkbookId || !workbooks.find(w => w.id === activeWorkbookId)) {
        setActiveWorkbookId(workbooks[0]?.id || null);
      }
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleSetActiveWorkbookId = useCallback((id: string | null) => {
    setActiveWorkbookId(id);
    setActiveSetlistId(null);
    setActiveSongId(null);
  }, [setActiveWorkbookId, setActiveSetlistId, setActiveSongId]);

  const addWorkbook = (name: string) => {
    const newWorkbook: Workbook = {
      id: Date.now().toString(),
      name,
      setlists: [],
    };
    setWorkbooks(prev => [...prev, newWorkbook]);
  };

  const deleteWorkbook = (workbookId: string) => {
    if (workbooks.length <= 1) {
      toast({ title: "Cannot delete the last workbook", variant: "destructive" });
      return;
    }
    setWorkbooks(prev => prev.filter(w => w.id !== workbookId));
    if (activeWorkbookId === workbookId) {
      handleSetActiveWorkbookId(workbooks[0]?.id || null);
    }
  };

  const updateWorkbook = (workbookId: string, updatedWorkbook: Partial<Workbook>) => {
    setWorkbooks(prev => prev.map(w => w.id === workbookId ? { ...w, ...updatedWorkbook } : w));
  };

  const moveSetlistToWorkbook = (setlistId: string, fromWorkbookId: string, toWorkbookId: string) => {
    let setlistToMove: Setlist | null = null;
    
    // Remove from old workbook
    const updatedWorkbooks = workbooks.map(w => {
      if (w.id === fromWorkbookId) {
        setlistToMove = w.setlists.find(s => s.id === setlistId) || null;
        return { ...w, setlists: w.setlists.filter(s => s.id !== setlistId) };
      }
      return w;
    });

    if (!setlistToMove) return;

    // Add to new workbook
    const finalWorkbooks = updatedWorkbooks.map(w => {
      if (w.id === toWorkbookId) {
        return { ...w, setlists: [...w.setlists, setlistToMove!] };
      }
      return w;
    });

    setWorkbooks(finalWorkbooks);
    if(activeSetlistId === setlistId) {
        setActiveSetlistId(null);
    }
  };

  const addSetlist = (workbookId: string, name: string) => {
    const newSetlist: Setlist = {
      id: Date.now().toString(),
      name,
      songs: [],
    };
    setWorkbooks(prev => prev.map(w => w.id === workbookId ? { ...w, setlists: [...w.setlists, newSetlist] } : w));
  };

  const updateSetlist = (workbookId: string, setlistId: string, updatedSetlist: Partial<Setlist>) => {
    setWorkbooks(prev => prev.map(w => {
      if (w.id === workbookId) {
        return { ...w, setlists: w.setlists.map(s => s.id === setlistId ? { ...s, ...updatedSetlist } : s) };
      }
      return w;
    }));
  };
  
  const deleteSetlist = (workbookId: string, setlistId: string) => {
    setWorkbooks(prev => prev.map(w => {
      if (w.id === workbookId) {
        return { ...w, setlists: w.setlists.filter(s => s.id !== setlistId) };
      }
      return w;
    }));
    if (activeSetlistId === setlistId) {
      setActiveSetlistId(null);
    }
  };

  const addSong = (workbookId: string, setlistId: string, songData: Omit<Song, 'id' | 'transpose' | 'scrollSpeed'>) => {
    const newSong: Song = { ...songData, id: Date.now().toString(), transpose: 0, scrollSpeed: 20 };
    setWorkbooks(prev => prev.map(w => {
      if (w.id === workbookId) {
        const setlists = w.setlists.map(s => {
          if (s.id === setlistId) return { ...s, songs: [...s.songs, newSong] };
          return s;
        });
        return { ...w, setlists };
      }
      return w;
    }));
  };

  const updateSong = (workbookId: string, setlistId: string, songId: string, updatedSong: Partial<Song>) => {
    setWorkbooks(prev => prev.map(w => {
      if (w.id === workbookId) {
        const setlists = w.setlists.map(s => {
          if (s.id === setlistId) {
            const songs = s.songs.map(song => song.id === songId ? { ...song, ...updatedSong } : song);
            return { ...s, songs };
          }
          return s;
        });
        return { ...w, setlists };
      }
      return w;
    }));
  };
  
  const deleteSong = (workbookId: string, setlistId: string, songId: string) => {
    setWorkbooks(prev => prev.map(w => {
      if (w.id === workbookId) {
        const setlists = w.setlists.map(s => {
          if (s.id === setlistId) return { ...s, songs: s.songs.filter(song => song.id !== songId) };
          return s;
        });
        return { ...w, setlists };
      }
      return w;
    }));
    if (activeSongId === songId) setActiveSongId(null);
  };
  
  const importSetlists = (workbookId: string, importedSetlists: Setlist[]) => {
    setWorkbooks(prev => prev.map(w => {
      if (w.id === workbookId) {
        const currentIds = new Set(w.setlists.map(s => s.id));
        const newSetlists = importedSetlists.filter(s => !currentIds.has(s.id));
        if (newSetlists.length === 0) {
          toast({ title: "No new setlists to import", description: "All setlists from the file already exist in this workbook." });
          return w;
        }
        toast({ title: "Import Successful", description: `${newSetlists.length} new setlist(s) added to "${w.name}".`});
        return { ...w, setlists: [...w.setlists, ...newSetlists] };
      }
      return w;
    }));
  };

  const reorderSongs = (workbookId: string, setlistId: string, songs: Song[]) => {
    setWorkbooks(prev => prev.map(w => {
      if (w.id === workbookId) {
        const setlists = w.setlists.map(s => s.id === setlistId ? { ...s, songs } : s);
        return { ...w, setlists };
      }
      return w;
    }));
  };

  const activeWorkbook = isLoading ? null : workbooks.find(w => w.id === activeWorkbookId) || null;
  const setlists = activeWorkbook?.setlists || [];
  const activeSetlist = isLoading ? null : setlists.find(s => s.id === activeSetlistId) || null;
  const activeSong = isLoading ? null : activeSetlist?.songs.find(s => s.id === activeSongId) || null;

  const value = {
    workbooks, addWorkbook, deleteWorkbook, updateWorkbook, moveSetlistToWorkbook,
    activeWorkbook, setActiveWorkbookId: handleSetActiveWorkbookId, activeWorkbookId,
    setlists, addSetlist, updateSetlist, deleteSetlist,
    activeSetlist, setActiveSetlistId, activeSetlistId,
    addSong, updateSong, deleteSong,
    activeSong, setActiveSongId, activeSongId,
    importSetlists, reorderSongs, isLoading,
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
