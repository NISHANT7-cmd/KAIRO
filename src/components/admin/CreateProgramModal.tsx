import React, { useState } from 'react';
import { 
  X, Sparkles, Calendar, Award, Shield, FileText, 
  Sliders, Image as ImageIcon, Plus, Trash2, CheckCircle2 
} from 'lucide-react';
import { Program, ProgramType, ProgramStatus, JudgingCriterion, ProgramPrize } from '../../types';

interface CreateProgramModalProps {
  programToEdit?: Program | null;
  onClose: () => void;
  onSubmit: (data: Partial<Program>) => Promise<void>;
}

const PROGRAM_TYPES: ProgramType[] = [
  'Writing Competition',
  'Lore Challenge',
  'One-Shot Contest',
  'Art / Cover Design',
  'Reader Review Event',
  'Community Festival',
  'Character Tournament',
  'Weekly Prompt',
  'Author Milestone Event',
  'Custom Special Campaign'
];

export const CreateProgramModal: React.FC<CreateProgramModalProps> = ({
  programToEdit,
  onClose,
  onSubmit
}) => {
  const [activeStep, setActiveStep] = useState<'BASIC' | 'TIMELINE' | 'RULES' | 'PRIZES' | 'JUDGING' | 'BRANDING'>('BASIC');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState(programToEdit?.name || '');
  const [tagline, setTagline] = useState(programToEdit?.tagline || '');
  const [description, setDescription] = useState(programToEdit?.description || '');
  const [type, setType] = useState<ProgramType>(programToEdit?.type || 'Writing Competition');
  const [customType, setCustomType] = useState(programToEdit?.customType || '');
  const [theme, setTheme] = useState(programToEdit?.theme || 'Cyberpunk & Astral Realms');
  const [category, setCategory] = useState(programToEdit?.category || 'Fantasy / Sci-Fi');
  const [organizerName, setOrganizerName] = useState(programToEdit?.organizerName || 'KAIRO Editorial Guild');
  const [targetAudience, setTargetAudience] = useState<'author-only' | 'reader-only' | 'both'>(
    programToEdit?.targetAudience || 'both'
  );
  const [visibility, setVisibility] = useState<'public' | 'private' | 'invite-only'>(
    programToEdit?.visibility || 'public'
  );
  const [status, setStatus] = useState<ProgramStatus>(programToEdit?.status || 'DRAFT');
  const [maxParticipants, setMaxParticipants] = useState<number>(programToEdit?.maxParticipants || 500);

  // Images
  const [coverImage, setCoverImage] = useState(
    programToEdit?.coverImage || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80'
  );
  const [bannerImage, setBannerImage] = useState(
    programToEdit?.bannerImage || 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1600&auto=format&fit=crop&q=80'
  );

  // Timeline
  const now = new Date();
  const formatInputDate = (isoStr?: string, daysOffset = 0) => {
    if (isoStr) {
      return isoStr.slice(0, 16);
    }
    const d = new Date(Date.now() + daysOffset * 86400000);
    return d.toISOString().slice(0, 16);
  };

  const [registrationOpens, setRegistrationOpens] = useState(formatInputDate(programToEdit?.timeline?.registrationOpens, 0));
  const [registrationCloses, setRegistrationCloses] = useState(formatInputDate(programToEdit?.timeline?.registrationCloses, 14));
  const [submissionOpens, setSubmissionOpens] = useState(formatInputDate(programToEdit?.timeline?.submissionOpens, 0));
  const [submissionDeadline, setSubmissionDeadline] = useState(formatInputDate(programToEdit?.timeline?.submissionDeadline, 28));
  const [votingStarts, setVotingStarts] = useState(formatInputDate(programToEdit?.timeline?.votingStarts, 29));
  const [votingEnds, setVotingEnds] = useState(formatInputDate(programToEdit?.timeline?.votingEnds, 40));
  const [judgingStarts, setJudgingStarts] = useState(formatInputDate(programToEdit?.timeline?.judgingStarts, 30));
  const [judgingEnds, setJudgingEnds] = useState(formatInputDate(programToEdit?.timeline?.judgingEnds, 42));
  const [resultDeclarationDate, setResultDeclarationDate] = useState(formatInputDate(programToEdit?.timeline?.resultDeclarationDate, 45));

  // Rules
  const [fullRules, setFullRules] = useState(programToEdit?.rules?.fullRules || 'Standard KAIRO community competition guidelines apply. Original creations only.');
  const [allowedContent, setAllowedContent] = useState(programToEdit?.rules?.allowedContent || 'Original fiction, lore essays, worldbuilding documents.');
  const [prohibitedContent, setProhibitedContent] = useState(programToEdit?.rules?.prohibitedContent || 'Hate speech, plagiarized stories, copyright infringements.');
  const [aiContentPolicy, setAiContentPolicy] = useState(programToEdit?.rules?.aiContentPolicy || 'Allowed with disclosure');
  const [submissionLimitPerUser, setSubmissionLimitPerUser] = useState(programToEdit?.rules?.submissionLimitPerUser || 1);
  const [requireRulesAgreement, setRequireRulesAgreement] = useState(programToEdit?.rules?.requireRulesAgreement ?? true);

  // Prizes
  const [prizes, setPrizes] = useState<ProgramPrize[]>(
    programToEdit?.prizes && programToEdit.prizes.length > 0
      ? programToEdit.prizes
      : [
          {
            id: 'prz_1',
            placement: '1st Place',
            title: 'Grand Champion Trophy & Editorial Feature',
            description: 'Featured on Kairo Homepage, official verified badge, and laureate certificate.',
            kairoCoins: 5000,
            xpReward: 15000,
            badgeKey: 'badge_grand_champion',
            badgeTitle: 'Grand Champion',
            certificateAwarded: true
          },
          {
            id: 'prz_2',
            placement: '2nd Place',
            title: 'Silver Laureate Distinction',
            description: 'Runner-up distinction with certified laurels and profile highlight.',
            kairoCoins: 2500,
            xpReward: 8000,
            certificateAwarded: true
          },
          {
            id: 'prz_3',
            placement: '3rd Place',
            title: 'Bronze Laureate Distinction',
            description: 'Honorable placement with digital certificate and platform reward.',
            kairoCoins: 1000,
            xpReward: 4000,
            certificateAwarded: true
          }
        ]
  );

  // Judging & Voting
  const [judgingEnabled, setJudgingEnabled] = useState(programToEdit?.judgingConfig?.enabled ?? true);
  const [blindJudging, setBlindJudging] = useState(programToEdit?.judgingConfig?.blindJudging ?? false);
  const [judgingFormula, setJudgingFormula] = useState(programToEdit?.judgingConfig?.formula || 'JUDGE_COMMUNITY_COMBINED');
  const [judgeWeightPercent, setJudgeWeightPercent] = useState(programToEdit?.judgingConfig?.judgeWeightPercent ?? 70);
  const [communityWeightPercent, setCommunityWeightPercent] = useState(programToEdit?.judgingConfig?.communityWeightPercent ?? 30);
  const [votingMode, setVotingMode] = useState<'ONE_PER_USER' | 'ONE_PER_DAY' | 'RANKED_CHOICE' | 'UNLIMITED'>(
    programToEdit?.votingConfig?.mode || 'ONE_PER_USER'
  );

  const [criteria, setCriteria] = useState<JudgingCriterion[]>(
    programToEdit?.judgingConfig?.criteria && programToEdit.judgingConfig.criteria.length > 0
      ? programToEdit.judgingConfig.criteria
      : [
          { id: 'crit_plot', name: 'Story & Narrative Arc', description: 'Coherence, pacing, emotional impact', weightPercent: 40 },
          { id: 'crit_world', name: 'Worldbuilding & Lore Depth', description: 'Originality and setting immersion', weightPercent: 30 },
          { id: 'crit_writing', name: 'Prose & Prose Craft', description: 'Stylistic clarity and execution', weightPercent: 30 }
        ]
  );

  const handleAddCriteria = () => {
    const id = `crit_${Date.now()}`;
    setCriteria(prev => [...prev, { id, name: 'New Criterion', weightPercent: 20 }]);
  };

  const handleRemoveCriteria = (id: string) => {
    setCriteria(prev => prev.filter(c => c.id !== id));
  };

  const handleAddPrize = () => {
    const id = `prz_${Date.now()}`;
    setPrizes(prev => [
      ...prev,
      {
        id,
        placement: `${prev.length + 1}th Place`,
        title: 'Honorable Distinction',
        description: 'Recognition and reward.',
        kairoCoins: 500,
        xpReward: 2000,
        certificateAwarded: true
      }
    ]);
  };

  const handleRemovePrize = (id: string) => {
    setPrizes(prev => prev.filter(p => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Program Name is required');
      setActiveStep('BASIC');
      return;
    }

    setSubmitting(true);
    setError(null);

    const programPayload: Partial<Program> = {
      name: name.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      type,
      customType: type === 'Custom Special Campaign' ? customType : undefined,
      theme,
      category,
      organizerName,
      targetAudience,
      visibility,
      status,
      maxParticipants: Number(maxParticipants) || 500,
      coverImage,
      bannerImage,
      timeline: {
        registrationOpens: new Date(registrationOpens).toISOString(),
        registrationCloses: new Date(registrationCloses).toISOString(),
        submissionOpens: new Date(submissionOpens).toISOString(),
        submissionDeadline: new Date(submissionDeadline).toISOString(),
        votingStarts: new Date(votingStarts).toISOString(),
        votingEnds: new Date(votingEnds).toISOString(),
        judgingStarts: new Date(judgingStarts).toISOString(),
        judgingEnds: new Date(judgingEnds).toISOString(),
        finalistAnnouncementDate: new Date(new Date(resultDeclarationDate).getTime() - 2 * 86400000).toISOString(),
        resultDeclarationDate: new Date(resultDeclarationDate).toISOString(),
        programEndDate: new Date(new Date(resultDeclarationDate).getTime() + 7 * 86400000).toISOString()
      },
      rules: {
        fullRules,
        participationRequirements: 'Open to all registered Kairo creators and readers.',
        allowedContent,
        prohibitedContent,
        aiContentPolicy: aiContentPolicy as any,
        plagiarismPolicy: 'Zero tolerance for plagiarism; all submissions must be 100% original.',
        submissionLimitPerUser: Number(submissionLimitPerUser) || 1,
        teamParticipationAllowed: false,
        eligibilityCriteria: 'All registered Kairo users.',
        disqualificationConditions: 'Violations of terms, plagiarism, or vote manipulation.',
        copyrightRequirements: 'Authors retain 100% intellectual property rights.',
        judgingRules: 'Scored according to designated weighted criteria.',
        requireRulesAgreement
      },
      prizes,
      judgingConfig: {
        enabled: judgingEnabled,
        criteria,
        blindJudging,
        formula: judgingFormula as any,
        judgeWeightPercent: Number(judgeWeightPercent),
        communityWeightPercent: Number(communityWeightPercent),
        judges: programToEdit?.judgingConfig?.judges || []
      },
      votingConfig: {
        enabled: true,
        mode: votingMode,
        maxVotesPerUser: votingMode === 'ONE_PER_USER' ? 1 : 5,
        publicVoteCount: true,
        hideUntilDeadline: false,
        eligibility: 'ALL'
      }
    };

    try {
      await onSubmit(programPayload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save program');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-pink-100/80 overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-[#26152b] to-[#4a1c38] text-white p-6 sm:p-7 flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Master Admin Program Studio</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white">
              {programToEdit ? `Edit: ${programToEdit.name}` : 'Create New Program or Competition'}
            </h2>
            <p className="text-xs text-pink-200/80 mt-0.5">
              Configure parameters, eligibility, timelines, judging weights, rewards, and branding.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Navigation Bar */}
        <div className="flex border-b border-pink-100 bg-pink-50/40 px-4 sm:px-6 overflow-x-auto">
          {[
            { id: 'BASIC', label: '1. Basics & Scope', icon: FileText },
            { id: 'TIMELINE', label: '2. Timeline', icon: Calendar },
            { id: 'RULES', label: '3. Rules & Content', icon: Shield },
            { id: 'PRIZES', label: '4. Prizes & Badges', icon: Award },
            { id: 'JUDGING', label: '5. Scoring & Voting', icon: Sliders },
            { id: 'BRANDING', label: '6. Artwork & Visuals', icon: ImageIcon }
          ].map(step => {
            const Icon = step.icon;
            const isCurrent = activeStep === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id as any)}
                className={`py-3 px-3 sm:px-4 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer shrink-0 ${
                  isCurrent
                    ? 'border-[#9e3b5f] text-[#9e3b5f]'
                    : 'border-transparent text-[#6e5d62] hover:text-[#26152b]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{step.label}</span>
              </button>
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 max-h-[68vh] overflow-y-auto space-y-6">
          
          {/* STEP 1: BASICS */}
          {activeStep === 'BASIC' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#26152b] uppercase tracking-wider mb-1.5">
                  Program Title *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Grand Celestial Writing Championship 2026"
                  className="w-full px-4 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#9e3b5f]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#26152b] uppercase tracking-wider mb-1.5">
                    Program Type
                  </label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as ProgramType)}
                    className="w-full px-3 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#9e3b5f] bg-white cursor-pointer"
                  >
                    {PROGRAM_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {type === 'Custom Special Campaign' && (
                  <div>
                    <label className="block text-xs font-bold text-[#26152b] uppercase tracking-wider mb-1.5">
                      Custom Category Name
                    </label>
                    <input
                      type="text"
                      value={customType}
                      onChange={e => setCustomType(e.target.value)}
                      placeholder="e.g. Manga Translation Sprint"
                      className="w-full px-3 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#9e3b5f]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#26152b] uppercase tracking-wider mb-1.5">
                    Initial Lifecycle Status
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as ProgramStatus)}
                    className="w-full px-3 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#9e3b5f] bg-white cursor-pointer"
                  >
                    <option value="DRAFT">DRAFT (Admin only)</option>
                    <option value="UPCOMING">UPCOMING (Teaser public)</option>
                    <option value="REGISTRATION_OPEN">REGISTRATION_OPEN</option>
                    <option value="SUBMISSION_OPEN">SUBMISSION_OPEN</option>
                    <option value="VOTING_OPEN">VOTING_OPEN</option>
                    <option value="JUDGING">JUDGING</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26152b] uppercase tracking-wider mb-1.5">
                  Catchy Tagline / Hook
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  placeholder="e.g., Unveil the hidden secrets of the Astral Expanse in our official seasonal contest."
                  className="w-full px-4 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#9e3b5f]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26152b] uppercase tracking-wider mb-1.5">
                  Full Description & Story Narrative
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Provide comprehensive details about the theme, narrative context, what authors should write, and reader engagement..."
                  className="w-full px-4 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#9e3b5f]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#26152b] uppercase tracking-wider mb-1.5">
                    Theme / Prompt
                  </label>
                  <input
                    type="text"
                    value={theme}
                    onChange={e => setTheme(e.target.value)}
                    placeholder="e.g., Rebirth & Starlight"
                    className="w-full px-3 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#9e3b5f]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#26152b] uppercase tracking-wider mb-1.5">
                    Genre / Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="e.g., Dark Fantasy / Isekai"
                    className="w-full px-3 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#9e3b5f]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#26152b] uppercase tracking-wider mb-1.5">
                    Organizer Entity
                  </label>
                  <input
                    type="text"
                    value={organizerName}
                    onChange={e => setOrganizerName(e.target.value)}
                    placeholder="e.g., KAIRO Council"
                    className="w-full px-3 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#9e3b5f]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#26152b] uppercase tracking-wider mb-1.5">
                    Target Audience
                  </label>
                  <select
                    value={targetAudience}
                    onChange={e => setTargetAudience(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#9e3b5f] bg-white cursor-pointer"
                  >
                    <option value="both">Both Authors & Readers</option>
                    <option value="author-only">Authors Only (Submission Focus)</option>
                    <option value="reader-only">Readers Only (Review/Quiz Focus)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#26152b] uppercase tracking-wider mb-1.5">
                    Visibility
                  </label>
                  <select
                    value={visibility}
                    onChange={e => setVisibility(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#9e3b5f] bg-white cursor-pointer"
                  >
                    <option value="public">Public (Visible to everyone)</option>
                    <option value="private">Private (Admin & Reviewers Only)</option>
                    <option value="invite-only">Invite-Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#26152b] uppercase tracking-wider mb-1.5">
                    Max Participants Cap
                  </label>
                  <input
                    type="number"
                    value={maxParticipants}
                    onChange={e => setMaxParticipants(Number(e.target.value))}
                    min={1}
                    className="w-full px-3 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#9e3b5f]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: TIMELINE */}
          {activeStep === 'TIMELINE' && (
            <div className="space-y-4">
              <p className="text-xs text-[#877276]">
                Set chronological lifecycle checkpoints. The Master Admin can also trigger status changes manually at any time.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-pink-50/50 p-4 rounded-2xl border border-pink-100 space-y-3">
                  <div className="text-xs font-bold text-[#9e3b5f] uppercase tracking-wider">Registration Phase</div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#26152b] mb-1">Registration Opens</label>
                    <input
                      type="datetime-local"
                      value={registrationOpens}
                      onChange={e => setRegistrationOpens(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#26152b] mb-1">Registration Closes</label>
                    <input
                      type="datetime-local"
                      value={registrationCloses}
                      onChange={e => setRegistrationCloses(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="bg-pink-50/50 p-4 rounded-2xl border border-pink-100 space-y-3">
                  <div className="text-xs font-bold text-[#9e3b5f] uppercase tracking-wider">Submission Phase</div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#26152b] mb-1">Submission Opens</label>
                    <input
                      type="datetime-local"
                      value={submissionOpens}
                      onChange={e => setSubmissionOpens(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#26152b] mb-1">Submission Deadline</label>
                    <input
                      type="datetime-local"
                      value={submissionDeadline}
                      onChange={e => setSubmissionDeadline(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-pink-50/50 p-4 rounded-2xl border border-pink-100 space-y-3">
                  <div className="text-xs font-bold text-[#9e3b5f] uppercase tracking-wider">Community Voting Phase</div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#26152b] mb-1">Voting Starts</label>
                    <input
                      type="datetime-local"
                      value={votingStarts}
                      onChange={e => setVotingStarts(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#26152b] mb-1">Voting Ends</label>
                    <input
                      type="datetime-local"
                      value={votingEnds}
                      onChange={e => setVotingEnds(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="bg-pink-50/50 p-4 rounded-2xl border border-pink-100 space-y-3">
                  <div className="text-xs font-bold text-[#9e3b5f] uppercase tracking-wider">Judging & Results Phase</div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#26152b] mb-1">Judging Starts</label>
                    <input
                      type="datetime-local"
                      value={judgingStarts}
                      onChange={e => setJudgingStarts(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#26152b] mb-1">Result Declaration Day</label>
                    <input
                      type="datetime-local"
                      value={resultDeclarationDate}
                      onChange={e => setResultDeclarationDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: RULES & POLICIES */}
          {activeStep === 'RULES' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#26152b] uppercase tracking-wider mb-1.5">
                  Full Rules & Eligibility Guidelines
                </label>
                <textarea
                  rows={4}
                  value={fullRules}
                  onChange={e => setFullRules(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#9e3b5f]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#26152b] uppercase tracking-wider mb-1.5">
                    Allowed Content
                  </label>
                  <input
                    type="text"
                    value={allowedContent}
                    onChange={e => setAllowedContent(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#26152b] uppercase tracking-wider mb-1.5">
                    Prohibited Content
                  </label>
                  <input
                    type="text"
                    value={prohibitedContent}
                    onChange={e => setProhibitedContent(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#26152b] uppercase tracking-wider mb-1.5">
                    AI Content Policy
                  </label>
                  <select
                    value={aiContentPolicy}
                    onChange={e => setAiContentPolicy(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-pink-200 text-sm bg-white cursor-pointer"
                  >
                    <option value="Strictly prohibited">Strictly Prohibited (Human-only prose)</option>
                    <option value="Allowed with disclosure">Allowed with explicit disclosure</option>
                    <option value="Unrestricted">Unrestricted creative assistance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#26152b] uppercase tracking-wider mb-1.5">
                    Submissions Limit Per User
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={submissionLimitPerUser}
                    onChange={e => setSubmissionLimitPerUser(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-pink-200 text-sm"
                  />
                </div>
              </div>

              <div className="p-3 bg-pink-50 rounded-xl border border-pink-200 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="req_rules_agreement"
                  checked={requireRulesAgreement}
                  onChange={e => setRequireRulesAgreement(e.target.checked)}
                  className="w-4 h-4 text-[#9e3b5f] rounded border-pink-300 focus:ring-[#9e3b5f] cursor-pointer"
                />
                <label htmlFor="req_rules_agreement" className="text-xs font-bold text-[#26152b] cursor-pointer">
                  Require participants to explicitly check and agree to competition rules upon entry registration
                </label>
              </div>
            </div>
          )}

          {/* STEP 4: PRIZES & BADGES */}
          {activeStep === 'PRIZES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#877276]">
                  Configure awards, cryptographic certificates, Astral/Kairo Coins, and profile badges.
                </p>
                <button
                  type="button"
                  onClick={handleAddPrize}
                  className="px-3 py-1.5 rounded-xl bg-[#9e3b5f] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#852f4e] cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Prize Tier</span>
                </button>
              </div>

              <div className="space-y-3">
                {prizes.map((prize, idx) => (
                  <div key={prize.id} className="p-4 rounded-2xl border border-pink-100 bg-pink-50/40 relative space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-[#9e3b5f]">Tier #{idx + 1}</span>
                      {prizes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePrize(prize.id)}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#26152b] mb-1">Placement Rank Title</label>
                        <input
                          type="text"
                          value={prize.placement}
                          onChange={e => {
                            const val = e.target.value;
                            setPrizes(prev => prev.map(p => p.id === prize.id ? { ...p, placement: val } : p));
                          }}
                          placeholder="e.g., 1st Place / Grand Winner"
                          className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#26152b] mb-1">Award Title</label>
                        <input
                          type="text"
                          value={prize.title}
                          onChange={e => {
                            const val = e.target.value;
                            setPrizes(prev => prev.map(p => p.id === prize.id ? { ...p, title: val } : p));
                          }}
                          placeholder="e.g., Celestial Champion Crest"
                          className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#26152b] mb-1">Kairo Coins</label>
                        <input
                          type="number"
                          value={prize.kairoCoins || 0}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setPrizes(prev => prev.map(p => p.id === prize.id ? { ...p, kairoCoins: val } : p));
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#26152b] mb-1">XP Points</label>
                        <input
                          type="number"
                          value={prize.xpReward || 0}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setPrizes(prev => prev.map(p => p.id === prize.id ? { ...p, xpReward: val } : p));
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs bg-white"
                        />
                      </div>
                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 text-xs font-bold text-[#26152b] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!prize.certificateAwarded}
                            onChange={e => {
                              const val = e.target.checked;
                              setPrizes(prev => prev.map(p => p.id === prize.id ? { ...p, certificateAwarded: val } : p));
                            }}
                            className="w-4 h-4 text-[#9e3b5f] rounded"
                          />
                          <span>Award Verifiable Certificate</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: JUDGING & VOTING */}
          {activeStep === 'JUDGING' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-[#26152b] uppercase tracking-wider">Judging Evaluation Formula</div>
                  <label className="flex items-center gap-2 text-xs font-bold text-[#26152b] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={blindJudging}
                      onChange={e => setBlindJudging(e.target.checked)}
                      className="w-4 h-4 text-[#9e3b5f] rounded"
                    />
                    <span>Enable Blind Judging (Hide author identities)</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#26152b] mb-1">Scoring Mode</label>
                    <select
                      value={judgingFormula}
                      onChange={e => setJudgingFormula(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs bg-white cursor-pointer"
                    >
                      <option value="JUDGE_COMMUNITY_COMBINED">Judge + Community Combined</option>
                      <option value="JUDGE_ONLY">Judges Score Only (100%)</option>
                      <option value="COMMUNITY_ONLY">Community Votes Only (100%)</option>
                    </select>
                  </div>

                  {judgingFormula === 'JUDGE_COMMUNITY_COMBINED' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-[#26152b] mb-1">Judge Weight %</label>
                        <input
                          type="number"
                          value={judgeWeightPercent}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setJudgeWeightPercent(val);
                            setCommunityWeightPercent(100 - val);
                          }}
                          min={0}
                          max={100}
                          className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#26152b] mb-1">Community Weight %</label>
                        <input
                          type="number"
                          value={communityWeightPercent}
                          disabled
                          className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs bg-gray-100"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Criteria */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-[#26152b] uppercase tracking-wider">Judging Criteria Rubric</div>
                  <button
                    type="button"
                    onClick={handleAddCriteria}
                    className="px-3 py-1.5 rounded-xl bg-[#9e3b5f] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#852f4e] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Rubric Criterion</span>
                  </button>
                </div>

                {criteria.map(crit => (
                  <div key={crit.id} className="p-3 rounded-xl border border-pink-100 bg-white flex items-center gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={crit.name}
                        onChange={e => {
                          const val = e.target.value;
                          setCriteria(prev => prev.map(c => c.id === crit.id ? { ...c, name: val } : c));
                        }}
                        placeholder="Criterion name"
                        className="w-full px-3 py-1.5 rounded-lg border border-pink-200 text-xs"
                      />
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        value={crit.weightPercent}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setCriteria(prev => prev.map(c => c.id === crit.id ? { ...c, weightPercent: val } : c));
                        }}
                        placeholder="Weight %"
                        className="w-full px-2 py-1.5 rounded-lg border border-pink-200 text-xs text-center"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCriteria(crit.id)}
                      className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Voting Configuration */}
              <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100 space-y-3">
                <div className="text-xs font-bold text-[#26152b] uppercase tracking-wider">Community Voting Protocol</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#26152b] mb-1">Voting Mode</label>
                    <select
                      value={votingMode}
                      onChange={e => setVotingMode(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs bg-white cursor-pointer"
                    >
                      <option value="ONE_PER_USER">Strict 1 Vote Per User</option>
                      <option value="ONE_PER_DAY">Daily Vote (1 Vote per 24 Hours)</option>
                      <option value="UNLIMITED">Unrestricted Support</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: BRANDING */}
          {activeStep === 'BRANDING' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#26152b] uppercase tracking-wider mb-1.5">
                  Banner Image URL (1600x500 recommended)
                </label>
                <input
                  type="url"
                  value={bannerImage}
                  onChange={e => setBannerImage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none"
                />
                {bannerImage && (
                  <div className="mt-2 h-32 w-full rounded-2xl overflow-hidden border border-pink-200">
                    <img src={bannerImage} alt="Banner Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26152b] uppercase tracking-wider mb-1.5">
                  Cover Card Image URL (800x600 recommended)
                </label>
                <input
                  type="url"
                  value={coverImage}
                  onChange={e => setCoverImage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none"
                />
                {coverImage && (
                  <div className="mt-2 h-40 w-48 rounded-2xl overflow-hidden border border-pink-200">
                    <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer controls */}
          <div className="pt-6 border-t border-pink-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer transition-all"
            >
              Cancel
            </button>

            <div className="flex items-center gap-3">
              {activeStep !== 'BRANDING' ? (
                <button
                  type="button"
                  onClick={() => {
                    const steps = ['BASIC', 'TIMELINE', 'RULES', 'PRIZES', 'JUDGING', 'BRANDING'];
                    const nextIdx = steps.indexOf(activeStep) + 1;
                    if (nextIdx < steps.length) setActiveStep(steps[nextIdx] as any);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-pink-100 text-[#9e3b5f] text-xs font-bold hover:bg-pink-200 cursor-pointer transition-all"
                >
                  Next Step &rarr;
                </button>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#9e3b5f] to-rose-600 hover:from-[#852f4e] hover:to-rose-700 text-white text-xs font-bold shadow-lg flex items-center gap-2 cursor-pointer transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Saving Program...' : programToEdit ? 'Update Program' : 'Publish / Create Program'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
