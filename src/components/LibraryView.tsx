import React, { useState, useEffect } from 'react';
import { 
  Bookmark, BookOpen, Clock, Play, Trash2, 
  Sparkles, Star, ChevronRight, CheckCircle2 
} from 'lucide-react';
import { Story, ReadingProgress } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface LibraryViewProps {
  onOpenStory: (storySlug: string) => void;
  onReadChapter: (storySlug: string, chapterNumber: number) => void;
  onDiscover: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onOpenStory,
  onReadChapter,
  onDiscover,
}) => {
  const { user } = useAuth();
  const [libraryStories, setLibraryStories] = useState<Story[]>([]);
  const [readingProgressList, setReadingProgressList] = useState<ReadingProgress[]>([]);
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'progress'>('progress');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLibraryData();
  }, [user]);

  const loadLibraryData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [libRes, progRes] = await Promise.all([
        api.getLibrary(),
        api.getReadingProgress(),
      ]);

      const storyIds = (libRes.library || []).map(l => l.storyId);
      if (storyIds.length > 0) {
        const storiesRes = await api.getStories();
        const saved = (storiesRes.stories || []).filter(s => storyIds.includes(s.id));
        setLibraryStories(saved);
      } else {
        setLibraryStories([]);
      }

      setReadingProgressList(progRes.progress || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromLibrary = async (storyId: string) => {
    try {
      await api.toggleLibrary(storyId);
      setLibraryStories(prev => prev.filter(s => s.id !== storyId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-28">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#fee7ff] border border-pink-200 text-[#9e3b5f] text-xs font-bold">
          <Bookmark className="w-3.5 h-3.5" />
          <span>PERSONAL READING SANCTUARY</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-display text-[#26152b]">
          My <span className="gradient-text">Library & Progress</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#544246]">
          Keep track of your saved light novels, ongoing chapters, and reading streaks.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="glass-card p-1 rounded-2xl border border-pink-200 flex gap-1">
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'progress' ? 'btn-gradient shadow-xs' : 'text-[#544246] hover:bg-pink-50'
            }`}
          >
            Currently Reading ({readingProgressList.length})
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'bookmarks' ? 'btn-gradient shadow-xs' : 'text-[#544246] hover:bg-pink-50'
            }`}
          >
            Saved Bookmarks ({libraryStories.length})
          </button>
        </div>
      </div>

      {/* In Progress Tab */}
      {activeTab === 'progress' && (
        <div className="space-y-4">
          {readingProgressList.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-3xl p-8 border border-pink-100 space-y-3">
              <Clock className="w-10 h-10 mx-auto text-[#877276] opacity-50" />
              <h3 className="font-bold text-base text-[#26152b]">No stories in progress</h3>
              <p className="text-xs text-[#877276]">Pick a story from Discover and begin reading!</p>
              <button
                onClick={onDiscover}
                className="btn-gradient px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
              >
                Browse Stories
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {readingProgressList.map(prog => (
                <div
                  key={prog.storyId}
                  className="glass-card rounded-3xl p-5 border border-pink-100 hover:shadow-md transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <img src={prog.storyCover} alt={prog.storyTitle} className="w-16 h-22 object-cover rounded-xl shadow-xs" />
                    <div>
                      <h4 className="font-bold text-base text-[#26152b] font-display line-clamp-1">{prog.storyTitle}</h4>
                      <p className="text-xs text-[#544246] mt-0.5">
                        Chapter {prog.chapterNumber}: {prog.chapterTitle}
                      </p>

                      <div className="w-40 sm:w-48 h-2 bg-pink-100 rounded-full mt-3 overflow-hidden">
                        <div
                          className="h-full bg-[#9e3b5f] rounded-full"
                          style={{ width: `${Math.max(10, prog.progressPercent)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[#877276] mt-1 block">
                        {prog.progressPercent}% completed
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onReadChapter(prog.storyId, prog.chapterNumber)}
                    className="btn-gradient p-3 rounded-2xl cursor-pointer shadow-xs"
                    title="Continue Reading"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bookmarks Tab */}
      {activeTab === 'bookmarks' && (
        <div>
          {libraryStories.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-3xl p-8 border border-pink-100 space-y-3">
              <Bookmark className="w-10 h-10 mx-auto text-[#877276] opacity-50" />
              <h3 className="font-bold text-base text-[#26152b]">No saved bookmarks yet</h3>
              <p className="text-xs text-[#877276]">Add stories to your library to read later.</p>
              <button
                onClick={onDiscover}
                className="btn-gradient px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
              >
                Discover Stories
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {libraryStories.map(story => (
                <div
                  key={story.id}
                  className="glass-card rounded-3xl p-4 border border-pink-100 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="relative rounded-2xl overflow-hidden aspect-4/3 mb-3">
                      <img src={story.coverImage} alt={story.title} className="w-full h-full object-cover" />
                      <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {story.genre}
                      </div>
                    </div>
                    <h3 className="font-bold text-base text-[#26152b] font-display line-clamp-1">{story.title}</h3>
                    <p className="text-xs text-[#544246] line-clamp-2 mt-1">{story.description}</p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-pink-100 flex items-center justify-between">
                    <button
                      onClick={() => onOpenStory(story.slug || story.id)}
                      className="btn-gradient px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Read Story
                    </button>
                    <button
                      onClick={() => handleRemoveFromLibrary(story.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl cursor-pointer"
                      title="Remove from library"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
