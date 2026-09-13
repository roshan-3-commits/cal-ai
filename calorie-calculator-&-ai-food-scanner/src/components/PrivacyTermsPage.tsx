import React from 'react';
import { ThemeMode } from '../types';
import { ShieldCheck, Lock, AlertCircle, FileText } from 'lucide-react';

interface PrivacyTermsPageProps {
  theme: ThemeMode;
}

export const PrivacyTermsPage: React.FC<PrivacyTermsPageProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn py-4">
      <div className="text-center space-y-2">
        <span
          className={`text-xs uppercase tracking-widest font-bold block ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          LEGAL & PRIVACY
        </span>
        <h1
          className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          Privacy Policy & Terms of Service
        </h1>
        <p className={`text-sm max-w-lg mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Our transparent, zero-tracking commitment and educational disclaimer.
        </p>
      </div>

      <div
        className={`rounded-3xl p-6 sm:p-8 border space-y-6 text-xs sm:text-sm ${
          isDark ? 'bg-[#101216] border-[#1f242d] text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">1. Zero-Data Privacy Architecture</h2>
            <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Effective Date: January 1, 2026
            </span>
          </div>
        </div>

        <p className="leading-relaxed">
          Free Calorie Calculator is built around the fundamental philosophy that your personal biometric measurements (such as age, sex, height, weight, and fitness targets) are private. All mathematical equations, BMR computations, and macro splits are executed strictly client-side inside your web browser.
        </p>

        <ul className="list-disc pl-5 space-y-1.5 leading-relaxed">
          <li>No personal information is sent to or stored on remote servers.</li>
          <li>No account creation, passwords, or emails are ever required.</li>
          <li>No third-party behavioral analytics or cross-site tracking pixels are embedded.</li>
          <li>Calculation states shared via URL query parameters are decoded purely in the user's browser.</li>
        </ul>

        <div className="pt-4 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">2. Medical Disclaimer & Educational Notice</h2>
              <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                For Informational and Educational Use Only
              </span>
            </div>
          </div>

          <p className="leading-relaxed">
            The calculations, caloric targets, macro distributions, and water intake numbers provided by this website are mathematical estimates based on peer-reviewed clinical formulas (including the Mifflin-St Jeor equation). They do not constitute medical, dietetic, or nutritional prescription or diagnosis.
          </p>

          <p className="leading-relaxed">
            Individual metabolic responses vary based on thyroid function, hormonal balance, gut microbiome, and medication history. Always consult a licensed physician or registered dietitian before embarking on significant caloric deficits or intense dietary modifications.
          </p>
        </div>
      </div>
    </div>
  );
};
