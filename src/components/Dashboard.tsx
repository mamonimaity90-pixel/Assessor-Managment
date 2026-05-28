/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Assessor, SchemeType } from '../types';
import { Sparkles, Users, UserCheck, UserPlus, UserX, Send, RefreshCw, GraduationCap, BarChart4, AlertCircle, Calendar, ShieldAlert, History, Search } from 'lucide-react';

interface DashboardProps {
  assessors: Assessor[];
  onQuickFilter: (filters: any) => void;
  catalog: Record<SchemeType, string[]>;
}

export default function Dashboard({ assessors, onQuickFilter, catalog }: DashboardProps) {
  // Sub-filters for Demographics & Compliance Metrics
  const [filterScheme, setFilterScheme] = useState<string>('All');
  const [filterProgram, setFilterProgram] = useState<string>('All');
  const [filterState, setFilterState] = useState<string>('All');
  const [filterCity, setFilterCity] = useState<string>('All');
  const [filterMinAge, setFilterMinAge] = useState<number>(20);
  const [filterMaxAge, setFilterMaxAge] = useState<number>(85);
  const [filterGender, setFilterGender] = useState<string>('All');
  const [filterJobRole, setFilterJobRole] = useState<string>('All');

  // Interactive filtering states for Banned & Inactivity Reason Analysis
  const [reasonStatusType, setReasonStatusType] = useState<'All' | 'Banned' | 'Inactive'>('All');
  const [reasonSearch, setReasonSearch] = useState('');
  const [reasonSortOrder, setReasonSortOrder] = useState<'desc' | 'asc'>('desc');

  // AI query state
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // Memoized categories mapping for compliance reason distributions
  const reasonCategories = React.useMemo(() => {
    let conflictCount = 0;
    let voluntaryCount = 0;
    let competenceCount = 0;
    let medicalCount = 0;
    let conductCount = 0;
    let totalEvents = 0;

    assessors.forEach(a => {
      const reasonsToScan: string[] = [];
      if ((a.status === 'Banned' || a.status === 'Inactive') && a.banReason) {
        reasonsToScan.push(a.banReason);
      }
      a.statusLogs?.forEach(l => {
        if ((l.statusTo === 'Banned' || l.statusTo === 'Inactive') && l.remarks) {
          reasonsToScan.push(l.remarks);
        }
      });

      reasonsToScan.forEach(r => {
        const text = r.toLowerCase();
        totalEvents++;
        if (text.includes('conflict') || text.includes('consulting') || text.includes('disclose') || text.includes('privately')) {
          conflictCount++;
        } else if (text.includes('voluntary') || text.includes('retire') || text.includes('personal') || text.includes('retired')) {
          voluntaryCount++;
        } else if (text.includes('medical') || text.includes('health') || text.includes('leave') || text.includes('welness')) {
          medicalCount++;
        } else if (text.includes('ethic') || text.includes('conduct') || text.includes('violation') || text.includes('misconduct')) {
          conductCount++;
        } else {
          competenceCount++;
        }
      });
    });

    const safeTotal = totalEvents || 1;

    return [
      { name: 'Conflict of Interest / Board Policy Breach', count: conflictCount, pct: Math.round((conflictCount / safeTotal) * 100), color: 'bg-rose-500', barColor: 'bg-rose-500' },
      { name: 'Voluntary Sabbatical / Leave of Absence', count: voluntaryCount, pct: Math.round((voluntaryCount / safeTotal) * 100), color: 'bg-amber-500', barColor: 'bg-amber-500' },
      { name: 'Medical & Wellness / Health Mandates', count: medicalCount, pct: Math.round((medicalCount / safeTotal) * 100), color: 'bg-indigo-500', barColor: 'bg-indigo-500' },
      { name: 'Ethical Violations / Audit Misconduct', count: conductCount, pct: Math.round((conductCount / safeTotal) * 100), color: 'bg-red-600', barColor: 'bg-red-600' },
      { name: 'Schedule Availability & Inactivity', count: competenceCount, pct: Math.round((competenceCount / safeTotal) * 100), color: 'bg-slate-400', barColor: 'bg-slate-400' },
    ].sort((a, b) => b.count - a.count);
  }, [assessors]);

  // Chronological timeline events list
  const deactivationEvents = React.useMemo(() => {
    const list: {
      id: string;
      assessorId: string;
      assessorName: string;
      eventType: 'Banned' | 'Inactive';
      date: string;
      reason: string;
      isHistoric: boolean;
    }[] = [];

    assessors.forEach(a => {
      // 1. Current State (Banned / Inactive)
      if (a.status === 'Banned' || a.status === 'Inactive') {
        const matchingLog = a.statusLogs?.find(l => l.statusTo === a.status);
        const date = matchingLog?.dateOfChange || a.dateOfEmpanelment || '2024-01-01';
        list.push({
          id: `current-${a.assessorId}`,
          assessorId: a.assessorId,
          assessorName: a.name,
          eventType: a.status as 'Banned' | 'Inactive',
          date: date,
          reason: a.banReason || 'No reason specified in registry profile.',
          isHistoric: false
        });
      }

      // 2. Archive Logs
      a.statusLogs?.forEach(log => {
        if (log.statusTo === 'Banned' || log.statusTo === 'Inactive') {
          // Avoid duplicate entry if dates and types are identical
          if (list.some(e => e.assessorId === a.assessorId && e.eventType === log.statusTo && e.date === log.dateOfChange)) {
            return;
          }
          list.push({
            id: log.id,
            assessorId: a.assessorId,
            assessorName: a.name,
            eventType: log.statusTo as 'Banned' | 'Inactive',
            date: log.dateOfChange || '2024-01-01',
            reason: log.remarks || 'No reason specified in registry logs.',
            isHistoric: true
          });
        }
      });
    });

    // Subfilter
    return list.filter(e => {
      if (reasonStatusType === 'Banned' && e.eventType !== 'Banned') return false;
      if (reasonStatusType === 'Inactive' && e.eventType !== 'Inactive') return false;
      
      const query = reasonSearch.toLowerCase().trim();
      if (query) {
        const matchesName = e.assessorName.toLowerCase().includes(query);
        const matchesId = e.assessorId.toLowerCase().includes(query);
        const matchesReason = e.reason.toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesReason) return false;
      }
      return true;
    }).sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return reasonSortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [assessors, reasonStatusType, reasonSearch, reasonSortOrder]);

  // Expanded demographic dataset where each program-role association counts separately
  const expandedDemographics = React.useMemo(() => {
    const list: any[] = [];
    assessors.forEach(a => {
      if (a.programs && a.programs.length > 0) {
        a.programs.forEach(p => {
          list.push({
            ...a,
            currentScheme: p.scheme,
            currentProgram: p.program,
            currentCapacity: p.capacity
          });
        });
      } else {
        list.push({
          ...a,
          currentScheme: 'Accreditation',
          currentProgram: 'Hospitals (Full Accreditation)',
          currentCapacity: a.designation
        });
      }
    });
    return list;
  }, [assessors]);

  // Calculate Core Statistics using expanded demographics
  const totalCount = expandedDemographics.length;
  const activeCount = expandedDemographics.filter(a => a.status === 'Active').length;
  const inactiveCount = expandedDemographics.filter(a => a.status === 'Inactive').length;
  const bannedCount = expandedDemographics.filter(a => a.status === 'Banned').length;

  // Mappings & Program distributions count
  const schemeCounts: Record<string, number> = { Accreditation: 0, Certification: 0, Empanelment: 0 };
  const programCounts: Record<string, number> = {};
  const stateCounts: Record<string, number> = {};

  expandedDemographics.forEach(a => {
    if (a.state) {
      stateCounts[a.state] = (stateCounts[a.state] || 0) + 1;
    }
    schemeCounts[a.currentScheme] = (schemeCounts[a.currentScheme] || 0) + 1;
    programCounts[a.currentProgram] = (programCounts[a.currentProgram] || 0) + 1;
  });

  // Sort states by count
  const sortedStates = Object.entries(stateCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Sort top programs of the catalog by count
  const sortedPrograms = Object.entries(programCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  // Analytics Filtered Dataset
  const filteredAnalyticsData = React.useMemo(() => {
    return expandedDemographics.filter(a => {
      if (filterScheme !== 'All' && a.currentScheme !== filterScheme) return false;
      if (filterProgram !== 'All' && a.currentProgram !== filterProgram) return false;
      if (filterState !== 'All' && a.state !== filterState) return false;
      if (filterCity !== 'All' && a.city !== filterCity) return false;
      if (a.age < filterMinAge || a.age > filterMaxAge) return false;
      if (filterGender !== 'All' && a.gender !== filterGender) return false;
      if (filterJobRole !== 'All' && a.designation !== filterJobRole) return false;
      return true;
    });
  }, [expandedDemographics, filterScheme, filterProgram, filterState, filterCity, filterMinAge, filterMaxAge, filterGender, filterJobRole]);

  // Derived specializations metrics
  const specializationDistribution = React.useMemo(() => {
    const counts: Record<string, number> = {};
    filteredAnalyticsData.forEach(a => {
      const spec = a.specialization || 'General Healthcare';
      counts[spec] = (counts[spec] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [filteredAnalyticsData]);

  // Filtered list of states present based on matches
  const activeStatesInDatabase = React.useMemo(() => {
    const set = new Set(expandedDemographics.map(x => x.state).filter(Boolean));
    return Array.from(set).sort();
  }, [expandedDemographics]);

  // Filtered list of cities present dependent specifically on chosen state filter
  const activeCitiesInDatabase = React.useMemo(() => {
    let dataset = expandedDemographics;
    if (filterState !== 'All') {
      dataset = dataset.filter(x => x.state === filterState);
    }
    const set = new Set(dataset.map(x => x.city).filter(Boolean));
    return Array.from(set).sort();
  }, [expandedDemographics, filterState]);

  // Filtered list of designation job roles present
  const activeJobRolesInDatabase = React.useMemo(() => {
    const set = new Set(expandedDemographics.map(x => x.designation).filter(Boolean));
    return Array.from(set).sort();
  }, [expandedDemographics]);

  // Empanelment year distribution
  const empanelmentDistribution = React.useMemo(() => {
    const years = [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
    return years.map(yr => {
      const count = filteredAnalyticsData.filter(a => {
        const empYear = a.empaneledYear || (a.dateOfEmpanelment ? new Date(a.dateOfEmpanelment).getFullYear() : 2018);
        return empYear === yr;
      }).length;
      return { year: yr, count };
    });
  }, [filteredAnalyticsData]);

  // Program status trend
  const programStatusDistribution = React.useMemo(() => {
    const map: Record<string, { active: number; inactive: number; banned: number; expired: number; total: number }> = {};
    filteredAnalyticsData.forEach(a => {
      const prog = a.currentProgram;
      if (!map[prog]) {
        map[prog] = { active: 0, inactive: 0, banned: 0, expired: 0, total: 0 };
      }
      map[prog].total++;
      if (a.status === 'Active') map[prog].active++;
      else if (a.status === 'Inactive') map[prog].inactive++;
      else if (a.status === 'Banned') map[prog].banned++;
      else if (a.status === 'Expired') map[prog].expired++;
    });
    return Object.entries(map)
      .map(([programName, stats]) => ({ programName, ...stats }))
      .sort((a, b) => b.total - a.total);
  }, [filteredAnalyticsData]);

  // Year-on-year dynamic additions and bans
  const yoyTrendDistribution = React.useMemo(() => {
    const years = [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
    return years.map(yr => {
      const additions = expandedDemographics.filter(a => {
        const joinYr = a.empaneledYear || (a.dateOfEmpanelment ? new Date(a.dateOfEmpanelment).getFullYear() : 2018);
        return joinYr === yr && (a.status === 'Active' || a.status === 'Inactive');
      }).length;

      const bans = expandedDemographics.filter(a => {
        const joinYr = a.empaneledYear || (a.dateOfEmpanelment ? new Date(a.dateOfEmpanelment).getFullYear() : 2018);
        return joinYr === yr && a.status === 'Banned';
      }).length;

      return { year: yr, additions, bans };
    });
  }, [expandedDemographics]);

  // AI handler
  const handleAiQuery = async (e: React.FormEvent, presetQuery?: string) => {
    if (e) e.preventDefault();
    const queryStr = presetQuery || aiQuestion;
    if (!queryStr.trim()) return;

    setAiLoading(true);
    setAiResponse('');
    setAiError('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: queryStr, assessors })
      });
      if (!response.ok) throw new Error('Failed to query the AI assistant');
      const data = await response.json();
      setAiResponse(data.answer);
    } catch (err: any) {
      setAiError(err.message || 'Error occurred querying the AI model.');
    } finally {
      setAiLoading(false);
    }
  };

  const samplePrompts = [
    "Who are our active assessors in Pune, Maharashtra?",
    "Show me a list of assessors who have a Ban status and the reasons why",
    "How many assessors do we have for Dental Clinics or Eye Care Providers?",
    "Give me active assessors empaneled since 2018 onwards"
  ];

  function renderChatInterface() {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5 mb-3.5">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800">
              Registry Copilot AI Assistant
            </h3>
          </div>

          <p className="text-xs text-slate-500 mb-3.5 leading-relaxed">
            Analyze, query, and audit this live assessor directory naturally. Gemini extracts statistics, location logs, ethical violations, and compliance ratings.
          </p>

          <div className="space-y-1.5 mb-3.5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Try asking Gemini:</p>
            <div className="flex flex-col gap-1">
              {samplePrompts.slice(0, 3).map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => handleAiQuery(e, prompt)}
                  className="text-left text-[11px] bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-600 border border-slate-200 rounded-lg px-2.5 py-1 transition-all leading-normal font-medium truncate cursor-pointer"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleAiQuery} className="relative mb-3.5">
            <input
              type="text"
              placeholder="Ask a question about the assessor roster..."
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg pl-3 pr-10 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400 font-medium"
            />
            <button
              type="submit"
              disabled={aiLoading}
              className="absolute right-2 top-1.5 text-slate-400 hover:text-blue-650 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {aiLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>

          {(aiResponse || aiLoading || aiError) && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 max-h-[220px] overflow-y-auto font-sans">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 font-bold">Analysis Response</span>
                {aiLoading && <span className="text-[9px] font-mono text-blue-600 animate-pulse">Consulting LLM...</span>}
              </div>

              {aiError && (
                <div className="text-xs text-rose-600 flex items-start gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <div>{aiError}</div>
                </div>
              )}

              {aiLoading && (
                <div className="space-y-1.5 py-1.5">
                  <div className="h-2.5 bg-slate-200 rounded-full w-3/4 animate-pulse"></div>
                  <div className="h-2.5 bg-slate-200 rounded-full w-5/6 animate-pulse"></div>
                </div>
              )}

              {aiResponse && (
                <div className="text-xs text-slate-700 leading-relaxed max-w-none whitespace-pre-wrap">
                  {aiResponse}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="text-[9px] font-mono text-slate-400 border-t border-slate-100 pt-2.5 mt-3 text-center">
          Gemini model: <strong className="text-slate-650 text-slate-600 font-bold">gemini-1.5-flash</strong>. No keys exposed.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      
      {/* Top Header Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <BarChart4 className="h-5.5 w-5.5 text-blue-600 animate-pulse" />
            <span>Assessor Management Dashboard</span>
          </h2>
        </div>
      </div>

      {/* Core statistics cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div 
          onClick={() => onQuickFilter({})}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between hover:border-slate-350 hover:shadow-md hover:bg-slate-50/55 transition-all cursor-pointer duration-250"
        >
          <div className="space-y-0.5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">total registered assessors</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{totalCount}</h3>
            <p className="text-[10px] font-mono text-slate-400">Registered Assessors</p>
          </div>
          <div className="bg-slate-50 w-10 h-10 rounded-lg border border-slate-100 flex items-center justify-center">
            <Users className="h-5 w-5 text-slate-400" />
          </div>
        </div>

        <div 
          onClick={() => onQuickFilter({ status: 'Active' })}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between hover:border-blue-300 hover:shadow-md hover:bg-blue-50/20 transition-all cursor-pointer duration-250"
        >
          <div className="space-y-0.5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-blue-600 font-bold">active assessors</p>
            <h3 className="text-2xl font-black text-blue-600 tracking-tight">{activeCount}</h3>
            <p className="text-[10px] font-mono text-slate-400 font-medium">
              {totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0}% active assessor ratio
            </p>
          </div>
          <div className="bg-blue-50 w-10 h-10 rounded-lg border border-blue-100 flex items-center justify-center">
            <UserCheck className="h-5 w-5 text-blue-600" />
          </div>
        </div>

        <div 
          onClick={() => onQuickFilter({ status: 'Inactive' })}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between hover:border-amber-300 hover:shadow-md hover:bg-amber-50/20 transition-all cursor-pointer duration-250"
        >
          <div className="space-y-0.5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-amber-605 text-amber-655 text-amber-600 font-bold">on hold or inactive assessors</p>
            <h3 className="text-2xl font-black text-amber-500 tracking-tight">{inactiveCount}</h3>
            <p className="text-[10px] font-mono text-slate-400 font-semibold">Inactive Assessors</p>
          </div>
          <div className="bg-amber-50 w-10 h-10 rounded-lg border border-amber-100 flex items-center justify-center">
            <UserPlus className="h-5 w-5 text-amber-500" />
          </div>
        </div>

        <div 
          onClick={() => onQuickFilter({ status: 'Banned' })}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between hover:border-red-300 hover:shadow-md hover:bg-red-50/20 transition-all cursor-pointer duration-250"
        >
          <div className="space-y-0.5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-red-650 text-red-600 font-bold">banned assessors</p>
            <h3 className="text-2xl font-black text-red-500 tracking-tight">{bannedCount}</h3>
            <p className="text-[10px] font-mono text-slate-400 font-semibold">Banned Assessors</p>
          </div>
          <div className="bg-red-50 w-10 h-10 rounded-lg border border-red-100 flex items-center justify-center">
            <UserX className="h-5 w-5 text-red-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Schemes / program counts */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-5">
          
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
                Program-wise assessors
              </h4>
              <button 
                onClick={() => onQuickFilter({})} 
                className="text-[10px] text-blue-600 hover:underline font-mono font-bold cursor-pointer"
              >
                View Classifications &rarr;
              </button>
            </div>

            <div className="space-y-3.5">
              {['Accreditation', 'Certification', 'Empanelment'].map(scheme => {
                const count = schemeCounts[scheme] || 0;
                const totalAssociations = Object.values(schemeCounts).reduce((a, b) => a + b, 0) || 1;
                const percentage = Math.round((count / totalAssociations) * 100);
                
                const schemeColors: Record<string, string> = {
                  Accreditation: 'bg-indigo-600',
                  Certification: 'bg-blue-600',
                  Empanelment: 'bg-emerald-600'
                };
                
                return (
                  <div key={scheme} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => onQuickFilter({ scheme })}
                        className="text-xs font-semibold text-slate-800 hover:text-blue-600 hover:underline transition-all text-left cursor-pointer"
                      >
                        {scheme} program-wise assessors
                      </button>
                      <span className="text-xs font-mono text-slate-500 font-semibold">
                        {count} Mappings ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${schemeColors[scheme]} rounded-full transition-all duration-500`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2.5 mb-3.5">
              Top Mapped Programs
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {sortedPrograms.slice(0, 6).map(([prog, count]) => (
                <div 
                  key={prog} 
                  className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:border-blue-300 transition-all flex flex-col justify-between"
                >
                  <span className="text-xs text-slate-800 font-semibold leading-normal mb-2 line-clamp-2">
                    {prog}
                  </span>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-mono text-slate-400">Associated</span>
                    <button
                      onClick={() => onQuickFilter({ program: prog })}
                      className="bg-blue-50 text-blue-600 border border-blue-105 border-blue-100 px-2.5 py-1 rounded text-[11px] font-mono font-bold hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                    >
                      {count} Assessors &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-3 text-center">
              💡 Click any card metric, program, or specialization to automatically see filtered results.
            </p>
          </div>

        </div>

        {/* Right Column: Regional Distribution and AI Assistant */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-5">
          
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2.5 mb-3.5 flex justify-between items-center">
              <span>Regional Distribution State-wise</span>
              <span className="text-[9px] text-slate-400 font-normal lowercase">(Click to filter)</span>
            </h3>
            <div className="space-y-3">
              {sortedStates.map(([state, count]) => {
                const maxCount = Math.max(...Object.values(stateCounts));
                const statePercentage = Math.round((count / (maxCount || 1)) * 100);
                return (
                  <div 
                    key={state} 
                    onClick={() => onQuickFilter({ state })}
                    className="group hover:bg-slate-50 rounded px-2.5 py-1.5 transition-all cursor-pointer duration-150 border border-transparent hover:border-slate-150"
                  >
                    <div className="flex justify-between items-center mb-0.5 text-xs">
                      {/* Name displays with 'HQ' safely removed as requested */}
                      <span className="text-slate-800 font-bold group-hover:text-blue-600 transition-colors">{state}</span>
                      <span className="font-mono text-slate-500 group-hover:text-blue-600 transition-colors">
                        {count} Assessor{count > 1 ? 's' : ''} &rarr;
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full group-hover:bg-slate-200 transition-colors">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${statePercentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Interface */}
          {renderChatInterface()}

        </div>

      </div>

      {/* ==================== BOTTOM DEMOGRAPHICS METRICS SECTION ==================== */}
      <div className="pt-6 border-t border-slate-200 space-y-5">
        
        {/* Metric filter container */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-2.5 mb-3.5 gap-2">
            <div className="flex items-center gap-2">
              <BarChart4 className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
              <span className="text-xs uppercase font-mono tracking-wider font-extrabold pb-0.5">Demographics & Compliance Metrics Filters</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFilterScheme('All');
                  setFilterProgram('All');
                  setFilterState('All');
                  setFilterCity('All');
                  setFilterMinAge(20);
                  setFilterMaxAge(85);
                  setFilterGender('All');
                  setFilterJobRole('All');
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[9px] px-2.5 py-1 rounded font-mono font-bold transition-all uppercase tracking-wider cursor-pointer"
              >
                Reset Filters
              </button>
              <span className="text-[10px] font-mono bg-slate-800 px-2 py-1 rounded text-amber-400 font-bold uppercase tracking-wider shrink-0 animate-pulse font-bold">
                Filtered Matches: N = {filteredAnalyticsData.length} Assessors
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {/* Scheme Select */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wide text-slate-404 text-slate-400 block font-bold">Standards Scheme</label>
              <select
                value={filterScheme}
                onChange={(e) => {
                  setFilterScheme(e.target.value);
                  setFilterProgram('All');
                }}
                className="w-full bg-slate-950 border border-slate-803 border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 font-semibold cursor-pointer text-slate-350"
              >
                <option value="All">All Schemes (Universal Directory)</option>
                <option value="Accreditation">Accreditation</option>
                <option value="Certification">Certification</option>
                <option value="Empanelment">Empanelment</option>
              </select>
            </div>

            {/* Program Select */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wide text-slate-404 text-slate-400 block font-bold">Specialized Program</label>
              <select
                value={filterProgram}
                onChange={(e) => setFilterProgram(e.target.value)}
                className="w-full bg-slate-950 border border-slate-803 border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 font-semibold cursor-pointer text-slate-350"
              >
                <option value="All">All Associated Programs</option>
                {filterScheme === 'All'
                  ? Array.from(new Set(Object.values(catalog).flat())).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))
                  : Array.from(new Set(catalog[filterScheme as SchemeType] || [])).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))
                }
              </select>
            </div>

            {/* State Select */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wide text-slate-404 text-slate-400 block font-bold">Audit Location / State</label>
              <select
                value={filterState}
                onChange={(e) => {
                  setFilterState(e.target.value);
                  setFilterCity('All');
                }}
                className="w-full bg-slate-950 border border-slate-803 border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 font-semibold cursor-pointer text-slate-350"
              >
                <option value="All">All States (All Jurisdictions)</option>
                {activeStatesInDatabase.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* City Select */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wide text-slate-404 text-slate-400 block font-bold">Local City</label>
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-803 border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 font-semibold cursor-pointer text-slate-350"
              >
                <option value="All">All Cities ({activeCitiesInDatabase.length})</option>
                {activeCitiesInDatabase.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Age Range slider */}
            <div className="space-y-1.5 bg-slate-950 border border-slate-800 rounded p-2 text-xs col-span-1 sm:col-span-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-mono tracking-wide text-slate-400 font-bold block">Age Spectrum</span>
                <span className="text-[10px] bg-slate-800 font-mono text-amber-400 font-bold px-1.5 py-0.5 rounded">
                  {filterMinAge} - {filterMaxAge} Yrs
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="flex items-center space-x-2 text-[9px] text-slate-400">
                  <span className="w-5 shrink-0 font-mono text-[8.5px] uppercase tracking-wider">Min:</span>
                  <input
                    type="range"
                    min="20"
                    max="85"
                    value={filterMinAge}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFilterMinAge(val);
                      if (val > filterMaxAge) setFilterMaxAge(val);
                    }}
                    className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center space-x-2 text-[9px] text-slate-400">
                  <span className="w-5 shrink-0 font-mono text-[8.5px] uppercase tracking-wider">Max:</span>
                  <input
                    type="range"
                    min="20"
                    max="85"
                    value={filterMaxAge}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFilterMaxAge(val);
                      if (val < filterMinAge) setFilterMinAge(val);
                    }}
                    className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Gender identity */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wide text-slate-404 text-slate-400 block font-bold">Gender Identity</label>
              <select
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
                className="w-full bg-slate-950 border border-slate-803 border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 font-semibold cursor-pointer text-slate-350"
              >
                <option value="All">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Designation */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wide text-slate-404 text-slate-400 block font-bold">Job Designation</label>
              <select
                value={filterJobRole}
                onChange={(e) => setFilterJobRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-810 border-slate-800 rounded p-2 text-xs text-slate-305 focus:outline-none focus:border-amber-500 font-semibold cursor-pointer text-slate-350"
              >
                <option value="All">All Job Roles ({activeJobRolesInDatabase.length})</option>
                {activeJobRolesInDatabase.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Demographic cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in slide-in-from-bottom duration-300">
          
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[300px]">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">Widget 01 &bull; demographics</span>
              <h3 className="text-sm font-bold text-slate-900 leading-tight mt-0.5">Assessor Gender Ratio Pie</h3>
            </div>

            {filteredAnalyticsData.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs font-mono gap-1.5 font-bold">
                <BarChart4 className="h-5 w-5 text-slate-300 animate-pulse" />
                <span>No matching assessor data</span>
              </div>
            ) : (
              <div className="py-2.5">
                <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                  <svg className="absolute w-full h-full transform -rotate-90 animate-in fade-in zoom-in duration-300" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="40" stroke="#f1f5f9" strokeWidth="11" fill="transparent" />
                    {(() => {
                      const mCount = filteredAnalyticsData.filter(a => a.gender === 'Male').length;
                      const fCount = filteredAnalyticsData.filter(a => a.gender === 'Female').length;
                      const oCount = filteredAnalyticsData.length - mCount - fCount;
                      const sum = filteredAnalyticsData.length;
                      const stats = [
                        { name: 'Male', val: mCount, color: '#3b82f6' },
                        { name: 'Female', val: fCount, color: '#ec4899' },
                        { name: 'Other', val: oCount, color: '#f59e0b' }
                      ].filter(s => s.val > 0);

                      const circum = 251.327;
                      let running = 0;

                      return stats.map(stat => {
                        const percentage = (stat.val / sum) * 100;
                        const segment = (percentage / 100) * circum;
                        const offset = running;
                        running -= segment;

                        return (
                          <circle
                            key={stat.name}
                            cx="60"
                            cy="60"
                            r="40"
                            stroke={stat.color}
                            strokeWidth="11"
                            strokeDasharray={`${segment} ${circum}`}
                            strokeDashoffset={offset}
                            fill="transparent"
                            className="transition-all duration-300 hover:opacity-85"
                            style={{ transformOrigin: 'center' }}
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="text-center z-10 space-y-0.5 font-sans">
                    <span className="text-lg font-black text-slate-800 block">{filteredAnalyticsData.length}</span>
                    <span className="text-[8px] font-mono text-slate-400 tracking-wider uppercase block">Total</span>
                  </div>
                </div>

                <div className="mt-5 space-y-2 max-w-[210px] mx-auto">
                  {(() => {
                    const mCount = filteredAnalyticsData.filter(a => a.gender === 'Male').length;
                    const fCount = filteredAnalyticsData.filter(a => a.gender === 'Female').length;
                    const oCount = filteredAnalyticsData.length - mCount - fCount;
                    const tot = filteredAnalyticsData.length;

                    return [
                      { name: 'Male', val: mCount, color: 'bg-blue-500' },
                      { name: 'Female', val: fCount, color: 'bg-pink-500' },
                      { name: 'Other', val: oCount, color: 'bg-amber-500' }
                    ].filter(x => x.val > 0).map(x => (
                      <div key={x.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                           <span className={`w-2 h-2 rounded-full ${x.color} shrink-0`} />
                           <span className="font-semibold text-slate-750 text-slate-705 text-slate-700">{x.name}</span>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-slate-500">
                          {x.val} <span className="text-slate-400 font-normal">({((x.val / tot) * 100).toFixed(0)}%)</span>
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[300px]">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">Widget 02 &bull; Age cohorts</span>
              <h3 className="text-sm font-bold text-slate-900 leading-tight mt-0.5">Age bracket Distribution</h3>
            </div>

            {filteredAnalyticsData.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-slate-400 text-xs font-mono font-bold">No matching records</div>
            ) : (
              <div className="py-2.5 space-y-3.5">
                {(() => {
                  const cU40 = filteredAnalyticsData.filter(a => a.age < 40).length;
                  const c40t49 = filteredAnalyticsData.filter(a => a.age >= 40 && a.age < 50).length;
                  const c50t59 = filteredAnalyticsData.filter(a => a.age >= 50 && a.age < 60).length;
                  const c60o = filteredAnalyticsData.filter(a => a.age >= 60).length;
                  const sum = filteredAnalyticsData.length;

                  const cohorts = [
                    { label: 'Junior Assessor (< 40)', val: cU40, color: 'bg-emerald-500', ageMin: 20, ageMax: 39 },
                    { label: 'Mid-Career Panel (40 - 49)', val: c40t49, color: 'bg-blue-600', ageMin: 40, ageMax: 49 },
                    { label: 'Senior Expert (50 - 59)', val: c50t59, color: 'bg-amber-500', ageMin: 50, ageMax: 59 },
                    { label: 'Veterans Advisory (60+)', val: c60o, color: 'bg-rose-500', ageMin: 60, ageMax: 85 }
                  ];

                  const maxC = Math.max(...cohorts.map(h => h.val), 1);

                  return cohorts.map(c => {
                    const ratio = (c.val / sum) * 100;
                    const lengthRatio = (c.val / maxC) * 100;
                    return (
                      <div 
                        key={c.label} 
                        onClick={() => onQuickFilter({ ageMin: c.ageMin, ageMax: c.ageMax })}
                        className="space-y-1 cursor-pointer hover:bg-slate-50 p-1 -mx-1 rounded transition-colors group"
                      >
                        <div className="flex items-center justify-between text-xs font-sans">
                          <span className="font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">{c.label}</span>
                          <span className="font-mono text-slate-500 text-[11px] font-bold">
                            {c.val} <span className="opacity-70 font-normal font-sans">({ratio.toFixed(0)}%)</span>
                          </span>
                        </div>
                        <div className="bg-slate-100 h-2 rounded overflow-hidden">
                          <div className={`h-full ${c.color} rounded transition-all duration-300`} style={{ width: `${lengthRatio}%` }} />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">Widget 04 &bull; expertises</span>
              <h3 className="text-sm font-bold text-slate-900 leading-tight mt-0.5">Assessor Specialization</h3>
            </div>

            {specializationDistribution.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-slate-400 text-xs font-mono font-bold">No matching records</div>
            ) : (
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {specializationDistribution.map(item => {
                  const totalSpec = specializationDistribution.reduce((acc, current) => acc + current.count, 0) || 1;
                  const pct = (item.count / totalSpec) * 100;
                  return (
                    <div 
                      key={item.name} 
                      onClick={() => onQuickFilter({ specialization: item.name })}
                      className="flex items-center gap-2.5 text-xs justify-between font-sans cursor-pointer hover:bg-slate-50 p-1 -mx-1 rounded transition-colors group"
                    >
                      <div className="flex items-center gap-1.5 flex-grow max-w-[70%]">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-slate-705 text-slate-700 group-hover:text-blue-600 transition-colors truncate" title={item.name}>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-12 bg-slate-100 h-1 rounded overflow-hidden hidden sm:block">
                          <div className="bg-slate-600 h-full rounded transition-all duration-300" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="font-mono text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors font-bold text-[10px] whitespace-nowrap bg-slate-100/80 px-1.5 py-0.5 rounded">N = {item.count} &rarr;</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">Widget 05 &bull; cross-program matrix status</span>
              <h3 className="text-sm font-bold text-slate-900 leading-tight mt-0.5">Program wise assessor active / banned / inactive / expired</h3>
            </div>

            {programStatusDistribution.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-slate-400 text-xs font-mono font-bold">No records mapped criteria</div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {programStatusDistribution.slice(0, 8).map((pDist) => {
                  return (
                    <div key={pDist.programName} className="border-b border-slate-100 pb-2.5 last:border-0 last:pb-0 font-sans">
                      <div className="flex items-start justify-between gap-2.5 text-xs">
                        <span className="font-bold text-slate-800 line-clamp-1 leading-snug">{pDist.programName}</span>
                        <span className="font-mono text-amber-600 text-[10px] font-bold bg-amber-50 px-1.5 py-0.5 rounded shrink-0 font-bold">
                          Assoc: {pDist.total}
                        </span>
                      </div>

                      <div className="mt-2 text-[10px] flex gap-x-3 gap-y-1.5 flex-wrap font-mono uppercase tracking-wider text-[9px] font-bold">
                        <span className="flex items-center gap-1 shrink-0">
                          <span className="w-2 h-2 rounded bg-emerald-500 shrink-0" />
                          <span className="text-slate-500 text-slate-600 font-bold">Active: {pDist.active}</span>
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                          <span className="w-2 h-2 rounded bg-slate-400 shrink-0" />
                          <span className="text-slate-500 text-slate-600 font-bold">Inactive: {pDist.inactive}</span>
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                          <span className="w-2 h-2 rounded bg-rose-500 shrink-0" />
                          <span className="text-slate-500 text-slate-600 font-bold">Banned: {pDist.banned}</span>
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                          <span className="w-2 h-2 rounded bg-indigo-500 shrink-0" />
                          <span className="text-slate-500 text-slate-600 font-bold">Expired: {pDist.expired}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-12 bg-white border border-slate-205 rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">Widget 06 &bull; Compliance & growth Trends</span>
              <h3 className="text-sm font-bold text-slate-900 leading-tight mt-0.5">Year-on-Year Growth vs. Administrative Disciplinary Actions</h3>
              <p className="text-xs text-slate-500 mt-1">
                Comparing the registration speed of active new assessors (Adds) against regulatory board bans (Bans) from {yoyTrendDistribution[0].year} to {yoyTrendDistribution[yoyTrendDistribution.length - 1].year}.
              </p>
            </div>

            <div className="mt-6 flex flex-col md:flex-row gap-6 items-stretch font-sans">
              <div className="flex-grow bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-end min-h-[220px]">
                <div className="h-36 flex items-end justify-between gap-3 border-b border-slate-200 pb-1 px-2 relative font-mono">
                  {yoyTrendDistribution.map(d => {
                    const maxAdds = Math.max(...yoyTrendDistribution.map(x => x.additions), 1);
                    const maxBans = Math.max(...yoyTrendDistribution.map(x => x.bans), 1);
                    const overallMax = Math.max(maxAdds, maxBans, 1);
                    
                    const hAddPct = (d.additions / overallMax) * 100;
                    const hBanPct = (d.bans / overallMax) * 100;
                    
                    return (
                      <div key={d.year} className="flex-1 flex items-end justify-center gap-1 group relative cursor-pointer h-full">
                        <div className="absolute bottom-full mb-1.5 bg-slate-900 border border-slate-800 text-slate-200 text-[10px] font-mono p-2.5 rounded shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-30 pointer-events-none space-y-1 font-bold">
                          <div className="text-white border-b border-slate-800 pb-1 mb-1 font-mono text-center text-[11px]">{d.year} Summary</div>
                          <div className="flex items-center gap-1.5 text-emerald-400">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span>Empaneled: {d.additions}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-rose-400">
                            <span className="h-2 w-2 rounded-full bg-rose-500" />
                            <span>Banned: {d.bans}</span>
                          </div>
                        </div>
                        
                        <div
                          className={`w-1/2 rounded-t transition-all duration-300 ${d.additions > 0 ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-slate-200'}`}
                          style={{ height: `${Math.max(hAddPct, d.additions > 0 ? 4 : 2)}%` }}
                        />
                        <div
                          className={`w-1/2 rounded-t transition-all duration-300 ${d.bans > 0 ? 'bg-rose-500 hover:bg-rose-400' : 'bg-slate-200'}`}
                          style={{ height: `${Math.max(hBanPct, d.bans > 0 ? 4 : 2)}%` }}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-2 px-1 font-bold">
                  {yoyTrendDistribution.map(d => (
                    <span key={d.year} className="flex-1 text-center truncate">{d.year}</span>
                  ))}
                </div>
              </div>

              <div className="w-full md:w-80 border border-slate-200 rounded-xl p-4 flex flex-col justify-between bg-white space-y-4">
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold mb-3 flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 bg-amber-500 rounded-full" />
                    Registry Trends Legend
                  </h4>
                  
                  <div className="space-y-3.5">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1 px-1.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[10px] font-black shrink-0">
                        + {yoyTrendDistribution.reduce((sum, d) => sum + d.additions, 0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Total New Additions</div>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-tight text-slate-500">Total registrations registered into the NABH system since 2012.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="p-1 px-1.5 rounded bg-rose-50 text-rose-700 font-mono text-[10px] font-black shrink-0">
                        - {yoyTrendDistribution.reduce((sum, d) => sum + d.bans, 0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Board Indictments</div>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-tight text-slate-500">Revocations issued due to conflict disclosures or compliance failures.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-[10px] text-slate-500 font-mono leading-relaxed">
                  <span className="font-bold text-slate-700 uppercase tracking-wide block mb-1">💡 Interactive Check</span>
                  Hover on the dual-bars to inspect specific additions vs administrative actions count overlays for any chosen calendar year.
                </div>
              </div>
            </div>
          </div>

          {/* Widget 07: Banned & Inactive Reason Analysis Panel */}
          <div className="lg:col-span-12 bg-white border border-slate-205 rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between border-b border-slate-100 pb-4 gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#2563eb] font-bold block">Widget 07 &bull; Disciplinary & Dormancy Reason Analyzer</span>
                <h3 className="text-sm font-bold text-slate-900 leading-tight mt-0.5">Banned & Inactive Reason Tracking Timeline</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Analyze dynamic reason categories and chronological timeline logs of administrative deactivation actions over a period of time.
                </p>
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                    <Search className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search keywords..."
                    value={reasonSearch}
                    onChange={(e) => setReasonSearch(e.target.value)}
                    className="pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-450 focus:outline-none focus:border-blue-500 font-mono w-40 sm:w-48 transition-all"
                  />
                  {reasonSearch && (
                    <button 
                      onClick={() => setReasonSearch('')} 
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 font-sans text-xs font-bold"
                    >
                      &times;
                    </button>
                  )}
                </div>

                {/* statusType buttons picker */}
                <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 inline-flex">
                  {(['All', 'Banned', 'Inactive'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setReasonStatusType(type)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold transition-all ${
                        reasonStatusType === type 
                          ? 'bg-white text-slate-900 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Sort order toggle buttons */}
                <button
                  type="button"
                  onClick={() => setReasonSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg p-1.5 text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                  title="Toggle Chronological Sorting"
                >
                  <History className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-[10px] font-mono uppercase font-bold">{reasonSortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
                </button>
              </div>
            </div>

            {/* Categorized Reasons Analysis Meter Bar Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2 bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-4">
                <div>
                  <h4 className="text-xs font-extrabold font-sans text-slate-800">Reason Category Metric Model</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Dynamic heuristics classification of bans & inactive records remarks.</p>
                </div>

                <div className="space-y-3.5">
                  {reasonCategories.map((cat, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-600 font-semibold truncate max-w-[200px]" title={cat.name}>
                          {cat.name}
                        </span>
                        <span className="text-slate-900 font-bold shrink-0">{cat.count} ({cat.pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${cat.barColor}`} 
                          style={{ width: `${cat.pct}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Event Timeline Streams */}
              <div className="lg:col-span-3 space-y-3">
                <div className="flex justify-between items-center text-xs font-sans text-slate-600">
                  <span className="font-extrabold flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                    <span>Progression & Disciplinary Feed ({deactivationEvents.length})</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Fuzzy Tracking Feed</span>
                </div>

                {deactivationEvents.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl py-12 flex flex-col items-center justify-center text-slate-400 gap-1.5">
                    <AlertCircle className="h-6 w-6 text-slate-300" />
                    <p className="text-xs font-mono">No matching records found with deactivation remarks</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                    {deactivationEvents.map((evt, idx) => (
                      <div 
                        key={evt.id} 
                        className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-3.5 shadow-sm transition-all flex items-start gap-3 relative overflow-hidden"
                      >
                        {/* Event highlight left bar */}
                        <div className={`absolute top-0 bottom-0 left-0 w-1 ${
                          evt.eventType === 'Banned' ? 'bg-rose-500' : 'bg-amber-500'
                        }`} />

                        <div className="flex-grow space-y-1 pl-1">
                          <div className="flex items-center justify-between gap-2.5 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-800 text-xs">{evt.assessorName}</span>
                              <span className="text-[9px] font-mono text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded">ID: {evt.assessorId}</span>
                            </div>
                            
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                evt.eventType === 'Banned' 
                                  ? 'bg-rose-50 border border-rose-100 text-rose-700' 
                                  : 'bg-amber-50 border border-amber-100 text-amber-700'
                              }`}>
                                {evt.eventType}
                              </span>
                              
                              <span className="text-[10px] text-slate-600 font-bold flex items-center gap-1 whitespace-nowrap">
                                <Calendar className="h-3 w-3 inline text-slate-400" />
                                {evt.date}
                              </span>
                            </div>
                          </div>

                          <blockquote className="text-[11px] font-sans text-slate-600 bg-slate-50 border-s-2 border-slate-300 p-2 italic leading-relaxed mt-1 whitespace-pre-wrap">
                            "{evt.reason}"
                          </blockquote>

                          <div className="text-[9px] font-mono text-slate-400 flex items-center gap-1.5">
                            <span>Origin state:</span>
                            <span className="text-slate-600 font-bold uppercase">{evt.isHistoric ? 'Historic transition' : 'Current profile status'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Integration descriptor block */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-slate-500 font-semibold tracking-wide font-sans">
          Roster database analytics and metrics derived in real-time.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => {
              setFilterScheme('All');
              setFilterProgram('All');
              setFilterState('All');
              setFilterCity('All');
              setFilterMinAge(20);
              setFilterMaxAge(85);
              setFilterGender('All');
              setFilterJobRole('All');
            }}
            className="bg-white border text-slate-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-50 border-slate-200 shadow-sm transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      </div>

    </div>
  );
}
