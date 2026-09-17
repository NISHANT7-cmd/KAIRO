import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Compass,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  BookOpen,
  Feather,
  Globe,
  MessageSquare,
  Palette,
  Search,
  Star,
  Zap,
  Flame,
  Brain,
  Heart,
  Smile,
  Moon,
  Users,
  Shuffle,
  Award,
  Layers,
  CheckCircle2,
  Sliders,
  Tv,
  HelpCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { User, Story, Community, UserInterestProfile, StoryDna } from '../../types';

interface OnboardingFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (user?: User) => void;
  currentUser: User | null;
}

// Visual genre definitions with emojis and descriptions
const GENRE_CARDS = [
  { id: 'Fantasy', name: 'Fantasy', icon: '✨', gradient: 'from-amber-500/20 to-purple-500/20', desc: 'Magic systems, ancient lore, and mythical races' },
  { id: 'Dark Fantasy', name: 'Dark Fantasy', icon: '🌑', gradient: 'from-zinc-700/40 to-red-950/40', desc: 'Grim fates, forbidden magic, and high stakes' },
  { id: 'Romance', name: 'Romance', icon: '💞', gradient: 'from-rose-500/20 to-pink-500/20', desc: 'Slow burns, fated bonds, and emotional arcs' },
  { id: 'Sci-Fi', name: 'Sci-Fi', icon: '🚀', gradient: 'from-cyan-500/20 to-blue-600/20', desc: 'Cybernetics, star-fleets, and synthetic minds' },
  { id: 'Action', name: 'Action', icon: '⚔️', gradient: 'from-orange-500/20 to-red-500/20', desc: 'Martial combat, arena duels, and adrenaline surges' },
  { id: 'Adventure', name: 'Adventure', icon: '🗺️', gradient: 'from-emerald-500/20 to-teal-500/20', desc: 'Expeditions into unknown continents & sky-isles' },
  { id: 'Thriller', name: 'Thriller', icon: '⚡', gradient: 'from-amber-600/20 to-orange-700/20', desc: 'Relentless tension, ticking clocks, and survival' },
  { id: 'Mystery', name: 'Mystery', icon: '🕵️', gradient: 'from-indigo-600/20 to-violet-800/20', desc: 'Conspiracies, hidden clues, and deep investigations' },
  { id: 'Horror', name: 'Horror', icon: '👁️', gradient: 'from-red-900/30 to-black', desc: 'Cosmic dread, abyssal shadows, and psychological fear' },
  { id: 'Supernatural', name: 'Supernatural', icon: '🔮', gradient: 'from-purple-600/20 to-violet-500/20', desc: 'Spirits, occult pacts, and parallel dimensions' },
  { id: 'Comedy', name: 'Comedy', icon: '😂', gradient: 'from-yellow-500/20 to-amber-500/20', desc: 'Witty banter, chaotic parties, and lighthearted fun' },
  { id: 'Drama', name: 'Drama', icon: '🎭', gradient: 'from-blue-600/20 to-indigo-700/20', desc: 'Complex relationships, family legacies, and internal strife' },
  { id: 'Slice of Life', name: 'Slice of Life', icon: '🍵', gradient: 'from-teal-500/20 to-emerald-600/20', desc: 'Cozy routines, tavern warmth, and comforting moments' },
  { id: 'Historical', name: 'Historical', icon: '🏛️', gradient: 'from-amber-700/20 to-stone-800/20', desc: 'Feudal dynasties, forgotten wars, and period authenticity' },
  { id: 'Psychological', name: 'Psychological', icon: '🧠', gradient: 'from-fuchsia-600/20 to-purple-800/20', desc: 'Mind games, unreliable narrators, and moral grayness' },
  { id: 'Sports', name: 'Sports', icon: '🏆', gradient: 'from-lime-600/20 to-emerald-700/20', desc: 'Competitive drive, team synergy, and tournament glory' },
  { id: 'Crime', name: 'Crime', icon: '🔍', gradient: 'from-slate-600/20 to-zinc-800/20', desc: 'Underworld syndicates, detectives, and heist crews' },
  { id: 'School', name: 'School', icon: '🎒', gradient: 'from-sky-500/20 to-blue-500/20', desc: 'Magic academies, rival dorms, and coming-of-age' },
  { id: 'Isekai', name: 'Isekai', icon: '🌀', gradient: 'from-violet-500/20 to-cyan-500/20', desc: 'Reborn in fantasy realms, game systems, and second chances' },
  { id: 'Mecha', name: 'Mecha', icon: '🤖', gradient: 'from-blue-600/20 to-stone-700/20', desc: 'Giant biomechanical armor, neural links, and planetary wars' },
];

const ROLES_OPTIONS = [
  { id: 'Reader', title: 'Reader', icon: BookOpen, desc: 'Discover serialized stories, follow authors, and build reading lists.' },
  { id: 'Writer', title: 'Writer', icon: Feather, desc: 'Publish serialized light novels, write chapters, and grow your audience.' },
  { id: 'World Builder', title: 'World Builder', icon: Globe, desc: 'Design deep magic systems, world maps, lore codexes, and characters.' },
  { id: 'Community Explorer', title: 'Community Explorer', icon: MessageSquare, desc: 'Participate in fan clubs, debate theories, vote in polls, and make friends.' },
  { id: 'Artist', title: 'Artist / Visualizer', icon: Palette, desc: 'Share character art, cover concepts, and visual world elements.' },
  { id: 'Anime Explorer', title: 'Anime Explorer', icon: Tv, desc: 'Track anime, bridge into light novels, and explore original fiction.' },
  { id: 'Reviewer', title: 'Reviewer / Critic', icon: Star, desc: 'Write in-depth chapter critiques, curate reviews, and rate stories.' },
];

const LANGUAGE_OPTIONS = [
  { id: 'English', label: 'English', native: 'English' },
  { id: 'Japanese', label: 'Japanese', native: '日本語' },
  { id: 'Hindi', label: 'Hindi', native: 'हिंदी' },
  { id: 'Marathi', label: 'Marathi', native: 'मराठी' },
  { id: 'Spanish', label: 'Spanish', native: 'Español' },
  { id: 'French', label: 'French', native: 'Français' },
  { id: 'Korean', label: 'Korean', native: '한국어' },
  { id: 'German', label: 'German', native: 'Deutsch' },
  { id: 'Portuguese', label: 'Portuguese', native: 'Português' },
  { id: 'Other', label: 'Other', native: 'Other' },
];

const STORY_STYLE_OPTIONS = [
  { id: 'Fast-paced action', label: 'Fast-paced action', icon: Zap },
  { id: 'Deep world-building', label: 'Deep world-building', icon: Globe },
  { id: 'Psychological stories', label: 'Psychological stories', icon: Brain },
  { id: 'Plot twists', label: 'Shocking plot twists', icon: Shuffle },
  { id: 'Emotional stories', label: 'Emotional & tear-jerkers', icon: Heart },
  { id: 'Slow-burn romance', label: 'Slow-burn romance', icon: Flame },
  { id: 'Character-driven drama', label: 'Character-driven drama', icon: Users },
  { id: 'Mystery & secrets', label: 'Mystery & secret lore', icon: Search },
  { id: 'Underdog stories', label: 'Underdog progression', icon: Award },
  { id: 'Dark & mature themes', label: 'Dark & mature themes', icon: Moon },
  { id: 'Comedy & lighthearted stories', label: 'Comedy & lighthearted', icon: Smile },
  { id: 'Magical adventures', label: 'Magical adventures', icon: Sparkles },
  { id: 'Ensemble casts', label: 'Rich ensemble casts', icon: Layers },
];

const ANIME_ENERGY_OPTIONS = [
  'Shonen (High energy, rivals & battles)',
  'Dark Fantasy (Grim worlds & consequences)',
  'Seinen (Mature, psychological & deep)',
  'Isekai (Otherworld rebirth & systems)',
  'Slice of Life & Rom-Com (Comforting)',
  'Sci-Fi & Cyberpunk (Futuristic tech)',
  'Supernatural & Occult (Spirits & curses)',
  'Magic Academia & Tournaments',
];

const READING_MEDIUMS = [
  'Light Novels',
  'Serialized Novels',
  'Original Fiction',
  'Manga-Style Stories',
  'Short Stories & Anthologies',
];

const HABITS_READING_WAY = [
  { id: 'Serialized chapters', label: 'Serialized Chapters', desc: 'I love following weekly or episodic releases.' },
  { id: 'Quick reads', label: 'Quick Bites (5-10 min)', desc: 'Short reading sessions on mobile or between tasks.' },
  { id: 'Long novels', label: 'Deep Multi-Hour Binge', desc: 'Immersing myself for hours in complete epics.' },
  { id: 'Light novels', label: 'Light Novel Format', desc: 'Brisk dialogue, cinematic pacing, and vivid tropes.' },
];

const HABITS_LENGTH = [
  { id: 'Short', label: 'Bite-Sized (< 30k words)' },
  { id: 'Medium', label: 'Standard Novel (30k - 100k words)' },
  { id: 'Long', label: 'Epic Universe (100k+ words)' },
  { id: 'No preference', label: 'Any length as long as it grips me' },
];

const HABITS_FREQUENCY = [
  { id: 'Daily', label: 'Daily reader' },
  { id: 'A few times a week', label: 'A few times a week' },
  { id: 'Weekly', label: 'Weekend reader' },
  { id: 'Whenever I visit', label: 'Casual explorer' },
];

const HABITS_ENDINGS = [
  { id: 'Happy', label: 'Satisfying & Triumphant' },
  { id: 'Bittersweet', label: 'Bittersweet & Poignant' },
  { id: 'Dark', label: 'Dark & Unforgiving' },
  { id: 'Unexpected', label: 'Mind-bending & Ambiguous' },
  { id: 'No preference', label: 'Surprise me' },
];

export const OnboardingFlowModal: React.FC<OnboardingFlowModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  currentUser,
}) => {
  // 0 = Welcome screen
  // 1 = Roles (Who are you)
  // 2 = Languages
  // 3 = Visual Genres (What pulls you in)
  // 4 = Story Style
  // 5 = Anime / Manga Taste
  // 6 = Reading Habits
  // 7 = First Interests & Creator Seed
  // 8 = Ready Screen (Story DNA)
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Form states
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Reader']);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);
  const [selectedUiLanguage, setSelectedUiLanguage] = useState<string>('English');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedAnimeTastes, setSelectedAnimeTastes] = useState<string[]>([]);
  const [selectedMediums, setSelectedMediums] = useState<string[]>(['Light Novels', 'Serialized Novels']);
  const [readingWay, setReadingWay] = useState<string>('Serialized chapters');
  const [storyLength, setStoryLength] = useState<string>('Medium');
  const [readingFreq, setReadingFreq] = useState<string>('Daily');
  const [endingStyle, setEndingStyle] = useState<string>('Unexpected');
  
  // Seeded interest selection
  const [seededStories, setSeededStories] = useState<Story[]>([]);
  const [seededCommunities, setSeededCommunities] = useState<Community[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Result state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [generatedStoryDna, setGeneratedStoryDna] = useState<StoryDna | null>(null);

  // Fetch initial seed stories & communities for Step 7
  useEffect(() => {
    if (isOpen) {
      api.getStories({ sort: 'popular' })
        .then(res => setSeededStories(res.stories || []))
        .catch(() => {});
      api.getCommunities()
        .then(res => setSeededCommunities(res.communities || []))
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalSteps = 7;

  // Toggle helper
  const toggleSelection = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleNext = () => {
    if (currentStep < 7) {
      setCurrentStep(prev => prev + 1);
    } else if (currentStep === 7) {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkipAll = async () => {
    setIsSubmitting(true);
    try {
      if (currentUser) {
        const res = await api.skipOnboarding();
        onComplete(res.user);
      } else {
        onClose();
      }
    } catch {
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const payload: Partial<UserInterestProfile> = {
        userRoles: selectedRoles,
        preferredLanguages: selectedLanguages,
        preferredUiLanguage: selectedUiLanguage,
        preferredGenres: selectedGenres.reduce((acc, g, idx) => {
          acc[g] = Math.max(0.6, 1.0 - idx * 0.05);
          return acc;
        }, {} as Record<string, number>),
        preferredStoryStyles: selectedStyles.reduce((acc, s) => {
          acc[s] = 0.9;
          return acc;
        }, {} as Record<string, number>),
        animePreferences: selectedAnimeTastes,
        readingMediumPreferences: selectedMediums,
        preferredSerialization: [readingWay],
        preferredStoryLengths: [storyLength],
        preferredReadingFrequency: readingFreq,
        preferredEndingStyles: [endingStyle],
        seededItemIds: selectedItemIds
      };

      if (currentUser) {
        const res = await api.completeOnboarding(payload);
        setGeneratedStoryDna(res.storyDna);
        setCurrentStep(8); // Move to final DNA screen
      } else {
        // Guest mode fallback
        setCurrentStep(8);
      }
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      setCurrentStep(8);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishAndEnter = () => {
    onComplete(currentUser || undefined);
    onClose();
  };

  // Determine can proceed
  const canProceed = () => {
    if (currentStep === 0) return true;
    if (currentStep === 1) return selectedRoles.length > 0;
    if (currentStep === 2) return selectedLanguages.length > 0;
    if (currentStep === 3) return selectedGenres.length >= 2; // at least 2
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 max-h-[92vh]"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/90 backdrop-blur z-10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white font-bold shadow-md shadow-amber-500/20">
              K
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold block">KAIRO Taste Engine</span>
              <span className="text-sm font-medium text-zinc-200">Personalized Universe Setup</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {currentStep > 0 && currentStep <= 7 && (
              <button
                type="button"
                onClick={handleSkipAll}
                className="text-xs text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition"
              >
                Skip for now
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar (Visible during steps 1-7) */}
        {currentStep >= 1 && currentStep <= 7 && (
          <div className="w-full bg-zinc-800/50 h-1 relative overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-500"
              initial={{ width: '0%' }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        {/* Step Indicator pill */}
        {currentStep >= 1 && currentStep <= 7 && (
          <div className="px-6 pt-4 flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold tracking-wide uppercase text-amber-400">
              Step {currentStep} of {totalSteps}
            </span>
            <span>
              {currentStep === 1 && 'Platform Persona'}
              {currentStep === 2 && 'Language Preferences'}
              {currentStep === 3 && 'Genre Taste'}
              {currentStep === 4 && 'Storytelling Style'}
              {currentStep === 5 && 'Anime & Medium'}
              {currentStep === 6 && 'Reading Habits'}
              {currentStep === 7 && 'First Discoveries'}
            </span>
          </div>
        )}

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <AnimatePresence mode="wait">
            {/* ----------------- STEP 0: CINEMATIC WELCOME ----------------- */}
            {currentStep === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="text-center py-6 md:py-10 space-y-6 max-w-lg mx-auto"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 via-rose-500/20 to-purple-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-500/10">
                  <Compass className="w-10 h-10 animate-pulse" />
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                    Welcome to KAIRO.
                  </h1>
                  <p className="text-base md:text-lg text-zinc-300 leading-relaxed">
                    Let’s discover what kind of stories belong in your universe.
                  </p>
                  <p className="text-xs text-zinc-400">
                    Takes less than 3 minutes. Your responses configure your personalized Home, Discover feeds, and community circles.
                  </p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-500 hover:opacity-95 text-white font-medium flex items-center justify-center space-x-2 shadow-lg shadow-rose-500/25 transition active:scale-95"
                  >
                    <span>Let’s Begin</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSkipAll}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 text-sm font-medium transition"
                  >
                    Skip for now
                  </button>
                </div>
              </motion.div>
            )}

            {/* ----------------- STEP 1: WHO ARE YOU ON KAIRO ----------------- */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white">Who are you on KAIRO?</h2>
                  <p className="text-sm text-zinc-400 mt-1">
                    Select all that apply. This customizes your navigation, dashboard tools, and creator connections.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ROLES_OPTIONS.map((role) => {
                    const Icon = role.icon;
                    const isSelected = selectedRoles.includes(role.id);
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => toggleSelection(selectedRoles, setSelectedRoles, role.id)}
                        className={`p-4 rounded-xl border text-left flex items-start space-x-3 transition-all ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30 text-white'
                            : 'bg-zinc-800/40 border-zinc-800 text-zinc-300 hover:bg-zinc-800/80 hover:border-zinc-700'
                        }`}
                      >
                        <div className={`p-2 rounded-lg mt-0.5 ${isSelected ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">{role.title}</span>
                            {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                          </div>
                          <p className="text-xs text-zinc-400 mt-1 leading-normal">{role.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ----------------- STEP 2: LANGUAGE PREFERENCES ----------------- */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white">Language Preferences</h2>
                  <p className="text-sm text-zinc-400 mt-1">
                    KAIRO hosts multi-lingual serials and translations. Choose your preferred reading languages.
                  </p>
                </div>

                {/* Content Languages (Multi-select) */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 block">
                    Languages you prefer to read in (Multi-select)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {LANGUAGE_OPTIONS.map((lang) => {
                      const isSelected = selectedLanguages.includes(lang.id);
                      return (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => toggleSelection(selectedLanguages, setSelectedLanguages, lang.id)}
                          className={`px-4 py-3 rounded-xl border text-left flex items-center justify-between transition ${
                            isSelected
                              ? 'bg-rose-500/15 border-rose-500/60 text-white font-medium'
                              : 'bg-zinc-800/40 border-zinc-800 text-zinc-300 hover:bg-zinc-800/80 hover:border-zinc-700'
                          }`}
                        >
                          <div>
                            <span className="text-sm block font-medium">{lang.label}</span>
                            <span className="text-xs text-zinc-500">{lang.native}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-rose-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* UI Language (Single-select) */}
                <div className="space-y-3 pt-2 border-t border-zinc-800/60">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 block">
                    KAIRO Interface Display Language
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGE_OPTIONS.slice(0, 6).map((lang) => {
                      const isSelected = selectedUiLanguage === lang.id;
                      return (
                        <button
                          key={`ui_${lang.id}`}
                          type="button"
                          onClick={() => setSelectedUiLanguage(lang.id)}
                          className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition ${
                            isSelected
                              ? 'bg-white text-black border-white shadow-sm'
                              : 'bg-zinc-800/60 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          {lang.label} ({lang.native})
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ----------------- STEP 3: VISUAL GENRE SELECTION ----------------- */}
            {currentStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">What kind of stories pull you in?</h2>
                    <p className="text-sm text-zinc-400 mt-1">
                      Choose at least 2 genres that match your literary taste.
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-zinc-800 text-xs font-medium text-amber-400 border border-zinc-700">
                    {selectedGenres.length} selected
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {GENRE_CARDS.map((genre) => {
                    const isSelected = selectedGenres.includes(genre.id);
                    return (
                      <button
                        key={genre.id}
                        type="button"
                        onClick={() => toggleSelection(selectedGenres, setSelectedGenres, genre.id)}
                        className={`relative p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all group overflow-hidden ${
                          isSelected
                            ? 'bg-zinc-800 border-amber-500/70 ring-1 ring-amber-500/40 text-white shadow-md'
                            : 'bg-zinc-800/40 border-zinc-800 text-zinc-300 hover:bg-zinc-800/80 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-2xl">{genre.icon}</span>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                              isSelected
                                ? 'bg-amber-500 border-amber-500 text-black'
                                : 'border-zinc-700 bg-zinc-800/50'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                        <div>
                          <span className="font-semibold text-sm block leading-tight">{genre.name}</span>
                          <span className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-snug">
                            {genre.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ----------------- STEP 4: STORY STYLE ----------------- */}
            {currentStep === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white">What storytelling styles do you enjoy?</h2>
                  <p className="text-sm text-zinc-400 mt-1">
                    Select the emotional and narrative beats that resonate with you most.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {STORY_STYLE_OPTIONS.map((style) => {
                    const Icon = style.icon;
                    const isSelected = selectedStyles.includes(style.id);
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => toggleSelection(selectedStyles, setSelectedStyles, style.id)}
                        className={`p-3.5 rounded-xl border text-left flex items-center space-x-3 transition ${
                          isSelected
                            ? 'bg-purple-500/15 border-purple-500/60 text-white ring-1 ring-purple-500/30'
                            : 'bg-zinc-800/40 border-zinc-800 text-zinc-300 hover:bg-zinc-800/80 hover:border-zinc-700'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-purple-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium flex-1">{style.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ----------------- STEP 5: ANIME & MEDIUM ----------------- */}
            {currentStep === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white">Anime & Medium Preferences</h2>
                  <p className="text-sm text-zinc-400 mt-1">
                    KAIRO bridges seasonal anime with serialized fiction and original light novels.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 block">
                    What anime energies do you gravitate toward?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ANIME_ENERGY_OPTIONS.map((anime) => {
                      const isSelected = selectedAnimeTastes.includes(anime);
                      return (
                        <button
                          key={anime}
                          type="button"
                          onClick={() => toggleSelection(selectedAnimeTastes, setSelectedAnimeTastes, anime)}
                          className={`p-3 rounded-xl border text-left text-xs font-medium transition flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500/60 text-white'
                              : 'bg-zinc-800/40 border-zinc-800 text-zinc-300 hover:bg-zinc-800/80 hover:border-zinc-700'
                          }`}
                        >
                          <span>{anime}</span>
                          {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-zinc-800/60">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 block">
                    What reading mediums do you prefer?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {READING_MEDIUMS.map((med) => {
                      const isSelected = selectedMediums.includes(med);
                      return (
                        <button
                          key={med}
                          type="button"
                          onClick={() => toggleSelection(selectedMediums, setSelectedMediums, med)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition flex items-center space-x-2 ${
                            isSelected
                              ? 'bg-rose-500/20 border-rose-500/70 text-white'
                              : 'bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                          }`}
                        >
                          <span>{med}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-rose-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ----------------- STEP 6: READING HABITS ----------------- */}
            {currentStep === 6 && (
              <motion.div
                key="step-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white">Your Reading Rhythm</h2>
                  <p className="text-sm text-zinc-400 mt-1">
                    Help us match chapter length, updates, and pacing to your schedule.
                  </p>
                </div>

                {/* How you read */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 block">
                    How do you usually read?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {HABITS_READING_WAY.map((hw) => (
                      <button
                        key={hw.id}
                        type="button"
                        onClick={() => setReadingWay(hw.id)}
                        className={`p-3 rounded-xl border text-left transition ${
                          readingWay === hw.id
                            ? 'bg-amber-500/15 border-amber-500/70 text-white ring-1 ring-amber-500/30'
                            : 'bg-zinc-800/40 border-zinc-800 text-zinc-300 hover:bg-zinc-800/80 hover:border-zinc-700'
                        }`}
                      >
                        <span className="font-semibold text-sm block">{hw.label}</span>
                        <span className="text-xs text-zinc-400 mt-0.5 block">{hw.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Length & Frequency */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800/60">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 block">
                      Preferred Story Scope
                    </label>
                    <div className="space-y-1.5">
                      {HABITS_LENGTH.map((len) => (
                        <button
                          key={len.id}
                          type="button"
                          onClick={() => setStoryLength(len.id)}
                          className={`w-full px-3 py-2 rounded-lg border text-left text-xs font-medium transition ${
                            storyLength === len.id
                              ? 'bg-white text-black border-white'
                              : 'bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                          }`}
                        >
                          {len.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 block">
                      Reading Cadence
                    </label>
                    <div className="space-y-1.5">
                      {HABITS_FREQUENCY.map((freq) => (
                        <button
                          key={freq.id}
                          type="button"
                          onClick={() => setReadingFreq(freq.id)}
                          className={`w-full px-3 py-2 rounded-lg border text-left text-xs font-medium transition ${
                            readingFreq === freq.id
                              ? 'bg-white text-black border-white'
                              : 'bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                          }`}
                        >
                          {freq.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ----------------- STEP 7: FIRST INTERESTS & SEED ----------------- */}
            {currentStep === 7 && (
              <motion.div
                key="step-7"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white">Pick Your First Discoveries</h2>
                  <p className="text-sm text-zinc-400 mt-1">
                    Select 2 or more stories or communities to seed your initial feed immediately.
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Filter stories or communities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-zinc-800/70 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Seed Stories */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 block">
                    Featured Stories
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {seededStories
                      .filter(s => !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.genre.toLowerCase().includes(searchQuery.toLowerCase()))
                      .slice(0, 4)
                      .map((story) => {
                        const isSelected = selectedItemIds.includes(story.id);
                        return (
                          <div
                            key={story.id}
                            onClick={() => toggleSelection(selectedItemIds, setSelectedItemIds, story.id)}
                            className={`p-3 rounded-xl border flex space-x-3 cursor-pointer transition ${
                              isSelected
                                ? 'bg-amber-500/15 border-amber-500/70 text-white ring-1 ring-amber-500/30'
                                : 'bg-zinc-800/40 border-zinc-800 text-zinc-300 hover:bg-zinc-800/80 hover:border-zinc-700'
                            }`}
                          >
                            <img
                              src={story.coverImage}
                              alt={story.title}
                              className="w-14 h-20 rounded-lg object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-amber-400">{story.genre}</span>
                                {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                              </div>
                              <h4 className="text-sm font-semibold text-white truncate mt-0.5">{story.title}</h4>
                              <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">{story.description}</p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Seed Communities */}
                {seededCommunities.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-zinc-800/60">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 block">
                      Recommended Communities
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {seededCommunities.slice(0, 2).map((comm) => {
                        const isSelected = selectedItemIds.includes(comm.id);
                        return (
                          <div
                            key={comm.id}
                            onClick={() => toggleSelection(selectedItemIds, setSelectedItemIds, comm.id)}
                            className={`p-3 rounded-xl border flex items-center space-x-3 cursor-pointer transition ${
                              isSelected
                                ? 'bg-rose-500/15 border-rose-500/70 text-white'
                                : 'bg-zinc-800/40 border-zinc-800 text-zinc-300 hover:bg-zinc-800/80 hover:border-zinc-700'
                            }`}
                          >
                            <img
                              src={comm.iconImage || comm.bannerImage}
                              alt={comm.name}
                              className="w-10 h-10 rounded-lg object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-semibold text-white truncate">{comm.name}</h4>
                              <span className="text-[10px] text-zinc-400">{comm.memberCount.toLocaleString()} members</span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-rose-400" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ----------------- STEP 8: READY & STORY DNA ----------------- */}
            {currentStep === 8 && (
              <motion.div
                key="step-8"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 py-4 text-center max-w-lg mx-auto"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center mx-auto text-white shadow-xl shadow-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-white">Your KAIRO is Ready</h2>
                  <p className="text-sm text-zinc-300">
                    We’ve mapped your literary taste and synthesized your personalized Story DNA.
                  </p>
                </div>

                {/* Story DNA Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-b from-zinc-800/80 to-zinc-900 border border-zinc-700 text-left space-y-4 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-700/60">
                    <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">Your Story Archetype</span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30">
                      {generatedStoryDna?.primaryArchetype || 'The Imaginative Wanderer'}
                    </span>
                  </div>

                  {/* Top Genres */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-zinc-300 block">Top Genre Affinities</span>
                    <div className="space-y-2">
                      {(generatedStoryDna?.topGenres || [
                        { name: 'Dark Fantasy', weight: 95, emoji: '🌑' },
                        { name: 'Fantasy', weight: 88, emoji: '✨' },
                        { name: 'Sci-Fi', weight: 75, emoji: '🚀' },
                      ]).map((genre) => (
                        <div key={genre.name} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="flex items-center space-x-1.5 text-zinc-200">
                              <span>{genre.emoji}</span>
                              <span>{genre.name}</span>
                            </span>
                            <span className="text-amber-400 font-semibold">{genre.weight}%</span>
                          </div>
                          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-rose-500"
                              style={{ width: `${genre.weight}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Badges summary */}
                  <div className="pt-2 flex flex-wrap gap-2 text-xs text-zinc-300">
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700">
                      📖 {generatedStoryDna?.primaryMedium || 'Light Novels'}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700">
                      ⏱️ {generatedStoryDna?.readingPace || 'Daily Pace'}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700">
                      🌐 {generatedStoryDna?.languages?.join(', ') || 'English'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleFinishAndEnter}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-500 hover:opacity-95 text-white font-medium flex items-center justify-center space-x-2 shadow-lg shadow-rose-500/25 transition active:scale-95"
                  >
                    <span>Enter KAIRO</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-sm font-medium transition"
                  >
                    Edit Preferences
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation (Steps 1 to 7) */}
        {currentStep >= 1 && currentStep <= 7 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800/80 bg-zinc-900/90 backdrop-blur z-10">
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 flex items-center space-x-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={!canProceed() || isSubmitting}
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-95 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-amber-500/20 transition active:scale-95"
              >
                <span>{currentStep === 7 ? 'Complete & Generate DNA' : 'Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
