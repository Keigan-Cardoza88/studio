"use client";

import { useAppContext } from '@/contexts/app-provider';
import { SetlistSidebar } from './setlist-sidebar';
import { WelcomeView } from './welcome-view';
import { SetlistView } from './setlist-view';
import { SongView } from './song-view';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export function MainApp() {
  const { activeSetlist, activeSong, setActiveSongId } = useAppContext();

  const handleBackToSetlist = () => {
    setActiveSongId(null);
  }

  return (
    <SidebarProvider>
      <SetlistSidebar />
      <SidebarInset>
        <div className="p-4 md:p-8 min-h-screen">
          {!activeSetlist && !activeSong && <WelcomeView />}
          {activeSetlist && !activeSong && <SetlistView setlist={activeSetlist} />}
          {activeSetlist && activeSong && <SongView setlistId={activeSetlist.id} song={activeSong} onBack={handleBackToSetlist} />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
