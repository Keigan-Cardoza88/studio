
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
            <p key={lineIndex} className="font-bold text-accent leading-tight">
                {line}
            </p>
        );
    }
    return (
        <p key={lineIndex} className="mb-1 leading-tight">
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
  const scrollAccumulatorRef = useRef(0);

  const scrollStep = useCallback(() => {
    if (!viewportRef.current || !isScrolling) return;

    const maxIncrement = 5; // Corresponds to the fastest speed
    const minIncrement = 0.1; // Corresponds to the slowest speed
    const increment = minIncrement + (scrollSpeed / 100) * (maxIncrement - minIncrement);

    scrollAccumulatorRef.current += increment;

    if (scrollAccumulatorRef.current >= 1) {
        const scrollAmount = Math.floor(scrollAccumulatorRef.current);
        const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
        if (scrollTop < scrollHeight - clientHeight) {
            viewportRef.current.scrollTop += scrollAmount;
            scrollAccumulatorRef.current -= scrollAmount;
        } else {
            setIsScrolling(false);
        }
    }
    
    scrollRef.current = requestAnimationFrame(scrollStep);
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
    <div className="h-screen flex flex-col p-1 mt-[10px]">
        <header className="flex-shrink-0">
            <Button variant="ghost" onClick={onBack} className="mb-1">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Setlist
            </Button>
            <div className="flex justify-between items-center mb-1 px-1">
                <div>
                <h1 className="text-lg font-bold font-headline">{song.title}</h1>
                <p className="text-sm text-muted-foreground">{song.artist}</p>
                </div>
                <SongEditor setlistId={setlistId} song={song} />
            </div>
        </header>

        <main className="flex-grow overflow-hidden pt-0">
            <Card className="h-full flex flex-col">
                <ScrollArea className="flex-grow" viewportRef={viewportRef}>
                    <CardContent className="p-2 text-sm font-mono whitespace-pre-wrap">
                        {renderLyrics(transposedLyrics)}
                    </CardContent>
                </ScrollArea>
            </Card>
        </main>

        <footer className="flex-shrink-0 bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-2 z-10 mb-3">
            <div className="max-w-4xl mx-auto grid grid-cols-3 gap-2 items-center">
                <div className="flex items-center gap-1">
                    <h3 className="text-xs font-semibold hidden md:block">Key</h3>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleTranspose(-1)}><Minus/></Button>
                    <span className="font-bold text-base w-10 text-center">{song.transpose > 0 ? `+${song.transpose}` : song.transpose}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleTranspose(1)}><Plus/></Button>
                </div>

                <div className="flex items-center gap-2 justify-center">
                    <Button size="icon" className="w-12 h-12 rounded-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={toggleScroll}>
                    {isScrolling ? <Pause className="w-6 h-6"/> : <Play className="w-6 h-6"/>}
                    </Button>
                </div>

                <div className="flex items-center gap-2 justify-end">
                    <h3 className="text-xs font-semibold hidden md:block">Speed</h3>
                    <Slider
                        defaultValue={[scrollSpeed]}
                        min={1}
                        max={100}
                        step={1}
                        onValueChange={handleScrollSpeedChange}
                        className="w-[200px] md:w-[340px]"
                    />
                    <span className="font-bold text-base w-10 text-center">{scrollSpeed}</span>
                </div>
            </div>
        </footer>
    </div>
  );
}
