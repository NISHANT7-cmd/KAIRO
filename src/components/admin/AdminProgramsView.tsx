import React, { useState, useEffect } from 'react';
import { 
  Trophy, Award, Calendar, Users, FileText, CheckCircle2, Clock, 
  Sparkles, Eye, Share2, ThumbsUp, Filter, Search, Plus, Edit2, 
  Trash2, Copy, Shield, AlertTriangle, ChevronRight, ExternalLink, 
  Sliders, Download, RefreshCw, Bell, Send, Lock, Unlock, Hash, 
  BarChart2, Flag, Star, BookOpen, Heart, Check, X, AlertCircle, Flame
} from 'lucide-react';
import { 
  Program, ProgramParticipant, ProgramSubmission, ProgramVote, 
  ProgramAnnouncement, ProgramAuditLog, ProgramCertificate, 
  AdminProgramsSummary, ProgramStatus, User 
} from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CreateProgramModal } from './CreateProgramModal';
import { CertificateModal } from './CertificateModal';

interface AdminProgramsViewProps {
  onOpenStory?: (slug: string) => void;
}

type MainTab = 
  | 'DASHBOARD'
  | 'PROGRAMS_LIST'
  | 'PROGRAM_DETAIL'
  | 'PARTICIPANTS'
  | 'SUBMISSIONS'
  | 'JUDGING'
  | 'VOTES'
  | 'RESULTS'
  | 'ANNOUNCEMENTS'
  | 'ANALYTICS'
  | 'AUDIT_LOGS';

const STATUS_COLORS: Record<ProgramStatus, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
  UPCOMING: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  REGISTRATION_OPEN: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  SUBMISSION_OPEN: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  VOTING_OPEN: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  JUDGING: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  FINALISTS_ANNOUNCED: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  RESULTS_PENDING: { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300' },
  COMPLETED: { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300' },
  ARCHIVED: { bg: 'bg-gray-200', text: 'text-gray-800', border: 'border-gray-300' },
  CANCELLED: { bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-300' }
};

export const AdminProgramsView: React.FC<AdminProgramsViewProps> = ({ onOpenStory }) => {
  const { user: currentUser } = useAuth();

  // Core Data State
  const [summary, setSummary] = useState<AdminProgramsSummary | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  // Detail tab lists
  const [participants, setParticipants] = useState<ProgramParticipant[]>([]);
  const [submissions, setSubmissions] = useState<ProgramSubmission[]>([]);
  const [votes, setVotes] = useState<ProgramVote[]>([]);
  const [announcements, setAnnouncements] = useState<ProgramAnnouncement[]>([]);
  const [auditLogs, setAuditLogs] = useState<ProgramAuditLog[]>([]);

  // View state
  const [activeTab, setActiveTab] = useState<MainTab>('DASHBOARD');
  const [programListFilter, setProgramListFilter] = useState<'ALL' | 'ONGOING' | 'UPCOMING' | 'DRAFT' | 'COMPLETED' | 'ARCHIVED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState<ProgramCertificate | null>(null);
  const [showDeclareResultsModal, setShowDeclareResultsModal] = useState(false);
  const [scoringSubmission, setScoringSubmission] = useState<ProgramSubmission | null>(null);
  const [newAnnouncementModal, setNewAnnouncementModal] = useState(false);

  // Status Override dropdown
  const [overrideStatus, setOverrideStatus] = useState<ProgramStatus | ''>('');
  const [overrideReason, setOverrideReason] = useState('');

  // Scoring form state
  const [judgeScores, setJudgeScores] = useState<Record<string, number>>({});
  const [judgeFeedback, setJudgeFeedback] = useState('');

  // Results Declaration form state
  const [winnerSelections, setWinnerSelections] = useState<Array<{ prizeId: string; submissionId: string }>>([]);
  const [resultsRemarks, setResultsRemarks] = useState('');

  // Announcement composer state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annType, setAnnType] = useState<ProgramAnnouncement['type']>('IMPORTANT_UPDATE');
  const [annSendNotification, setAnnSendNotification] = useState(true);
  const [annSocialCopy, setAnnSocialCopy] = useState('');

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Initial Load
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [sumRes, progsRes, logsRes] = await Promise.all([
        api.adminGetProgramsSummary(),
        api.adminGetPrograms(),
        api.adminGetProgramAuditLogs()
      ]);

      setSummary(sumRes.summary);
      setPrograms(progsRes.programs || []);
      setAuditLogs(logsRes.logs || []);

      // If program was selected, refresh it
      if (selectedProgramId) {
        const found = (progsRes.programs || []).find(p => p.id === selectedProgramId);
        if (found) setSelectedProgram(found);
      } else if (progsRes.programs && progsRes.programs.length > 0) {
        // Default select first program for immediate inspection
        setSelectedProgramId(progsRes.programs[0].id);
        setSelectedProgram(progsRes.programs[0]);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load Programs summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // 2. Load Selected Program Sub-collections
  const loadProgramDetails = async (programId: string) => {
    try {
      const [partsRes, subsRes, votesRes, annsRes] = await Promise.all([
        api.adminGetProgramParticipants(programId),
        api.adminGetProgramSubmissions(programId),
        api.adminGetProgramVotes(programId),
        api.adminGetProgramAnnouncements(programId)
      ]);

      setParticipants(partsRes.participants || []);
      setSubmissions(subsRes.submissions || []);
      setVotes(votesRes.votes || []);
      setAnnouncements(annsRes.announcements || []);
    } catch (err: any) {
      console.error('Failed to load program details:', err);
    }
  };

  useEffect(() => {
    if (selectedProgramId) {
      const prog = programs.find(p => p.id === selectedProgramId);
      if (prog) setSelectedProgram(prog);
      loadProgramDetails(selectedProgramId);
    }
  }, [selectedProgramId]);

  // Select program helper
  const handleSelectProgram = (prog: Program, targetTab?: MainTab) => {
    setSelectedProgramId(prog.id);
    setSelectedProgram(prog);
    if (targetTab) {
      setActiveTab(targetTab);
    } else {
      setActiveTab('PROGRAM_DETAIL');
    }
  };

  // 3. Status Override
  const handleApplyStatusOverride = async () => {
    if (!selectedProgram || !overrideStatus) return;
    setActionLoading('status_override');
    try {
      const res = await api.adminOverrideProgramStatus(selectedProgram.id, overrideStatus as ProgramStatus, overrideReason);
      setSelectedProgram(res.program);
      setPrograms(prev => prev.map(p => p.id === res.program.id ? res.program : p));
      showToast('success', `Program status changed to ${overrideStatus}`);
      setOverrideStatus('');
      setOverrideReason('');
      loadInitialData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to override status');
    } finally {
      setActionLoading(null);
    }
  };

  // 4. Duplicate Program
  const handleDuplicateProgram = async (prog: Program) => {
    const cloneName = prompt('Enter name for the new cloned program:', `${prog.name} (Next Season)`);
    if (!cloneName) return;

    setActionLoading(`dup_${prog.id}`);
    try {
      const res = await api.adminDuplicateProgram(prog.id, cloneName);
      setPrograms(prev => [res.program, ...prev]);
      showToast('success', `Program duplicated successfully: "${res.program.name}"`);
      handleSelectProgram(res.program);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to duplicate program');
    } finally {
      setActionLoading(null);
    }
  };

  // 5. Delete Program
  const handleDeleteProgram = async (prog: Program) => {
    if (!confirm(`Are you absolutely sure you want to permanently delete "${prog.name}" and all associated submissions, votes, and records?`)) {
      return;
    }

    setActionLoading(`del_${prog.id}`);
    try {
      await api.adminDeleteProgram(prog.id);
      setPrograms(prev => prev.filter(p => p.id !== prog.id));
      showToast('success', `Deleted program: ${prog.name}`);
      if (selectedProgramId === prog.id) {
        setSelectedProgramId(null);
        setSelectedProgram(null);
        setActiveTab('PROGRAMS_LIST');
      }
      loadInitialData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete program');
    } finally {
      setActionLoading(null);
    }
  };

  // 6. Finalist Toggle
  const handleToggleFinalist = async (sub: ProgramSubmission) => {
    if (!selectedProgram) return;
    setActionLoading(`finalist_${sub.id}`);
    const nextFinalist = sub.status !== 'FINALIST';
    try {
      const res = await api.adminToggleProgramFinalist(selectedProgram.id, sub.id, nextFinalist);
      setSubmissions(prev => prev.map(s => s.id === sub.id ? res.submission : s));
      showToast('success', nextFinalist ? `Marked "${sub.title}" as Finalist` : `Removed finalist flag from "${sub.title}"`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update finalist status');
    } finally {
      setActionLoading(null);
    }
  };

  // 7. Judge Scoring
  const handleOpenScoring = (sub: ProgramSubmission) => {
    setScoringSubmission(sub);
    const existing = sub.scores?.judgeScores?.[currentUser?.id || '']?.criteriaScores || {};
    const criteriaList = selectedProgram?.judgingConfig?.criteria || [];
    const initialScores: Record<string, number> = {};
    criteriaList.forEach(c => {
      initialScores[c.id] = existing[c.id] || 85;
    });
    setJudgeScores(initialScores);
    setJudgeFeedback(sub.scores?.judgeScores?.[currentUser?.id || '']?.feedback || '');
  };

  const handleSaveScore = async () => {
    if (!selectedProgram || !scoringSubmission) return;
    setActionLoading('saving_score');
    try {
      const res = await api.adminScoreProgramSubmission(
        selectedProgram.id,
        scoringSubmission.id,
        judgeScores,
        judgeFeedback
      );
      setSubmissions(prev => prev.map(s => s.id === scoringSubmission.id ? res.submission : s));
      showToast('success', `Score submitted: ${res.submission.scores.finalWeightedScore} / 100`);
      setScoringSubmission(null);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save score');
    } finally {
      setActionLoading(null);
    }
  };

  // 8. Result Declaration
  const handleOpenDeclareResults = () => {
    if (!selectedProgram) return;
    const prizes = selectedProgram.prizes || [];
    // Sort submissions by final weighted score or votes descending
    const sorted = [...submissions].sort((a, b) => {
      const scoreA = a.scores?.finalWeightedScore || a.votes || 0;
      const scoreB = b.scores?.finalWeightedScore || b.votes || 0;
      return scoreB - scoreA;
    });

    const initialWinners = prizes.map((prize, idx) => ({
      prizeId: prize.id,
      submissionId: sorted[idx]?.id || submissions[0]?.id || ''
    }));

    setWinnerSelections(initialWinners);
    setResultsRemarks(`Official results declared by Master Admin ${currentUser?.displayName || 'Editorial Guild'}. All cryptographic certificates and reward badges are certified.`);
    setShowDeclareResultsModal(true);
  };

  const handleConfirmDeclareResults = async () => {
    if (!selectedProgram) return;
    setActionLoading('declaring_results');
    try {
      const winnersPayload = winnerSelections.map(w => {
        const sub = submissions.find(s => s.id === w.submissionId);
        return {
          prizeId: w.prizeId,
          submissionId: w.submissionId,
          userId: sub?.userId,
          displayName: sub?.displayName,
          username: sub?.username,
          storyTitle: sub?.title
        };
      });

      const res = await api.adminDeclareProgramResults(selectedProgram.id, winnersPayload, resultsRemarks);
      setSelectedProgram(res.program);
      setPrograms(prev => prev.map(p => p.id === res.program.id ? res.program : p));
      showToast('success', `Results declared! Cryptographic certificates have been generated.`);
      setShowDeclareResultsModal(false);
      loadProgramDetails(selectedProgram.id);
      loadInitialData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to declare results');
    } finally {
      setActionLoading(null);
    }
  };

  // 9. Announcement Creation
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram || !annTitle.trim()) return;

    setActionLoading('creating_announcement');
    try {
      const res = await api.adminCreateProgramAnnouncement(selectedProgram.id, {
        title: annTitle.trim(),
        content: annContent.trim(),
        type: annType,
        sendInAppNotification: annSendNotification,
        socialMediaCopy: annSocialCopy.trim()
      });
      setAnnouncements(prev => [res.announcement, ...prev]);
      showToast('success', `Announcement dispatched! In-app notifications sent: ${annSendNotification ? 'YES' : 'NO'}`);
      setAnnTitle('');
      setAnnContent('');
      setAnnSocialCopy('');
      setNewAnnouncementModal(false);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to post announcement');
    } finally {
      setActionLoading(null);
    }
  };

  // Filtered Programs list
  const filteredPrograms = programs.filter(prog => {
    const matchesSearch = 
      prog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prog.theme.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prog.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'ALL' || prog.type.toLowerCase() === typeFilter.toLowerCase();

    let matchesStatus = true;
    if (programListFilter === 'ONGOING') {
      matchesStatus = ['REGISTRATION_OPEN', 'SUBMISSION_OPEN', 'VOTING_OPEN', 'JUDGING', 'FINALISTS_ANNOUNCED'].includes(prog.status);
    } else if (programListFilter === 'UPCOMING') {
      matchesStatus = prog.status === 'UPCOMING';
    } else if (programListFilter === 'DRAFT') {
      matchesStatus = prog.status === 'DRAFT';
    } else if (programListFilter === 'COMPLETED') {
      matchesStatus = prog.status === 'COMPLETED';
    } else if (programListFilter === 'ARCHIVED') {
      matchesStatus = prog.status === 'ARCHIVED';
    }

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Toast Banner */}
      {toastMessage && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-md animate-in fade-in duration-150 ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2 text-xs font-bold">
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="p-1 hover:opacity-75 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Management Ribbon */}
      <div className="bg-white/95 text-[#26152b] p-6 rounded-3xl border border-pink-200/90 shadow-sm relative overflow-hidden backdrop-blur-md">
        {/* Subtle decorative theme glows */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-gradient-to-br from-pink-100/70 via-purple-100/40 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-gradient-to-tr from-rose-100/50 via-pink-50/60 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-pink-100/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-100 text-[#9e3b5f] border border-pink-200 text-xs font-bold uppercase tracking-wider mb-2 shadow-2xs">
              <Trophy className="w-3.5 h-3.5 text-[#9e3b5f]" />
              <span>Programs & Competitions Command Center</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-[#26152b]">
              Master Admin Program Operations
            </h2>
            <p className="text-xs sm:text-sm text-[#544246] mt-1 max-w-2xl font-medium leading-relaxed">
              100% authoritative control over all Kairo writing competitions, lore challenges, character tournaments, reader festivals, and special community campaigns.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setEditingProgram(null);
                setShowCreateModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#9e3b5f] via-[#b3426e] to-[#d94b76] hover:from-[#882e50] hover:to-[#be3c63] text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Program</span>
            </button>
            <button
              onClick={loadInitialData}
              disabled={loading}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-pink-50/80 border border-pink-200 text-xs font-bold text-[#544246] hover:text-[#26152b] flex items-center gap-2 cursor-pointer transition-all shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#9e3b5f] ${loading ? 'animate-spin' : ''}`} />
              <span>Sync All</span>
            </button>
          </div>
        </div>

        {/* Global Summary KPI counters */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-6 relative z-10">
            <div className="bg-gradient-to-br from-white to-emerald-50/70 p-3 rounded-2xl border border-emerald-200/90 shadow-2xs hover:border-emerald-300 transition-all">
              <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Active / Ongoing</div>
              <div className="text-xl font-black text-[#26152b] mt-0.5">{summary.activeProgramsCount}</div>
              <div className="text-[10px] font-semibold text-emerald-700 mt-0.5">Live Contests</div>
            </div>
            <div className="bg-gradient-to-br from-white to-sky-50/70 p-3 rounded-2xl border border-sky-200/90 shadow-2xs hover:border-sky-300 transition-all">
              <div className="text-[10px] font-bold text-sky-800 uppercase tracking-wider">Upcoming</div>
              <div className="text-xl font-black text-[#26152b] mt-0.5">{summary.upcomingProgramsCount}</div>
              <div className="text-[10px] font-semibold text-sky-700 mt-0.5">Teasers</div>
            </div>
            <div className="bg-gradient-to-br from-white to-pink-50/70 p-3 rounded-2xl border border-pink-200/90 shadow-2xs hover:border-pink-300 transition-all">
              <div className="text-[10px] font-bold text-[#877276] uppercase tracking-wider">Drafts</div>
              <div className="text-xl font-black text-[#26152b] mt-0.5">{summary.draftProgramsCount}</div>
              <div className="text-[10px] font-semibold text-[#877276] mt-0.5">In Prep</div>
            </div>
            <div className="bg-gradient-to-br from-white to-purple-50/70 p-3 rounded-2xl border border-purple-200/90 shadow-2xs hover:border-purple-300 transition-all">
              <div className="text-[10px] font-bold text-[#635882] uppercase tracking-wider">Completed</div>
              <div className="text-xl font-black text-[#26152b] mt-0.5">{summary.completedProgramsCount}</div>
              <div className="text-[10px] font-semibold text-[#635882] mt-0.5">Certified</div>
            </div>
            <div className="bg-gradient-to-br from-white to-amber-50/70 p-3 rounded-2xl border border-amber-200/90 shadow-2xs hover:border-amber-300 transition-all">
              <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Participants</div>
              <div className="text-xl font-black text-[#26152b] mt-0.5">{summary.totalParticipants}</div>
              <div className="text-[10px] font-semibold text-amber-700 mt-0.5">Registered</div>
            </div>
            <div className="bg-gradient-to-br from-white to-rose-50/70 p-3 rounded-2xl border border-rose-200/90 shadow-2xs hover:border-rose-300 transition-all">
              <div className="text-[10px] font-bold text-[#b8336a] uppercase tracking-wider">Submissions</div>
              <div className="text-xl font-black text-[#26152b] mt-0.5">{summary.totalSubmissions}</div>
              <div className="text-[10px] font-semibold text-[#b8336a] mt-0.5">Original Works</div>
            </div>
            <div className="bg-gradient-to-br from-white to-indigo-50/70 p-3 rounded-2xl border border-indigo-200/90 shadow-2xs hover:border-indigo-300 transition-all">
              <div className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Votes Cast</div>
              <div className="text-xl font-black text-[#26152b] mt-0.5">{summary.totalVotes}</div>
              <div className="text-[10px] font-semibold text-indigo-700 mt-0.5">Ballots</div>
            </div>
            <div className="bg-gradient-to-br from-white to-red-50/70 p-3 rounded-2xl border border-red-200/90 shadow-2xs hover:border-red-300 transition-all">
              <div className="text-[10px] font-bold text-red-800 uppercase tracking-wider">Needs Action</div>
              <div className="text-xl font-black text-[#26152b] mt-0.5">{summary.programsNeedingAttention}</div>
              <div className="text-[10px] font-semibold text-red-700 mt-0.5">Judging / Results</div>
            </div>
          </div>
        )}
      </div>

      {/* Internal Navigation Sub-Bar */}
      <div className="flex items-center gap-1.5 border-b border-pink-100 overflow-x-auto pb-1">
        {[
          { id: 'DASHBOARD', label: 'Programs Overview', icon: BarChart2 },
          { id: 'PROGRAMS_LIST', label: `All Programs (${programs.length})`, icon: Trophy },
          { id: 'PROGRAM_DETAIL', label: selectedProgram ? `Manage: ${selectedProgram.name.slice(0, 24)}...` : 'Program Controller', icon: Sliders },
          { id: 'PARTICIPANTS', label: `Participants (${participants.length})`, icon: Users },
          { id: 'SUBMISSIONS', label: `Submissions (${submissions.length})`, icon: FileText },
          { id: 'JUDGING', label: 'Judging Console', icon: Award },
          { id: 'VOTES', label: `Votes & Fraud Monitor (${votes.length})`, icon: ThumbsUp },
          { id: 'RESULTS', label: 'Results & Certificates', icon: CheckCircle2 },
          { id: 'ANNOUNCEMENTS', label: `Announcements (${announcements.length})`, icon: Bell },
          { id: 'AUDIT_LOGS', label: `Audit Trail (${auditLogs.length})`, icon: Shield }
        ].map(tab => {
          const Icon = tab.icon;
          const isCurrent = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                isCurrent
                  ? 'bg-[#9e3b5f] text-white shadow-md'
                  : 'text-[#544246] hover:bg-pink-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DASHBOARD OVERVIEW */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Quick Actions & Live Highlights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Active Programs Quick Access */}
            <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-pink-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#26152b] flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span>Live & High Priority Programs</span>
                  </h3>
                  <p className="text-xs text-[#877276]">Competitions currently collecting submissions, undergoing community voting, or requiring judging.</p>
                </div>
                <button
                  onClick={() => {
                    setProgramListFilter('ONGOING');
                    setActiveTab('PROGRAMS_LIST');
                  }}
                  className="text-xs font-bold text-[#9e3b5f] hover:underline"
                >
                  View All &rarr;
                </button>
              </div>

              <div className="space-y-3">
                {programs.filter(p => ['REGISTRATION_OPEN', 'SUBMISSION_OPEN', 'VOTING_OPEN', 'JUDGING', 'FINALISTS_ANNOUNCED'].includes(p.status)).slice(0, 4).map(prog => {
                  const statusStyle = STATUS_COLORS[prog.status] || STATUS_COLORS.DRAFT;
                  return (
                    <div
                      key={prog.id}
                      className="p-4 rounded-xl border border-pink-100/80 bg-white hover:border-pink-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={prog.thumbnail || prog.coverImage}
                          alt={prog.name}
                          className="w-12 h-12 rounded-xl object-cover border border-pink-100 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-[#26152b]">{prog.name}</span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                              {prog.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#877276] mt-0.5 flex items-center gap-3">
                            <span>Type: {prog.type}</span>
                            <span>Theme: {prog.theme}</span>
                            <span>Submissions: {prog.analytics?.submissionsCount ?? 0}</span>
                            <span>Votes: {prog.analytics?.totalVotes ?? 0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleSelectProgram(prog, 'PROGRAM_DETAIL')}
                          className="px-3 py-1.5 rounded-xl bg-pink-100 hover:bg-pink-200 text-[#9e3b5f] text-xs font-bold transition-all cursor-pointer"
                        >
                          Control Center
                        </button>
                        <button
                          onClick={() => handleSelectProgram(prog, 'SUBMISSIONS')}
                          className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-all cursor-pointer"
                        >
                          Submissions
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Audit Trail Sidebar */}
            <div className="glass-card rounded-2xl p-6 border border-pink-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#26152b] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span>Real-Time Audit Log</span>
                </h3>
                <button
                  onClick={() => setActiveTab('AUDIT_LOGS')}
                  className="text-xs font-bold text-[#9e3b5f] hover:underline"
                >
                  Full Trail &rarr;
                </button>
              </div>

              <div className="space-y-3">
                {auditLogs.slice(0, 6).map(log => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-pink-50/50 border border-pink-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[#9e3b5f]">{log.action}</span>
                      <span className="text-[10px] text-gray-500">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-[11px] text-[#26152b]">
                      <strong>{log.actorUsername}</strong> {log.targetName ? `→ "${log.targetName}"` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Programs Cards Grid */}
          <div className="space-y-3">
            <h3 className="text-sm sm:text-base font-bold text-[#26152b]">Program Management Directory</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {programs.slice(0, 6).map(prog => {
                const statusStyle = STATUS_COLORS[prog.status] || STATUS_COLORS.DRAFT;
                return (
                  <div
                    key={prog.id}
                    className="glass-card rounded-2xl overflow-hidden border border-pink-100 hover:border-pink-300 transition-all flex flex-col justify-between"
                  >
                    <div className="relative h-28 w-full overflow-hidden">
                      <img src={prog.coverImage} alt={prog.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <span className={`absolute top-3 left-3 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-sm ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                        {prog.status}
                      </span>
                      <span className="absolute bottom-2 left-3 text-[11px] font-bold text-white truncate max-w-[85%]">
                        {prog.name}
                      </span>
                    </div>

                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <p className="text-xs text-[#877276] line-clamp-2">{prog.tagline || prog.description}</p>
                      
                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-pink-50 text-center text-xs">
                        <div>
                          <div className="font-bold text-[#26152b]">{prog.analytics?.registrationsCount ?? 0}</div>
                          <div className="text-[10px] text-gray-500">Participants</div>
                        </div>
                        <div>
                          <div className="font-bold text-[#26152b]">{prog.analytics?.submissionsCount ?? 0}</div>
                          <div className="text-[10px] text-gray-500">Entries</div>
                        </div>
                        <div>
                          <div className="font-bold text-[#26152b]">{prog.analytics?.totalVotes ?? 0}</div>
                          <div className="text-[10px] text-gray-500">Votes</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleSelectProgram(prog, 'PROGRAM_DETAIL')}
                          className="flex-1 py-1.5 rounded-xl bg-[#9e3b5f] hover:bg-[#852f4e] text-white font-bold text-xs transition-all cursor-pointer text-center"
                        >
                          Manage Program
                        </button>
                        <button
                          onClick={() => handleDuplicateProgram(prog)}
                          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer transition-all"
                          title="Duplicate / Clone Program for next edition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROGRAMS LIST */}
      {activeTab === 'PROGRAMS_LIST' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Controls & Search */}
          <div className="glass-card rounded-2xl p-4 border border-pink-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'ONGOING', label: 'Ongoing / Active' },
                { id: 'UPCOMING', label: 'Upcoming' },
                { id: 'DRAFT', label: 'Drafts' },
                { id: 'COMPLETED', label: 'Completed' },
                { id: 'ARCHIVED', label: 'Archived' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setProgramListFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    programListFilter === f.id
                      ? 'bg-[#9e3b5f] text-white shadow-sm'
                      : 'bg-pink-50/70 text-[#544246] hover:bg-pink-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search and Type Dropdown */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search programs..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-pink-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#9e3b5f] w-48"
                />
              </div>

              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-pink-200 text-xs bg-white cursor-pointer"
              >
                <option value="ALL">All Program Types</option>
                <option value="Writing Competition">Writing Competition</option>
                <option value="Lore Challenge">Lore Challenge</option>
                <option value="One-Shot Contest">One-Shot Contest</option>
                <option value="Art / Cover Design">Art / Cover Design</option>
                <option value="Reader Review Event">Reader Review Event</option>
                <option value="Community Festival">Community Festival</option>
                <option value="Character Tournament">Character Tournament</option>
                <option value="Custom Special Campaign">Custom Special Campaign</option>
              </select>
            </div>
          </div>

          {/* Programs Table */}
          <div className="glass-card rounded-2xl border border-pink-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-pink-50/60 text-[#26152b] uppercase font-black text-[10px] tracking-wider border-b border-pink-100">
                  <tr>
                    <th className="py-3.5 px-4">Program & Type</th>
                    <th className="py-3.5 px-4">Theme / Scope</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-center">Participants</th>
                    <th className="py-3.5 px-4 text-center">Submissions</th>
                    <th className="py-3.5 px-4 text-center">Votes</th>
                    <th className="py-3.5 px-4">Timeline Closes</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-50">
                  {filteredPrograms.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-500 font-semibold">
                        No programs found matching filter.
                      </td>
                    </tr>
                  ) : (
                    filteredPrograms.map(prog => {
                      const statusStyle = STATUS_COLORS[prog.status] || STATUS_COLORS.DRAFT;
                      return (
                        <tr key={prog.id} className="hover:bg-pink-50/30 transition-all">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={prog.thumbnail || prog.coverImage}
                                alt={prog.name}
                                className="w-10 h-10 rounded-xl object-cover border border-pink-100 shrink-0"
                              />
                              <div>
                                <button
                                  onClick={() => handleSelectProgram(prog, 'PROGRAM_DETAIL')}
                                  className="font-bold text-[#26152b] hover:text-[#9e3b5f] text-xs text-left cursor-pointer"
                                >
                                  {prog.name}
                                </button>
                                <div className="text-[10px] text-[#877276]">{prog.type}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-700">
                            <div>{prog.theme}</div>
                            <div className="text-[10px] text-gray-500">{prog.category}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                              {prog.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-gray-900">
                            {prog.analytics?.registrationsCount ?? 0} / {prog.maxParticipants ?? 500}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-gray-900">
                            {prog.analytics?.submissionsCount ?? 0}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-gray-900">
                            {prog.analytics?.totalVotes ?? 0}
                          </td>
                          <td className="py-3 px-4 text-[11px] text-gray-600">
                            {prog.timeline?.submissionDeadline ? new Date(prog.timeline.submissionDeadline).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleSelectProgram(prog, 'PROGRAM_DETAIL')}
                                className="p-1.5 rounded-lg bg-pink-100 hover:bg-pink-200 text-[#9e3b5f] cursor-pointer"
                                title="Open Program Operations Center"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingProgram(prog);
                                  setShowCreateModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                                title="Edit Program Configuration"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDuplicateProgram(prog)}
                                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                                title="Duplicate / Clone"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProgram(prog)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                                title="Delete Program"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROGRAM DETAIL & AUTHORITATIVE CONTROLLER */}
      {activeTab === 'PROGRAM_DETAIL' && selectedProgram && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Selected Program Header Banner */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-pink-100 bg-gradient-to-r from-pink-50/80 via-white to-purple-50/80 shadow-md relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <img
                  src={selectedProgram.coverImage}
                  alt={selectedProgram.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-pink-200 shadow-md shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-black uppercase text-[#9e3b5f]">{selectedProgram.type}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs font-semibold text-gray-600">{selectedProgram.theme}</span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[selectedProgram.status]?.bg || ''} ${STATUS_COLORS[selectedProgram.status]?.text || ''} ${STATUS_COLORS[selectedProgram.status]?.border || ''}`}>
                      {selectedProgram.status}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#26152b] font-display">
                    {selectedProgram.name}
                  </h2>
                  <p className="text-xs text-[#877276] mt-1 max-w-xl">
                    {selectedProgram.tagline || selectedProgram.description}
                  </p>
                </div>
              </div>

              {/* Status Override Controller */}
              <div className="bg-white p-4 rounded-2xl border border-pink-200 shadow-xs space-y-3 min-w-[280px]">
                <div className="flex items-center justify-between text-xs font-extrabold text-[#26152b] uppercase tracking-wider">
                  <span>Authoritative Override</span>
                  <Shield className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">Override Status Immediately</label>
                  <select
                    value={overrideStatus}
                    onChange={e => setOverrideStatus(e.target.value as ProgramStatus)}
                    className="w-full px-3 py-1.5 rounded-xl border border-pink-200 text-xs bg-white cursor-pointer font-bold text-[#26152b]"
                  >
                    <option value="">Select New Lifecycle Status...</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="REGISTRATION_OPEN">REGISTRATION_OPEN</option>
                    <option value="REGISTRATION_CLOSED">REGISTRATION_CLOSED</option>
                    <option value="SUBMISSION_OPEN">SUBMISSION_OPEN</option>
                    <option value="SUBMISSION_CLOSED">SUBMISSION_CLOSED</option>
                    <option value="VOTING_OPEN">VOTING_OPEN</option>
                    <option value="VOTING_CLOSED">VOTING_CLOSED</option>
                    <option value="JUDGING">JUDGING</option>
                    <option value="FINALISTS_ANNOUNCED">FINALISTS_ANNOUNCED</option>
                    <option value="RESULTS_PENDING">RESULTS_PENDING</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
                {overrideStatus && (
                  <div>
                    <input
                      type="text"
                      value={overrideReason}
                      onChange={e => setOverrideReason(e.target.value)}
                      placeholder="Reason for manual override (audit trail)..."
                      className="w-full px-2.5 py-1 rounded-lg border border-pink-200 text-xs"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleApplyStatusOverride}
                    disabled={!overrideStatus || actionLoading === 'status_override'}
                    className="flex-1 py-1.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-extrabold text-xs shadow-sm cursor-pointer disabled:opacity-50 transition-all text-center"
                  >
                    {actionLoading === 'status_override' ? 'Applying...' : 'Apply Override'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingProgram(selectedProgram);
                      setShowCreateModal(true);
                    }}
                    className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                    title="Edit Full Program Settings"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick stats ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-pink-100 text-center">
              <div className="bg-white/60 p-2.5 rounded-xl border border-pink-100">
                <div className="text-[10px] text-gray-500 uppercase font-semibold">Registered</div>
                <div className="text-base font-black text-[#26152b]">{participants.length}</div>
              </div>
              <div className="bg-white/60 p-2.5 rounded-xl border border-pink-100">
                <div className="text-[10px] text-gray-500 uppercase font-semibold">Submissions</div>
                <div className="text-base font-black text-[#26152b]">{submissions.length}</div>
              </div>
              <div className="bg-white/60 p-2.5 rounded-xl border border-pink-100">
                <div className="text-[10px] text-gray-500 uppercase font-semibold">Finalists</div>
                <div className="text-base font-black text-purple-700">
                  {submissions.filter(s => s.status === 'FINALIST').length}
                </div>
              </div>
              <div className="bg-white/60 p-2.5 rounded-xl border border-pink-100">
                <div className="text-[10px] text-gray-500 uppercase font-semibold">Total Votes</div>
                <div className="text-base font-black text-rose-600">{votes.length}</div>
              </div>
              <div className="bg-white/60 p-2.5 rounded-xl border border-pink-100">
                <div className="text-[10px] text-gray-500 uppercase font-semibold">Announcements</div>
                <div className="text-base font-black text-[#26152b]">{announcements.length}</div>
              </div>
              <div className="bg-white/60 p-2.5 rounded-xl border border-pink-100">
                <div className="text-[10px] text-gray-500 uppercase font-semibold">Results Declared</div>
                <div className="text-base font-black text-emerald-700">
                  {selectedProgram.results?.isLocked ? 'YES (Locked)' : 'NO'}
                </div>
              </div>
            </div>
          </div>

          {/* Program Sub-View Tabs Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left: Timeline & Phase Progress */}
            <div className="glass-card rounded-2xl p-6 border border-pink-100 space-y-4">
              <h3 className="text-xs font-bold text-[#26152b] uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#9e3b5f]" />
                <span>Program Timeline Checkpoints</span>
              </h3>

              <div className="space-y-3 text-xs">
                {[
                  { label: 'Registration Window', start: selectedProgram.timeline?.registrationOpens, end: selectedProgram.timeline?.registrationCloses },
                  { label: 'Submission Window', start: selectedProgram.timeline?.submissionOpens, end: selectedProgram.timeline?.submissionDeadline },
                  { label: 'Community Voting', start: selectedProgram.timeline?.votingStarts, end: selectedProgram.timeline?.votingEnds },
                  { label: 'Judging & Evaluation', start: selectedProgram.timeline?.judgingStarts, end: selectedProgram.timeline?.judgingEnds },
                  { label: 'Result Declaration', start: selectedProgram.timeline?.resultDeclarationDate, end: selectedProgram.timeline?.programEndDate }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-pink-50/40 border border-pink-100/60 space-y-1">
                    <div className="font-bold text-[#26152b]">{item.label}</div>
                    <div className="text-[11px] text-gray-500">
                      {item.start ? new Date(item.start).toLocaleDateString() : 'N/A'} — {item.end ? new Date(item.end).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Middle: Prizes & Badges */}
            <div className="glass-card rounded-2xl p-6 border border-pink-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#26152b] uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Prizes & Verified Honors</span>
                </h3>
                {selectedProgram.results?.isLocked ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Results Locked
                  </span>
                ) : (
                  <button
                    onClick={handleOpenDeclareResults}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Declare Results
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {(selectedProgram.prizes || []).map(prize => (
                  <div key={prize.id} className="p-3 rounded-xl border border-amber-200/80 bg-amber-50/40 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-amber-900">{prize.placement}</span>
                      <span className="font-bold text-xs text-[#9e3b5f]">{prize.kairoCoins} Coins • {prize.xpReward} XP</span>
                    </div>
                    <div className="font-semibold text-gray-800">{prize.title}</div>
                    <div className="text-[11px] text-gray-600">{prize.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Rules & Protocol Summary */}
            <div className="glass-card rounded-2xl p-6 border border-pink-100 space-y-4">
              <h3 className="text-xs font-bold text-[#26152b] uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500" />
                <span>Governance & Rubric</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-pink-100 space-y-1">
                  <div className="font-bold text-gray-800">Judging Formula</div>
                  <div className="text-gray-600">
                    {selectedProgram.judgingConfig?.formula} (Judge: {selectedProgram.judgingConfig?.judgeWeightPercent}%, Community: {selectedProgram.judgingConfig?.communityWeightPercent}%)
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-pink-100 space-y-1">
                  <div className="font-bold text-gray-800">AI Content Policy</div>
                  <div className="text-gray-600">{selectedProgram.rules?.aiContentPolicy}</div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-pink-100 space-y-1">
                  <div className="font-bold text-gray-800">Voting Limits</div>
                  <div className="text-gray-600">{selectedProgram.votingConfig?.mode} (Max {selectedProgram.votingConfig?.maxVotesPerUser || 1} vote(s))</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PARTICIPANTS */}
      {activeTab === 'PARTICIPANTS' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="glass-card rounded-2xl p-4 border border-pink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#26152b]">Registered Participants</h3>
              <p className="text-xs text-[#877276]">
                {selectedProgram ? `Participants in "${selectedProgram.name}"` : 'All registered participants'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedProgramId || ''}
                onChange={e => setSelectedProgramId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-pink-200 text-xs bg-white cursor-pointer font-semibold text-[#26152b]"
              >
                {programs.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-pink-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-pink-50/60 text-[#26152b] uppercase font-black text-[10px] tracking-wider border-b border-pink-100">
                  <tr>
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Role / Type</th>
                    <th className="py-3.5 px-4">Submission Status</th>
                    <th className="py-3.5 px-4">Registered At</th>
                    <th className="py-3.5 px-4">Rules Agreed</th>
                    <th className="py-3.5 px-4 text-center">Votes Earned</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-50">
                  {participants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500 font-semibold">
                        No participants registered yet for this program.
                      </td>
                    </tr>
                  ) : (
                    participants.map(part => (
                      <tr key={part.id} className="hover:bg-pink-50/30 transition-all">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img src={part.avatar} alt={part.displayName} className="w-8 h-8 rounded-full object-cover border border-pink-100" />
                            <div>
                              <div className="font-bold text-[#26152b]">{part.displayName}</div>
                              <div className="text-[10px] text-[#877276]">@{part.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-[#9e3b5f]">
                            {part.userType}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">
                            {part.submissionStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(part.registeredAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Agreed</span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-gray-900">
                          {part.voteCount}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={async () => {
                              if (!selectedProgram) return;
                              if (!confirm(`Remove participant @${part.username} from this program?`)) return;
                              await api.adminRemoveProgramParticipant(selectedProgram.id, part.id);
                              setParticipants(prev => prev.filter(p => p.id !== part.id));
                              showToast('success', `Removed participant @${part.username}`);
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                            title="Disqualify / Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SUBMISSIONS */}
      {activeTab === 'SUBMISSIONS' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="glass-card rounded-2xl p-4 border border-pink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#26152b]">Program Submissions & Entries</h3>
              <p className="text-xs text-[#877276]">
                Review creative works, evaluate word counts, assign judge scores, and crown finalists.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedProgramId || ''}
                onChange={e => setSelectedProgramId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-pink-200 text-xs bg-white cursor-pointer font-semibold text-[#26152b]"
              >
                {programs.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {submissions.length === 0 ? (
              <div className="md:col-span-2 py-12 text-center text-gray-500 font-semibold glass-card rounded-2xl border border-pink-100">
                No submissions received yet for this program.
              </div>
            ) : (
              submissions.map(sub => {
                const isFinalist = sub.status === 'FINALIST';
                return (
                  <div
                    key={sub.id}
                    className={`glass-card rounded-2xl p-5 border transition-all space-y-4 flex flex-col justify-between ${
                      isFinalist ? 'border-amber-400 bg-amber-50/20' : 'border-pink-100 hover:border-pink-300'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <img src={sub.avatar} alt={sub.displayName} className="w-9 h-9 rounded-full object-cover border border-pink-200" />
                          <div>
                            <div className="font-bold text-[#26152b] text-xs">{sub.displayName}</div>
                            <div className="text-[10px] text-gray-500">@{sub.username}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isFinalist && (
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-800 border border-amber-400/40 flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>FINALIST</span>
                            </span>
                          )}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            {sub.status}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-[#26152b]">{sub.title}</h4>
                        {sub.tagline && <p className="text-xs text-[#9e3b5f] italic">{sub.tagline}</p>}
                        <p className="text-xs text-[#877276] mt-1 line-clamp-3">
                          {sub.summary || sub.content}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-pink-50/50 border border-pink-100">
                        <span className="text-gray-600 font-semibold">{sub.wordCount} words</span>
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          <span>{sub.votes || 0} Votes</span>
                        </span>
                        <span className="text-purple-700 font-bold">
                          Score: {sub.scores?.finalWeightedScore || 0} / 100
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-pink-50">
                      <div className="flex items-center gap-2">
                        {sub.storySlug && onOpenStory && (
                          <button
                            onClick={() => onOpenStory(sub.storySlug!)}
                            className="px-2.5 py-1.5 rounded-lg bg-pink-100 hover:bg-pink-200 text-[#9e3b5f] text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Read Story</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenScoring(sub)}
                          className="px-2.5 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Score Entry</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleFinalist(sub)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            isFinalist
                              ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {isFinalist ? 'Remove Finalist' : 'Mark Finalist'}
                        </button>

                        <button
                          onClick={async () => {
                            if (!selectedProgram) return;
                            if (!confirm(`Delete submission "${sub.title}"?`)) return;
                            await api.adminDeleteProgramSubmission(selectedProgram.id, sub.id);
                            setSubmissions(prev => prev.filter(s => s.id !== sub.id));
                            showToast('success', `Deleted submission: ${sub.title}`);
                          }}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 6: JUDGING CONSOLE */}
      {activeTab === 'JUDGING' && selectedProgram && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="glass-card rounded-2xl p-6 border border-pink-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#26152b] flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span>Judging Panel & Scoring Matrix</span>
                </h3>
                <p className="text-xs text-[#877276]">
                  Evaluate submissions against defined criteria weights.
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-gray-600">Judging Mode: </span>
                <span className="text-xs font-black text-[#9e3b5f]">{selectedProgram.judgingConfig?.formula}</span>
              </div>
            </div>

            {/* Criteria summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(selectedProgram.judgingConfig?.criteria || []).map(crit => (
                <div key={crit.id} className="p-3 rounded-xl bg-pink-50/50 border border-pink-100 text-xs">
                  <div className="font-bold text-[#26152b]">{crit.name}</div>
                  <div className="text-purple-700 font-extrabold text-sm">{crit.weightPercent}% Weight</div>
                </div>
              ))}
            </div>
          </div>

          {/* Submissions Ranked by Score */}
          <div className="glass-card rounded-2xl border border-pink-100 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-pink-100 bg-pink-50/30 flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#26152b] uppercase tracking-wider">Submissions Scoring Leaderboard</h4>
              <span className="text-xs text-gray-500">Sorted by Final Weighted Score</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-pink-50/60 text-[#26152b] uppercase font-black text-[10px] tracking-wider border-b border-pink-100">
                  <tr>
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Story & Creator</th>
                    <th className="py-3 px-4 text-center">Judge Avg (70%)</th>
                    <th className="py-3 px-4 text-center">Community Score (30%)</th>
                    <th className="py-3 px-4 text-center">Final Score</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-50">
                  {[...submissions]
                    .sort((a, b) => (b.scores?.finalWeightedScore || 0) - (a.scores?.finalWeightedScore || 0))
                    .map((sub, idx) => (
                      <tr key={sub.id} className="hover:bg-pink-50/30 transition-all">
                        <td className="py-3 px-4 font-black text-sm text-[#9e3b5f]">
                          #{idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#26152b]">{sub.title}</div>
                          <div className="text-[10px] text-gray-500">by {sub.displayName} (@{sub.username})</div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-gray-800">
                          {sub.scores?.averageJudgeScore || 0}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-gray-800">
                          {sub.scores?.communityScore || 0}
                        </td>
                        <td className="py-3 px-4 text-center font-black text-sm text-purple-700">
                          {sub.scores?.finalWeightedScore || 0}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-[#9e3b5f]">
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenScoring(sub)}
                            className="px-3 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs cursor-pointer"
                          >
                            Score & Review
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: VOTES & FRAUD MONITOR */}
      {activeTab === 'VOTES' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="glass-card rounded-2xl p-6 border border-pink-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#26152b] flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-rose-500" />
                  <span>Live Ballot & Vote Activity Stream</span>
                </h3>
                <p className="text-xs text-[#877276]">
                  Real-time vote logs, voter usernames, timestamps, and duplicate ballot protection.
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs text-gray-500">Total Valid Ballots</div>
                <div className="text-2xl font-black text-rose-600">{votes.length}</div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-pink-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-pink-50/60 text-[#26152b] uppercase font-black text-[10px] tracking-wider border-b border-pink-100">
                  <tr>
                    <th className="py-3.5 px-4">Vote ID</th>
                    <th className="py-3.5 px-4">Voter Username</th>
                    <th className="py-3.5 px-4">Submission Voted For</th>
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">IP / Origin</th>
                    <th className="py-3.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-50">
                  {votes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500 font-semibold">
                        No community votes cast yet.
                      </td>
                    </tr>
                  ) : (
                    votes.map(v => {
                      const sub = submissions.find(s => s.id === v.submissionId);
                      return (
                        <tr key={v.id} className="hover:bg-pink-50/30 transition-all">
                          <td className="py-3 px-4 font-mono text-gray-500 text-[10px]">{v.id}</td>
                          <td className="py-3 px-4 font-bold text-[#26152b]">@{v.username}</td>
                          <td className="py-3 px-4 font-medium text-purple-900">{sub?.title || v.submissionId}</td>
                          <td className="py-3 px-4 text-gray-600">{new Date(v.votedAt).toLocaleString()}</td>
                          <td className="py-3 px-4 font-mono text-gray-500 text-[10px]">{v.ipAddress || '127.0.0.1'}</td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Verified Ballot
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: RESULTS & CERTIFICATES */}
      {activeTab === 'RESULTS' && selectedProgram && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="glass-card rounded-2xl p-6 border border-pink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#26152b] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Results Declaration & Certificate Issuance</span>
              </h3>
              <p className="text-xs text-[#877276]">
                Review declared champions, view cryptographic verification certificates, and unlock winner badges.
              </p>
            </div>

            {!selectedProgram.results?.isLocked ? (
              <button
                onClick={handleOpenDeclareResults}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-extrabold text-xs shadow-lg flex items-center gap-2 cursor-pointer transition-all"
              >
                <Award className="w-4 h-4" />
                <span>Declare Official Winners & Lock Results</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300">
                <Lock className="w-3.5 h-3.5" />
                <span>Results Certified & Locked</span>
              </div>
            )}
          </div>

          {/* Results Showcase */}
          {selectedProgram.results?.winners && selectedProgram.results.winners.length > 0 ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                <div className="font-bold">Official Grand Council Remarks:</div>
                <p className="italic">{selectedProgram.results.remarks}</p>
                <div className="text-[10px] text-amber-700 pt-1">
                  Declared on {selectedProgram.results.publishedAt ? new Date(selectedProgram.results.publishedAt).toLocaleString() : 'N/A'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedProgram.results.winners.map(win => (
                  <div
                    key={win.submissionId}
                    className="glass-card rounded-2xl p-5 border border-amber-200 bg-gradient-to-b from-amber-50/40 to-white space-y-4 shadow-sm flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-800 uppercase tracking-wider">{win.placementTitle}</span>
                        <Award className="w-5 h-5 text-amber-500" />
                      </div>

                      <div>
                        <h4 className="font-extrabold text-sm text-[#26152b]">{win.storyTitle}</h4>
                        <div className="text-xs text-[#877276] mt-0.5">Author: {win.displayName} (@{win.username})</div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-amber-100/60 border border-amber-200 text-[11px] text-amber-900">
                        Award: <strong>{win.specialAwardName || 'Honorable Laureate'}</strong>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-amber-100">
                      <button
                        onClick={async () => {
                          if (win.certificateId) {
                            const res = await api.verifyCertificate(win.certificateId);
                            if (res.certificate) setShowCertificateModal(res.certificate);
                          }
                        }}
                        className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-bold shadow-xs hover:from-amber-600 hover:to-yellow-600 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>View Cryptographic Certificate</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-12 text-center text-gray-500 border border-pink-100 space-y-3">
              <Award className="w-12 h-12 text-gray-300 mx-auto" />
              <div className="text-sm font-bold text-[#26152b]">No official results declared yet</div>
              <p className="text-xs text-[#877276] max-w-md mx-auto">
                Once judging and community voting conclude, click "Declare Official Winners" to certify placements, generate verifiable cryptographic certificates, and issue platform badges.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 9: ANNOUNCEMENTS */}
      {activeTab === 'ANNOUNCEMENTS' && selectedProgram && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="glass-card rounded-2xl p-4 border border-pink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#26152b] flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-600" />
                <span>Program Broadcast Announcements</span>
              </h3>
              <p className="text-xs text-[#877276]">
                Publish official updates, deadline extensions, or results broadcasts directly to participants.
              </p>
            </div>

            <button
              onClick={() => setNewAnnouncementModal(true)}
              className="px-4 py-2 rounded-xl bg-[#9e3b5f] hover:bg-[#852f4e] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Compose Broadcast</span>
            </button>
          </div>

          <div className="space-y-3">
            {announcements.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center text-gray-500 border border-pink-100 font-semibold">
                No announcements published yet for this program.
              </div>
            ) : (
              announcements.map(ann => (
                <div key={ann.id} className="glass-card rounded-2xl p-5 border border-pink-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                        {ann.type}
                      </span>
                      <h4 className="font-bold text-sm text-[#26152b]">{ann.title}</h4>
                    </div>
                    <span className="text-[10px] text-gray-500">
                      {new Date(ann.publishedAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                    {ann.content}
                  </p>

                  {ann.socialMediaCopy && (
                    <div className="p-3 rounded-xl bg-pink-50/50 border border-pink-100 text-xs text-gray-700">
                      <span className="font-bold text-[#9e3b5f]">Social Copy: </span>
                      <span>{ann.socialMediaCopy}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 10: AUDIT LOGS */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="glass-card rounded-2xl p-6 border border-pink-100 space-y-2">
            <h3 className="text-sm font-bold text-[#26152b] flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" />
              <span>Tamper-Evident Administrative Audit Log</span>
            </h3>
            <p className="text-xs text-[#877276]">
              Chronological ledger tracking every program creation, manual status override, judge score assignment, and result declaration.
            </p>
          </div>

          <div className="glass-card rounded-2xl border border-pink-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-pink-50/60 text-[#26152b] uppercase font-black text-[10px] tracking-wider border-b border-pink-100">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action Type</th>
                    <th className="py-3 px-4">Admin Actor</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Change Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-50">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-500 font-semibold">
                        No audit logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-pink-50/30 transition-all font-mono text-[11px]">
                        <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-sans font-bold text-[#9e3b5f]">
                          {log.action}
                        </td>
                        <td className="py-3 px-4 font-sans font-bold text-[#26152b]">
                          {log.actorUsername}
                        </td>
                        <td className="py-3 px-4 font-sans text-gray-700">
                          {log.targetName || log.targetId || '-'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[10px] text-gray-600 max-w-md truncate">
                          {log.newValue ? JSON.stringify(log.newValue) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PROGRAM MODAL */}
      {showCreateModal && (
        <CreateProgramModal
          programToEdit={editingProgram}
          onClose={() => {
            setShowCreateModal(false);
            setEditingProgram(null);
          }}
          onSubmit={async (data) => {
            if (editingProgram) {
              const res = await api.adminUpdateProgram(editingProgram.id, data);
              setSelectedProgram(res.program);
              setPrograms(prev => prev.map(p => p.id === res.program.id ? res.program : p));
              showToast('success', `Updated program: ${res.program.name}`);
            } else {
              const res = await api.adminCreateProgram(data);
              setPrograms(prev => [res.program, ...prev]);
              handleSelectProgram(res.program);
              showToast('success', `Created new program: ${res.program.name}`);
            }
            loadInitialData();
          }}
        />
      )}

      {/* CERTIFICATE VERIFICATION MODAL */}
      {showCertificateModal && (
        <CertificateModal
          certificate={showCertificateModal}
          onClose={() => setShowCertificateModal(null)}
        />
      )}

      {/* JUDGE SCORING MODAL */}
      {scoringSubmission && selectedProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-pink-100 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#9e3b5f] uppercase tracking-wider">Judging Console</span>
                <h3 className="text-lg font-bold text-[#26152b]">{scoringSubmission.title}</h3>
                <div className="text-xs text-gray-500">Author: {scoringSubmission.displayName} (@{scoringSubmission.username})</div>
              </div>
              <button
                onClick={() => setScoringSubmission(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {(selectedProgram.judgingConfig?.criteria || []).map(crit => (
                <div key={crit.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-[#26152b]">
                    <span>{crit.name} ({crit.weightPercent}% weight)</span>
                    <span className="text-purple-700 font-black">{judgeScores[crit.id] || 0} / 100</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={judgeScores[crit.id] || 0}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setJudgeScores(prev => ({ ...prev, [crit.id]: val }));
                    }}
                    className="w-full accent-[#9e3b5f] cursor-pointer"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-bold text-[#26152b] mb-1">Judge Feedback / Critique</label>
                <textarea
                  rows={3}
                  value={judgeFeedback}
                  onChange={e => setJudgeFeedback(e.target.value)}
                  placeholder="Constructive feedback for the author..."
                  className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#9e3b5f]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setScoringSubmission(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScore}
                disabled={actionLoading === 'saving_score'}
                className="px-5 py-2 rounded-xl bg-[#9e3b5f] hover:bg-[#852f4e] text-white text-xs font-bold shadow-md cursor-pointer"
              >
                {actionLoading === 'saving_score' ? 'Saving...' : 'Submit Evaluation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DECLARE RESULTS MODAL */}
      {showDeclareResultsModal && selectedProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-200 space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase">
                  <Award className="w-3.5 h-3.5" />
                  <span>Grand Council Result Declaration</span>
                </div>
                <h3 className="text-xl font-black text-[#26152b] mt-1 font-display">Declare & Certify Winners</h3>
                <p className="text-xs text-[#877276]">Assign prizes to top submissions. Cryptographic certificates will be generated immediately.</p>
              </div>
              <button
                onClick={() => setShowDeclareResultsModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Prize to Submission Mappings */}
            <div className="space-y-4">
              {(selectedProgram.prizes || []).map((prize, idx) => {
                const currentSelection = winnerSelections.find(w => w.prizeId === prize.id)?.submissionId || '';
                return (
                  <div key={prize.id} className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-900 uppercase tracking-wider">{prize.placement}</span>
                      <span className="text-xs font-bold text-[#9e3b5f]">{prize.title}</span>
                    </div>

                    <select
                      value={currentSelection}
                      onChange={e => {
                        const val = e.target.value;
                        setWinnerSelections(prev => {
                          const rest = prev.filter(w => w.prizeId !== prize.id);
                          return [...rest, { prizeId: prize.id, submissionId: val }];
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs bg-white font-semibold text-[#26152b] cursor-pointer"
                    >
                      <option value="">Select Winning Submission...</option>
                      {submissions.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.title} — by {s.displayName} (Score: {s.scores?.finalWeightedScore || 0}, Votes: {s.votes})
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}

              <div>
                <label className="block text-xs font-bold text-[#26152b] mb-1">Official Master Admin Remarks</label>
                <textarea
                  rows={3}
                  value={resultsRemarks}
                  onChange={e => setResultsRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-amber-100">
              <button
                onClick={() => setShowDeclareResultsModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeclareResults}
                disabled={actionLoading === 'declaring_results'}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black text-xs font-black shadow-lg cursor-pointer flex items-center gap-2"
              >
                <Award className="w-4 h-4" />
                <span>{actionLoading === 'declaring_results' ? 'Certifying Results...' : 'Confirm & Publish Official Results'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPOSE ANNOUNCEMENT MODAL */}
      {newAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-pink-100 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#26152b] flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-600" />
                <span>Compose Program Broadcast</span>
              </h3>
              <button
                onClick={() => setNewAnnouncementModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#26152b] mb-1">Headline / Title *</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={e => setAnnTitle(e.target.value)}
                  placeholder="e.g. Submissions Closed — Voting Starts Now!"
                  className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#9e3b5f]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26152b] mb-1">Announcement Type</label>
                <select
                  value={annType}
                  onChange={e => setAnnType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs bg-white cursor-pointer"
                >
                  <option value="IMPORTANT_UPDATE">Important Update</option>
                  <option value="DEADLINE_EXTENSION">Deadline Extension</option>
                  <option value="FINALISTS_REVEAL">Finalists Reveal</option>
                  <option value="RESULTS_ANNOUNCED">Results Announced</option>
                  <option value="RULES_CLARIFICATION">Rules Clarification</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26152b] mb-1">Broadcast Body Content</label>
                <textarea
                  rows={4}
                  required
                  value={annContent}
                  onChange={e => setAnnContent(e.target.value)}
                  placeholder="Full message delivered to participants and public viewers..."
                  className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#9e3b5f]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26152b] mb-1">Social Media Copy (Optional)</label>
                <input
                  type="text"
                  value={annSocialCopy}
                  onChange={e => setAnnSocialCopy(e.target.value)}
                  placeholder="Tweet/Post copy with hashtags..."
                  className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs"
                />
              </div>

              <div className="p-3 bg-pink-50 rounded-xl border border-pink-200 flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="ann_notif"
                  checked={annSendNotification}
                  onChange={e => setAnnSendNotification(e.target.checked)}
                  className="w-4 h-4 text-[#9e3b5f] rounded"
                />
                <label htmlFor="ann_notif" className="text-xs font-bold text-[#26152b] cursor-pointer">
                  Send immediate in-app notification to all registered participants
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewAnnouncementModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'creating_announcement'}
                  className="px-5 py-2 rounded-xl bg-[#9e3b5f] hover:bg-[#852f4e] text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{actionLoading === 'creating_announcement' ? 'Dispatching...' : 'Dispatch Announcement'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
