
"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Setlist, Song } from '@/lib/types';
import { useAppContext } from '@/contexts/app-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { GripVertical, Music, Trash2, Move, Copy, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { SongEditor } from './song-editor';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useLongPress } from '@/hooks/use-long-press';

interface SetlistViewProps {
  workbookId: string;
  setlist: Setlist;
}

function MoveCopyDialog() {
    const { 
        workbooks, addWorkbook, addSetlist, 
        isActionModalOpen, closeActionModal, confirmSongAction,
        actionModalMode, actionSource, selectedSongIds
    } = useAppContext();

    const [targetWorkbookId, setTargetWorkbookId] = useState<string | null>(null);
    const [targetSetlistId, setTargetSetlistId] = useState<string | null>(null);
  
    const [isCreatingWorkbook, setIsCreatingWorkbook] = useState(false);
    const [newWorkbookName, setNewWorkbookName] = useState("");
    const [isCreatingSetlist, setIsCreatingSetlist] = useState(false);
    const [newSetlistName, setNewSetlistName] = useState("");
    const { toast } = useToast();

    // Reset local state when the dialog opens or closes
    useEffect(() => {
        if (isActionModalOpen) {
            setTargetWorkbookId(actionModalMode === 'move' ? null : actionSource?.workbookId || null);
            setTargetSetlistId(null);
            setIsCreatingWorkbook(false);
            setNewWorkbookName("");
            setIsCreatingSetlist(false);
            setNewSetlistName("");
        }
    }, [isActionModalOpen, actionSource, actionModalMode]);

    const targetableWorkbooks = useMemo(() => {
        if (!actionSource) return [];
        if (actionModalMode === 'move') {
          // Exclude the source workbook when moving
          return workbooks.filter(wb => wb.id !== actionSource.workbookId);
        }
        return workbooks;
    }, [workbooks, actionModalMode, actionSource]);

    const targetableSetlists = useMemo(() => {
        if (!targetWorkbookId || !actionSource) return [];
        const targetWb = workbooks.find(wb => wb.id === targetWorkbookId);
        if (!targetWb) return [];
    
        if (actionModalMode === 'move' && targetWorkbookId === actionSource.workbookId) {
          // Exclude source setlist when moving within the same workbook
          return targetWb.setlists.filter(s => s.id !== actionSource.setlistId);
        }
        
        return targetWb.setlists;
    }, [workbooks, targetWorkbookId, actionModalMode, actionSource]);

    const handleConfirm = () => {
        if (!targetWorkbookId || !targetSetlistId) {
          toast({ title: "Selection Missing", description: "Please select a destination workbook and setlist.", variant: "destructive" });
          return;
        }
        confirmSongAction(targetWorkbookId, targetSetlistId);
    };
  
    const handleCreateWorkbook = () => {
      if (newWorkbookName.trim()) {
        const newWorkbookId = addWorkbook(newWorkbookName.trim());
        setTargetWorkbookId(newWorkbookId);
        setNewWorkbookName("");
        setIsCreatingWorkbook(false);
        setTargetSetlistId(null); // Reset setlist selection
      }
    }
  
    const handleCreateSetlist = () => {
      if (newSetlistName.trim() && targetWorkbookId) {
        const newSetlistId = addSetlist(targetWorkbookId, newSetlistName.trim());
        setTargetSetlistId(newSetlistId);
        setNewSetlistName("");
        setIsCreatingSetlist(false);
      }
    }

    if (!actionSource) return null;

    return (
        <Dialog open={isActionModalOpen} onOpenChange={closeActionModal}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{actionModalMode === 'move' ? 'Move' : 'Copy'} {selectedSongIds.length} song(s)</DialogTitle>
                <DialogDescription>Select the destination for the selected songs.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Destination Workbook</label>
                    {isCreatingWorkbook ? (
                      <div className="flex gap-2">
                        <Input 
                          value={newWorkbookName} 
                          onChange={(e) => setNewWorkbookName(e.target.value)} 
                          placeholder="New workbook name..."
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkbook()}
                        />
                        <Button onClick={handleCreateWorkbook}>Create</Button>
                        <Button variant="ghost" onClick={() => setIsCreatingWorkbook(false)}>Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                                {workbooks.find(w => w.id === targetWorkbookId)?.name || "Select a workbook"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                            {targetableWorkbooks.map(w => (
                                <DropdownMenuItem key={w.id} onSelect={() => {setTargetWorkbookId(w.id); setTargetSetlistId(null);}}>
                                {w.name}
                                </DropdownMenuItem>
                            ))}
                             {targetableWorkbooks.length === 0 && <DropdownMenuItem disabled>No other workbooks</DropdownMenuItem>}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="outline" size="icon" onClick={() => setIsCreatingWorkbook(true)}><PlusCircle /></Button>
                      </div>
                    )}
                </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium">Destination Setlist</label>
                     {isCreatingSetlist ? (
                      <div className="flex gap-2">
                        <Input 
                          value={newSetlistName} 
                          onChange={(e) => setNewSetlistName(e.target.value)} 
                          placeholder="New setlist name..."
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleCreateSetlist()}
                        />
                        <Button onClick={handleCreateSetlist}>Create</Button>
                        <Button variant="ghost" onClick={() => setIsCreatingSetlist(false)}>Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between" disabled={!targetWorkbookId}>
                                {workbooks.flatMap(w => w.setlists).find(s => s.id === targetSetlistId)?.name || "Select a setlist"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                            {targetableSetlists.length > 0 ? targetableSetlists.map(s => (
                                <DropdownMenuItem key={s.id} onSelect={() => setTargetSetlistId(s.id)}>
                                {s.name}
                                </DropdownMenuItem>
                            )) : <DropdownMenuItem disabled>No setlists in this workbook</DropdownMenuItem>}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="outline" size="icon" disabled={!targetWorkbookId} onClick={() => setIsCreatingSetlist(true)}><PlusCircle /></Button>
                      </div>
                    )}
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
                <Button onClick={handleConfirm} disabled={!targetSetlistId}>Confirm</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    );
}

export function SetlistView({ workbookId, setlist }: SetlistViewProps) {
  const { 
      setActiveSongId, deleteSong, reorderSongs, openActionModal, 
      selectedSongIds, handleSongSelectionChange, handleSelectAllSongs,
      isSongSelectionModeActive, setIsSongSelectionModeActive
  } = useAppContext();
  
  const [songs, setSongs] = useState<Song[]>(setlist.songs);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  
  useEffect(() => {
    setSongs(setlist.songs);
  }, [setlist.songs]);

  const longPressEvents = useLongPress({
      onLongPress: (e) => {
        const songId = (e.currentTarget as HTMLElement).dataset.songId;
        if (songId && !isSongSelectionModeActive) {
            setIsSongSelectionModeActive(true);
            handleSongSelectionChange(songId, true);
        }
      },
      onClick: (e) => {
        const songId = (e.currentTarget as HTMLElement).dataset.songId;
        if (!songId) return;

        if (isSongSelectionModeActive) {
          handleSongSelectionChange(songId, !selectedSongIds.includes(songId));
        } else {
          setActiveSongId(songId);
        }
      }
  });
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (isSongSelectionModeActive) {
      e.preventDefault();
      return;
    }
    dragItem.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (dragItem.current === null) return;
    dragOverItem.current = index;
    const newSongs = [...songs];
    const draggedItemContent = newSongs.splice(dragItem.current!, 1)[0];
    newSongs.splice(dragOverItem.current!, 0, draggedItemContent);
    dragItem.current = dragOverItem.current;
    dragOverItem.current = null;
    setSongs(newSongs);
  };
  
  const handleDragEnd = () => {
    if (dragItem.current === null) return;
    reorderSongs(workbookId, setlist.id, songs);
    dragItem.current = null;
    dragOverItem.current = null;
  };
  
  const allSongsSelected = songs.length > 0 && selectedSongIds.length === songs.length;

  return (
    <div className="mt-10">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
           {isSongSelectionModeActive && songs.length > 0 && (
             <Checkbox
                id="select-all"
                checked={allSongsSelected}
                onCheckedChange={(checked) => handleSelectAllSongs(songs, Boolean(checked))}
                aria-label="Select all songs"
            />
           )}
           <div>
              <h1 className="text-4xl font-bold font-headline">{setlist.name}</h1>
              <p className="text-muted-foreground">
                {isSongSelectionModeActive ? `${selectedSongIds.length} of ${songs.length} selected` : `${songs.length} songs`}
              </p>
           </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isSongSelectionModeActive ? (
              <>
                  <Button onClick={() => openActionModal('move', workbookId, setlist.id)}><Move className="mr-2"/> Move</Button>
                  <Button onClick={() => openActionModal('copy', workbookId, setlist.id)}><Copy className="mr-2"/> Copy</Button>
              </>
          ) : (
            <SongEditor workbookId={workbookId} setlistId={setlist.id} />
          )}
        </div>
      </div>
      <div className="space-y-2">
        {songs.length > 0 ? (
          songs.map((song, index) => (
            <div
              key={song.id}
              draggable={!isSongSelectionModeActive}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={cn("group flex items-center gap-2", !isSongSelectionModeActive && "cursor-grab active:cursor-grabbing")}
            >
              {isSongSelectionModeActive && (
                 <Checkbox
                  checked={selectedSongIds.includes(song.id)}
                  onCheckedChange={(checked) => handleSongSelectionChange(song.id, Boolean(checked))}
                  className="ml-4"
                />
              )}
              <Card 
                className="hover:bg-card/80 transition-colors flex-grow"
                {...longPressEvents}
                data-song-id={song.id}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className={cn("flex items-center gap-4 flex-grow", !isSongSelectionModeActive && "cursor-pointer")}>
                    {!isSongSelectionModeActive && <GripVertical className="h-5 w-5 text-muted-foreground transition-opacity duration-300 opacity-0 group-hover:opacity-100" />}
                    <div className="text-muted-foreground w-6 text-center">{index + 1}</div>
                    <Music className="h-6 w-6 text-accent" />
                    <div>
                      <p className="font-semibold text-lg">{song.title}</p>
                      <p className="text-sm text-muted-foreground">{song.artist}</p>
                    </div>
                  </div>
                  {!isSongSelectionModeActive && (
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteSong(workbookId, setlist.id, song.id) }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold">No songs in this setlist yet.</h3>
            <p className="text-muted-foreground mt-2">Click "Add Song" to get started.</p>
          </div>
        )}
      </div>
      <MoveCopyDialog />
    </div>
  );
}
