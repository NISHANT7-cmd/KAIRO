import React, { useState, useEffect } from 'react';
import { 
  Globe, Sparkles, BookOpen, Users, Compass, ArrowLeft, 
  MapPin, Clock, Shield, Star, ChevronRight, Plus, Lightbulb 
} from 'lucide-react';
import { Universe, Story, Character, World, Theory } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface UniverseDetailViewProps {
  universeSlug: string;
  onBack: () => void;
  onOpenStory: (storySlug: string) => void;
  onReadChapter: (storySlug: string, chapterNumber: number) => void;
}

export const UniverseDetailView: React.FC<UniverseDetailViewProps> = ({
  universeSlug,
  onBack,
  onOpenStory,
  onReadChapter,
}) => {
  const { user } = useAuth();
  const [universe, setUniverse] = useState<Universe | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [theories, setTheories] = useState<Theory[]>([]);
  const [activeTab, setActiveTab] = useState<'stories' | 'worlds' | 'characters' | 'timeline' | 'rules' | 'theories'>('stories');
  const [loading, setLoading] = useState(true);

  // New Theory modal/form state
  const [showTheoryModal, setShowTheoryModal] = useState(false);
  const [theoryTitle, setTheoryTitle] = useState('');
  const [theoryDesc, setTheoryDesc] = useState('');

  useEffect(() => {
    loadUniverseData();
  }, [universeSlug]);

  const loadUniverseData = async () => {
    setLoading(true);
    try {
      const uniRes = await api.getUniverse(universeSlug);
      setUniverse(uniRes.universe);
      setStories(uniRes.stories || []);

      const [charsRes, worldsRes, theoriesRes] = await Promise.all([
        api.getCharacters(),
        api.getWorlds(),
        api.getTheories(),
      ]);

      setCharacters(charsRes.characters || []);
      setWorlds(worldsRes.worlds || []);
      setTheories(theoriesRes.theories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostTheory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!universe || !user || !theoryTitle.trim()) return;
    try {
      const res = await api.createTheory({
        universeId: universe.id,
        title: theoryTitle,
        description: theoryDesc,
        status: 'FAN_THEORY',
      });
      setTheories(prev => [res.theory, ...prev]);
      setShowTheoryModal(false);
      setTheoryTitle('');
      setTheoryDesc('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleVoteTheory = async (theoryId: string) => {
    try {
      const res = await api.voteTheory(theoryId);
      setTheories(prev => prev.map(t => t.id === theoryId ? { ...t, agreeCount: res.agreeCount } : t));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-28 text-[#877276]">
        <Sparkles className="w-8 h-8 mx-auto mb-2 text-[#635882] animate-spin" />
        <p className="font-semibold text-sm">Synchronizing universe codex...</p>
      </div>
    );
  }

  if (!universe) {
    return (
      <div className="text-center py-28 max-w-md mx-auto px-4 space-y-4">
        <h2 className="text-2xl font-bold font-display text-[#26152b]">Universe Not Found</h2>
        <p className="text-sm text-[#877276]">The universe lore or codex you requested does not exist or may have been archived.</p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#635882] text-white text-xs font-bold shadow-md hover:bg-[#50456c] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Universes</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-28">
      
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-xs font-bold text-[#544246] border border-pink-100 shadow-2xs transition-all cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Universes</span>
      </button>

      {/* Universe Cinematic Header */}
      <section className="relative rounded-3xl overflow-hidden glass-card border border-purple-200/80 shadow-xl">
        <div className="relative h-64 sm:h-80 w-full overflow-hidden">
          <img
            src={universe.bannerImage}
            alt={universe.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#26152b] via-[#26152b]/60 to-transparent" />

          <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#635882]/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest">
              <Globe className="w-3.5 h-3.5" />
              <span>SHARED CONTINUITY CODEX</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight">
              {universe.name}
            </h1>
            <p className="text-sm sm:text-base text-pink-200 font-serif italic max-w-2xl">
              "{universe.tagline}"
            </p>
          </div>
        </div>

        {/* Universe Meta Info */}
        <div className="p-6 sm:p-8 space-y-6">
          <p className="text-sm sm:text-base text-[#544246] leading-relaxed max-w-4xl">
            {universe.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 text-center">
              <div className="font-black text-xl text-[#635882]">{stories.length}</div>
              <div className="text-[10px] font-bold text-[#877276] uppercase tracking-wider mt-0.5">Stories</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 text-center">
              <div className="font-black text-xl text-[#635882]">{characters.length}</div>
              <div className="text-[10px] font-bold text-[#877276] uppercase tracking-wider mt-0.5">Characters</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 text-center">
              <div className="font-black text-xl text-[#635882]">{worlds.length}</div>
              <div className="text-[10px] font-bold text-[#877276] uppercase tracking-wider mt-0.5">Regions</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 text-center">
              <div className="font-black text-xl text-[#9e3b5f]">★ {universe.rating}</div>
              <div className="text-[10px] font-bold text-[#877276] uppercase tracking-wider mt-0.5">Lore Score</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-pink-100 overflow-x-auto hide-scrollbar">
        {[
          { id: 'stories', label: `Connected Stories (${stories.length})` },
          { id: 'worlds', label: `Continents & Regions (${worlds.length})` },
          { id: 'characters', label: `Characters (${characters.length})` },
          { id: 'timeline', label: 'Canon Timeline' },
          { id: 'rules', label: 'Magic & Laws' },
          { id: 'theories', label: `Theories & Lore (${theories.length})` },
        ].map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`universe-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                active 
                  ? 'border-[#635882] text-[#635882]' 
                  : 'border-transparent text-[#877276] hover:text-[#26152b]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Stories */}
      {activeTab === 'stories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map(story => (
            <div
              key={story.id}
              onClick={() => onOpenStory(story.slug || story.id)}
              className="glass-card rounded-3xl p-4 border border-pink-100 hover:border-purple-300 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="relative rounded-2xl overflow-hidden aspect-4/3 mb-3.5">
                  <img src={story.coverImage} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-2.5 left-2.5 bg-[#635882]/90 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">
                    {story.genre}
                  </div>
                </div>

                <h3 className="font-extrabold text-base text-[#26152b] font-display group-hover:text-[#635882] transition-colors line-clamp-1">
                  {story.title}
                </h3>
                <p className="text-xs text-[#544246] line-clamp-2 mt-1 leading-relaxed">
                  {story.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-pink-100 flex items-center justify-between">
                <span className="text-xs text-[#877276] font-semibold">{story.chaptersCount} Chapters</span>
                <span className="text-xs font-bold text-[#635882] flex items-center gap-1">
                  <span>Read</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Continents & Regions */}
      {activeTab === 'worlds' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {worlds.map(world => (
            <div key={world.id} className="glass-card rounded-3xl overflow-hidden border border-pink-100 shadow-md">
              <div className="h-48 relative">
                <img src={world.mapImageUrl} alt={world.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-3 left-3 text-white">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-pink-200">{world.climate}</div>
                  <h3 className="text-xl font-bold font-display">{world.name}</h3>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <p className="text-xs sm:text-sm text-[#544246] leading-relaxed">
                  {world.description}
                </p>

                <div className="pt-2 border-t border-pink-100 text-xs flex justify-between">
                  <span className="text-[#877276]">Capital City:</span>
                  <span className="font-bold text-[#26152b]">{world.capital}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Characters */}
      {activeTab === 'characters' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map(char => (
            <div key={char.id} className="glass-card rounded-3xl p-5 border border-purple-100 shadow-sm space-y-3">
              <div className="flex items-center gap-3.5">
                <img src={char.portrait} alt={char.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-200" />
                <div>
                  <div className="px-2 py-0.5 rounded-md bg-purple-100 text-[#635882] text-[10px] font-bold uppercase inline-block">
                    {char.role}
                  </div>
                  <h4 className="font-bold text-base text-[#26152b] font-display mt-0.5">{char.name}</h4>
                  <span className="text-xs text-[#877276]">Status: {char.status}</span>
                </div>
              </div>
              <div className="text-xs space-y-1.5 pt-2 border-t border-purple-50">
                <div className="text-[#635882] font-semibold">Ability: {char.primaryPower}</div>
                <p className="text-[#544246] line-clamp-3 leading-relaxed">{char.biography}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Timeline */}
      {activeTab === 'timeline' && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-purple-100 space-y-6">
          <h3 className="font-bold text-xl text-[#26152b] font-display">Canon Era Chronology</h3>
          <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-purple-200">
            {[
              { era: 'Era of the First Architects', year: 'Year 0 - 1,200', desc: 'The discovery of the primal Astral Leyline and construction of the Crystal Spire Citadels.' },
              { era: 'The Great Mana Shattering', year: 'Year 1,240', desc: 'Cataclysmic rupture across Solaria splitting the continental plates and unleashing etheric storms.' },
              { era: 'The Modern Astral Epoch', year: 'Current Era', desc: 'The rise of rogue astral drifters, cybernetic light-weavers, and the resurgence of the void.' },
            ].map((t, idx) => (
              <div key={idx} className="relative pl-8 space-y-1">
                <div className="absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-[#635882] border-2 border-white shadow-xs" />
                <div className="text-xs font-bold text-[#9e3b5f] uppercase tracking-wider">{t.year}</div>
                <h4 className="font-bold text-base text-[#26152b] font-display">{t.era}</h4>
                <p className="text-xs sm:text-sm text-[#544246] leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Rules */}
      {activeTab === 'rules' && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-purple-100 space-y-6">
          <h3 className="font-bold text-xl text-[#26152b] font-display">Cosmology & Laws of Magic</h3>
          <div className="space-y-4 text-sm text-[#544246] leading-relaxed">
            <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-100 space-y-2">
              <h4 className="font-bold text-sm text-[#635882]">1. The Law of Astral Resonance</h4>
              <p className="text-xs">{universe.magicSystemRules}</p>
            </div>
            <div className="p-4 rounded-2xl bg-pink-50/80 border border-pink-100 space-y-2">
              <h4 className="font-bold text-sm text-[#9e3b5f]">2. Void Degradation</h4>
              <p className="text-xs">Unanchored mana creates localized reality distortions known as Hollow Rifts. Only certified Navigators can traverse without physical corruption.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Theories */}
      {activeTab === 'theories' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xl text-[#26152b] font-display">Universe Theories & Mysteries</h3>
            {user && (
              <button
                onClick={() => setShowTheoryModal(true)}
                className="btn-gradient px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Submit Theory</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {theories.map(th => (
              <div key={th.id} className="glass-card rounded-3xl p-5 border border-purple-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-[#635882]">
                    {th.status}
                  </span>
                  <span className="text-[11px] text-[#877276]">By @{th.authorUsername}</span>
                </div>

                <h4 className="font-bold text-base text-[#26152b] font-display">{th.title}</h4>
                <p className="text-xs text-[#544246] leading-relaxed">{th.description}</p>

                <div className="pt-2 border-t border-purple-50 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleVoteTheory(th.id)}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#635882] font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>▲ Agree ({th.agreeCount})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* New Theory Modal */}
          {showTheoryModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="w-full max-w-lg glass-card rounded-3xl p-6 border border-purple-200 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-lg text-[#26152b] font-display">Submit Lore Theory</h3>
                <form onSubmit={handlePostTheory} className="space-y-4">
                  <input
                    type="text"
                    required
                    value={theoryTitle}
                    onChange={e => setTheoryTitle(e.target.value)}
                    placeholder="Theory Title (e.g. The Void Emperor's True Identity)"
                    className="w-full h-11 px-4 rounded-xl bg-white border border-pink-200 outline-none text-xs font-semibold text-[#26152b]"
                  />
                  <textarea
                    required
                    rows={4}
                    value={theoryDesc}
                    onChange={e => setTheoryDesc(e.target.value)}
                    placeholder="Provide evidence from the chapters and lore codex..."
                    className="w-full p-4 rounded-xl bg-white border border-pink-200 outline-none text-xs text-[#26152b]"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowTheoryModal(false)}
                      className="px-4 py-2 rounded-xl bg-white border border-pink-200 text-xs font-semibold text-[#544246]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-gradient px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Post Theory
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
