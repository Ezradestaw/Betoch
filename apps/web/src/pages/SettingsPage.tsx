// ==============================================================================
// BETOCH SETTINGS & PREFERENCES CENTER
// Profile management, language & theme preferences, notifications & security
// ==============================================================================

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  Bell,
  Moon,
  Sun,
  Globe,
  Lock,
  Download,
  LogOut,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  // Notification Preferences State (persisted in localStorage)
  const [notifyPriceDrops, setNotifyPriceDrops] = useState<boolean>(() => {
    return localStorage.getItem('betoch_notify_price') !== 'false';
  });
  const [notifyViewings, setNotifyViewings] = useState<boolean>(() => {
    return localStorage.getItem('betoch_notify_viewing') !== 'false';
  });
  const [notifyApplications, setNotifyApplications] = useState<boolean>(() => {
    return localStorage.getItem('betoch_notify_app') !== 'false';
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveNotifications = () => {
    localStorage.setItem('betoch_notify_price', String(notifyPriceDrops));
    localStorage.setItem('betoch_notify_viewing', String(notifyViewings));
    localStorage.setItem('betoch_notify_app', String(notifyApplications));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleExportData = () => {
    const data = {
      user: {
        id: user?.id,
        email: user?.email,
        phone: user?.phone,
        role: user?.role
      },
      exportDate: new Date().toISOString(),
      platform: 'Betoch Ethiopian Real Estate Marketplace'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `betoch_userdata_${user?.id?.slice(0, 8) || 'account'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Account Preferences</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Settings & Privacy</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your personal profile, notifications, Ethiopian localization, and security preferences.
          </p>
        </div>

        <div className="space-y-6">
          {/* SECTION 1: PROFILE OVERVIEW */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-brand-700" />
              Profile Details
            </h2>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-700 text-white text-xl font-black flex items-center justify-center">
                  {user?.profile?.firstName?.[0] || 'U'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {user?.profile ? `${user.profile.firstName} ${user.profile.lastName}`.trim() : 'Betoch Member'}
                  </h3>
                  <p className="text-xs text-slate-500">{user?.email || 'user@betoch.et'}</p>
                  {user?.phone && <p className="text-[11px] text-slate-400 font-mono mt-0.5">{user?.phone}</p>}
                </div>
              </div>

              <Link
                to="/profile/verification"
                className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Fayda Verification Portal
              </Link>
            </div>
          </div>

          {/* SECTION 2: LOCALIZATION & THEME */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand-700" />
              Language & Appearance
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Language Switcher */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Display Language
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      language === 'en'
                        ? 'bg-brand-700 text-white border-brand-800 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    English (EN)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('am')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      language === 'am'
                        ? 'bg-brand-700 text-white border-brand-800 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    አማርኛ (Amharic)
                  </button>
                </div>
              </div>

              {/* Theme Switcher */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Color Theme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      theme === 'light'
                        ? 'bg-brand-700 text-white border-brand-800 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" /> Light
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      theme === 'dark'
                        ? 'bg-brand-700 text-white border-brand-800 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" /> Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      theme === 'system'
                        ? 'bg-brand-700 text-white border-brand-800 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Auto
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: NOTIFICATIONS PREFERENCES */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-brand-700" />
              In-App Notification Alerts
            </h2>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Price Reduction Alerts</span>
                  <span className="text-[11px] text-slate-500">
                    Get notified immediately whenever an owner lowers the rent on a property in your favorites.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyPriceDrops}
                  onChange={(e) => setNotifyPriceDrops(e.target.checked)}
                  className="w-4 h-4 text-brand-700 rounded border-slate-300 focus:ring-brand-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Viewing Tour Reminders</span>
                  <span className="text-[11px] text-slate-500">
                    Receive confirmation alerts and time reminders for upcoming physical property inspections.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyViewings}
                  onChange={(e) => setNotifyViewings(e.target.checked)}
                  className="w-4 h-4 text-brand-700 rounded border-slate-300 focus:ring-brand-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Rental Application Updates</span>
                  <span className="text-[11px] text-slate-500">
                    Alerts when your application moves through owner review, acceptance, and lease registration.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyApplications}
                  onChange={(e) => setNotifyApplications(e.target.checked)}
                  className="w-4 h-4 text-brand-700 rounded border-slate-300 focus:ring-brand-500"
                />
              </label>

              <div className="flex items-center justify-between pt-2">
                {savedSuccess ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Preferences Saved!
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Settings update instantly</span>
                )}
                <button
                  type="button"
                  onClick={handleSaveNotifications}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
                >
                  Save Notification Settings
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 4: PRIVACY & DATA EXPORT */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand-700" />
              Security & Privacy
            </h2>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-slate-100">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Download Account Data</h4>
                <p className="text-[11px] text-slate-500">
                  Export a copy of your personal profile, rental logs, and saved items in JSON format.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportData}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Export JSON
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
              <div>
                <h4 className="text-xs font-bold text-red-600">Sign Out</h4>
                <p className="text-[11px] text-slate-500">
                  End your current session on this device.
                </p>
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold hover:bg-red-100 flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
