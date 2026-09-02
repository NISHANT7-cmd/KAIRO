import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ReaderProvider } from './context/ReaderContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { SearchModal } from './components/SearchModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { AuthModal } from './components/AuthModal';
import { HomeView } from './components/HomeView';
import { DiscoverView } from './components/DiscoverView';
import { StoryDetailView } from './components/StoryDetailView';
import { ReaderView } from './components/ReaderView';
import { StudioDashboardView } from './components/StudioDashboardView';
import { CreateStoryView } from './components/CreateStoryView';
import { ChapterEditorView } from './components/ChapterEditorView';
import { UniversesView } from './components/UniversesView';
import { UniverseDetailView } from './components/UniverseDetailView';
import { CommunityView } from './components/CommunityView';
import { AnimeHubView } from './components/AnimeHubView';
import { LibraryView } from './components/LibraryView';
import { ProfileView } from './components/ProfileView';
import { AdminPortalView } from './components/AdminPortalView';
import { WorldBuilderModal } from './components/WorldBuilderModal';
import { CharacterBuilderModal } from './components/CharacterBuilderModal';

export function KairoApp() {
  // Navigation State
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedStorySlug, setSelectedStorySlug] = useState<string>('celestial-drifters');
  const [selectedChapterNumber, setSelectedChapterNumber] = useState<number>(1);
  const [selectedUniverseSlug, setSelectedUniverseSlug] = useState<string>('the-astral-universe');
  const [selectedCommunitySlug, setSelectedCommunitySlug] = useState<string>('astral-universe-fandom');
  const [editorStoryId, setEditorStoryId] = useState<string>('');
  const [editorChapterId, setEditorChapterId] = useState<string | undefined>(undefined);

  // Global Modals & Drawers
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWorldBuilderOpen, setIsWorldBuilderOpen] = useState(false);
  const [isCharacterBuilderOpen, setIsCharacterBuilderOpen] = useState(false);

  // Handle URL hash changes for easy navigation and bookmarking
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const parts = hash.split('/');
        const view = parts[0];
        if (view) {
          setCurrentView(view);
          if (view === 'story' && parts[1]) {
            setSelectedStorySlug(parts[1]);
          } else if (view === 'reader' && parts[1]) {
            setSelectedStorySlug(parts[1]);
            if (parts[2]) setSelectedChapterNumber(parseInt(parts[2]) || 1);
          } else if (view === 'universe' && parts[1]) {
            setSelectedUniverseSlug(parts[1]);
          } else if (view === 'community' && parts[1]) {
            setSelectedCommunitySlug(parts[1]);
          }
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (view: string, data?: any) => {
    setCurrentView(view);
    if (view === 'story' && data) {
      setSelectedStorySlug(data);
      window.location.hash = `story/${data}`;
    } else if (view === 'reader' && data) {
      setSelectedStorySlug(data.slug);
      setSelectedChapterNumber(data.chapterNumber || 1);
      window.location.hash = `reader/${data.slug}/${data.chapterNumber || 1}`;
    } else if (view === 'universe' && data) {
      setSelectedUniverseSlug(data);
      window.location.hash = `universe/${data}`;
    } else if (view === 'community' && data) {
      setSelectedCommunitySlug(data);
      window.location.hash = `community/${data}`;
    } else if (view === 'editor' && data) {
      setEditorStoryId(data.storyId);
      setEditorChapterId(data.chapterId);
      window.location.hash = `editor`;
    } else {
      window.location.hash = view;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If in Reader mode, ReaderView takes over the full viewport
  if (currentView === 'reader') {
    return (
      <ReaderView
        storySlug={selectedStorySlug}
        chapterNumber={selectedChapterNumber}
        onExit={() => navigateTo('story', selectedStorySlug)}
        onSelectChapter={(num) => {
          setSelectedChapterNumber(num);
          window.location.hash = `reader/${selectedStorySlug}/${num}`;
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#fff7fb] text-[#26152b] flex flex-col font-sans selection:bg-[#fee7ff] selection:text-[#9e3b5f]">
      
      {/* Top Main Navigation Bar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => navigateTo(view)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNotifs={() => setIsNotificationOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomeView
            onNavigate={(view, data) => navigateTo(view, data)}
            onOpenStory={(slug) => navigateTo('story', slug)}
            onReadChapter={(slug, num) => navigateTo('reader', { slug, chapterNumber: num })}
            onOpenUniverse={(slug) => navigateTo('universe', slug)}
            onOpenCommunity={(slug) => navigateTo('community', slug)}
          />
        )}

        {currentView === 'discover' && (
          <DiscoverView
            onOpenStory={(slug) => navigateTo('story', slug)}
            onReadChapter={(slug, num) => navigateTo('reader', { slug, chapterNumber: num })}
          />
        )}

        {currentView === 'story' && (
          <StoryDetailView
            storyIdOrSlug={selectedStorySlug}
            onBack={() => navigateTo('discover')}
            onReadChapter={(slug, num) => navigateTo('reader', { slug, chapterNumber: num })}
            onOpenUniverse={(slug) => navigateTo('universe', slug)}
            onOpenAuthor={(username) => navigateTo('profile')}
          />
        )}

        {currentView === 'universes' && (
          <UniversesView
            onOpenUniverse={(slug) => navigateTo('universe', slug)}
            onCreateUniverse={() => setIsWorldBuilderOpen(true)}
          />
        )}

        {currentView === 'universe' && (
          <UniverseDetailView
            universeSlug={selectedUniverseSlug}
            onBack={() => navigateTo('universes')}
            onOpenStory={(slug) => navigateTo('story', slug)}
            onReadChapter={(slug, num) => navigateTo('reader', { slug, chapterNumber: num })}
          />
        )}

        {currentView === 'community' && (
          <CommunityView
            initialCommunitySlug={selectedCommunitySlug}
            onOpenStory={(slug) => navigateTo('story', slug)}
          />
        )}

        {currentView === 'anime' && (
          <AnimeHubView
            onOpenStory={(slug) => navigateTo('story', slug)}
          />
        )}

        {currentView === 'studio' && (
          <StudioDashboardView
            onCreateStory={() => navigateTo('create-story')}
            onEditChapter={(storyId, chapterId) => navigateTo('editor', { storyId, chapterId })}
            onOpenWorldBuilder={() => setIsWorldBuilderOpen(true)}
            onOpenCharacterBuilder={() => setIsCharacterBuilderOpen(true)}
            onOpenStoryDetail={(slug) => navigateTo('story', slug)}
          />
        )}

        {currentView === 'create-story' && (
          <CreateStoryView
            onBack={() => navigateTo('studio')}
            onStoryCreated={(storyId) => navigateTo('editor', { storyId })}
          />
        )}

        {currentView === 'editor' && (
          <ChapterEditorView
            storyId={editorStoryId}
            chapterId={editorChapterId}
            onBack={() => navigateTo('studio')}
            onSaved={(slug, num) => navigateTo('reader', { slug, chapterNumber: num })}
          />
        )}

        {currentView === 'library' && (
          <LibraryView
            onOpenStory={(slug) => navigateTo('story', slug)}
            onReadChapter={(slug, num) => navigateTo('reader', { slug, chapterNumber: num })}
            onDiscover={() => navigateTo('discover')}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView
            onOpenStory={(slug) => navigateTo('story', slug)}
            onOpenStudio={() => navigateTo('studio')}
            onOpenAdmin={() => navigateTo('admin')}
          />
        )}

        {currentView === 'admin' && (
          <AdminPortalView
            onOpenStory={(slug) => navigateTo('story', slug)}
            onOpenUniverse={(slug) => navigateTo('universe', slug)}
            onExitAdmin={() => navigateTo('home')}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentView={currentView}
        onNavigate={(view) => navigateTo(view)}
      />

      {/* Global Modals & Drawers */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectStory={(slug) => navigateTo('story', slug)}
        onSelectUniverse={(slug) => navigateTo('universe', slug)}
        onSelectCommunity={(slug) => navigateTo('community', slug)}
        onSelectAnime={() => navigateTo('anime')}
      />

      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onNavigateStory={(slug) => navigateTo('story', slug)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAdminLogin={() => navigateTo('admin')}
      />

      <WorldBuilderModal
        isOpen={isWorldBuilderOpen}
        onClose={() => setIsWorldBuilderOpen(false)}
      />

      <CharacterBuilderModal
        isOpen={isCharacterBuilderOpen}
        onClose={() => setIsCharacterBuilderOpen(false)}
      />

      {/* Global Footer (Desktop & Tablet) */}
      <footer className="border-t border-pink-100/80 bg-white/60 py-8 px-4 sm:px-6 lg:px-8 text-xs text-[#877276] mb-14 md:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-[#9e3b5f] font-display">KAIRO</span>
            <span>•</span>
            <span>Social Storytelling, Anime & Fictional Universes</span>
          </div>
          <div className="flex items-center gap-4 font-semibold text-[#544246]">
            <button onClick={() => navigateTo('discover')} className="hover:text-[#9e3b5f]">Discover</button>
            <button onClick={() => navigateTo('universes')} className="hover:text-[#9e3b5f]">Lore Universes</button>
            <button onClick={() => navigateTo('anime')} className="hover:text-[#9e3b5f]">Anime Hub</button>
            <button onClick={() => navigateTo('studio')} className="hover:text-[#9e3b5f]">Creator Studio</button>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ReaderProvider>
        <KairoApp />
      </ReaderProvider>
    </AuthProvider>
  );
}
