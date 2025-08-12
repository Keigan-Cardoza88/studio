"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Song } from '@/lib/types';
import { useAppContext } from '@/contexts/app-provider';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { transpose } from '@/lib/transpose';
import { ArrowLeft, Minus, Plus, Play, Pause, FastForward, Rewind } from 'lucide-react';
import { SongEditor } from './song-editor';
import { Card, CardContent } from '@/components/ui/card';

interface SongViewProps {
  song: Song;
  setlistId: string;
  onBack: () => void;
}

const chordRegex = /\[([^\]]+)\]/;

const isChordLine = (line: string): boolean => {
    if (line.trim().length === 0) return false;
    if (chordRegex.test(line)) return false;
    const lyricRegex = /[a-z]/; // simple check for lyrics
    if (lyricRegex.test(line)) return false;

    // It's likely a chord line if it doesn't contain bracketed chords or lowercase letters
    const potentialChords = line.trim().split(/\s+/);
    const chordPattern = /^[A-G](b|#)?(m|maj|min|dim|aug|sus|add|m7|maj7|7|6|9|11|13)?(\/[A-G](b|#)?)?$/;
    return potentialChords.every(pc => chordPattern.test(pc));
};


const renderLyrics = (text: string) => {
  return text.split('\n').map((line, lineIndex) => {
    if (isChordLine(line)) {
        return (
            <p key={lineIndex} className="font-bold text-accent leading-relaxed">
                {line}
            </p>
        );
    }
    return (
        <p key={lineIndex} className="mb-4 leading-relaxed">
        {line.split(/(\[[^\]]+\])/g).map((part, partIndex) => {
            if (part.startsWith('[') && part.endsWith(']')) {
            return (
                <span key={partIndex} className="font-bold text-accent mx-1">
                {part.slice(1, -1)}
                </span>
            );
            }
            return <span key={partIndex}>{part}</span>;
        })}
        </p>
    );
  });
};

export function SongView({ song, setlistId, onBack }: SongViewProps) {
  const { updateSong } = useAppContext();
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollRef = useRef<number | null>(null);

  const scrollStep = useCallback(() => {
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight) {
      setIsScrolling(false);
      if (scrollRef.current) cancelAnimationFrame(scrollRef.current);
      return;
    }
    const scrollAmount = (song.scrollSpeed / 100) * 1.5;
    window.scrollBy(0, scrollAmount);
    scrollRef.current = requestAnimationFrame(scrollStep);
  }, [song.scrollSpeed]);

  const toggleScroll = () => {
    if (isScrolling) {
      setIsScrolling(false);
      if (scrollRef.current) cancelAnimationFrame(scrollRef.current);
    } else {
      setIsScrolling(true);
      scrollRef.current = requestAnimationFrame(scrollStep);
    }
  };
  
  useEffect(() => {
    return () => {
      if (scrollRef.current) cancelAnimationFrame(scrollRef.current);
    };
  }, []);

  const handleTranspose = (amount: number) => {
    updateSong(setlistId, song.id, { transpose: song.transpose + amount });
  };

  const handleScrollSpeedChange = (value: number[]) => {
    updateSong(setlistId, song.id, { scrollSpeed: value[0] });
  };
  
  const transposedLyrics = transpose(song.lyricsWithChords, song.transpose);

  return (
    <div className="pb-32">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Setlist
      </Button>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-5xl font-bold font-headline">{song.title}</h1>
          <p className="text-xl text-muted-foreground">{song.artist}</p>
        </div>
        <SongEditor setlistId={setlistId} song={song} />
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-6 text-lg font-mono whitespace-pre-wrap">
          {renderLyrics(transposedLyrics)}
        </CardContent>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4 md:px-8 z-10">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4 items-center">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold hidden md:block">Key</h3>
            <Button variant="outline" size="icon" onClick={() => handleTranspose(-1)}><Minus/></Button>
            <span className="font-bold text-lg w-12 text-center">{song.transpose > 0 ? `+${song.transpose}` : song.transpose}</span>
            <Button variant="outline" size="icon" onClick={() => handleTranspose(1)}><Plus/></Button>
          </div>

          <div className="flex items-center gap-2 col-span-2 md:col-span-1 justify-center">
            <Button size="icon" className="w-16 h-16 rounded-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={toggleScroll}>
              {isScrolling ? <Pause className="w-8 h-8"/> : <Play className="w-8 h-8"/>}
            </Button>
            <div className="w-8"></div>
          </div>
          
          <div className="flex items-center gap-2 col-span-2 md:col-span-1">
            <Rewind className="hidden md:block" />
            <Slider
              value={[song.scrollSpeed]}
              onValueChange={handleScrollSpeedChange}
              max={100}
              step={1}
            />
            <FastForward className="hidden md:block" />
          </div>
        </div>
      </div>
    </div>
  );
}
