import React from 'react';
import { Award, ShieldCheck, CheckCircle2, Download, X, ExternalLink } from 'lucide-react';
import { ProgramCertificate } from '../../types';

interface CertificateModalProps {
  certificate: ProgramCertificate;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ certificate, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#2a132e] via-[#1a0c1d] to-[#120714] text-white rounded-3xl border border-amber-500/40 p-6 sm:p-10 shadow-2xl overflow-hidden">
        {/* Decorative corner borders */}
        <div className="absolute top-3 left-3 w-12 h-12 border-t-2 border-l-2 border-amber-400/60 rounded-tl-xl pointer-events-none" />
        <div className="absolute top-3 right-3 w-12 h-12 border-t-2 border-r-2 border-amber-400/60 rounded-tr-xl pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-12 h-12 border-b-2 border-l-2 border-amber-400/60 rounded-bl-xl pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-12 h-12 border-b-2 border-r-2 border-amber-400/60 rounded-br-xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Body */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-bold uppercase tracking-widest">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Official KAIRO Laureate Award</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300">
            Certificate of Excellence
          </h2>

          <p className="text-xs sm:text-sm text-pink-200/70 uppercase tracking-widest font-semibold">
            This verified distinction is proudly presented to
          </p>

          <div className="py-2">
            <span className="text-2xl sm:text-4xl font-extrabold text-white font-display border-b-2 border-amber-400/40 pb-2 px-6 inline-block">
              {certificate.recipientName}
            </span>
            <div className="text-xs text-amber-400/80 mt-1">@{certificate.recipientUsername}</div>
          </div>

          <p className="text-xs sm:text-sm text-white/80 max-w-md mx-auto leading-relaxed">
            In honorable recognition of outstanding creativity, storytelling mastery, and community acclaim in the program:
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl py-3 px-6 inline-block max-w-lg">
            <div className="text-sm sm:text-base font-bold text-pink-200">{certificate.programName}</div>
            <div className="text-xs text-amber-300 font-semibold mt-0.5">{certificate.awardTitle} • {certificate.placement}</div>
          </div>

          {/* Cryptographic verification box */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Digitally Certified & Cryptographically Verified</span>
                </div>
                <div className="text-[10px] font-mono text-white/60 mt-0.5 break-all">
                  Hash: {certificate.verificationHash}
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] text-white/40 uppercase">Certified Date</div>
              <div className="text-xs font-bold text-white/90">{certificate.issuedDate}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                window.print();
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Print / Download Certificate</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
