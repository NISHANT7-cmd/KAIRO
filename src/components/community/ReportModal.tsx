import React, { useState } from 'react';
import { ShieldAlert, X, AlertTriangle, Check } from 'lucide-react';
import { api } from '../../services/api';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: string;
  targetId: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId
}) => {
  const [reason, setReason] = useState('UNFLAGGED_SPOILER');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.reportContent({
        targetType,
        targetId,
        reason,
        notes: notes.trim() || undefined
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-pink-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-pink-100">
          <div className="flex items-center gap-2 text-red-600">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="font-display font-black text-base text-[#26152b]">
              Report Content for Review
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-[#26152b]">Report Submitted</h4>
            <p className="text-xs text-[#877276]">Thank you for keeping the KAIRO community safe and spoiler-free.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#26152b] mb-1">Reason for Report</label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-pink-200 text-xs font-semibold outline-none focus:border-[#9e3b5f] bg-white"
              >
                <option value="UNFLAGGED_SPOILER">Unflagged Major Story Spoiler</option>
                <option value="HARASSMENT">Harassment, Hate or Toxicity</option>
                <option value="SPAM">Spam or Unsolicited Promotion</option>
                <option value="INAPPROPRIATE">Inappropriate or Explicit Content</option>
                <option value="PLAGIARISM">Plagiarism or Intellectual Property</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#26152b] mb-1">Additional Details (Optional)</label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Describe what occurred or which chapter was spoiled..."
                className="w-full p-3 rounded-xl border border-pink-200 text-xs outline-none focus:border-[#9e3b5f]"
              />
            </div>

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
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
