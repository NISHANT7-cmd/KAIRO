import React, { useState } from 'react';
import { X, Users, Globe, Lock, Sparkles, Image, Shield } from 'lucide-react';
import { Community, User } from '../../types';
import { api } from '../../services/api';

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onCommunityCreated: (community: Community) => void;
}

export const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({
  isOpen,
  onClose,
  user,
  onCommunityCreated
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'STORY_FANDOM' | 'ANIME_MANGA' | 'WRITING_CRAFT' | 'THEORIES_WORLDBUILDING' | 'FAN_ART'>('STORY_FANDOM');
  const [isPrivate, setIsPrivate] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [iconImage, setIconImage] = useState('');
  const [rules, setRules] = useState('1. Be respectful to fellow fans and authors.\n2. Use spoiler tags for new releases.\n3. Credit original artists and creators.');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const res = await api.createCommunity({
        name: name.trim(),
        slug,
        description: description.trim(),
        category,
        isPrivate,
        accessCode: isPrivate ? accessCode.trim() : undefined,
        bannerImage: bannerImage.trim() || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
        iconImage: iconImage.trim() || 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=200&auto=format&fit=crop&q=80',
        rules: rules.split('\n').filter(r => r.trim().length > 0)
      });
      onCommunityCreated(res.community);
      onClose();
    } catch (err) {
      console.error('Failed to create community:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-pink-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-pink-100">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#9e3b5f]" />
            <h3 className="font-display font-black text-lg text-[#26152b]">
              Create a New Community
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#26152b] mb-1">Community Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Cyberpunk Arcology Theorists"
              className="w-full h-10 px-3.5 rounded-xl border border-pink-200 text-xs font-semibold outline-none focus:border-[#9e3b5f]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#26152b] mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as any)}
              className="w-full h-10 px-3 rounded-xl border border-pink-200 text-xs font-semibold outline-none focus:border-[#9e3b5f] bg-white"
            >
              <option value="STORY_FANDOM">Story Fandom</option>
              <option value="ANIME_MANGA">Anime & Manga Discussions</option>
              <option value="WRITING_CRAFT">Writing Craft & Workshopping</option>
              <option value="THEORIES_WORLDBUILDING">Lore, Theories & Worldbuilding</option>
              <option value="FAN_ART">Fan Art & Visual Creations</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#26152b] mb-1">Community Description & Purpose</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What makes this fandom space unique? What can readers discuss here?"
              className="w-full p-3 rounded-xl border border-pink-200 text-xs outline-none focus:border-[#9e3b5f]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#26152b] mb-1">Banner Image URL</label>
              <input
                type="url"
                value={bannerImage}
                onChange={e => setBannerImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full h-9 px-3 rounded-xl border border-pink-200 text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#26152b] mb-1">Icon Avatar URL</label>
              <input
                type="url"
                value={iconImage}
                onChange={e => setIconImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full h-9 px-3 rounded-xl border border-pink-200 text-xs outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#26152b] mb-1">Community Guidelines / Rules</label>
            <textarea
              rows={3}
              value={rules}
              onChange={e => setRules(e.target.value)}
              className="w-full p-3 rounded-xl border border-pink-200 text-xs outline-none font-mono text-[11px]"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-pink-50/50 border border-pink-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPrivate ? <Lock className="w-4 h-4 text-amber-600" /> : <Globe className="w-4 h-4 text-emerald-600" />}
              <div>
                <h5 className="text-xs font-bold text-[#26152b]">
                  {isPrivate ? 'Private Fandom' : 'Public Fandom'}
                </h5>
                <p className="text-[10px] text-[#877276]">
                  {isPrivate ? 'Members require an invite or passcode to join' : 'Open for any reader or fan to join'}
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={isPrivate}
              onChange={e => setIsPrivate(e.target.checked)}
              className="w-4 h-4 rounded text-[#9e3b5f] cursor-pointer"
            />
          </div>

          {isPrivate && (
            <div>
              <label className="block text-xs font-bold text-[#26152b] mb-1">Fandom Access Passcode</label>
              <input
                type="text"
                required={isPrivate}
                value={accessCode}
                onChange={e => setAccessCode(e.target.value)}
                placeholder="e.g. ASTRAL2025"
                className="w-full h-9 px-3 rounded-xl border border-pink-200 text-xs outline-none"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-pink-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f47fa5] to-[#9e3b5f] text-white text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Community'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
