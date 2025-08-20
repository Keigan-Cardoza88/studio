
"use client";

import React, { useEffect, useState } from 'react';
import type { Song } from '@/lib/types';
import { useAppContext } from '@/contexts/app-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Edit, PlusCircle } from 'lucide-react';
import { transpose } from '@/lib/transpose';

interface SongEditorProps {
  workbookId: string;
  setlistId: string;
  song?: Song;
  transposedLyrics?: string;
}

type Inputs = {
  title: string;
  artist: string;
  lyricsWithChords: string;
};

export function SongEditor({ workbookId, setlistId, song, transposedLyrics }: SongEditorProps) {
  const { addSong, updateSong } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm<Inputs>();

  useEffect(() => {
    if (isOpen) {
        if (song) {
            setValue('title', song.title);
            setValue('artist', song.artist);
            setValue('lyricsWithChords', transposedLyrics ?? song.lyricsWithChords);
        } else {
            reset({ title: '', artist: '', lyricsWithChords: ''});
        }
    }
  }, [song, setValue, reset, isOpen, transposedLyrics]);

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    if (song) {
      // Revert the lyrics to 0 transpose before saving
      const originalLyrics = transpose(data.lyricsWithChords, -song.transpose);
      updateSong(workbookId, setlistId, song.id, { 
        ...data,
        lyricsWithChords: originalLyrics
      });
    } else {
      addSong(workbookId, setlistId, data);
    }
    reset();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {song ? (
          <Button variant="outline" size="icon"><Edit/></Button>
        ) : (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Song
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl md:max-w-6xl lg:max-w-7xl">
        <DialogHeader>
          <DialogTitle>{song ? 'Edit Song' : 'Add New Song'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <Input {...register("title", { required: true })} placeholder="Song Title" />
            <Input {...register("artist", { required: true })} placeholder="Artist" />
            <Textarea 
              {...register("lyricsWithChords")} 
              placeholder="Lyrics with chords, e.g., [Am]Some lyrics..."
              className="h-96 font-mono text-[10px]"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit">{song ? 'Save Changes' : 'Add Song'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
