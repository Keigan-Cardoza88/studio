"use client";

import { useAppContext } from '@/contexts/app-provider';
import { SetlistSidebar } from './setlist-sidebar';
import { WelcomeView } from './welcome-view';
import { SetlistView } from './setlist-view';
import { SongView } from './song-view';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

export function MainApp() {
  const { activeSetlist, activeSong, setActiveSongId } = useAppContext();

  const handleBackToSetlist = () => {
    setActiveSongId(null);
  }

  return (
    <SidebarProvider>
      <SetlistSidebar />
      <SidebarInset>
        <div className="absolute top-2 left-2">
          <SidebarTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-panel-left"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>
            </Button>
          </SidebarTrigger>
        </div>
        <div className="p-4 md:p-8 min-h-screen">
          {!activeSetlist && !activeSong && <WelcomeView />}
          {activeSetlist && !activeSong && <SetlistView setlist={activeSetlist} />}
          {activeSetlist && activeSong && <SongView setlistId={activeSetlist.id} song={activeSong} onBack={handleBackToSetlist} />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
