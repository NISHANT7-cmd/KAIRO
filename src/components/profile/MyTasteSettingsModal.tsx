import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Sliders,
  RotateCcw,
  Check,
  X,
  Shield,
  Eye,
  EyeOff,
  UserX,
  VolumeX,
  RefreshCw,
  Award,
  BookOpen,
  Globe,
  Trash2,
  HelpCircle,
  Flame,
  Info
} from 'lucide-react';
import { api } from '../../services/api';
import { UserInterestProfile, StoryDna, User } from '../../types';
import { useLanguage, SupportedLanguage } from '../../context/LanguageContext';

interface MyTasteSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetakeOnboarding: () => void;
  currentUser: User | null;
}

const ALL_GENRES = [
  'Fantasy', 'Dark Fantasy', 'Romance', 'Sci-Fi', 'Action', 'Adventure',
  'Thriller', 'Mystery', 'Horror', 'Supernatural', 'Comedy', 'Drama',
  'Slice of Life', 'Historical', 'Psychological', 'Sports', 'Crime', 'School', 'Isekai', 'Mecha'
];

const ALL_STYLES = [
  'Fast-paced action', 'Deep world-building', 'Psychological stories', 'Plot twists',
  'Emotional stories', 'Slow-burn romance', 'Character-driven drama', 'Mystery & secrets',
  'Underdog stories', 'Dark & mature themes', 'Comedy & lighthearted stories', 'Magical adventures'
];

export const MyTasteSettingsModal: React.FC<MyTasteSettingsModalProps> = ({
  isOpen,
  onClose,
  onRetakeOnboarding,
  currentUser,
}) => {
  const { currentLanguage, setLanguage, supportedLanguages, t } = useLanguage();
  const [profile, setProfile] = useState<UserInterestProfile | null>(null);
  const [storyDna, setStoryDna] = useState<StoryDna | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'dna' | 'genres' | 'habits' | 'privacy'>('dna');

  // Negative signal restore feedback message
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await api.getTasteProfile();
      setProfile(res.profile);
      setStoryDna(res.storyDna);
    } catch (err) {
      console.error('Failed to load taste profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      if (profile.preferredUiLanguage && profile.preferredUiLanguage !== currentLanguage) {
        setLanguage(profile.preferredUiLanguage as SupportedLanguage);
      }
      const res = await api.updateTasteProfile(profile);
      setProfile(res.profile);
      setStoryDna(res.storyDna);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset your personalization back to initial platform defaults? This will clear your behavioral adjustments and negative signals.')) {
      return;
    }
    setSaving(true);
    try {
      const res = await api.resetPersonalization();
      setProfile(res.profile);
      setStoryDna(res.storyDna);
      setFeedbackMsg('Personalization baseline reset successfully.');
      setTimeout(() => setFeedbackMsg(null), 3500);
    } catch (err) {
      console.error('Failed to reset:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreSignal = async (type: 'story' | 'genre' | 'author', targetId: string) => {
    try {
      const res = await api.restoreRecommendationFeedback({ type, targetId });
      setProfile(res.profile);
      setFeedbackMsg(`Restored ${targetId} into your recommendation feed.`);
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err) {
      console.error('Failed to restore signal:', err);
    }
  };

  const toggleGenreWeight = (genre: string) => {
    if (!profile) return;
    const current = profile.preferredGenres || {};
    const newWeight = (current[genre] || 0) > 0.4 ? 0 : 0.85;
    const updated = { ...current };
    if (newWeight === 0) {
      delete updated[genre];
    } else {
      updated[genre] = newWeight;
    }
    setProfile({ ...profile, preferredGenres: updated });
  };

  const toggleStyleWeight = (style: string) => {
    if (!profile) return;
    const current = profile.preferredStoryStyles || {};
    const newWeight = (current[style] || 0) > 0.4 ? 0 : 0.9;
    const updated = { ...current };
    if (newWeight === 0) {
      delete updated[style];
    } else {
      updated[style] = newWeight;
    }
    setProfile({ ...profile, preferredStoryStyles: updated });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 to-rose-500/20 text-amber-400 border border-amber-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">My Taste, Language & Settings</h3>
              <p className="text-xs text-zinc-400">View and fine-tune your Story DNA, UI language, and personalized recommendations</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center space-x-1 px-6 pt-3 border-b border-zinc-800/80 bg-zinc-900/50 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveSubTab('dna')}
            className={`pb-3 px-3 border-b-2 transition flex items-center space-x-1.5 ${
              activeSubTab === 'dna'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Story DNA</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('genres')}
            className={`pb-3 px-3 border-b-2 transition flex items-center space-x-1.5 ${
              activeSubTab === 'genres'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Genres & Style</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('habits')}
            className={`pb-3 px-3 border-b-2 transition flex items-center space-x-1.5 ${
              activeSubTab === 'habits'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Language & Habits</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('privacy')}
            className={`pb-3 px-3 border-b-2 transition flex items-center space-x-1.5 ${
              activeSubTab === 'privacy'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy & Negative Signals</span>
          </button>
        </div>

        {/* Status messages */}
        {feedbackMsg && (
          <div className="px-6 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-xs text-emerald-400 flex items-center space-x-2">
            <Check className="w-4 h-4" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-12 text-center text-zinc-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
              Loading your taste model...
            </div>
          ) : !profile ? (
            <div className="py-8 text-center space-y-3">
              <p className="text-sm text-zinc-400">No interest profile found. Start by running the onboarding flow!</p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRetakeOnboarding();
                }}
                className="px-4 py-2 bg-amber-500 text-black font-semibold text-xs rounded-xl"
              >
                Launch Onboarding
              </button>
            </div>
          ) : (
            <>
              {/* TAB 1: STORY DNA */}
              {activeSubTab === 'dna' && (
                <div className="space-y-5">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-800/80 via-zinc-900 to-black border border-zinc-700/80 shadow-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                        Synthesized Profile
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40">
                        {storyDna?.primaryArchetype || 'The Imaginative Wanderer'}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Your Story DNA represents your cumulative reading affinity, combining your onboarding preferences with ongoing reading completions, bookmarks, and author affinities.
                    </p>

                    <div className="space-y-2.5 pt-2">
                      <span className="text-xs font-semibold text-zinc-200 block">Top Genre Affinities</span>
                      {(storyDna?.topGenres || []).map((genre) => (
                        <div key={genre.name} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="flex items-center space-x-1.5 text-zinc-200">
                              <span>{genre.emoji}</span>
                              <span>{genre.name}</span>
                            </span>
                            <span className="text-amber-400 font-medium">{genre.weight}%</span>
                          </div>
                          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-rose-500"
                              style={{ width: `${genre.weight}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex flex-wrap gap-2 text-xs text-zinc-300">
                      <span className="px-3 py-1 rounded-lg bg-zinc-800 border border-zinc-700">
                        📖 Medium: {storyDna?.primaryMedium || 'Light Novels'}
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-zinc-800 border border-zinc-700">
                        ⏱️ Cadence: {storyDna?.readingPace || 'Daily Pace'}
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-zinc-800 border border-zinc-700">
                        🌐 Languages: {storyDna?.languages?.join(', ') || 'English'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/40 border border-zinc-800">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Want to refresh your profile?</h4>
                      <p className="text-xs text-zinc-400">You can retake the interactive 7-step onboarding at any time.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onRetakeOnboarding();
                      }}
                      className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition border border-zinc-700"
                    >
                      Retake Questionnaire
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: GENRES & STYLES */}
              {activeSubTab === 'genres' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Preferred Genres</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Click genres to toggle them in your recommendation weights.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {ALL_GENRES.map((g) => {
                        const weight = profile.preferredGenres?.[g] || 0;
                        const isSelected = weight > 0.4;
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => toggleGenreWeight(g)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center space-x-1.5 ${
                              isSelected
                                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-semibold'
                                : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            <span>{g}</span>
                            {isSelected && <Check className="w-3 h-3 text-amber-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-800">
                    <h4 className="text-sm font-semibold text-white">Storytelling Styles</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">Narrative elements prioritized in your feed.</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {ALL_STYLES.map((s) => {
                        const weight = profile.preferredStoryStyles?.[s] || 0;
                        const isSelected = weight > 0.4;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleStyleWeight(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center space-x-1.5 ${
                              isSelected
                                ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 font-semibold'
                                : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            <span>{s}</span>
                            {isSelected && <Check className="w-3 h-3 text-rose-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: LANGUAGES & HABITS */}
              {activeSubTab === 'habits' && (
                <div className="space-y-6">
                  {/* UX Display Language */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-white">{t('taste_active_ui_lang', 'Interface Display Language')}</h4>
                        <p className="text-xs text-zinc-400 mt-0.5">Controls the visual text and dynamically tailors recommendations.</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40">
                        {profile.preferredUiLanguage || currentLanguage}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                      {supportedLanguages.map((lang) => {
                        const isCurrent = (profile.preferredUiLanguage || currentLanguage) === lang.id;
                        return (
                          <button
                            key={lang.id}
                            type="button"
                            onClick={() => {
                              setProfile({ ...profile, preferredUiLanguage: lang.id });
                              setLanguage(lang.id);
                            }}
                            className={`p-2.5 rounded-xl border text-xs text-left transition flex items-center justify-between cursor-pointer ${
                              isCurrent
                                ? 'bg-amber-500/20 border-amber-500/60 text-white font-semibold'
                                : 'bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:border-zinc-500'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">{lang.flag}</span>
                              <div>
                                <span className="block font-medium">{lang.native}</span>
                                <span className="text-[10px] text-zinc-400">{lang.label}</span>
                              </div>
                            </div>
                            {isCurrent && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reading Content Languages */}
                  <div className="pt-4 border-t border-zinc-800">
                    <h4 className="text-sm font-semibold text-white">{t('taste_reading_langs', 'Content Languages')}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">Languages prioritized in search, personalized rails, and discovery.</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['English', 'Japanese', 'Hindi', 'Marathi', 'Spanish', 'French', 'Korean', 'German', 'Portuguese'].map((lang) => {
                        const isSel = (profile.preferredLanguages || []).includes(lang);
                        return (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => {
                              const curr = profile.preferredLanguages || [];
                              const updated = isSel ? curr.filter(l => l !== lang) : [...curr, lang];
                              setProfile({ ...profile, preferredLanguages: updated });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs border transition cursor-pointer flex items-center gap-1.5 ${
                              isSel
                                ? 'bg-amber-500/20 border-amber-500/60 text-white font-medium'
                                : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            <span>{lang}</span>
                            {isSel && <Check className="w-3 h-3 text-amber-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-800">
                    <label className="text-xs font-semibold uppercase text-zinc-300 block mb-2">
                      Reading Cadence
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['Daily', 'A few times a week', 'Weekly', 'Whenever I visit'].map((cad) => (
                        <button
                          key={cad}
                          type="button"
                          onClick={() => setProfile({ ...profile, preferredReadingFrequency: cad })}
                          className={`p-2.5 rounded-xl border text-xs text-center transition cursor-pointer ${
                            profile.preferredReadingFrequency === cad
                              ? 'bg-white text-black font-semibold border-white'
                              : 'bg-zinc-800/40 border-zinc-700 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {cad}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PRIVACY & NEGATIVE SIGNALS */}
              {activeSubTab === 'privacy' && (
                <div className="space-y-6">
                  {/* Privacy switches */}
                  <div className="p-4 rounded-xl bg-zinc-800/40 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-semibold text-white block">Explainable Recommendations</span>
                        <span className="text-xs text-zinc-400">Show &ldquo;Why recommended for you&rdquo; chips on story cards.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={profile.showExplainability !== false}
                        onChange={(e) => setProfile({ ...profile, showExplainability: e.target.checked })}
                        className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                      <div>
                        <span className="text-sm font-semibold text-white block">Behavioral Learning</span>
                        <span className="text-xs text-zinc-400">Allow KAIRO to continuously tune weights from your reading progress.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={profile.allowBehavioralLearning !== false}
                        onChange={(e) => setProfile({ ...profile, allowBehavioralLearning: e.target.checked })}
                        className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Negative signals list */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Hidden Stories ({profile.negativeSignals?.hiddenStoryIds?.length || 0})</h4>
                      <p className="text-xs text-zinc-400">Stories you marked as &ldquo;Not interested&rdquo; or &ldquo;Don&apos;t recommend&rdquo;.</p>
                      <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
                        {(profile.negativeSignals?.hiddenStoryIds || []).length === 0 ? (
                          <span className="text-xs text-zinc-400 italic">No stories hidden.</span>
                        ) : (
                          profile.negativeSignals?.hiddenStoryIds.map((sid) => (
                            <div key={sid} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-800 text-xs">
                              <span className="text-zinc-300 truncate">Story ID: {sid}</span>
                              <button
                                type="button"
                                onClick={() => handleRestoreSignal('story', sid)}
                                className="text-amber-400 hover:underline text-[11px]"
                              >
                                Restore
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white">Muted Authors ({profile.negativeSignals?.mutedAuthorIds?.length || 0})</h4>
                      <p className="text-xs text-zinc-400">Authors excluded from your recommendations.</p>
                      <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
                        {(profile.negativeSignals?.mutedAuthorIds || []).length === 0 ? (
                          <span className="text-xs text-zinc-400 italic">No authors muted.</span>
                        ) : (
                          profile.negativeSignals?.mutedAuthorIds.map((aid) => (
                            <div key={aid} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-800 text-xs">
                              <span className="text-zinc-300 truncate">Author ID: {aid}</span>
                              <button
                                type="button"
                                onClick={() => handleRestoreSignal('author', aid)}
                                className="text-amber-400 hover:underline text-[11px]"
                              >
                                Unmute
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white">Disliked Genres ({profile.negativeSignals?.dislikedGenres?.length || 0})</h4>
                      <p className="text-xs text-zinc-400">Genres filtered out of your discovery feeds.</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(profile.negativeSignals?.dislikedGenres || []).length === 0 ? (
                          <span className="text-xs text-zinc-400 italic">No disliked genres.</span>
                        ) : (
                          profile.negativeSignals?.dislikedGenres.map((g) => (
                            <div key={g} className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-red-950/40 border border-red-900/50 text-red-300 text-xs">
                              <span>{g}</span>
                              <button
                                type="button"
                                onClick={() => handleRestoreSignal('genre', g)}
                                className="hover:text-white"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reset baseline button */}
                  <div className="pt-4 border-t border-zinc-800 flex justify-end">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-4 py-2 rounded-xl bg-red-900/30 hover:bg-red-900/50 text-red-300 text-xs font-medium border border-red-800/40 flex items-center space-x-2 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset All Personalization to Baseline</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-900/90 z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200"
          >
            Close
          </button>

          <div className="flex items-center space-x-3">
            {savedSuccess && (
              <span className="text-xs text-emerald-400 flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>Preferences saved!</span>
              </span>
            )}
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveProfile}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-semibold shadow-md shadow-amber-500/20 hover:opacity-95 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
