import React, { useState } from 'react';
import { Globe, X, Sparkles, MapPin } from 'lucide-react';
import { api } from '../services/api';

interface WorldBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorldCreated?: () => void;
}

export const WorldBuilderModal: React.FC<WorldBuilderModalProps> = ({ isOpen, onClose, onWorldCreated }) => {
  const [name, setName] = useState('');
  const [climate, setClimate] = useState('High Fantasy / Floating Islands');
  const [description, setDescription] = useState('');
  const [capital, setCapital] = useState('');
  const [mapImageUrl, setMapImageUrl] = useState('https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await api.createWorld({
        name,
        climate,
        description,
        capital,
        mapImageUrl,
      });
      if (onWorldCreated) onWorldCreated();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg glass-card rounded-3xl p-6 sm:p-8 border border-purple-200 shadow-2xl space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-purple-100">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#635882]" />
            <h3 className="font-bold text-lg text-[#26152b] font-display">World & Region Codex Builder</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-[#544246] hover:bg-purple-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1">
              Region / Continent Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Solaria Imperialis"
              className="w-full h-10 px-3.5 rounded-xl bg-white border border-pink-200 text-xs font-semibold outline-none focus:border-[#635882]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1">
                Climate & Geography
              </label>
              <input
                type="text"
                value={climate}
                onChange={e => setClimate(e.target.value)}
                placeholder="e.g. Floating Islands"
                className="w-full h-10 px-3 rounded-xl bg-white border border-pink-200 text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1">
                Capital City
              </label>
              <input
                type="text"
                value={capital}
                onChange={e => setCapital(e.target.value)}
                placeholder="e.g. Lumis Citadel"
                className="w-full h-10 px-3 rounded-xl bg-white border border-pink-200 text-xs outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1">
              Lore Description & History
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe magical Leylines, governing factions, and key historical catastrophes..."
              className="w-full p-3 rounded-xl bg-white border border-pink-200 text-xs outline-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1">
              Map Image URL
            </label>
            <input
              type="text"
              value={mapImageUrl}
              onChange={e => setMapImageUrl(e.target.value)}
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
              {loading ? 'Creating...' : 'Save World Region'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
