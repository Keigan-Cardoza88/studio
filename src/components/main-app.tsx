
"use client";

import { useAppContext } from '@/contexts/app-provider';
import { SetlistSidebar } from './setlist-sidebar';
import { WelcomeView } from './welcome-view';
import { SetlistView } from './setlist-view';
import { SongView } from './song-view';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';

export function MainApp() {
  const { activeWorkbook, activeSetlist, activeSong, setActiveSongId, isLoading } = useAppContext();

  const handleBackToSetlist = () => {
    setActiveSongId(null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-full max-w-md p-4 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <div className="space-y-2 pt-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <SetlistSidebar />
      <SidebarInset>
        <div className="absolute top-4 left-4 z-20">
          <SidebarTrigger />
        </div>
        <div className="p-2 md:p-4 min-h-screen">
          {!activeSetlist && !activeSong && <WelcomeView />}
          {activeWorkbook && activeSetlist && !activeSong && <SetlistView workbookId={activeWorkbook.id} setlist={activeSetlist} />}
          {activeWorkbook && activeSetlist && activeSong && <SongView workbookId={activeWorkbook.id} setlistId={activeSetlist.id} song={activeSong} onBack={handleBackToSetlist} />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
