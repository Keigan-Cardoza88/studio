
"use client";

import React, { useState, useEffect, useRef } from 'react';
import type { Setlist, Song } from '@/lib/types';
import { useAppContext } from '@/contexts/app-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Music, Trash2 } from 'lucide-react';
import { SongEditor } from './song-editor';
import { cn } from '@/lib/utils';

interface SetlistViewProps {
  workbookId: string;
  setlist: Setlist;
}

export function SetlistView({ workbookId, setlist }: SetlistViewProps) {
  const { setActiveSongId, deleteSong, reorderSongs } = useAppContext();
  const [songs, setSongs] = useState<Song[]>(setlist.songs);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    setSongs(setlist.songs);
  }, [setlist.songs, setlist.id]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragOverItem.current = index;
    const newSongs = [...songs];
    const draggedItemContent = newSongs.splice(dragItem.current!, 1)[0];
    newSongs.splice(dragOverItem.current!, 0, draggedItemContent);
    dragItem.current = dragOverItem.current;
    dragOverItem.current = null;
    setSongs(newSongs);
  };
  
  const handleDragEnd = () => {
    reorderSongs(workbookId, setlist.id, songs);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <div className="mt-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold font-headline">{setlist.name}</h1>
          <p className="text-muted-foreground">{setlist.songs.length} songs</p>
        </div>
        <SongEditor workbookId={workbookId} setlistId={setlist.id} />
      </div>
      <div className="space-y-2">
        {songs.length > 0 ? (
          songs.map((song, index) => (
            <div
              key={song.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={cn("group cursor-grab active:cursor-grabbing")}
            >
              <Card className="hover:bg-card/80 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 cursor-pointer flex-grow" onClick={() => setActiveSongId(song.id)}>
                    <GripVertical className="h-5 w-5 text-muted-foreground transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
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
    </div>
  );
}
