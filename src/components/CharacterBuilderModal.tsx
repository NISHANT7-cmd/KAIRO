import React, { useState } from 'react';
import { Sparkles, X, User } from 'lucide-react';
import { api } from '../services/api';

interface CharacterBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCharacterCreated?: () => void;
}

export const CharacterBuilderModal: React.FC<CharacterBuilderModalProps> = ({
  isOpen,
  onClose,
  onCharacterCreated,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Protagonist' | 'Antagonist' | 'Companion' | 'Deity'>('Protagonist');
  const [age, setAge] = useState('19');
  const [primaryPower, setPrimaryPower] = useState('Astral Mana Blade & Void Phasing');
  const [biography, setBiography] = useState('');
  const [portrait, setPortrait] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await api.createCharacter({
        name,
        role,
        age,
        primaryPower,
        biography,
        portrait,
      });
      if (onCharacterCreated) onCharacterCreated();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg glass-card rounded-3xl p-6 sm:p-8 border border-pink-200 shadow-2xl space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-pink-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#9e3b5f]" />
            <h3 className="font-bold text-lg text-[#26152b] font-display">Character Profile Builder</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-[#544246] hover:bg-pink-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                Role
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-pink-200 text-xs font-semibold text-[#26152b] outline-none"
              >
                <option value="Protagonist">Protagonist</option>
                <option value="Antagonist">Antagonist</option>
                <option value="Companion">Companion</option>
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
                className="w-full h-10 px-3 rounded-xl bg-white border border-pink-200 text-xs outline-none"
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
                placeholder="e.g. Telekinesis"
                className="w-full h-10 px-3 rounded-xl bg-white border border-pink-200 text-xs outline-none"
              />
            </div>
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
              placeholder="Describe origin, allegiances, personal flaws, and narrative arc..."
              className="w-full p-3 rounded-xl bg-white border border-pink-200 text-xs outline-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1">
              Portrait Image URL
            </label>
            <input
              type="text"
              value={portrait}
              onChange={e => setPortrait(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-white border border-pink-200 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-pink-200 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-gradient px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
            >
              {loading ? 'Forging...' : 'Save Character'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
