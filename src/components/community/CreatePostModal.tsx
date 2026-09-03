import React, { useState } from 'react';
import { 
  X, MessageSquare, Sparkles, BarChart2, Image, ThumbsUp, 
  AlertTriangle, Plus, Trash2, BookOpen 
} from 'lucide-react';
import { Community, CommunityPost, PostType, User } from '../../types';
import { api } from '../../services/api';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  communities: Community[];
  defaultCommunityId?: string;
  user: User | null;
  onPostCreated: (post: CommunityPost) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  communities,
  defaultCommunityId,
  user,
  onPostCreated
}) => {
  const [communityId, setCommunityId] = useState(defaultCommunityId || communities[0]?.id || 'comm_1');
  const [postType, setPostType] = useState<PostType>('DISCUSSION');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tag, setTag] = useState('General');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [spoilerChapter, setSpoilerChapter] = useState(1);
  const [mediaUrl, setMediaUrl] = useState('');
  
  // Poll options
  const [pollOptions, setPollOptions] = useState<string[]>(['Option 1', 'Option 2']);
  
  // Recommendation fields
  const [recTitle, setRecTitle] = useState('');
  const [recCategory, setRecCategory] = useState<'Story' | 'Anime' | 'Manga'>('Story');
  const [recNote, setRecNote] = useState('');

  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, `Option ${pollOptions.length + 1}`]);
    }
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handlePollOptionChange = (index: number, val: string) => {
    const updated = [...pollOptions];
    updated[index] = val;
    setPollOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      const payload: any = {
        communityId,
        title: title.trim(),
        content: content.trim(),
        type: postType,
        tag: postType === 'THEORY' ? 'Theory' : tag,
        isSpoiler,
        spoilerChapter: isSpoiler ? Number(spoilerChapter) : undefined,
        mediaUrl: mediaUrl.trim() || undefined,
        mediaType: mediaUrl.trim() ? 'image' : undefined
      };

      if (postType === 'POLL') {
        payload.pollOptions = pollOptions
          .filter(o => o.trim().length > 0)
          .map((text, idx) => ({ id: `opt_${Date.now()}_${idx}`, text: text.trim(), votes: [] }));
      }

      if (postType === 'RECOMMENDATION') {
        payload.recommendation = {
          title: recTitle.trim() || title.trim(),
          category: recCategory,
          note: recNote.trim() || undefined
        };
      }

      const res = await api.createCommunityPost(payload);
      onPostCreated(res.post);
      onClose();
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-xl w-full border border-pink-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-pink-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#9e3b5f]" />
            <h3 className="font-display font-black text-lg text-[#26152b]">
              Create Community Thread
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
          {/* Community Selector */}
          <div>
            <label className="block text-xs font-bold text-[#26152b] mb-1">Select Channel / Fandom</label>
            <select
              value={communityId}
              onChange={e => setCommunityId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-pink-200 text-xs font-semibold outline-none focus:border-[#9e3b5f] bg-white"
            >
              {communities.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({(c.membersCount || 0).toLocaleString()} members)
                </option>
              ))}
            </select>
          </div>

          {/* Post Type Buttons */}
          <div>
            <label className="block text-xs font-bold text-[#26152b] mb-1.5">Post Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: 'DISCUSSION', label: 'Discussion', icon: MessageSquare },
                { type: 'THEORY', label: 'Theory & Lore', icon: Sparkles },
                { type: 'POLL', label: 'Poll / Vote', icon: BarChart2 },
                { type: 'RECOMMENDATION', label: 'Recommendation', icon: ThumbsUp },
              ].map(item => {
                const Icon = item.icon;
                const isSelected = postType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setPostType(item.type as PostType)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#9e3b5f] text-white border-[#9e3b5f] shadow-2xs'
                        : 'bg-white border-pink-200 text-[#544246] hover:bg-pink-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-[#26152b] mb-1">Headline / Question</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Will the Twin Eclipse tear apart the Archon Council?"
              className="w-full h-10 px-3.5 rounded-xl border border-pink-200 text-xs font-semibold outline-none focus:border-[#9e3b5f]"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-bold text-[#26152b] mb-1">Details & Thoughts</label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Share the full context, clues from chapters, or discussion prompts..."
              className="w-full p-3 rounded-xl border border-pink-200 text-xs outline-none focus:border-[#9e3b5f]"
            />
          </div>

          {/* Conditional: Poll Options */}
          {postType === 'POLL' && (
            <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100 space-y-2">
              <label className="block text-xs font-bold text-[#26152b]">Poll Options</label>
              <div className="space-y-2">
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={e => handlePollOptionChange(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 h-9 px-3 rounded-xl border border-pink-200 text-xs bg-white outline-none focus:border-[#9e3b5f]"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePollOption(idx)}
                        className="p-2 text-gray-400 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {pollOptions.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddPollOption}
                  className="text-xs font-bold text-[#9e3b5f] flex items-center gap-1 hover:underline pt-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add another option
                </button>
              )}
            </div>
          )}

          {/* Conditional: Recommendation */}
          {postType === 'RECOMMENDATION' && (
            <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100 space-y-3">
              <h4 className="text-xs font-bold text-[#26152b]">Recommendation Info</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#877276] mb-1">Medium</label>
                  <select
                    value={recCategory}
                    onChange={e => setRecCategory(e.target.value as any)}
                    className="w-full h-9 px-2 rounded-xl border border-pink-200 text-xs bg-white outline-none"
                  >
                    <option value="Story">Story / Web Novel</option>
                    <option value="Anime">Anime Series</option>
                    <option value="Manga">Manga</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#877276] mb-1">Title</label>
                  <input
                    type="text"
                    value={recTitle}
                    onChange={e => setRecTitle(e.target.value)}
                    placeholder="Title to check out"
                    className="w-full h-9 px-3 rounded-xl border border-pink-200 text-xs bg-white outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Media URL / Fan Art */}
          <div>
            <label className="block text-xs font-bold text-[#26152b] mb-1">Image / Media Attachment URL (Optional)</label>
            <input
              type="url"
              value={mediaUrl}
              onChange={e => setMediaUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full h-9 px-3.5 rounded-xl border border-pink-200 text-xs outline-none focus:border-[#9e3b5f]"
            />
          </div>

          {/* Spoiler Protection */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/60 border border-amber-200/60">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <div>
                <h5 className="text-xs font-bold text-amber-900">Mark as Spoiler</h5>
                <p className="text-[10px] text-amber-700">Blurs content until readers choose to reveal</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isSpoiler && (
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-[11px] text-amber-900">Through Ch.</span>
                  <input
                    type="number"
                    min={1}
                    value={spoilerChapter}
                    onChange={e => setSpoilerChapter(Number(e.target.value))}
                    className="w-12 h-7 px-1.5 rounded-lg border border-amber-300 bg-white text-xs text-center outline-none"
                  />
                </div>
              )}
              <input
                type="checkbox"
                checked={isSpoiler}
                onChange={e => setIsSpoiler(e.target.checked)}
                className="w-4 h-4 rounded text-[#9e3b5f] cursor-pointer"
              />
            </div>
          </div>

          {/* Submit buttons */}
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
              disabled={submitting || !title.trim() || !content.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f47fa5] to-[#9e3b5f] text-white text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Publishing...' : 'Publish Thread'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
