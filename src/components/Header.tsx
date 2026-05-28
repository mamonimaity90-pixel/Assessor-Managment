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
              onClick={() => setCurrentTab('admin')}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentTab === 'admin'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              🔧 Admin Panel
            </button>

            {/* Quick Admin Access Status (No Lock required) */}
            <div className="h-6 w-[1px] bg-slate-700 hidden sm:block"></div>
            
            <div className="flex items-center space-x-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white">Admin Authorized</p>
                <p className="text-[9px] text-emerald-400 font-mono">System Online</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs border border-slate-500 font-bold text-white shadow-inner select-none">
                AD
              </div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
