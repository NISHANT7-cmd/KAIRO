import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Feather, Save, Sparkles, Check, Clock, 
  FileText, Bold, Italic, Quote, Heading, Eye, Trash2, 
  Split, Columns, Music, Volume2, MessageSquare, AlertCircle,
  Wand2, BookOpen, ChevronRight, X, RotateCcw, Image as ImageIcon
} from 'lucide-react';
import { Story, Chapter } from '../types';
import { api } from '../services/api';
import { ImageUploader } from './ImageUploader';

interface ChapterEditorViewProps {
  storyId: string;
  chapterId?: string;
  onBack: () => void;
  onSaved: (storySlug: string, chapterNumber: number) => void;
}

const AMBIENT_PRESETS = [
  { id: 'none', label: 'None' },
  { id: 'celestial-leyline', label: '✨ Celestial Leyline' },
  { id: 'midnight-rain', label: '🌧️ Midnight Rain' },
  { id: 'epic-climax', label: '⚡ Epic Battle Climax' },
  { id: 'peaceful-academy', label: '🌸 Peaceful Academy' },
  { id: 'mystic-dungeon', label: '🗝️ Ancient Crypt' },
  { id: 'cyber-synthwave', label: '🌆 Neo City Rain' },
];

const PROMPT_SUGGESTIONS = [
  {
    category: 'Cliffhanger Endings',
    items: [
      'The runes along the ancient blade suddenly pulsed crimson—a color they had not radiated in three thousand years.',
      'A voice whispered from the empty shadows behind him, calling him by a name only the fallen gods knew.',
      'She looked down at the shattered seal in horror. "We didn\'t prevent the catastrophe," she murmured. "We triggered it."',
      'Before he could strike, time itself seemed to freeze, and a cloaked figure stepped through the fractured veil.',
    ]
  },
  {
    category: 'Sensory & Atmospheric Cues',
    items: [
      'The scent of ozone and chilled starlight lingered heavy in the damp cavern air.',
      'A low vibrational hum resonated through the stone floor, shaking loose dust from the monolithic arches.',
      'The silver moonlight cast jagged shadows through the skeletal canopy of the ironwood forest.',
      'Mana crackled against his fingertips, sharp and biting like needles of frozen flame.',
    ]
  },
  {
    category: 'Scene Transitions',
    items: [
      '***\n\nThree hours before the lunar eclipse—at the eastern garrison.',
      '***\n\nMeanwhile, within the high sanctum of the Astral Council...',
      '***\n\nDawn broke not with golden sunlight, but with an ominous violet haze.',
    ]
  }
];

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
  const [volumeName, setVolumeName] = useState('Volume 1');
  const [ambientAudio, setAmbientAudio] = useState('none');
  const [content, setContent] = useState('');
  const [authorNote, setAuthorNote] = useState('');
  const [status, setStatus] = useState<'Published' | 'Draft'>('Published');
  const [viewMode, setViewMode] = useState<'write' | 'split' | 'preview'>('write');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showSparkDrawer, setShowSparkDrawer] = useState(false);
  const [autoSavedTime, setAutoSavedTime] = useState<string | null>(null);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Illustration upload modal
  const [showIllustrationModal, setShowIllustrationModal] = useState(false);
  const [illustrationUrl, setIllustrationUrl] = useState('');
  const [illustrationCaption, setIllustrationCaption] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertIllustration = () => {
    if (!illustrationUrl) return;
    const tag = `\n\n![${illustrationCaption || 'Chapter Illustration'}](${illustrationUrl})\n\n`;
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newContent = content.substring(0, start) + tag + content.substring(end);
      setContent(newContent);
    } else {
      setContent(prev => prev + tag);
    }
    setIllustrationUrl('');
    setIllustrationCaption('');
    setShowIllustrationModal(false);
  };

  // Storage key for autosave
  const storageKey = `kairo_draft_${storyId}_${chapterId || 'new'}`;

  useEffect(() => {
    loadEditorData();
  }, [storyId, chapterId]);

  const loadEditorData = async () => {
    setLoading(true);
    try {
      const res = await api.getStory(storyId);
      setStory(res.story);
      const chaps = res.chapters || [];

      let initialTitle = '';
      let initialSubtitle = '';
      let initialContent = '';
      let initialNote = '';
      let initialNum = chaps.length + 1;
      let initialStatus: 'Published' | 'Draft' = 'Published';

      if (chapterId) {
        const target = chaps.find(c => c.id === chapterId);
        if (target) {
          initialNum = target.chapterNumber;
          initialTitle = target.title;
          initialSubtitle = target.subtitle || '';
          initialContent = target.content;
          initialNote = target.authorNote || '';
          initialStatus = (target.status === 'Draft' || target.status === 'draft') ? 'Draft' : 'Published';
          if ((target as any).volumeName) setVolumeName((target as any).volumeName);
          if ((target as any).ambientAudio) setAmbientAudio((target as any).ambientAudio);
        }
      } else {
        initialNum = chaps.length + 1;
        initialTitle = `Chapter ${initialNum}: The Journey Continues`;
        initialContent = `The wind howled through the crystal spires of the celestial city, carrying whispers of ancient forgotten mana...\n\nStep by step, the journey unfolded into the unknown.`;
      }

      // Check if there is a local autosaved backup that has more content
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.content && parsed.content.length > initialContent.length) {
            initialContent = parsed.content;
            if (parsed.title) initialTitle = parsed.title;
            if (parsed.subtitle) initialSubtitle = parsed.subtitle;
            if (parsed.authorNote) initialNote = parsed.authorNote;
            setHasRestoredDraft(true);
          }
        } catch {
          // ignore parsing error
        }
      }

      setChapterNumber(initialNum);
      setTitle(initialTitle);
      setSubtitle(initialSubtitle);
      setContent(initialContent);
      setAuthorNote(initialNote);
      setStatus(initialStatus);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Periodic autosave to local storage every 8 seconds
  useEffect(() => {
    if (!content && !title) return;
    const interval = setInterval(() => {
      localStorage.setItem(storageKey, JSON.stringify({
        title,
        subtitle,
        content,
        authorNote,
        volumeName,
        chapterNumber,
        timestamp: new Date().toISOString(),
      }));
      const now = new Date();
      setAutoSavedTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    }, 8000);

    return () => clearInterval(interval);
  }, [title, subtitle, content, authorNote, volumeName, chapterNumber, storageKey]);

  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Quick insertion helpers for toolbar
  const insertFormatting = (prefix: string, suffix: string = '', defaultPlaceholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || defaultPlaceholder;

    const newContent = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 10);
  };

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
        ...({ volumeName, ambientAudio } as any),
      });

      // Clear local storage draft after successful save
      localStorage.removeItem(storageKey);
      setHasRestoredDraft(false);

      setSavedSuccess(true);
      setTimeout(() => {
        onSaved(story.slug || story.id, chapterNumber);
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save chapter. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChapter = async () => {
    if (!chapterId) return;
    setDeleting(true);
    setErrorMessage(null);
    try {
      await api.deleteChapter(chapterId);
      localStorage.removeItem(storageKey);
      onBack();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete chapter');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-28 text-[#877276]">
        <Sparkles className="w-8 h-8 mx-auto mb-2 text-[#9e3b5f] animate-spin" />
        <p className="font-semibold text-sm">Preparing manuscript canvas...</p>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="text-center py-28 max-w-md mx-auto px-4 space-y-4">
        <h2 className="text-2xl font-bold font-display text-[#26152b]">Story Not Found</h2>
        <p className="text-sm text-[#877276]">The story you are trying to draft chapters for could not be found or has been removed.</p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9e3b5f] text-white text-xs font-bold shadow-md hover:bg-[#852e4e] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Creator Studio</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28">
      
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-800 font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top action navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            id="editor-back-btn"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/90 hover:bg-white text-xs font-bold text-[#544246] border border-pink-100 shadow-2xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Studio</span>
          </button>

          <div>
            <div className="text-[11px] font-bold text-[#9e3b5f] uppercase tracking-wider flex items-center gap-1.5">
              <span>{story.title}</span>
              <span>•</span>
              <span className="text-[#544246]">Chapter {chapterNumber}</span>
            </div>
            {autoSavedTime && (
              <div className="text-[10px] text-emerald-700 flex items-center gap-1 mt-0.5">
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Autosaved at {autoSavedTime}</span>
              </div>
            )}
          </div>
        </div>

        {/* View Mode Switcher + Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          
          {/* View Mode Buttons */}
          <div className="inline-flex p-1 bg-white/80 rounded-xl border border-pink-100 shadow-2xs">
            <button
              onClick={() => setViewMode('write')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'write' ? 'bg-[#9e3b5f] text-white shadow-xs' : 'text-[#544246] hover:text-[#26152b]'
              }`}
              title="Focus on writing manuscript"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Write</span>
            </button>

            <button
              onClick={() => setViewMode('split')}
              className={`hidden md:flex px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer items-center gap-1.5 ${
                viewMode === 'split' ? 'bg-[#9e3b5f] text-white shadow-xs' : 'text-[#544246] hover:text-[#26152b]'
              }`}
              title="Split view (Editor and Reader Preview)"
            >
              <Split className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>

            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'preview' ? 'bg-[#9e3b5f] text-white shadow-xs' : 'text-[#544246] hover:text-[#26152b]'
              }`}
              title="Preview formatted chapter as reader"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>

          {/* AI Creative Prompts Drawer Toggle */}
          <button
            onClick={() => setShowSparkDrawer(!showSparkDrawer)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              showSparkDrawer 
                ? 'bg-purple-100 border-purple-300 text-purple-900' 
                : 'bg-white border-pink-200 text-[#635882] hover:bg-purple-50'
            }`}
            title="Open Creative Prompts & Cliffhangers"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden sm:inline">Idea Spark</span>
          </button>

          {/* Delete Chapter Button (Only if existing chapter) */}
          {chapterId && (
            <button
              id="editor-delete-chapter-btn"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-xl text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
              title="Delete this chapter"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Save Draft */}
          <button
            id="editor-save-draft-btn"
            onClick={() => handleSave('Draft')}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-white border border-pink-200 text-xs font-bold text-[#544246] hover:bg-pink-50 cursor-pointer transition-colors"
          >
            Save Draft
          </button>

          {/* Publish Chapter */}
          <button
            id="chapter-publish-btn"
            onClick={() => handleSave('Published')}
            disabled={saving}
            className="btn-gradient px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all hover:scale-102"
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

      {/* Local Draft Restored Banner */}
      {hasRestoredDraft && (
        <div className="p-3 bg-pink-50 border border-pink-200 rounded-2xl flex items-center justify-between text-xs text-[#9e3b5f]">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-[#9e3b5f]" />
            <span>Restored unsaved draft from your browser's local backup.</span>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem(storageKey);
              setHasRestoredDraft(false);
              loadEditorData();
            }}
            className="underline hover:text-[#26152b] font-semibold cursor-pointer"
          >
            Discard local draft & reset
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm glass-card rounded-3xl p-6 border border-pink-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-black text-lg text-[#26152b] font-display">Delete Chapter {chapterNumber}?</h3>
              <p className="text-xs text-[#877276]">
                This will permanently delete this chapter manuscript from KAIRO. Readers will no longer be able to read it.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-white border border-pink-200 text-xs font-bold text-[#544246] hover:bg-pink-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-chapter-btn"
                onClick={handleDeleteChapter}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Editor & Preview Area */}
        <div className={`${showSparkDrawer ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6 transition-all duration-300`}>
          
          {/* Metadata Controls Bar */}
          <div className="glass-card rounded-3xl p-4 sm:p-5 border border-pink-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#877276]">Chapter:</span>
                <input
                  type="number"
                  min={1}
                  value={chapterNumber}
                  onChange={e => setChapterNumber(parseInt(e.target.value) || 1)}
                  className="w-14 h-8 px-2 rounded-lg bg-white border border-pink-200 text-xs font-bold text-center text-[#26152b]"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#877276]">Arc / Volume:</span>
                <input
                  type="text"
                  value={volumeName}
                  onChange={e => setVolumeName(e.target.value)}
                  placeholder="Volume 1"
                  className="w-28 sm:w-32 h-8 px-2.5 rounded-lg bg-white border border-pink-200 text-xs font-semibold text-[#26152b]"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-[#877276]" />
                <span className="text-xs font-bold text-[#877276]">Mood:</span>
                <select
                  value={ambientAudio}
                  onChange={e => setAmbientAudio(e.target.value)}
                  className="h-8 px-2 rounded-lg bg-white border border-pink-200 text-xs font-medium text-[#26152b] cursor-pointer"
                >
                  {AMBIENT_PRESETS.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-xs text-[#877276] flex items-center gap-3">
              <span className="font-bold text-[#9e3b5f]">{(wordCount ?? 0).toLocaleString()} words</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#877276]" />
                <span>~{readingTime} min</span>
              </span>
            </div>
          </div>

          {/* Write Mode & Split View Layout */}
          {(viewMode === 'write' || viewMode === 'split') && (
            <div className={`grid ${viewMode === 'split' ? 'grid-cols-1 md:grid-cols-2 gap-6' : 'grid-cols-1'}`}>
              
              {/* Manuscript Editor Card */}
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-pink-200/90 shadow-xl space-y-5 bg-white/90">
                
                {/* Title & Subtitle */}
                <div className="space-y-2">
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Chapter Title (e.g. Whispers of the Astral Leyline)"
                    className="w-full text-2xl sm:text-3xl font-black font-display text-[#26152b] bg-transparent outline-none placeholder-[#b49fa4]"
                  />
                  <input
                    type="text"
                    value={subtitle}
                    onChange={e => setSubtitle(e.target.value)}
                    placeholder="Subtitle or scene location setting (Optional)"
                    className="w-full text-xs sm:text-sm font-serif italic text-[#544246] bg-transparent outline-none placeholder-[#b49fa4]"
                  />
                </div>

                {/* Formatting Quick Toolbar */}
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-pink-50/50 rounded-2xl border border-pink-100 text-xs">
                  <button
                    type="button"
                    onClick={() => insertFormatting('**', '**', 'bold text')}
                    className="p-1.5 rounded-lg hover:bg-white text-[#544246] hover:text-[#9e3b5f] font-bold cursor-pointer transition-colors"
                    title="Bold (**text**)"
                  >
                    <Bold className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => insertFormatting('*', '*', 'italicized text')}
                    className="p-1.5 rounded-lg hover:bg-white text-[#544246] hover:text-[#9e3b5f] italic cursor-pointer transition-colors"
                    title="Italics (*text*)"
                  >
                    <Italic className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => insertFormatting('### ', '\n', 'Scene Subheading')}
                    className="p-1.5 rounded-lg hover:bg-white text-[#544246] hover:text-[#9e3b5f] cursor-pointer transition-colors"
                    title="Scene Subheading (###)"
                  >
                    <Heading className="w-4 h-4" />
                  </button>

                  <div className="w-[1px] h-5 bg-pink-200 mx-1" />

                  {/* Japanese Light Novel Quote */}
                  <button
                    type="button"
                    onClick={() => insertFormatting('「', '」', 'Dialogue speech')}
                    className="px-2 py-1 rounded-lg hover:bg-white text-[#9e3b5f] font-bold cursor-pointer transition-colors"
                    title="Japanese Light Novel Quotes (「...」)"
                  >
                    「...」
                  </button>

                  {/* Standard Quotes */}
                  <button
                    type="button"
                    onClick={() => insertFormatting('"', '"', 'Spoken dialogue')}
                    className="px-2 py-1 rounded-lg hover:bg-white text-[#544246] hover:text-[#9e3b5f] font-bold cursor-pointer transition-colors"
                    title="Standard Speech Quotes"
                  >
                    “...”
                  </button>

                  {/* Monologue / Inner Thoughts */}
                  <button
                    type="button"
                    onClick={() => insertFormatting('*‘', '’*', 'Internal thought...')}
                    className="px-2 py-1 rounded-lg hover:bg-white text-[#635882] italic cursor-pointer transition-colors"
                    title="Internal Monologue / Thoughts (*‘...’*)"
                  >
                    ‘thought’
                  </button>

                  {/* Scene Break */}
                  <button
                    type="button"
                    onClick={() => insertFormatting('\n\n***\n\n', '', '')}
                    className="px-2 py-1 rounded-lg hover:bg-white text-[#544246] hover:text-[#9e3b5f] font-semibold cursor-pointer transition-colors"
                    title="Scene Break Divider (***)"
                  >
                    ***
                  </button>

                  {/* Blockquote / Lore Fragment */}
                  <button
                    type="button"
                    onClick={() => insertFormatting('\n> ', '\n', 'Lore chronicle quotation')}
                    className="p-1.5 rounded-lg hover:bg-white text-[#544246] hover:text-[#9e3b5f] cursor-pointer transition-colors"
                    title="Blockquote (>)"
                  >
                    <Quote className="w-4 h-4" />
                  </button>

                  <div className="w-[1px] h-5 bg-pink-200 mx-1" />

                  {/* Direct Gallery/Storage Illustration Insert */}
                  <button
                    type="button"
                    id="editor-insert-image-btn"
                    onClick={() => setShowIllustrationModal(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/80 hover:bg-white text-[#9e3b5f] font-bold text-xs border border-pink-200 cursor-pointer shadow-2xs hover:scale-102 transition-all"
                    title="Insert Light Novel Scene Illustration (Upload from Gallery or Device Storage)"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Insert Illustration</span>
                  </button>
                </div>

                {/* Text Area */}
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    rows={viewMode === 'split' ? 22 : 20}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Write your chapter manuscript here. Use double line breaks between paragraphs..."
                    className="w-full p-4 sm:p-6 rounded-2xl bg-white border border-pink-100 focus:border-[#9e3b5f] focus:ring-2 focus:ring-pink-200/50 outline-none text-base text-[#26152b] leading-relaxed font-serif whitespace-pre-wrap transition-all"
                  />
                </div>

                {/* Author's Note */}
                <div className="space-y-1.5 pt-2 border-t border-pink-100">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#877276]">
                    Author's Note (Appears at end of chapter)
                  </label>
                  <textarea
                    rows={2}
                    value={authorNote}
                    onChange={e => setAuthorNote(e.target.value)}
                    placeholder="Thank your readers, tease upcoming arcs, or share lore commentary..."
                    className="w-full p-3 rounded-xl bg-white border border-pink-100 text-xs text-[#544246] outline-none focus:border-[#9e3b5f]"
                  />
                </div>
              </div>

              {/* Split View: Live Preview Column */}
              {viewMode === 'split' && (
                <div className="glass-card rounded-3xl p-6 sm:p-8 border border-purple-200/80 shadow-xl space-y-6 overflow-y-auto max-h-[850px] bg-gradient-to-b from-[#fff7fb] to-white">
                  <div className="border-b border-pink-100 pb-3 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#9e3b5f] flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Live Reader Preview</span>
                    </span>
                    <span className="text-[11px] text-[#877276]">
                      {volumeName} • {readingTime} min read
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl font-black font-display text-[#26152b]">{title || 'Untitled Chapter'}</h2>
                    {subtitle && <p className="text-xs font-serif italic text-[#877276] mt-1">{subtitle}</p>}
                  </div>

                  <div className="prose prose-pink max-w-none text-sm font-serif leading-relaxed text-[#26152b] space-y-4">
                    {content.split('\n\n').map((para, idx) => {
                      if (para.trim() === '***') {
                        return <div key={idx} className="text-center text-pink-300 font-bold tracking-widest my-4">◆ ◆ ◆</div>;
                      }
                      if (para.startsWith('### ')) {
                        return <h3 key={idx} className="font-sans font-bold text-base text-[#9e3b5f] mt-4">{para.replace('### ', '')}</h3>;
                      }
                      if (para.startsWith('> ')) {
                        return <blockquote key={idx} className="border-l-2 border-[#9e3b5f] pl-4 italic text-[#635882]">{para.replace('> ', '')}</blockquote>;
                      }
                      return <p key={idx} className="whitespace-pre-wrap">{para}</p>;
                    })}
                  </div>

                  {authorNote && (
                    <div className="mt-8 p-4 rounded-2xl bg-[#fee7ff]/50 border border-pink-200 text-xs">
                      <div className="font-bold text-[#9e3b5f] mb-1">Author's Note</div>
                      <p className="text-[#544246] italic">{authorNote}</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* Full Reader Preview Mode */}
          {viewMode === 'preview' && (
            <div className="glass-card rounded-3xl p-8 sm:p-14 border border-pink-200/90 shadow-2xl space-y-8 bg-white max-w-3xl mx-auto">
              <div className="text-center space-y-2 pb-6 border-b border-pink-100">
                <span className="px-3 py-1 rounded-full bg-[#fee7ff] text-[#9e3b5f] text-xs font-bold uppercase tracking-wider">
                  {volumeName} • Chapter {chapterNumber}
                </span>
                <h1 className="text-3xl sm:text-4xl font-black font-display text-[#26152b]">
                  {title || 'Untitled Chapter'}
                </h1>
                {subtitle && (
                  <p className="text-sm font-serif italic text-[#877276] max-w-md mx-auto">
                    {subtitle}
                  </p>
                )}
                <div className="text-xs text-[#877276] pt-2 flex items-center justify-center gap-3">
                  <span>{(wordCount ?? 0).toLocaleString()} words</span>
                  <span>•</span>
                  <span>~{readingTime} min read</span>
                  {ambientAudio !== 'none' && (
                    <>
                      <span>•</span>
                      <span className="text-purple-700 font-semibold">{AMBIENT_PRESETS.find(p => p.id === ambientAudio)?.label}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Rendered Text paragraphs */}
              <div className="text-base sm:text-lg font-serif leading-relaxed text-[#26152b] space-y-6">
                {content.split('\n\n').map((para, idx) => {
                  if (para.trim() === '***') {
                    return (
                      <div key={idx} className="text-center text-pink-300 font-bold tracking-widest my-8">
                        ◆ ◆ ◆
                      </div>
                    );
                  }
                  if (para.startsWith('### ')) {
                    return (
                      <h3 key={idx} className="font-sans font-black text-xl text-[#9e3b5f] mt-8 mb-2">
                        {para.replace('### ', '')}
                      </h3>
                    );
                  }
                  if (para.startsWith('> ')) {
                    return (
                      <blockquote key={idx} className="border-l-4 border-[#9e3b5f] pl-4 italic text-[#635882] my-4">
                        {para.replace('> ', '')}
                      </blockquote>
                    );
                  }
                  return (
                    <p key={idx} className="whitespace-pre-wrap">
                      {para}
                    </p>
                  );
                })}
              </div>

              {/* Rendered Author Note */}
              {authorNote && (
                <div className="mt-12 p-6 rounded-3xl bg-gradient-to-br from-[#fee7ff]/60 to-[#fff7fb] border border-pink-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#9e3b5f] uppercase tracking-wider mb-2">
                    <Feather className="w-4 h-4" />
                    <span>Author's Postscript</span>
                  </div>
                  <p className="text-sm font-serif text-[#544246] leading-relaxed">
                    {authorNote}
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Idea Spark Drawer (Right Column) */}
        {showSparkDrawer && (
          <div className="lg:col-span-4 space-y-5 animate-in slide-in-from-right duration-200">
            <div className="glass-card rounded-3xl p-5 border border-purple-200/90 shadow-lg space-y-4 bg-gradient-to-b from-white via-purple-50/30 to-pink-50/30">
              <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-sm text-[#26152b] font-display">Author Creative Spark</h3>
                </div>
                <button
                  onClick={() => setShowSparkDrawer(false)}
                  className="p-1 rounded-lg hover:bg-purple-100 text-[#877276] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#544246] leading-relaxed">
                Overcome writer's block. Click any prompt below to instantly insert it into your chapter manuscript!
              </p>

              <div className="space-y-4">
                {PROMPT_SUGGESTIONS.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-purple-900">
                      {group.category}
                    </div>
                    <div className="space-y-2">
                      {group.items.map((item, iIdx) => (
                        <div
                          key={iIdx}
                          onClick={() => {
                            insertFormatting(`\n\n${item}\n\n`);
                          }}
                          className="p-3 rounded-2xl bg-white hover:bg-purple-50 border border-purple-100 hover:border-purple-300 shadow-2xs transition-all cursor-pointer group text-xs text-[#544246] hover:text-[#26152b]"
                        >
                          <p className="line-clamp-3 italic font-serif">"{item}"</p>
                          <div className="flex items-center justify-end gap-1 mt-1.5 text-[10px] font-bold text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>+ Insert into manuscript</span>
                            <ChevronRight className="w-3 h-3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Illustration Insert Modal (Upload from Gallery or Device Storage) */}
        {showIllustrationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-lg glass-card rounded-3xl p-6 sm:p-7 border border-pink-200 shadow-2xl space-y-4 bg-white/95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#9e3b5f]" />
                  <h3 className="font-extrabold text-base text-[#26152b] font-display">
                    Insert Light Novel Scene Illustration
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIllustrationModal(false)}
                  className="text-gray-400 hover:text-gray-600 font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div>
                <ImageUploader
                  id="editor-illustration-upload"
                  label="Illustration Image"
                  value={illustrationUrl}
                  onChange={setIllustrationUrl}
                  aspect="auto"
                  helperText="Upload image directly from gallery or storage to insert into chapter"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#544246] mb-1">
                  Illustration Caption / Alt Description (Optional)
                </label>
                <input
                  type="text"
                  value={illustrationCaption}
                  onChange={e => setIllustrationCaption(e.target.value)}
                  placeholder="e.g. Elena summoning the Astral Blade in the Moonlit Glade"
                  className="w-full h-10 px-3.5 rounded-xl border border-pink-200 text-xs text-[#26152b] outline-none focus:border-[#9e3b5f]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-pink-100">
                <button
                  type="button"
                  onClick={() => setShowIllustrationModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleInsertIllustration}
                  disabled={!illustrationUrl}
                  className="btn-gradient px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  Insert Into Chapter
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
