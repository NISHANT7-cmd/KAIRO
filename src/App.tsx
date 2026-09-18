import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ReaderProvider } from './context/ReaderContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
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
import { OnboardingFlowModal } from './components/onboarding/OnboardingFlowModal';
import { MyTasteSettingsModal } from './components/profile/MyTasteSettingsModal';
import { KairoLogo } from './components/KairoLogo';

export function KairoApp() {
  const { user, isAuthModalOpen, openAuthModal, closeAuthModal } = useAuth();

  // Navigation State
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedStorySlug, setSelectedStorySlug] = useState<string>('celestial-drifters');
  const [selectedChapterNumber, setSelectedChapterNumber] = useState<number>(1);
  const [selectedUniverseSlug, setSelectedUniverseSlug] = useState<string>('the-astral-universe');
  const [selectedCommunitySlug, setSelectedCommunitySlug] = useState<string>('astral-universe-fandom');
  const [selectedProfileIdOrUsername, setSelectedProfileIdOrUsername] = useState<string | undefined>(undefined);
  const [selectedProfileTab, setSelectedProfileTab] = useState<string | undefined>(undefined);
  const [editorStoryId, setEditorStoryId] = useState<string>('');
  const [editorChapterId, setEditorChapterId] = useState<string | undefined>(undefined);

  // Global Modals & Drawers
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWorldBuilderOpen, setIsWorldBuilderOpen] = useState(false);
  const [isCharacterBuilderOpen, setIsCharacterBuilderOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isMyTasteOpen, setIsMyTasteOpen] = useState(false);

  // Only prompt onboarding once right after user registration
  useEffect(() => {
    if (user) {
      const isJustRegistered = sessionStorage.getItem('kairo_just_registered') === 'true';
      const isLocallyCompleted = localStorage.getItem(`kairo_onboarding_completed_${user.id}`) === 'true';
      const hasCompleted = user.hasCompletedOnboarding || isLocallyCompleted;

      if (isJustRegistered && !hasCompleted) {
        sessionStorage.removeItem('kairo_just_registered');
        setIsOnboardingOpen(true);
      }
    }
  }, [user]);

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
          } else if (view === 'editor') {
            if (parts[1]) {
              setEditorStoryId(parts[1]);
              try { sessionStorage.setItem('kairo_last_editor_story_id', parts[1]); } catch {}
            } else {
              const saved = sessionStorage.getItem('kairo_last_editor_story_id');
              if (saved) setEditorStoryId(saved);
            }
            if (parts[2]) setEditorChapterId(parts[2]);
          } else if (view === 'profile') {
            const rawSlug = parts[1];
            if (rawSlug && rawSlug !== '[object Object]' && rawSlug !== 'undefined' && rawSlug !== 'null') {
              setSelectedProfileIdOrUsername(rawSlug);
            } else {
              setSelectedProfileIdOrUsername(user?.username || undefined);
            }
          }
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user]);

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
    } else if (view === 'profile') {
      let targetUsername: string | undefined = undefined;
      let targetTab: string | undefined = undefined;

      if (typeof data === 'string') {
        if (data && data !== '[object Object]' && data !== 'undefined' && data !== 'null') {
          targetUsername = data;
        }
      } else if (typeof data === 'object' && data !== null) {
        targetUsername = data.username || data.userId || data.id || undefined;
        targetTab = data.tab || undefined;
      }

      if (!targetUsername && user?.username) {
        targetUsername = user.username;
      }

      setSelectedProfileIdOrUsername(targetUsername);
      setSelectedProfileTab(targetTab);
      window.location.hash = targetUsername ? `profile/${targetUsername}` : 'profile';
    } else if (view === 'editor') {
      const sId = typeof data === 'string' ? data : (data?.storyId || '');
      const cId = typeof data === 'object' ? data?.chapterId : undefined;
      if (sId) {
        setEditorStoryId(sId);
        try { sessionStorage.setItem('kairo_last_editor_story_id', sId); } catch {}
      }
      setEditorChapterId(cId);
      const activeSId = sId || sessionStorage.getItem('kairo_last_editor_story_id') || '';
      window.location.hash = activeSId ? (cId ? `editor/${activeSId}/${cId}` : `editor/${activeSId}`) : 'editor';
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
        onNavigate={(view, data) => navigateTo(view, data)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNotifs={() => setIsNotificationOpen(true)}
        onOpenAuth={openAuthModal}
        onOpenMyTaste={() => setIsMyTasteOpen(true)}
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
            onOpenAuthor={(username) => navigateTo('profile', username)}
          />
        )}

        {currentView === 'story' && (
          <StoryDetailView
            storyIdOrSlug={selectedStorySlug}
            onBack={() => navigateTo('discover')}
            onReadChapter={(slug, num) => navigateTo('reader', { slug, chapterNumber: num })}
            onOpenUniverse={(slug) => navigateTo('universe', slug)}
            onOpenAuthor={(username) => navigateTo('profile', username)}
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
            onRequireAuth={openAuthModal}
            onOpenProfile={(username) => navigateTo('profile', username)}
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
            onReadChapter={(slug, num) => navigateTo('reader', { slug, chapterNumber: num })}
          />
        )}

        {currentView === 'create-story' && (
          <CreateStoryView
            onBack={() => navigateTo('studio')}
            onStoryCreated={(storyId) => {
              setEditorStoryId(storyId);
              setEditorChapterId(undefined);
              try { sessionStorage.setItem('kairo_last_editor_story_id', storyId); } catch {}
              navigateTo('editor', { storyId });
            }}
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
            userIdOrUsername={selectedProfileIdOrUsername}
            initialTab={selectedProfileTab}
            onOpenStory={(slug) => navigateTo('story', slug)}
            onOpenStudio={() => navigateTo('studio')}
            onOpenAdmin={() => navigateTo('admin')}
            onOpenUniverse={(slug) => navigateTo('universe', slug)}
            onOpenCommunity={(slug) => navigateTo('community', slug)}
            onNavigate={(view, data) => navigateTo(view, data)}
            onBack={() => navigateTo('home')}
            onOpenTasteSettings={() => setIsMyTasteOpen(true)}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
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
        onNavigate={(view, data) => navigateTo(view, data)}
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
        isOpen={isAuthOpen || isAuthModalOpen}
        onClose={() => {
          setIsAuthOpen(false);
          closeAuthModal();
        }}
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

      {/* 7-Step User Onboarding Flow Modal */}
      <OnboardingFlowModal
        isOpen={isOnboardingOpen}
        onClose={() => {
          setIsOnboardingOpen(false);
          if (user) {
            localStorage.setItem(`kairo_onboarding_completed_${user.id}`, 'true');
          }
        }}
        onComplete={() => {
          setIsOnboardingOpen(false);
          if (user) {
            localStorage.setItem(`kairo_onboarding_completed_${user.id}`, 'true');
          }
          navigateTo('home');
        }}
        onNavigateStory={(slug) => navigateTo('story', slug)}
      />

      {/* User Taste Profile & Story DNA Settings Modal */}
      <MyTasteSettingsModal
        isOpen={isMyTasteOpen}
        onClose={() => setIsMyTasteOpen(false)}
        onRetakeOnboarding={() => {
          setIsMyTasteOpen(false);
          setIsOnboardingOpen(true);
        }}
        currentUser={user}
      />

      {/* Global Footer (Desktop & Tablet) */}
      <footer className="border-t border-pink-100/80 bg-white/60 py-8 px-4 sm:px-6 lg:px-8 text-xs text-[#877276] mb-14 md:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => navigateTo('home')} 
              className="hover:opacity-80 transition-opacity cursor-pointer"
              title="KAIRO Home"
            >
              <KairoLogo size="xs" layout="horizontal" showTagline={false} />
            </button>
            <span className="text-pink-300">•</span>
            <span>Social Storytelling, Anime & Fictional Universes</span>
          </div>
          <div className="flex items-center gap-4 font-semibold text-[#544246]">
            <button onClick={() => navigateTo('discover')} className="hover:text-[#9e3b5f]">Discover</button>
            <button onClick={() => navigateTo('universes')} className="hover:text-[#9e3b5f]">Lore Universes</button>
            <button onClick={() => navigateTo('anime')} className="hover:text-[#9e3b5f]">Anime Hub</button>
            {(!user || user.role !== 'USER') && (
              <button onClick={() => navigateTo('studio')} className="hover:text-[#9e3b5f]">Creator Studio</button>
            )}
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ReaderProvider>
          <KairoApp />
        </ReaderProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
