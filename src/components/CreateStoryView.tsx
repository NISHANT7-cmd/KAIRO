import React, { useState } from 'react';
import { Sparkles, ArrowLeft, ArrowRight, Check, Image as ImageIcon, Globe, BookOpen } from 'lucide-react';
import { StoryType, AgeRating, StoryStatus } from '../types';
import { api } from '../services/api';

interface CreateStoryViewProps {
  onBack: () => void;
  onStoryCreated: (storyId: string) => void;
}

export const CreateStoryView: React.FC<CreateStoryViewProps> = ({ onBack, onStoryCreated }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80');
  const [genre, setGenre] = useState('Fantasy');
  const [tagsInput, setTagsInput] = useState('Anime-Inspired, Light Novel, Original Universe');
  const [storyType, setStoryType] = useState<StoryType>('Light Novel');
  const [ageRating, setAgeRating] = useState<AgeRating>('Teen');
  const [language, setLanguage] = useState('English');
  const [status, setStatus] = useState<StoryStatus>('Ongoing');
  const [universeName, setUniverseName] = useState('The Astral Universe');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const coverPresets = [
    { label: 'Celestial Astral', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80' },
    { label: 'Dark Spire', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80' },
    { label: 'Cyberpunk Neon', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80' },
    { label: 'Starry Library', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80' },
  ];

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Please provide a story title.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const res = await api.createStory({
        title,
        description,
        coverImage,
        genre,
        tags,
        storyType,
        ageRating,
        language,
        status,
        universeName: universeName.trim() || undefined,
      });

      onStoryCreated(res.story.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-28">
      
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-xs font-bold text-[#544246] border border-pink-100 shadow-2xs transition-all cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Cancel & Back</span>
      </button>

      {/* Stepper Wizard Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fee7ff] text-[#9e3b5f] text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>STORY PUBLISHING WIZARD</span>
        </div>
        <h1 className="text-3xl font-black font-display text-[#26152b]">
          Create a New Story
        </h1>
        <div className="flex items-center justify-center gap-3 pt-3">
          {[
            { num: 1, label: 'Story Info' },
            { num: 2, label: 'Format & Cover' },
            { num: 3, label: 'Review & Launch' },
          ].map(s => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                step === s.num 
                  ? 'bg-[#9e3b5f] text-white shadow-xs' 
                  : step > s.num 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-pink-100 text-[#877276]'
              }`}>
                {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
              </div>
              <span className={`text-xs font-semibold hidden sm:inline ${step === s.num ? 'text-[#26152b]' : 'text-[#877276]'}`}>
                {s.label}
              </span>
              {s.num < 3 && <span className="text-[#dac0c5] mx-1">→</span>}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
          {error}
        </div>
      )}

      {/* Step 1: Info */}
      {step === 1 && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-pink-200/90 shadow-lg space-y-5 animate-in fade-in">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1.5">
              Story Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Celestial Drifters: Awakening"
              className="w-full h-11 px-4 rounded-xl bg-white border border-pink-200/80 focus:border-[#9e3b5f] outline-none text-sm font-semibold text-[#26152b]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1.5">
              Synopsis & Pitch *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the inciting incident, high-concept world, main character dilemmas..."
              className="w-full p-4 rounded-xl bg-white border border-pink-200/80 focus:border-[#9e3b5f] outline-none text-xs sm:text-sm text-[#26152b] leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1.5">
                Primary Genre
              </label>
              <select
                value={genre}
                onChange={e => setGenre(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-white border border-pink-200 text-xs font-semibold text-[#26152b] outline-none"
              >
                {['Fantasy', 'Dark Fantasy', 'Sci-Fi', 'Light Novel', 'Romance', 'Action', 'Cyberpunk', 'Mystery', 'Isekai'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1.5">
                Age Rating
              </label>
              <select
                value={ageRating}
                onChange={e => setAgeRating(e.target.value as any)}
                className="w-full h-11 px-3 rounded-xl bg-white border border-pink-200 text-xs font-semibold text-[#26152b] outline-none"
              >
                <option value="Everyone">Everyone (All Ages)</option>
                <option value="Teen">Teen (13+)</option>
                <option value="Mature">Mature (18+)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1.5">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="e.g. Magic Academy, Rivalry, Biomechanics, Space Opera"
              className="w-full h-11 px-4 rounded-xl bg-white border border-pink-200/80 focus:border-[#9e3b5f] outline-none text-xs text-[#26152b]"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => {
                if (!title.trim()) { setError('Story title is required'); return; }
                setError('');
                setStep(2);
              }}
              className="btn-gradient px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Next: Format & Cover</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Format & Cover */}
      {step === 2 && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-pink-200/90 shadow-lg space-y-6 animate-in fade-in">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-2">
              Story Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { type: 'Light Novel', desc: 'Serialized chapters with Japanese light novel aesthetic & pacing.' },
                { type: 'Serialized Novel', desc: 'Traditional serialized fantasy/sci-fi novel with standard pacing.' },
                { type: 'Manga-Style Story', desc: 'Fast-paced action dialogue and visual beat descriptors.' },
                { type: 'Short Story', desc: 'Self-contained 1-3 chapter episodic tale.' },
              ].map(item => (
                <div
                  key={item.type}
                  onClick={() => setStoryType(item.type as StoryType)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    storyType === item.type
                      ? 'bg-[#fee7ff] border-[#9e3b5f] ring-2 ring-pink-300'
                      : 'bg-white/80 border-pink-100 hover:bg-white'
                  }`}
                >
                  <div className="font-bold text-xs text-[#26152b]">{item.type}</div>
                  <div className="text-[11px] text-[#877276] mt-1">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-2">
              Cover Artwork
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {coverPresets.map(preset => (
                <div
                  key={preset.label}
                  onClick={() => setCoverImage(preset.url)}
                  className={`relative rounded-2xl overflow-hidden aspect-3/4 border-2 transition-all cursor-pointer ${
                    coverImage === preset.url ? 'border-[#9e3b5f] ring-2 ring-pink-400 scale-102' : 'border-transparent'
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2">
                    <span className="text-white text-[10px] font-bold">{preset.label}</span>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#877276] mb-1">
                Or custom image URL:
              </label>
              <input
                type="text"
                value={coverImage}
                onChange={e => setCoverImage(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-pink-200 text-xs text-[#26152b]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1.5">
              Universe Continuity Link (Optional)
            </label>
            <input
              type="text"
              value={universeName}
              onChange={e => setUniverseName(e.target.value)}
              placeholder="e.g. The Astral Universe"
              className="w-full h-11 px-4 rounded-xl bg-white border border-pink-200/80 focus:border-[#9e3b5f] outline-none text-xs text-[#26152b]"
            />
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-xl bg-white border border-pink-200 text-xs font-semibold text-[#544246]"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="btn-gradient px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Next: Review & Launch</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-pink-200/90 shadow-lg space-y-6 animate-in fade-in">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/80 border border-pink-100">
            <img src={coverImage} alt={title} className="w-20 h-28 object-cover rounded-xl shadow-xs" />
            <div>
              <span className="px-2 py-0.5 rounded-md bg-[#fee7ff] text-[#9e3b5f] text-[10px] font-bold">
                {genre} • {storyType}
              </span>
              <h3 className="font-bold text-lg text-[#26152b] font-display mt-1">{title}</h3>
              <p className="text-xs text-[#544246] line-clamp-2 mt-1">{description}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-2">
              Initial Publication Status
            </label>
            <div className="flex gap-3">
              {(['Ongoing', 'Draft'] as StoryStatus[]).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    status === st ? 'bg-[#9e3b5f] text-white border-[#9e3b5f]' : 'bg-white border-pink-200 text-[#544246]'
                  }`}
                >
                  {st === 'Ongoing' ? 'Public (Ongoing)' : 'Private (Draft)'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2.5 rounded-xl bg-white border border-pink-200 text-xs font-semibold text-[#544246]"
            >
              Back
            </button>
            <button
              id="confirm-create-story-btn"
              onClick={handleCreate}
              disabled={loading}
              className="btn-gradient px-8 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 cursor-pointer shadow-md"
            >
              {loading ? (
                <span>Publishing story...</span>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  <span>Create & Write First Chapter</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
