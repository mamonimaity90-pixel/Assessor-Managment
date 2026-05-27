/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Award, Database, Search, Unlock, Lock } from 'lucide-react';

interface HeaderProps {
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  currentTab: 'dashboard' | 'database' | 'admin';
  setCurrentTab: (tab: 'dashboard' | 'database' | 'admin') => void;
}

export default function Header({ isAdmin, setIsAdmin, currentTab, setCurrentTab }: HeaderProps) {
  const [passcode, setPasscode] = useState('');
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'admin123') {
      setIsAdmin(true);
      setShowUnlockModal(false);
      setPasscode('');
      setErrorMsg('');
    } else {
      setErrorMsg('Invalid administrative passcode. Please try again.');
    }
  };

  const lockAdmin = () => {
    setIsAdmin(false);
    if (currentTab === 'admin') {
      setCurrentTab('dashboard');
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-700 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo Brand Zone (High Density Style Matching design HTML) */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center font-black text-xl text-white shadow-md select-none shrink-0">
              N
            </div>
            <div>
              <h1 className="text-base font-extrabold leading-none text-white tracking-tight flex items-center gap-2">
                NABH Assessor Database
                <span className="bg-slate-700 text-[9px] text-slate-300 px-1.5 py-0.5 rounded font-mono font-medium">v1.0</span>
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
                National Accreditation Board for Hospitals
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="nav-dashboard"
              onClick={() => setCurrentTab('dashboard')}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              📊 Analytics Dashboard
            </button>
            <button
              id="nav-database"
              onClick={() => setCurrentTab('database')}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentTab === 'database'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              🗂️ Assessor Directory
            </button>
            <button
              id="nav-admin"
              onClick={() => {
                if (isAdmin) {
                  setCurrentTab('admin');
                } else {
                  setShowUnlockModal(true);
                }
              }}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentTab === 'admin'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              🔧 Admin Panel
              {!isAdmin && <Lock className="h-3 w-3 text-slate-400" />}
            </button>

            {/* Quick Admin Access State Toggle */}
            <div className="h-6 w-[1px] bg-slate-700 hidden sm:block"></div>
            
            {isAdmin ? (
              <div className="flex items-center space-x-3 pl-2">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-white">Admin Authorized</p>
                  <p className="text-[9px] text-emerald-400 font-mono">System Online</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-650 flex items-center justify-center text-xs border border-slate-500 font-bold text-white shadow-inner select-none">
                  AD
                </div>
                <button
                  onClick={lockAdmin}
                  className="text-[9px] text-slate-400 hover:text-rose-450 hover:text-rose-400 underline font-mono ml-1 transition-all"
                  title="Lock admin modes"
                >
                  (Lock)
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowUnlockModal(true)}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 px-2.5 py-1 rounded-full text-slate-300 hover:text-white transition-all text-[11px] font-mono"
              >
                <Lock className="h-3.5 w-3.5 text-orange-450" />
                <span>Unlock Admin</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Admin Unlock Modal Dialog (High Density Clean Palette Style) */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-5 shadow-2xl relative text-slate-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 text-blue-600">
                <ShieldAlert className="h-5 w-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Elevate Credentials</h3>
              </div>
              <button
                onClick={() => {
                  setShowUnlockModal(false);
                  setErrorMsg('');
                  setPasscode('');
                }}
                className="text-slate-400 hover:text-slate-700 font-sans text-xl"
              >
                &times;
              </button>
            </div>
            
            <p className="text-xs text-slate-500 mt-2 mb-4 leading-relaxed">
              Administrative credentials are required to manually edit rosters, perform bulk excel sheet migrations, change status restrictions, or delete assessors.
            </p>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-1">
                  Access License Passcode
                </label>
                <input
                  type="password"
                  placeholder="Enter administrator passcode (e.g. admin123)"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-400 font-mono"
                  autoFocus
                />
              </div>

              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded text-xs leading-normal">
                  {errorMsg}
                </div>
              )}

              <div className="text-xs text-blue-600 border-t border-slate-200 pt-3">
                💡 Default sandbox supervisor passcode: <strong className="font-mono text-slate-900">admin123</strong>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUnlockModal(false);
                    setErrorMsg('');
                    setPasscode('');
                  }}
                  className="px-3 py-1.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors text-xs font-bold"
                >
                  Authorize admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
