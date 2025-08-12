"use client";

import React from 'react';
import type { Setlist } from '@/lib/types';
import { useAppContext } from '@/contexts/app-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, Trash2 } from 'lucide-react';
import { SongEditor } from './song-editor';

interface SetlistViewProps {
  setlist: Setlist;
}

export function SetlistView({ setlist }: SetlistViewProps) {
  const { setActiveSongId, deleteSong } = useAppContext();

  return (
    <div className="mt-[5px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold font-headline">{setlist.name}</h1>
          <p className="text-muted-foreground">{setlist.songs.length} songs</p>
        </div>
        <SongEditor setlistId={setlist.id} />
      </div>
      <div className="space-y-4">
        {setlist.songs.length > 0 ? (
          setlist.songs.map((song, index) => (
            <Card key={song.id} className="hover:bg-card/80 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4 cursor-pointer flex-grow" onClick={() => setActiveSongId(song.id)}>
                  <div className="text-muted-foreground">{index + 1}</div>
                  <Music className="h-6 w-6 text-accent" />
                  <div>
                    <p className="font-semibold text-lg">{song.title}</p>
                    <p className="text-sm text-muted-foreground">{song.artist}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteSong(setlist.id, song.id) }}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
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
