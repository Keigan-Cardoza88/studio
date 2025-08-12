
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Song } from '@/lib/types';
import { useAppContext } from '@/contexts/app-provider';
import { Button } from '@/components/ui/button';
import { transpose } from '@/lib/transpose';
import { ArrowLeft, Minus, Plus, Play, Pause } from 'lucide-react';
import { SongEditor } from './song-editor';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';

interface SongViewProps {
  song: Song;
  setlistId: string;
  onBack: () => void;
}

const chordRegex = /\[([^\]]+)\]/;

const isChordLine = (line: string): boolean => {
    if (line.trim().length === 0) return false;

    // This is a line with chords and lyrics, like "[Am]Some lyrics"
    if (chordRegex.test(line)) {
        const justLyrics = line.replace(/\[([^\]]+)\]/g, '').trim();
        if (justLyrics.length > 0) return false;
    }

    const potentialChords = line.trim().split(/\s+/);
    // This pattern is simplified and may not catch all complex chords, but covers the basics.
    const chordPattern = /^[A-G](b|#)?(m|maj|min|dim|aug|sus|add|m7|maj7|7|6|9|11|13)?(\/[A-G](b|#)?)?$/i;
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
  const [scrollSpeed, setScrollSpeed] = useState(song.scrollSpeed || 20);
  const scrollRef = useRef<number | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollAccumulatorRef = useRef<number>(0);

  const scrollStep = useCallback(() => {
    if (!viewportRef.current) return;
    
    const minPixelsPerFrame = 0.1;
    const maxPixelsPerFrame = 10;
    
    // Scale the scroll speed non-linearly to have more control at lower speeds
    const speed = minPixelsPerFrame + ((maxPixelsPerFrame - minPixelsPerFrame) * (scrollSpeed / 100));
    
    scrollAccumulatorRef.current += speed;

    const scrollAmount = Math.floor(scrollAccumulatorRef.current);

    if (scrollAmount > 0) {
      const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
      if (scrollTop < scrollHeight - clientHeight) {
        viewportRef.current.scrollTop += scrollAmount;
        scrollAccumulatorRef.current -= scrollAmount;
      } else {
        setIsScrolling(false);
      }
    }
    
    if (isScrolling) {
        scrollRef.current = requestAnimationFrame(scrollStep);
    }
  }, [scrollSpeed, isScrolling]);

  const toggleScroll = () => {
    setIsScrolling(prev => !prev);
  };

  useEffect(() => {
    if (isScrolling) {
      scrollAccumulatorRef.current = 0;
      scrollRef.current = requestAnimationFrame(scrollStep);
    } else {
      if (scrollRef.current) {
        cancelAnimationFrame(scrollRef.current);
      }
    }
    return () => {
      if (scrollRef.current) cancelAnimationFrame(scrollRef.current);
    };
  }, [isScrolling, scrollStep]);

  useEffect(() => {
      setIsScrolling(false);
      if (viewportRef.current) viewportRef.current.scrollTop = 0;
  }, [song.id]);


  const handleTranspose = (amount: number) => {
    updateSong(setlistId, song.id, { transpose: song.transpose + amount });
  };

  const handleScrollSpeedChange = (newSpeed: number[]) => {
    const speedValue = newSpeed[0];
    setScrollSpeed(speedValue);
    updateSong(setlistId, song.id, { scrollSpeed: speedValue });
  };

  const transposedLyrics = transpose(song.lyricsWithChords, song.transpose);

  return (
    <div className="h-screen flex flex-col">
        <header className="flex-shrink-0 pt-4 px-4">
            <Button variant="ghost" onClick={onBack} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Setlist
            </Button>
            <div className="flex justify-between items-center mb-6">
                <div>
                <h1 className="text-4xl font-bold font-headline">{song.title}</h1>
                <p className="text-lg text-muted-foreground">{song.artist}</p>
                </div>
                <SongEditor setlistId={setlistId} song={song} />
            </div>
        </header>

        <main className="flex-grow mb-2 overflow-hidden">
            <Card className="h-full flex flex-col">
                <ScrollArea className="flex-grow" viewportRef={viewportRef}>
                    <CardContent className="p-6 text-xl font-mono whitespace-pre-wrap">
                        {renderLyrics(transposedLyrics)}
                    </CardContent>
                </ScrollArea>
            </Card>
        </main>

        <footer className="flex-shrink-0 bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4 md:px-8 z-10">
            <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 items-center">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold hidden md:block">Key</h3>
                    <Button variant="outline" size="icon" onClick={() => handleTranspose(-1)}><Minus/></Button>
                    <span className="font-bold text-lg w-12 text-center">{song.transpose > 0 ? `+${song.transpose}` : song.transpose}</span>
                    <Button variant="outline" size="icon" onClick={() => handleTranspose(1)}><Plus/></Button>
                </div>

                <div className="flex items-center gap-2 justify-center">
                    <Button size="icon" className="w-16 h-16 rounded-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={toggleScroll}>
                    {isScrolling ? <Pause className="w-8 h-8"/> : <Play className="w-8 h-8"/>}
                    </Button>
                </div>

                <div className="flex items-center gap-2 justify-end">
                    <h3 className="text-sm font-semibold hidden md:block">Speed</h3>
                    <Slider
                        defaultValue={[scrollSpeed]}
                        min={1}
                        max={100}
                        step={1}
                        onValueChange={handleScrollSpeedChange}
                        className="w-[240px]"
                    />
                    <span className="font-bold text-lg w-12 text-center">{scrollSpeed}</span>
                </div>
            </div>
        </footer>
    </div>
  );
}

