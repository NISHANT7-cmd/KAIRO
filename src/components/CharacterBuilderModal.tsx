import React, { useState, useEffect } from 'react';
import { Sparkles, X, Trash2, BookOpen, User as UserIcon } from 'lucide-react';
import { api } from '../services/api';
import { ImageUploader } from './ImageUploader';
import { Character, Story } from '../types';
import { useAuth } from '../context/AuthContext';

interface CharacterBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCharacterCreated?: () => void;
  onCharacterDeleted?: (id: string) => void;
  characterToEdit?: Character | null;
  defaultStoryId?: string;
  defaultStoryTitle?: string;
}

export const CharacterBuilderModal: React.FC<CharacterBuilderModalProps> = ({
  isOpen,
  onClose,
  onCharacterCreated,
  onCharacterDeleted,
  characterToEdit,
  defaultStoryId,
  defaultStoryTitle,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Protagonist' | 'Antagonist' | 'Companion' | 'Deity' | 'Rival' | 'Supporting' | 'Mentor'>('Protagonist');
  const [age, setAge] = useState('19');
  const [primaryPower, setPrimaryPower] = useState('Astral Mana Blade & Void Phasing');
  const [personality, setPersonality] = useState('');
  const [biography, setBiography] = useState('');
  const [portrait, setPortrait] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80');
  const [selectedStoryId, setSelectedStoryId] = useState<string>('');
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when modal opens or characterToEdit changes
  useEffect(() => {
    if (!isOpen) return;

    if (characterToEdit) {
      setName(characterToEdit.name || '');
      setRole((characterToEdit.role as any) || 'Protagonist');
      setAge(String(characterToEdit.age || '19'));
      setPrimaryPower(characterToEdit.primaryPower || '');
      setPersonality(characterToEdit.personality || '');
      setBiography(characterToEdit.biography || '');
      setPortrait(characterToEdit.portrait || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80');
      setSelectedStoryId(characterToEdit.storyId || defaultStoryId || '');
    } else {
      setName('');
      setRole('Protagonist');
      setAge('19');
      setPrimaryPower('Astral Mana Blade & Void Phasing');
      setPersonality('');
      setBiography('');
      setPortrait('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80');
      setSelectedStoryId(defaultStoryId || '');
    }
    setError(null);

    // Load writer's stories for the dropdown
    if (user) {
      api.getStories({ authorId: user.id })
        .then(res => setUserStories(res.stories || []))
        .catch(() => {});
    }
  }, [isOpen, characterToEdit, defaultStoryId, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a character name');
      return;
    }
    setLoading(true);
    setError(null);

    const chosenStory = userStories.find(s => s.id === selectedStoryId);
    const storyTitle = chosenStory?.title || defaultStoryTitle || undefined;

    try {
      if (characterToEdit) {
        await api.updateCharacter(characterToEdit.id, {
          name: name.trim(),
          role,
          age,
          primaryPower: primaryPower.trim(),
          personality: personality.trim(),
          biography: biography.trim(),
          portrait,
          storyId: selectedStoryId || undefined,
          storyTitle,
        });
      } else {
        await api.createCharacter({
          name: name.trim(),
          role,
          age,
          primaryPower: primaryPower.trim(),
          personality: personality.trim(),
          biography: biography.trim(),
          portrait,
          storyId: selectedStoryId || undefined,
          storyTitle,
        });
      }

      if (onCharacterCreated) onCharacterCreated();
      onClose();
    } catch (err: any) {
      console.error('[CharacterBuilderModal] error saving character:', err);
      setError(err?.message || 'Failed to save character profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!characterToEdit) return;
    if (!window.confirm(`Are you sure you want to delete "${characterToEdit.name}" from this story? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    setError(null);
    try {
      await api.deleteCharacter(characterToEdit.id);
      if (onCharacterDeleted) {
        onCharacterDeleted(characterToEdit.id);
      }
      if (onCharacterCreated) {
        onCharacterCreated();
      }
      onClose();
    } catch (err: any) {
      console.error('[CharacterBuilderModal] error deleting character:', err);
      setError(err?.message || 'Failed to delete character');
    } finally {
      setIsDeleting(false);
    }
  };

  const isEditing = Boolean(characterToEdit);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="w-full max-w-lg glass-card rounded-3xl p-6 sm:p-8 border border-pink-200 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-pink-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#9e3b5f]" />
            <h3 className="font-bold text-lg text-[#26152b] font-display">
              {isEditing ? 'Edit Character Profile' : 'Character Profile Builder'}
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 rounded-full text-[#544246] hover:bg-pink-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Associated Story selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1">
              Associated Manuscript / Story
            </label>
            <div className="relative">
              <BookOpen className="w-4 h-4 absolute left-3.5 top-3 text-[#9e3b5f]" />
              <select
                value={selectedStoryId}
                onChange={e => setSelectedStoryId(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-pink-200 text-xs font-semibold text-[#26152b] outline-none focus:border-[#9e3b5f]"
              >
                <option value="">-- Standalone / Unassigned Character --</option>
                {defaultStoryId && !userStories.some(s => s.id === defaultStoryId) && (
                  <option value={defaultStoryId}>{defaultStoryTitle || 'Current Story'}</option>
                )}
                {userStories.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.status})
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[10px] text-[#877276] mt-1 block">
              Characters linked to a story will appear directly on that story's public page and studio dossier.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1">
                Character Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Aria Vance"
                className="w-full h-10 px-3.5 rounded-xl bg-white border border-pink-200 text-xs font-semibold outline-none focus:border-[#9e3b5f]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1">
                Narrative Role
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-pink-200 text-xs font-semibold text-[#26152b] outline-none focus:border-[#9e3b5f]"
              >
                <option value="Protagonist">Protagonist</option>
                <option value="Antagonist">Antagonist</option>
                <option value="Companion">Companion</option>
                <option value="Rival">Rival</option>
                <option value="Mentor">Mentor</option>
                <option value="Supporting">Supporting</option>
                <option value="Deity">Deity / Mythic</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1">
                Age
              </label>
              <input
                type="text"
                value={age}
                onChange={e => setAge(e.target.value)}
                placeholder="e.g. 19"
                className="w-full h-10 px-3 rounded-xl bg-white border border-pink-200 text-xs outline-none focus:border-[#9e3b5f]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1">
                Abilities / Power
              </label>
              <input
                type="text"
                value={primaryPower}
                onChange={e => setPrimaryPower(e.target.value)}
                placeholder="e.g. Celestial Telekinesis"
                className="w-full h-10 px-3 rounded-xl bg-white border border-pink-200 text-xs outline-none focus:border-[#9e3b5f]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1">
              Personality & Archetype
            </label>
            <input
              type="text"
              value={personality}
              onChange={e => setPersonality(e.target.value)}
              placeholder="e.g. Fiercely loyal, sarcastic, struggles with celestial guilt..."
              className="w-full h-10 px-3.5 rounded-xl bg-white border border-pink-200 text-xs outline-none focus:border-[#9e3b5f]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1">
              Backstory & Motivations
            </label>
            <textarea
              rows={3}
              required
              value={biography}
              onChange={e => setBiography(e.target.value)}
              placeholder="Describe origin, allegiances, personal flaws, and narrative journey..."
              className="w-full p-3 rounded-xl bg-white border border-pink-200 text-xs outline-none leading-relaxed focus:border-[#9e3b5f]"
            />
          </div>

          <div>
            <ImageUploader
              id="character-portrait-upload"
              label="Character Portrait / Artwork"
              value={portrait}
              onChange={setPortrait}
              aspect="cover"
              helperText="Upload portrait directly from your gallery or device storage"
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-pink-100">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || loading}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white border border-pink-200 text-xs font-semibold text-[#544246] hover:bg-pink-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || isDeleting}
                className="btn-gradient px-5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs hover:shadow-md disabled:opacity-50"
              >
                {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Forge Character'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
