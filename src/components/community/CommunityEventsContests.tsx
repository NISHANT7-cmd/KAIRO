import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Sparkles, Users, Clock, Vote, Check, Award, Plus, Upload } from 'lucide-react';
import { CommunityEvent, Contest, User } from '../../types';
import { api } from '../../services/api';

interface CommunityEventsContestsProps {
  user: User | null;
  onRequireAuth?: () => void;
}

export const CommunityEventsContests: React.FC<CommunityEventsContestsProps> = ({
  user,
  onRequireAuth
}) => {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinedEvents, setJoinedEvents] = useState<Record<string, boolean>>({});

  // Contest submission modal
  const [activeContestModal, setActiveContestModal] = useState<Contest | null>(null);
  const [entryTitle, setEntryTitle] = useState('');
  const [entryContent, setEntryContent] = useState('');
  const [entryMediaUrl, setEntryMediaUrl] = useState('');
  const [submittingEntry, setSubmittingEntry] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [evRes, conRes] = await Promise.all([
        api.getEvents(),
        api.getContests()
      ]);
      setEvents(evRes.events || []);
      setContests(conRes.contests || []);
    } catch (err) {
      console.error('Failed to load events/contests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    if (!user) {
      onRequireAuth?.();
      return;
    }
    try {
      await api.joinEvent(eventId);
      setJoinedEvents(prev => ({ ...prev, [eventId]: true }));
      setEvents(prev => prev.map(ev => 
        ev.id === eventId 
          ? { ...ev, attendeesCount: (ev.attendeesCount || 0) + 1 } 
          : ev
      ));
    } catch (err) {
      console.error(err);
    }
  };

  const handleVoteEntry = async (contestId: string, entryId: string) => {
    if (!user) {
      onRequireAuth?.();
      return;
    }
    try {
      await api.voteContestEntry(contestId, entryId);
      setContests(prev => prev.map(c => {
        if (c.id === contestId) {
          return {
            ...c,
            submissions: c.submissions?.map(s => 
              s.id === entryId 
                ? { ...s, votes: (s.votes || 0) + 1, userVoted: true } 
                : s
            )
          };
        }
        return c;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireAuth?.();
      return;
    }
    if (!activeContestModal || !entryTitle.trim() || !entryContent.trim()) return;

    setSubmittingEntry(true);
    try {
      const res = await api.submitContestEntry(activeContestModal.id, {
        title: entryTitle.trim(),
        content: entryContent.trim(),
        mediaUrl: entryMediaUrl.trim() || undefined
      });

      // Update contest submissions
      setContests(prev => prev.map(c => {
        if (c.id === activeContestModal.id) {
          return {
            ...c,
            submissions: [...(c.submissions || []), res.submission]
          };
        }
        return c;
      }));

      setActiveContestModal(null);
      setEntryTitle('');
      setEntryContent('');
      setEntryMediaUrl('');
    } catch (err) {
      console.error('Failed to submit entry:', err);
    } finally {
      setSubmittingEntry(false);
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-xs text-[#877276]">Loading community events and creative contests...</div>;
  }

  return (
    <div className="space-y-10">
      {/* Contests Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="font-display font-black text-lg sm:text-xl text-[#26152b]">
              Creator & Fandom Contests
            </h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
            Prizes & Badges
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contests.map(contest => {
            return (
              <div
                key={contest.id}
                className="glass-card rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4 flex flex-col justify-between bg-white/85"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-pink-100 text-[#9e3b5f] text-[10px] font-black uppercase tracking-wider">
                      {contest.type} CONTEST
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Active
                    </span>
                  </div>

                  <h3 className="font-display font-black text-base sm:text-lg text-[#26152b]">
                    {contest.title}
                  </h3>

                  <p className="text-xs text-[#544246] leading-relaxed">
                    {contest.description}
                  </p>

                  <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-xs text-amber-900 font-semibold flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Prizes: {contest.prizeDescription || 'Exclusive Verified Badge + 5,000 Astral Gems'}</span>
                  </div>
                </div>

                {/* Submissions showcase & Voting */}
                <div className="space-y-3 pt-3 border-t border-pink-100">
                  <div className="flex items-center justify-between text-xs font-bold text-[#26152b]">
                    <span>Top Submissions ({contest.submissions?.length || 0})</span>
                    <button
                      type="button"
                      onClick={() => setActiveContestModal(contest)}
                      className="text-xs font-bold text-[#9e3b5f] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Submit Entry
                    </button>
                  </div>

                  <div className="space-y-2">
                    {contest.submissions?.slice(0, 2).map(sub => (
                      <div
                        key={sub.id}
                        className="p-3 rounded-2xl bg-pink-50/40 border border-pink-100/80 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <h5 className="font-bold text-[#26152b] truncate">{sub.title}</h5>
                          <p className="text-[11px] text-[#877276]">By {sub.authorName}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleVoteEntry(contest.id, sub.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                            sub.userVoted
                              ? 'bg-amber-500 text-white shadow-2xs'
                              : 'bg-white border border-pink-200 text-amber-700 hover:bg-amber-50'
                          }`}
                        >
                          <Vote className="w-3 h-3" />
                          <span>{sub.votes || 0}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Events Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h2 className="font-display font-black text-lg sm:text-xl text-[#26152b]">
              Upcoming Fandom Events
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#877276]">
            Live Q&As, Screenings & Discussions
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map(event => {
            const isJoined = joinedEvents[event.id];

            return (
              <div
                key={event.id}
                className="glass-card rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4 flex flex-col justify-between bg-white/85"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black uppercase tracking-wider">
                      {event.type}
                    </span>
                    <span className="text-xs font-semibold text-[#9e3b5f] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(event.startDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h3 className="font-display font-black text-base sm:text-lg text-[#26152b]">
                    {event.title}
                  </h3>

                  <p className="text-xs text-[#544246] leading-relaxed">
                    {event.description}
                  </p>

                  <div className="flex items-center gap-2 text-xs font-semibold text-[#877276]">
                    <span>Hosted by <strong className="text-[#26152b]">{event.hostName}</strong></span>
                    <span>•</span>
                    <span>{event.attendeesCount || 0} attending</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-pink-100 flex items-center justify-between">
                  <span className="text-xs text-[#877276]">Free for all readers</span>
                  <button
                    type="button"
                    onClick={() => handleJoinEvent(event.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isJoined 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-[#9e3b5f] text-white hover:opacity-90 shadow-2xs'
                    }`}
                  >
                    {isJoined ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>RSVP Confirmed</span>
                      </>
                    ) : (
                      <>
                        <Users className="w-3.5 h-3.5" />
                        <span>Join Event</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contest Submission Modal */}
      {activeContestModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-pink-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-pink-100">
              <h3 className="font-display font-black text-base text-[#26152b]">
                Submit Entry: {activeContestModal.title}
              </h3>
              <button
                onClick={() => setActiveContestModal(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEntry} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#26152b] mb-1">Entry Title</label>
                <input
                  type="text"
                  required
                  value={entryTitle}
                  onChange={e => setEntryTitle(e.target.value)}
                  placeholder="e.g. Twin Eclipse Twilight Awakening"
                  className="w-full h-10 px-3.5 rounded-xl border border-pink-200 text-xs outline-none focus:border-[#9e3b5f]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26152b] mb-1">Artwork URL / Media Link (Optional)</label>
                <input
                  type="url"
                  value={entryMediaUrl}
                  onChange={e => setEntryMediaUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full h-10 px-3.5 rounded-xl border border-pink-200 text-xs outline-none focus:border-[#9e3b5f]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26152b] mb-1">Artist Statement / Story Content</label>
                <textarea
                  required
                  rows={4}
                  value={entryContent}
                  onChange={e => setEntryContent(e.target.value)}
                  placeholder="Describe your creation or paste your flash fiction story..."
                  className="w-full p-3 rounded-xl border border-pink-200 text-xs outline-none focus:border-[#9e3b5f]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveContestModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEntry}
                  className="px-5 py-2.5 rounded-xl bg-[#9e3b5f] text-white text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submittingEntry ? 'Submitting...' : 'Submit Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
