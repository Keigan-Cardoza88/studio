
"use client";

import { Music } from 'lucide-react';

export function WelcomeView() {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-center">
      <Music className="w-24 h-24 text-accent mb-6" />
      <h1 className="text-4xl font-bold font-headline mb-2">Welcome to ReadySetPlay 2.0</h1>
      <p className="text-muted-foreground text-lg">
        Your ultimate setlist manager.
      </p>
      <p className="text-muted-foreground mt-4">
        Select a workbook and setlist from the sidebar, or create a new one to get started.
      </p>
    </div>
  );
}
