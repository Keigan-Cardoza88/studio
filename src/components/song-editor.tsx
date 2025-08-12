"use client";

import React, { useState, useEffect } from 'react';
import type { Song } from '@/lib/types';
import { useAppContext } from '@/contexts/app-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { useForm, SubmitHandler } from 'react-hook-form';

interface SongEditorProps {
  setlistId: string;
  song?: Song;
  children: React.ReactNode;
}

type Inputs = {
  title: string;
  artist: string;
  lyricsWithChords: string;
};

export function SongEditor({ setlistId, song, children }: SongEditorProps) {
  const { addSong, updateSong } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm<Inputs>();

  useEffect(() => {
    if (song) {
      setValue('title', song.title);
      setValue('artist', song.artist);
      setValue('lyricsWithChords', song.lyricsWithChords);
    } else {
        reset({ title: '', artist: '', lyricsWithChords: ''});
    }
  }, [song, setValue, reset, isOpen]);

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    if (song) {
      updateSong(setlistId, song.id, data);
    } else {
      addSong(setlistId, data);
    }
    reset();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{song ? 'Edit Song' : 'Add New Song'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <Input {...register("title", { required: true })} placeholder="Song Title" />
            <Input {...register("artist", { required: true })} placeholder="Artist" />
            <Textarea 
              {...register("lyricsWithChords", { required: true })} 
              placeholder="Lyrics with chords, e.g., [Am]Some lyrics..."
              className="h-64 font-mono"
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
