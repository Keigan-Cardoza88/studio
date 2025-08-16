
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Setlist, Song, Workbook } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  workbooks: Workbook[];
  setWorkbooks: (value: Workbook[] | ((val: Workbook[]) => Workbook[])) => void;
  addWorkbook: (name: string) => string;
  deleteWorkbook: (workbookId: string) => void;
  updateWorkbook: (workbookId: string, updatedWorkbook: Partial<Workbook>) => void;
  moveSetlistToWorkbook: (setlistId: string, fromWorkbookId: string, toWorkbookId: string) => void;

  activeWorkbook: Workbook | null;
  setActiveWorkbookId: (id: string | null) => void;
  activeWorkbookId: string | null;

  setlists: Setlist[];
  addSetlist: (workbookId: string, name: string) => string;
  updateSetlist: (workbookId: string, setlistId: string, updatedSetlist: Partial<Setlist>) => void;
  deleteSetlist: (workbookId: string, setlistId: string) => void;
  
  activeSetlist: Setlist | null;
  setActiveSetlistId: (id: string | null) => void;
  activeSetlistId: string | null;
  
  addSong: (workbookId: string, setlistId: string, song: Omit<Song, 'id' | 'transpose' | 'scrollSpeed'>) => void;
  updateSong: (workbookId: string, setlistId: string, songId: string, updatedSong: Partial<Song>) => void;
  deleteSong: (workbookId: string, setlistId: string, songId: string) => void;
  moveSongs: (sourceWbId: string, sourceSlId: string, songIds: string[], destWbId: string, destSlId: string) => void;
  copySongs: (sourceWbId: string, sourceSlId: string, songIds: string[], destWbId: string, destSlId: string) => void;
  
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

  const addWorkbook = (name: string): string => {
    const newWorkbook: Workbook = {
      id: Date.now().toString(),
      name,
      setlists: [],
    };
    setWorkbooks(prev => [...prev, newWorkbook]);
    toast({ title: "Workbook Created", description: `"${name}" has been created.` });
    return newWorkbook.id;
  };

  const deleteWorkbook = (workbookId: string) => {
    if (workbooks.length <= 1) {
      toast({ title: "Cannot delete the last workbook", variant: "destructive" });
      return;
    }
    const updatedWorkbooks = workbooks.filter(w => w.id !== workbookId);
    setWorkbooks(updatedWorkbooks);
    if (activeWorkbookId === workbookId) {
      handleSetActiveWorkbookId(updatedWorkbooks[0]?.id || null);
    }
  };

  const updateWorkbook = (workbookId: string, updatedWorkbook: Partial<Workbook>) => {
    setWorkbooks(prev => prev.map(w => w.id === workbookId ? { ...w, ...updatedWorkbook } : w));
  };

  const moveSetlistToWorkbook = (setlistId: string, fromWorkbookId: string, toWorkbookId: string) => {
    let setlistToMove: Setlist | null = null;
    
    const updatedWorkbooks = workbooks.map(w => {
      if (w.id === fromWorkbookId) {
        setlistToMove = w.setlists.find(s => s.id === setlistId) || null;
        return { ...w, setlists: w.setlists.filter(s => s.id !== setlistId) };
      }
      return w;
    });

    if (!setlistToMove) return;

    const finalWorkbooks = updatedWorkbooks.map(w => {
      if (w.id === toWorkbookId) {
        return { ...w, setlists: [...w.setlists, setlistToMove!] };
      }
      return w;
    });

    setWorkbooks(finalWorkbooks);
    if(activeSetlistId === setlistId) {
        setActiveSetlistId(null);
        setActiveWorkbookId(toWorkbookId);
    }
  };

  const addSetlist = (workbookId: string, name: string): string => {
    const newSetlist: Setlist = {
      id: Date.now().toString(),
      name,
      songs: [],
    };
    setWorkbooks(prev => prev.map(w => w.id === workbookId ? { ...w, setlists: [...w.setlists, newSetlist] } : w));
    toast({ title: "Setlist Created", description: `"${name}" has been created.` });
    return newSetlist.id;
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

  const performSongAction = (
    sourceWbId: string,
    sourceSlId: string,
    songIds: string[],
    destWbId: string,
    destSlId: string,
    mode: 'move' | 'copy'
  ) => {
    let songsToProcess: Song[] = [];
    const songIdsSet = new Set(songIds);

    const sourceWorkbook = workbooks.find(wb => wb.id === sourceWbId);
    const sourceSetlist = sourceWorkbook?.setlists.find(sl => sl.id === sourceSlId);

    if (!sourceSetlist) {
      toast({ title: "Error", description: "Source setlist not found.", variant: "destructive" });
      return;
    }

    songsToProcess = sourceSetlist.songs.filter(song => songIdsSet.has(song.id));
    if (songsToProcess.length === 0) {
      toast({ title: "Error", description: "Source songs not found.", variant: "destructive" });
      return;
    }

    setWorkbooks(currentWorkbooks => {
      let updatedWorkbooks = [...currentWorkbooks];

      // Add songs to destination
      updatedWorkbooks = updatedWorkbooks.map(wb => {
        if (wb.id === destWbId) {
          const destSetlists = wb.setlists.map(sl => {
            if (sl.id === destSlId) {
              const songsToAdd = mode === 'copy'
                ? songsToProcess.map(song => ({ ...song, id: `${Date.now()}-${Math.random()}` }))
                : songsToProcess;
              return { ...sl, songs: [...sl.songs, ...songsToAdd] };
            }
            return sl;
          });
          return { ...wb, setlists: destSetlists };
        }
        return wb;
      });

      // Remove songs from source if moving
      if (mode === 'move') {
        updatedWorkbooks = updatedWorkbooks.map(wb => {
          if (wb.id === sourceWbId) {
            const sourceSetlists = wb.setlists.map(sl => {
              if (sl.id === sourceSlId) {
                const remainingSongs = sl.songs.filter(song => !songIdsSet.has(song.id));
                return { ...sl, songs: remainingSongs };
              }
              return sl;
            });
            return { ...wb, setlists: sourceSetlists };
          }
          return wb;
        });
      }

      return updatedWorkbooks;
    });

    toast({
      title: `Songs ${mode === 'move' ? 'Moved' : 'Copied'}`,
      description: `${songsToProcess.length} song(s) transferred successfully.`,
    });
  };

  const moveSongs = (sourceWbId: string, sourceSlId: string, songIds: string[], destWbId: string, destSlId: string) => {
    performSongAction(sourceWbId, sourceSlId, songIds, destWbId, destSlId, 'move');
  };

  const copySongs = (sourceWbId: string, sourceSlId: string, songIds: string[], destWbId: string, destSlId: string) => {
    performSongAction(sourceWbId, sourceSlId, songIds, destWbId, destSlId, 'copy');
  };

  const activeWorkbook = isLoading ? null : workbooks.find(w => w.id === activeWorkbookId) || null;
  const setlists = activeWorkbook?.setlists || [];
  const activeSetlist = isLoading ? null : setlists.find(s => s.id === activeSetlistId) || null;
  const activeSong = isLoading ? null : activeSetlist?.songs.find(s => s.id === activeSongId) || null;

  const value = {
    workbooks, setWorkbooks, addWorkbook, deleteWorkbook, updateWorkbook, moveSetlistToWorkbook,
    activeWorkbook, setActiveWorkbookId: handleSetActiveWorkbookId, activeWorkbookId,
    setlists, addSetlist, updateSetlist, deleteSetlist,
    activeSetlist, setActiveSetlistId, activeSetlistId,
    addSong, updateSong, deleteSong, moveSongs, copySongs,
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
