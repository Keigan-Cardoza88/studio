
"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Setlist, Song, Workbook } from '@/lib/types';
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


interface SetlistViewProps {
  workbookId: string;
  setlist: Setlist;
}

export function SetlistView({ workbookId, setlist }: SetlistViewProps) {
  const { workbooks, setWorkbooks, addWorkbook, addSetlist, setActiveSongId, deleteSong, reorderSongs, moveSongs, copySongs } = useAppContext();
  const [songs, setSongs] = useState<Song[]>(setlist.songs);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'move' | 'copy' | null>(null);
  const [targetWorkbookId, setTargetWorkbookId] = useState<string | null>(null);
  const [targetSetlistId, setTargetSetlistId] = useState<string | null>(null);
  
  const [isCreatingWorkbook, setIsCreatingWorkbook] = useState(false);
  const [newWorkbookName, setNewWorkbookName] = useState("");
  const [isCreatingSetlist, setIsCreatingSetlist] = useState(false);
  const [newSetlistName, setNewSetlistName] = useState("");


  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    setSongs(setlist.songs);
    setSelectedSongIds([]); // Reset selection when setlist changes
  }, [setlist.songs, setlist.id]);
  
  const targetableWorkbooks = useMemo(() => workbooks, [workbooks]);
  const targetableSetlists = useMemo(() => {
      if (!targetWorkbookId) return [];
      const targetWb = workbooks.find(wb => wb.id === targetWorkbookId);
      return targetWb?.setlists || [];
  }, [workbooks, targetWorkbookId]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (selectedSongIds.length > 0) {
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
  
  const handleSelectionChange = (songId: string, isChecked: boolean) => {
    setSelectedSongIds(prev =>
      isChecked ? [...prev, songId] : prev.filter(id => id !== songId)
    );
  };

  const handleSelectAll = (isChecked: boolean) => {
    setSelectedSongIds(isChecked ? songs.map(s => s.id) : []);
  };
  
  const openActionModal = (mode: 'move' | 'copy') => {
    setModalMode(mode);
    setTargetWorkbookId(null);
    setTargetSetlistId(null);
    setIsCreatingWorkbook(false);
    setIsCreatingSetlist(false);
    setIsModalOpen(true);
  };

  const handleConfirmAction = () => {
    if (!modalMode || !targetWorkbookId || !targetSetlistId) {
      toast({ title: "Selection Missing", description: "Please select a destination workbook and setlist.", variant: "destructive" });
      return;
    }

    if (modalMode === 'move') {
      moveSongs(workbookId, setlist.id, selectedSongIds, targetWorkbookId, targetSetlistId);
    } else if (modalMode === 'copy') {
      copySongs(workbookId, setlist.id, selectedSongIds, targetWorkbookId, targetSetlistId);
    }

    setIsModalOpen(false);
    setSelectedSongIds([]);
  };

  const handleCreateWorkbook = () => {
    if (newWorkbookName.trim()) {
      const newWorkbookId = addWorkbook(newWorkbookName.trim());
      setTargetWorkbookId(newWorkbookId);
      setNewWorkbookName("");
      setIsCreatingWorkbook(false);
      setTargetSetlistId(null); // Clear setlist selection after new workbook is created
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

  const isSelectionMode = selectedSongIds.length > 0;
  const allSongsSelected = songs.length > 0 && selectedSongIds.length === songs.length;

  return (
    <div className="mt-10">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
           {songs.length > 0 && (
             <Checkbox
                id="select-all"
                checked={allSongsSelected}
                onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                aria-label="Select all songs"
            />
           )}
           <div>
              <h1 className="text-4xl font-bold font-headline">{setlist.name}</h1>
              <p className="text-muted-foreground">
                {isSelectionMode ? `${selectedSongIds.length} of ${songs.length} selected` : `${songs.length} songs`}
              </p>
           </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isSelectionMode ? (
              <>
                  <Button onClick={() => openActionModal('move')}><Move className="mr-2"/> Move</Button>
                  <Button onClick={() => openActionModal('copy')}><Copy className="mr-2"/> Copy</Button>
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
              draggable={!isSelectionMode}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={cn("group flex items-center gap-2", !isSelectionMode && "cursor-grab active:cursor-grabbing")}
            >
              <Checkbox
                checked={selectedSongIds.includes(song.id)}
                onCheckedChange={(checked) => handleSelectionChange(song.id, Boolean(checked))}
                className="ml-4"
              />
              <Card className="hover:bg-card/80 transition-colors flex-grow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 cursor-pointer flex-grow" onClick={() => !isSelectionMode && setActiveSongId(song.id)}>
                    {!isSelectionMode && <GripVertical className="h-5 w-5 text-muted-foreground transition-opacity duration-300 opacity-0 group-hover:opacity-100" />}
                    <div className="text-muted-foreground w-6 text-center">{index + 1}</div>
                    <Music className="h-6 w-6 text-accent" />
                    <div>
                      <p className="font-semibold text-lg">{song.title}</p>
                      <p className="text-sm text-muted-foreground">{song.artist}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteSong(workbookId, setlist.id, song.id) }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
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
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{modalMode === 'move' ? 'Move' : 'Copy'} {selectedSongIds.length} song(s)</DialogTitle>
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
                                {targetableWorkbooks.find(w => w.id === targetWorkbookId)?.name || "Select a workbook"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                            {targetableWorkbooks.map(w => (
                                <DropdownMenuItem key={w.id} onSelect={() => {setTargetWorkbookId(w.id); setTargetSetlistId(null);}}>
                                {w.name}
                                </DropdownMenuItem>
                            ))}
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
                                {targetableSetlists.find(s => s.id === targetSetlistId)?.name || "Select a setlist"}
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
                <Button onClick={handleConfirmAction} disabled={!targetSetlistId}>Confirm</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
