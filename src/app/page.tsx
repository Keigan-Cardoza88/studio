import { AppProvider } from '@/contexts/app-provider';
import { MainApp } from '@/components/main-app';

export default function Home() {
  return (
    <main>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </main>
  );
}
