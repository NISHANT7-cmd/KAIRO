import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Feather, Save, Sparkles, Check, Clock, 
  FileText, Bold, Italic, Quote, Heading, Eye 
} from 'lucide-react';
import { Story, Chapter } from '../types';
import { api } from '../services/api';

interface ChapterEditorViewProps {
  storyId: string;
  chapterId?: string;
  onBack: () => void;
  onSaved: (storySlug: string, chapterNumber: number) => void;
}

export const ChapterEditorView: React.FC<ChapterEditorViewProps> = ({
  storyId,
  chapterId,
  onBack,
  onSaved,
}) => {
  const [story, setStory] = useState<Story | null>(null);
  const [chapterNumber, setChapterNumber] = useState(1);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [authorNote, setAuthorNote] = useState('');
  const [status, setStatus] = useState<'Published' | 'Draft'>('Published');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadEditorData();
  }, [storyId, chapterId]);

  const loadEditorData = async () => {
    setLoading(true);
    try {
      const res = await api.getStory(storyId);
      setStory(res.story);
      const chaps = res.chapters || [];

      if (chapterId) {
        const target = chaps.find(c => c.id === chapterId);
        if (target) {
          setChapterNumber(target.chapterNumber);
          setTitle(target.title);
          setSubtitle(target.subtitle || '');
          setContent(target.content);
          setAuthorNote(target.authorNote || '');
          setStatus(target.status);
        }
      } else {
        // Next chapter by default
        setChapterNumber(chaps.length + 1);
        setTitle(`The Journey Continues`);
        setContent(`The wind howled through the crystal spires of the celestial city, carrying whispers of ancient forgotten mana...\n\nStep by step, the journey unfolded into the unknown.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const handleSave = async (publishStatus: 'Published' | 'Draft') => {
    if (!story || !title.trim()) return;
    setSaving(true);
    try {
      const res = await api.saveChapter({
        id: chapterId,
        storyId: story.id,
        chapterNumber,
        title,
        subtitle: subtitle || undefined,
        content,
        authorNote: authorNote || undefined,
        status: publishStatus,
      });

      setSavedSuccess(true);
      setTimeout(() => {
        onSaved(story.slug || story.id, chapterNumber);
      }, 800);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !story) {
    return (
      <div className="text-center py-28 text-[#877276]">
        <Sparkles className="w-8 h-8 mx-auto mb-2 text-[#9e3b5f] animate-spin" />
        <p className="font-semibold text-sm">Preparing manuscript canvas...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28">
      
      {/* Top action navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-xs font-bold text-[#544246] border border-pink-100 shadow-2xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Editor</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="text-xs text-[#877276] hidden sm:flex items-center gap-2">
            <span>{(wordCount ?? 0).toLocaleString()} words</span>
            <span>•</span>
            <span>~{readingTime ?? 1} min read</span>
          </div>

          <button
            onClick={() => handleSave('Draft')}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-white border border-pink-200 text-xs font-bold text-[#544246] hover:bg-pink-50 cursor-pointer"
          >
            Save Draft
          </button>

          <button
            id="chapter-publish-btn"
            onClick={() => handleSave('Published')}
            disabled={saving}
            className="btn-gradient px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>Published!</span>
              </>
            ) : (
              <>
                <Feather className="w-4 h-4" />
                <span>{saving ? 'Publishing...' : 'Publish Chapter'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Main Canvas */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 border border-pink-200/90 shadow-xl space-y-6">
        
        {/* Story context label */}
        <div className="flex items-center justify-between pb-4 border-b border-pink-100 text-xs">
          <div className="font-bold text-[#9e3b5f]">
            Writing for: <span className="text-[#26152b]">{story.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#877276]">Chapter Number:</span>
            <input
              type="number"
              min={1}
              value={chapterNumber}
              onChange={e => setChapterNumber(parseInt(e.target.value) || 1)}
              className="w-14 h-7 px-2 rounded-lg bg-white border border-pink-200 text-xs font-bold text-center text-[#26152b]"
            />
          </div>
        </div>

        {/* Chapter Title & Subtitle */}
        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Chapter Title (e.g. Whispers of the Astral Leyline)"
            className="w-full text-2xl sm:text-3xl font-black font-display text-[#26152b] bg-transparent outline-none placeholder-[#877276]"
          />
          <input
            type="text"
            value={subtitle}
            onChange={e => setSubtitle(e.target.value)}
            placeholder="Subtitle or scene setting (Optional)"
            className="w-full text-sm font-serif italic text-[#544246] bg-transparent outline-none placeholder-[#877276]"
          />
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea
            rows={18}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your chapter manuscript here. Use double line breaks between paragraphs..."
            className="w-full p-4 sm:p-6 rounded-2xl bg-white/70 border border-pink-100 focus:border-[#9e3b5f] focus:ring-2 focus:ring-pink-200/50 outline-none text-base text-[#26152b] leading-relaxed font-serif whitespace-pre-wrap"
          />
        </div>

        {/* Author Note */}
        <div className="space-y-1.5 pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#877276]">
            Author's Note (Appears at end of chapter)
          </label>
          <textarea
            rows={2}
            value={authorNote}
            onChange={e => setAuthorNote(e.target.value)}
            placeholder="Thank your readers, tease the next chapter, or share behind-the-scenes thoughts..."
            className="w-full p-3 rounded-xl bg-white border border-pink-100 text-xs text-[#544246] outline-none"
          />
        </div>

      </div>

    </div>
  );
};
