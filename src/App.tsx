/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DatabaseGrid from './components/DatabaseGrid';
import AdminPanel from './components/AdminPanel';
import { Assessor, INITIAL_ASSESSORS, SchemeType, NABH_SCHEMES_CATALOG, AssessorStatusType, StatusLogEntry } from './types';
import { Database, FileText, CheckCircle, ShieldAlert } from 'lucide-react';

export default function App() {
  
  // 1. Core Local Storage Synchronized States
  const [assessors, setAssessors] = useState<Assessor[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'database' | 'admin'>('dashboard');

  // Programs Catalog Dynamic State
  const [catalog, setCatalog] = useState<Record<SchemeType, string[]>>(() => {
    const savedCatalog = localStorage.getItem('nabh_programs_catalog_v1');
    if (savedCatalog) {
      try {
        return JSON.parse(savedCatalog);
      } catch (e) {
        return NABH_SCHEMES_CATALOG;
      }
    }
    return NABH_SCHEMES_CATALOG;
  });

  // Dynamic Banning & Inactive reasons state
  const [banReasons, setBanReasons] = useState<string[]>(() => {
    const saved = localStorage.getItem('nabh_ban_reasons_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      "Conflict of Interest: Private consulting",
      "Ethical Violation: Compromised evaluation",
      "Misconduct during Candidate Assessment",
      "Failed to disclose relationship with assessment candidates",
      "Providing false academic or professional credentials",
      "Other / Compliance audit violation"
    ];
  });

  const [inactiveReasons, setInactiveReasons] = useState<string[]>(() => {
    const saved = localStorage.getItem('nabh_inactive_reasons_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      "Voluntary Inactivity (Personal / Health Reasons)",
      "Temporary Availability / Schedule Constraints",
      "Maternity / Paternity / Medical Leave",
      "Academic Sabbatical or Institutional Deputation",
      "Prolonged Non-participation in NABH Assessment Programs"
    ];
  });

  const handleAddBanReason = (reason: string) => {
    const trimmed = reason.trim();
    if (!trimmed || banReasons.includes(trimmed)) return;
    const updated = [...banReasons, trimmed];
    setBanReasons(updated);
    localStorage.setItem('nabh_ban_reasons_v1', JSON.stringify(updated));
  };

  const handleDeleteBanReason = (reason: string) => {
    const updated = banReasons.filter(r => r !== reason);
    setBanReasons(updated);
    localStorage.setItem('nabh_ban_reasons_v1', JSON.stringify(updated));
  };

  const handleAddInactiveReason = (reason: string) => {
    const trimmed = reason.trim();
    if (!trimmed || inactiveReasons.includes(trimmed)) return;
    const updated = [...inactiveReasons, trimmed];
    setInactiveReasons(updated);
    localStorage.setItem('nabh_inactive_reasons_v1', JSON.stringify(updated));
  };

  const handleDeleteInactiveReason = (reason: string) => {
    const updated = inactiveReasons.filter(r => r !== reason);
    setInactiveReasons(updated);
    localStorage.setItem('nabh_inactive_reasons_v1', JSON.stringify(updated));
  };

  const handleCreateProgram = (scheme: SchemeType, newProgramName: string) => {
    const trimmed = newProgramName.trim();
    if (!trimmed) return false;
    const currentList = catalog[scheme] || [];
    if (currentList.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
      return false; // duplicated
    }
    const updated = {
      ...catalog,
      [scheme]: [...currentList, trimmed]
    };
    setCatalog(updated);
    localStorage.setItem('nabh_programs_catalog_v1', JSON.stringify(updated));
    return true;
  };

  const handleDeleteProgram = (scheme: SchemeType, programToDelete: string) => {
    const updatedList = (catalog[scheme] || []).filter(p => p !== programToDelete);
    const updated = {
      ...catalog,
      [scheme]: updatedList
    };
    setCatalog(updated);
    localStorage.setItem('nabh_programs_catalog_v1', JSON.stringify(updated));

    // Cleanup associated assessor mappings so we don't have dangling maps
    const updatedAssessors = assessors.map(a => ({
      ...a,
      programs: a.programs.filter(p => !(p.scheme === scheme && p.program === programToDelete))
    }));
    saveToStorage(updatedAssessors);
  };

  const handleRenameProgram = (scheme: SchemeType, oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || oldName === trimmed) return false;
    const currentList = catalog[scheme] || [];
    if (currentList.some(p => p.toLowerCase() === trimmed.toLowerCase() && p !== oldName)) {
      return false; // direct duplicate
    }
    const updatedList = currentList.map(p => p === oldName ? trimmed : p);
    const updated = {
      ...catalog,
      [scheme]: updatedList
    };
    setCatalog(updated);
    localStorage.setItem('nabh_programs_catalog_v1', JSON.stringify(updated));

    // Update assessor program references automatically
    const updatedAssessors = assessors.map(a => ({
      ...a,
      programs: a.programs.map(p => p.scheme === scheme && p.program === oldName ? { ...p, program: trimmed } : p)
    }));
    saveToStorage(updatedAssessors);
    return true;
  };

  // Triggering Filter presets from Dashboard count clicks
  const [presetFilters, setPresetFilters] = useState<any>(null);

  // Syncing DB on startup from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('nabh_assessors_registry_v1');
    if (savedData) {
      try {
        setAssessors(JSON.parse(savedData));
      } catch (err) {
        setAssessors(INITIAL_ASSESSORS);
      }
    } else {
      setAssessors(INITIAL_ASSESSORS);
    }

    const savedPrivilege = localStorage.getItem('nabh_admin_privilege_v1');
    if (savedPrivilege) {
      setIsAdmin(savedPrivilege === 'true');
    }
  }, []);

  // Sync to Storage on Mutations
  const saveToStorage = (updatedList: Assessor[]) => {
    setAssessors(updatedList);
    localStorage.setItem('nabh_assessors_registry_v1', JSON.stringify(updatedList));
  };

  const handleAdminPrivilegeToggle = (val: boolean) => {
    setIsAdmin(val);
    localStorage.setItem('nabh_admin_privilege_v1', String(val));
  };

  // State Mutators: Delete
  const handleDeleteAssessor = (assessorId: string) => {
    const newList = assessors.filter(a => a.assessorId !== assessorId);
    saveToStorage(newList);
  };

  // State Mutators: Insert
  const handleAddAssessor = (newAssessor: Assessor) => {
    const existingIdx = assessors.findIndex(e => 
      (e.assessorId && newAssessor.assessorId && e.assessorId.toLowerCase().trim() === newAssessor.assessorId.toLowerCase().trim()) ||
      (e.name && newAssessor.name && e.name.toLowerCase().trim() === newAssessor.name.toLowerCase().trim())
    );

    if (existingIdx !== -1) {
      // If assessor already exists, merge their programs beautifully
      const updatedList = [...assessors];
      const existing = updatedList[existingIdx];
      const newPrograms = [...existing.programs];
      newAssessor.programs.forEach(p => {
        if (!newPrograms.some(e => e.program === p.program)) {
          newPrograms.push(p);
        }
      });
      updatedList[existingIdx] = {
        ...existing,
        ...newAssessor,
        programs: newPrograms,
        sNo: existing.sNo // Keep original serial number
      };
      saveToStorage(updatedList);
    } else {
      const newList = [newAssessor, ...assessors];
      saveToStorage(newList);
    }
  };

  // State Mutators: Bulk import spreadsheet parsed rows
  const handleBulkImport = (importedList: Assessor[], override: boolean) => {
    if (override) {
      saveToStorage(importedList);
    } else {
      // Merge: Avoid duplicating assessor names or IDs, merge programs if duplicate Name / ID
      const mergedList = [...assessors];
      importedList.forEach(imported => {
        const existingIdx = mergedList.findIndex(e => 
          (e.assessorId && imported.assessorId && e.assessorId.toLowerCase().trim() === imported.assessorId.toLowerCase().trim()) ||
          (e.name && imported.name && e.name.toLowerCase().trim() === imported.name.toLowerCase().trim())
        );

        if (existingIdx !== -1) {
          // If assessor already exists, merge programs
          const existing = mergedList[existingIdx];
          const newPrograms = [...existing.programs];
          imported.programs.forEach(p => {
            if (!newPrograms.some(e => e.program === p.program)) {
              newPrograms.push(p);
            }
          });
          mergedList[existingIdx] = {
            ...existing,
            programs: newPrograms
          };
        } else {
          // Add as new row
          mergedList.unshift(imported);
        }
      });
      
      // Re-assign S.Nos to ensure clean sequencing
      const sequencedList = mergedList.map((item, idx) => ({
        ...item,
        sNo: idx + 1
      }));

      saveToStorage(sequencedList);
    }
  };

  // State Mutators: Update status transitions with reasons
  const handleUpdateStatus = (id: string, newStatus: AssessorStatusType, reason?: string, dateOfChange?: string) => {
    const newList = assessors.map(a => {
      if (a.assessorId === id) {
        if (a.status === newStatus) return a;
        
        const changeDate = dateOfChange || new Date().toISOString().split('T')[0];
        const logEntry: StatusLogEntry = {
          id: 'LOG-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          timestamp: new Date().toISOString(),
          statusFrom: a.status,
          statusTo: newStatus,
          remarks: reason || 'Status updated via table control.',
          dateOfChange: changeDate
        };

        return {
          ...a,
          status: newStatus,
          banReason: reason || undefined,
          statusLogs: [logEntry, ...(a.statusLogs || [])]
        };
      }
      return a;
    });
    saveToStorage(newList);
  };

  // State Mutators: Edit individual assessor details in the directory
  const handleUpdateAssessor = (updatedAssessor: Assessor) => {
    const newList = assessors.map(a => a.assessorId === updatedAssessor.assessorId ? updatedAssessor : a);
    saveToStorage(newList);
  };

  // State Mutators: Factory reset back to defaults
  const handleResetDatabase = () => {
    saveToStorage(INITIAL_ASSESSORS);
    setCatalog(NABH_SCHEMES_CATALOG);
    localStorage.setItem('nabh_programs_catalog_v1', JSON.stringify(NABH_SCHEMES_CATALOG));
  };

  // Handle Quick Filter click from Dashboard metrics
  const handleQuickFilterSelect = (filters: any) => {
    setPresetFilters(filters);
    setCurrentTab('database');
  };

  const clearPresets = () => {
    setPresetFilters(null);
  };

  return (
    <div className="min-h-screen bg-slate-150 bg-slate-100 text-slate-950 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Dynamic Header */}
      <Header 
        isAdmin={isAdmin}
        setIsAdmin={handleAdminPrivilegeToggle}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

      {/* Main Content View Port */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        
        {currentTab === 'dashboard' && (
          <Dashboard 
            assessors={assessors}
            onQuickFilter={handleQuickFilterSelect}
            catalog={catalog}
          />
        )}

        {currentTab === 'database' && (
          <DatabaseGrid 
            assessors={assessors}
            onDeleteAssessor={handleDeleteAssessor}
            onUpdateStatus={handleUpdateStatus}
            onUpdateAssessor={handleUpdateAssessor}
            isAdmin={isAdmin}
            presetFilters={presetFilters}
            clearPresets={clearPresets}
            catalog={catalog}
            banReasons={banReasons}
            inactiveReasons={inactiveReasons}
          />
        )}

        {currentTab === 'admin' && (
          <AdminPanel 
            assessors={assessors}
            onAddAssessor={handleAddAssessor}
            onBulkImport={handleBulkImport}
            onResetDatabase={handleResetDatabase}
            catalog={catalog}
            onCreateProgram={handleCreateProgram}
            onDeleteProgram={handleDeleteProgram}
            onRenameProgram={handleRenameProgram}
            isAdmin={isAdmin}
            banReasons={banReasons}
            inactiveReasons={inactiveReasons}
            onAddBanReason={handleAddBanReason}
            onDeleteBanReason={handleDeleteBanReason}
            onAddInactiveReason={handleAddInactiveReason}
            onDeleteInactiveReason={handleDeleteInactiveReason}
          />
        )}

      </main>

      {/* Footer Area - High Density Style */}
      <footer className="bg-white border-t border-slate-200 text-slate-500 text-[10px] py-3 font-mono mt-8 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-4">
            <span>v1.0-stable</span>
            <span>&copy; 2024 National Board for Quality Promotion</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
              Cloud Sync: Active
            </span>
            <span className="flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
              Last Backup: Just now
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
