/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Assessor, INDIAN_STATES, SchemeType, AssessorStatusType, DesignationType, JobRoleType, AssessorDocument } from '../types';
import { Search, Filter, Trash2, ChevronDown, ChevronUp, Download, Eye, Ban, UserCheck, AlertTriangle, Calendar, FileText, X, Edit, Plus, History, GraduationCap } from 'lucide-react';
import DocumentSection from './DocumentSection';
import CalendarPicker from './CalendarPicker';

interface DatabaseGridProps {
  assessors: Assessor[];
  onDeleteAssessor: (id: string) => void;
  onUpdateStatus: (id: string, status: AssessorStatusType, reason?: string, dateOfChange?: string) => void;
  onUpdateAssessor: (updated: Assessor) => void;
  isAdmin: boolean;
  presetFilters?: any;
  clearPresets: () => void;
  catalog: Record<SchemeType, string[]>;
  banReasons: string[];
  inactiveReasons: string[];
}

export default function DatabaseGrid({ 
  assessors, 
  onDeleteAssessor, 
  onUpdateStatus, 
  onUpdateAssessor,
  isAdmin, 
  presetFilters, 
  clearPresets,
  catalog,
  banReasons = [],
  inactiveReasons = []
}: DatabaseGridProps) {
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [schemeFilter, setSchemeFilter] = useState<string>('All');
  const [programFilter, setProgramFilter] = useState<string>('All');
  const [stateFilter, setStateFilter] = useState<string>('All');
  const [capacityFilter, setCapacityFilter] = useState<string>('All');
  const [cityFilter, setCityFilter] = useState<string>('All');
  const [minAgeFilter, setMinAgeFilter] = useState<number>(20);
  const [maxAgeFilter, setMaxAgeFilter] = useState<number>(85);
  const [genderFilter, setGenderFilter] = useState<string>('All');
  const [jobRoleFilter, setJobRoleFilter] = useState<string>('All');

  // Multi-Sort States
  const [sortBy, setSortBy] = useState<'sNo' | 'name' | 'assessorId' | 'empaneledYear' | 'age'>('sNo');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Expanded Rows State
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({});

  // Inline deletion confirmation state tracker (bypasses window.confirm in iframe)
  const [deleteConfId, setDeleteConfId] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Individual Assessor Editing State
  const [editingAssessor, setEditingAssessor] = useState<Assessor | null>(null);
  const [editForm, setEditForm] = useState<Assessor | null>(null);
  // States for adding associations in edit mode
  const [editSelScheme, setEditSelScheme] = useState<SchemeType>('Accreditation');
  const [editSelProgram, setEditSelProgram] = useState<string>('');
  const [editSelCapacity, setEditSelCapacity] = useState<'Principal Assessor' | 'Assessor' | 'Co-Assessor' | 'Committee Member'>('Assessor');
  const [editSelEffectiveDate, setEditSelEffectiveDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [editSelProgressRemarks, setEditSelProgressRemarks] = useState<string>('');
  // States for adding courses in edit mode
  const [editCourseName, setEditCourseName] = useState<string>('');
  const [editCourseDate, setEditCourseDate] = useState<string>('');

  // Admin status transition reason state modal
  const [statusChangeModal, setStatusChangeModal] = useState<{
    show: boolean;
    assessorId: string;
    newStatus: AssessorStatusType;
    selectedReason: string;
    remarks: string;
    dateOfChange: string;
  }>({
    show: false,
    assessorId: '',
    newStatus: 'Active',
    selectedReason: '',
    remarks: '',
    dateOfChange: new Date().toISOString().split('T')[0]
  });

  // Handle Preset Filters passed from Dashboard counts clicks
  useEffect(() => {
    if (presetFilters) {
      // Reset all other filters first to avoid overlapping filter constraints
      setSearchTerm('');
      setStatusFilter('All');
      setSchemeFilter('All');
      setProgramFilter('All');
      setStateFilter('All');
      setCapacityFilter('All');
      setCityFilter('All');
      setMinAgeFilter(20);
      setMaxAgeFilter(85);
      setGenderFilter('All');
      setJobRoleFilter('All');

      // Map incoming dashboard filters directly into active state configurations
      if (presetFilters.scheme) setSchemeFilter(presetFilters.scheme);
      if (presetFilters.program) setProgramFilter(presetFilters.program);
      if (presetFilters.status) setStatusFilter(presetFilters.status);
      if (presetFilters.state) setStateFilter(presetFilters.state);
      if (presetFilters.city) setCityFilter(presetFilters.city);
      if (presetFilters.gender) setGenderFilter(presetFilters.gender);
      if (presetFilters.jobRole) setJobRoleFilter(presetFilters.jobRole);
      
      if (presetFilters.specialization) {
        setSearchTerm(presetFilters.specialization);
      }
      if (presetFilters.empaneledYear) {
        setSearchTerm(String(presetFilters.empaneledYear));
      }
      if (presetFilters.searchTerm) {
        setSearchTerm(presetFilters.searchTerm);
      }
      if (presetFilters.designation) {
        setSearchTerm(presetFilters.designation);
      }

      if (presetFilters.ageMin !== undefined) setMinAgeFilter(presetFilters.ageMin);
      if (presetFilters.ageMax !== undefined) setMaxAgeFilter(presetFilters.ageMax);

      setCurrentPage(1);
    }
  }, [presetFilters]);

  // Clean filters helper
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setSchemeFilter('All');
    setProgramFilter('All');
    setStateFilter('All');
    setCapacityFilter('All');
    setCityFilter('All');
    setMinAgeFilter(20);
    setMaxAgeFilter(85);
    setGenderFilter('All');
    setJobRoleFilter('All');
    clearPresets();
    setCurrentPage(1);
  };

  const programsDropdownList = useMemo(() => {
    if (schemeFilter !== 'All') {
      return Array.from(new Set(catalog[schemeFilter as SchemeType] || []));
    }
    return Array.from(new Set(Object.values(catalog).flat()));
  }, [schemeFilter, catalog]);

  // Derived unique lists for dynamic dropdown selection in accordance with selected state
  const citiesDropdownList = useMemo(() => {
    const filteredByState = stateFilter === 'All'
      ? assessors
      : assessors.filter(a => a.state === stateFilter);
    const setOfCities = new Set(filteredByState.map(a => a.city).filter(Boolean));
    return Array.from(setOfCities).sort();
  }, [assessors, stateFilter]);

  const jobRolesDropdownList = useMemo(() => {
    const setOfRoles = new Set(assessors.map(a => a.jobRole || 'Clinician').filter(Boolean));
    return Array.from(setOfRoles).sort();
  }, [assessors]);

  // Apply sequential mapping logic and perform filtering
  const filteredAssessors = useMemo(() => {
    return assessors.filter(a => {
      // 1. Text Search Filter (ID, Name, Designation, Email, City State, Certificate)
      const matchesSearch = searchTerm.trim() === '' || 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.assessorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.certificateNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.contactNumber.includes(searchTerm) ||
        a.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.qualification.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.specialization && a.specialization.toLowerCase().includes(searchTerm.toLowerCase()));

      // 2. Status Filter
      const matchesStatus = statusFilter === 'All' || a.status === statusFilter;

      // 3. Scheme Filter
      const matchesScheme = schemeFilter === 'All' || 
        a.programs.some(p => p.scheme === schemeFilter);

      // 4. Program Filter
      const matchesProgram = programFilter === 'All' || 
        a.programs.some(p => p.program === programFilter);

      // 5. State Filter
      const matchesState = stateFilter === 'All' || a.state === stateFilter;

      // 6. Capacity Filter
      const matchesCapacity = capacityFilter === 'All' || 
        a.programs.some(p => p.capacity === capacityFilter);

      // 7. City Filter
      const matchesCity = cityFilter === 'All' || a.city === cityFilter;

      // 8. Age Range Filter
      const matchesAgeRange = a.age >= minAgeFilter && a.age <= maxAgeFilter;

      // 9. Gender Filter
      const matchesGender = genderFilter === 'All' || a.gender === genderFilter;

      // 10. Job Role Filter
      const matchesJobRole = jobRoleFilter === 'All' || (a.jobRole || 'Clinician') === jobRoleFilter;

      return matchesSearch && matchesStatus && matchesScheme && matchesProgram && matchesState && matchesCapacity && matchesCity && matchesAgeRange && matchesGender && matchesJobRole;
    });
  }, [assessors, searchTerm, statusFilter, schemeFilter, programFilter, stateFilter, capacityFilter, cityFilter, minAgeFilter, maxAgeFilter, genderFilter, jobRoleFilter]);

  // Sort the resulting dataset
  const sortedAssessors = useMemo(() => {
    const sorted = [...filteredAssessors];
    sorted.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredAssessors, sortBy, sortOrder]);

  // Compute pagination rows
  const paginatedAssessors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAssessors.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAssessors, currentPage]);

  const totalPages = Math.ceil(sortedAssessors.length / itemsPerPage) || 1;

  // Keep pagination in bounds when filter changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [sortedAssessors, totalPages, currentPage]);

  const toggleRowExpanded = (id: string) => {
    setExpandedRowIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSortAndToggle = (field: 'sNo' | 'name' | 'assessorId' | 'empaneledYear' | 'age') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // CSV Exporter
  const handleExportToCsv = () => {
    let headers = [
      "SNo", "Assessor ID", "Certificate No", "Name", "Email", "Contact Number",
      "City", "State", "Pincode", "DOB", "Designation", "Age", "Gender",
      "Official Address", "Residential Address", "Qualification", "Specialization", "Date of Empanelment", "Year of Empanelment",
      "Status", "Reason for Ban/Inactive", "Programs Mapped", "Courses Attended"
    ];

    let csvContent = "";
    csvContent += headers.join(",") + "\n";

    filteredAssessors.forEach(a => {
      const programsStr = a.programs.map(p => `${p.scheme}: ${p.program} (${p.capacity})`).join(" | ");
      const coursesStr = a.courses.map(c => `${c.courseName} (${c.date})`).join(" | ");

      const row = [
        a.sNo,
        `"${a.assessorId}"`,
        `"${a.certificateNo}"`,
        `"${a.name.replace(/"/g, '""')}"`,
        `"${a.email}"`,
        `"${a.contactNumber}"`,
        `"${a.city}"`,
        `"${a.state}"`,
        `"${a.pincode}"`,
        `"${a.dob}"`,
        `"${a.designation.replace(/"/g, '""')}"`,
        a.age,
        a.gender,
        `"${a.officialAddress.replace(/"/g, '""')}"`,
        `"${a.residentialAddress.replace(/"/g, '""')}"`,
        `"${a.qualification.replace(/"/g, '""')}"`,
        `"${(a.specialization || '').replace(/"/g, '""')}"`,
        `"${a.dateOfEmpanelment || ''}"`,
        a.empaneledYear,
        a.status,
        `"${(a.banReason || '').replace(/"/g, '""')}"`,
        `"${programsStr.replace(/"/g, '""')}"`,
        `"${coursesStr.replace(/"/g, '""')}"`
      ];

      csvContent += row.join(",") + "\n";
    });

    // Create blobs and trigger click
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `NABH_Assessor_Registry_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStatusDropdownChange = (assessorId: string, currentStatus: string, selectedStatus: AssessorStatusType) => {
    if (selectedStatus === 'Active') {
      onUpdateStatus(assessorId, 'Active');
    } else {
      // Need reason for ban or inactivity/expiry, open reason modal dialog
      const standardReasons = selectedStatus === 'Banned' ? banReasons : inactiveReasons;
      const initialReason = standardReasons && standardReasons.length > 0 ? standardReasons[0] : '';
      setStatusChangeModal({
        show: true,
        assessorId: assessorId,
        newStatus: selectedStatus,
        selectedReason: initialReason,
        remarks: '',
        dateOfChange: new Date().toISOString().split('T')[0]
      });
    }
  };

  const submitStatusChangeWithReason = (e: React.FormEvent) => {
    e.preventDefault();
    const { assessorId, newStatus, selectedReason, remarks, dateOfChange } = statusChangeModal;
    
    // Combine standard reason from dropdown and remarks
    const combinedReason = selectedReason + (remarks.trim() ? ': ' + remarks.trim() : '');
    
    if (!combinedReason.trim()) return;

    onUpdateStatus(assessorId, newStatus, combinedReason.trim(), dateOfChange);
    setStatusChangeModal({
      show: false,
      assessorId: '',
      newStatus: 'Active',
      selectedReason: '',
      remarks: '',
      dateOfChange: new Date().toISOString().split('T')[0]
    });
  };

  // Auto-set the selected program option when scheme selection changes during Edit Mode
  useEffect(() => {
    if (editingAssessor && catalog[editSelScheme] && catalog[editSelScheme].length > 0) {
      if (!catalog[editSelScheme].includes(editSelProgram)) {
        setEditSelProgram(catalog[editSelScheme][0]);
      }
    }
  }, [editSelScheme, catalog, editingAssessor, editSelProgram]);

  const handleOpenEditModal = (a: Assessor) => {
    setEditingAssessor(a);
    setEditForm({
      ...a,
      programs: a.programs ? [...a.programs] : [],
      courses: a.courses ? [...a.courses] : [],
      roleProgression: a.roleProgression ? [...a.roleProgression] : [],
      biographyDocs: a.biographyDocs ? [...a.biographyDocs] : [],
      otherDocs: a.otherDocs ? [...a.otherDocs] : []
    });
    setEditSelScheme('Accreditation');
    if (catalog['Accreditation'] && catalog['Accreditation'].length > 0) {
      setEditSelProgram(catalog['Accreditation'][0]);
    }
    setEditSelEffectiveDate(new Date().toISOString().slice(0, 10));
    setEditSelProgressRemarks('');
  };

  const handleSaveAssessorEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    onUpdateAssessor(editForm);
    setEditingAssessor(null);
    setEditForm(null);
  };

  const handleEditAddProgram = () => {
    if (!editForm || !editSelProgram) return;
    
    const existingIndex = editForm.programs.findIndex(
      p => p.scheme === editSelScheme && p.program === editSelProgram
    );

    let updatedPrograms = [...editForm.programs];
    let roleFrom = "None (Newly Mapped)";
    const remarksToUse = editSelProgressRemarks.trim();

    if (existingIndex !== -1) {
      // Program already mapped, let's see if the capacity is actually different
      const oldAssoc = editForm.programs[existingIndex];
      if (oldAssoc.capacity === editSelCapacity) {
        return; // Nothing to do, perfect match
      }
      // Capacity is different - this is a role progression!
      roleFrom = oldAssoc.capacity;
      updatedPrograms[existingIndex] = {
        ...oldAssoc,
        capacity: editSelCapacity
      };
    } else {
      // Brand new association
      updatedPrograms.push({
        scheme: editSelScheme,
        program: editSelProgram,
        capacity: editSelCapacity
      });
    }

    // Append to progression history log
    const nextLogId = `RP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newProgressionLog = {
      id: nextLogId,
      scheme: editSelScheme,
      program: editSelProgram,
      roleFrom: roleFrom,
      roleTo: editSelCapacity,
      effectiveDate: editSelEffectiveDate || new Date().toISOString().slice(0, 10),
      remarks: remarksToUse || (existingIndex !== -1 
        ? `Upgraded from ${roleFrom} to ${editSelCapacity}` 
        : `Empaneled as ${editSelCapacity}`),
      timestamp: new Date().toISOString()
    };

    setEditForm({
      ...editForm,
      programs: updatedPrograms,
      roleProgression: [...(editForm.roleProgression || []), newProgressionLog]
    });

    // Reset remarks input
    setEditSelProgressRemarks('');
  };

  const handleEditRemoveProgram = (index: number) => {
    if (!editForm) return;
    const updatedPrograms = editForm.programs.filter((_, idx) => idx !== index);
    setEditForm({
      ...editForm,
      programs: updatedPrograms
    });
  };

  const handleEditAddCourse = () => {
    if (!editForm || !editCourseName.trim()) return;
    const dateToUse = editCourseDate || new Date().toISOString().slice(0, 10);
    const updatedCourses = [
      ...editForm.courses,
      { courseName: editCourseName.trim(), date: dateToUse }
    ];
    setEditForm({
      ...editForm,
      courses: updatedCourses
    });
    setEditCourseName('');
    setEditCourseDate('');
  };

  const handleEditRemoveCourse = (index: number) => {
    if (!editForm) return;
    const updatedCourses = editForm.courses.filter((_, idx) => idx !== index);
    setEditForm({
      ...editForm,
      courses: updatedCourses
    });
  };

  const handleDocUploadBio = (assessor: Assessor, doc: AssessorDocument) => {
    const bios = assessor.biographyDocs ? [...assessor.biographyDocs, doc] : [doc];
    onUpdateAssessor({ ...assessor, biographyDocs: bios });
  };

  const handleDocDeleteBio = (assessor: Assessor, id: string) => {
    const bios = (assessor.biographyDocs || []).filter(d => d.id !== id);
    onUpdateAssessor({ ...assessor, biographyDocs: bios });
  };

  const handleDocUploadOther = (assessor: Assessor, doc: AssessorDocument) => {
    const others = assessor.otherDocs ? [...assessor.otherDocs, doc] : [doc];
    onUpdateAssessor({ ...assessor, otherDocs: others });
  };

  const handleDocDeleteOther = (assessor: Assessor, id: string) => {
    const others = (assessor.otherDocs || []).filter(d => d.id !== id);
    onUpdateAssessor({ ...assessor, otherDocs: others });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 text-slate-900">
      
      {/* Search and Filters Bento Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3.5">
        
        {/* Top line: Search and Export */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, specialization, qualification, city, state, or certificate..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs rounded-lg pl-9 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              id="btn-export-csv"
              onClick={handleExportToCsv}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg font-sans text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV Directory</span>
            </button>
            
            <button
              onClick={handleResetFilters}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg font-sans text-xs font-semibold transition-all border border-slate-200"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Divider line */}
        <div className="h-[1px] bg-slate-150 w-full"></div>

        {/* Expanded Filters grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          
          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">Duty Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-sans text-xs rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">🟢 Active Duty</option>
              <option value="Inactive">🟡 Inactive</option>
              <option value="Banned">🔴 Banned</option>
            </select>
          </div>

          {/* Scheme Filter */}
          <div className="space-y-1">
            <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">Classification</label>
            <select
              value={schemeFilter}
              onChange={(e) => { 
                setSchemeFilter(e.target.value); 
                setProgramFilter('All'); // Clear child program selection
                setCurrentPage(1); 
              }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-sans text-xs rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All">All Classifications</option>
              <option value="Accreditation">Accreditation</option>
              <option value="Certification">Certification</option>
              <option value="Empanelment">Empanelment</option>
            </select>
          </div>

          {/* Program Filter */}
          <div className="space-y-1">
            <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">NABH Program</label>
            <select
              value={programFilter}
              onChange={(e) => { setProgramFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-sans text-xs rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All">All Programs ({programsDropdownList.length})</option>
              {programsDropdownList.map((prog) => (
                <option key={prog} value={prog}>
                  {prog}
                </option>
              ))}
            </select>
          </div>

          {/* Region / State Filter */}
          <div className="space-y-1">
            <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">Region / State</label>
            <select
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setCityFilter('All');
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-sans text-xs rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All">All States ({INDIAN_STATES.length})</option>
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Capacity Capacity Filter */}
          <div className="space-y-1 text-slate-700">
            <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">Duty Capacity</label>
            <select
              value={capacityFilter}
              onChange={(e) => { setCapacityFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-sans text-xs rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All">All Capacities</option>
              <option value="Principal Assessor">Principal Assessor</option>
              <option value="Assessor">Assessor</option>
              <option value="Co-Assessor">Co-Assessor</option>
              <option value="Committee Member">Committee Member</option>
            </select>
          </div>

          {/* City Filter */}
          <div className="space-y-1">
            <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">Local City</label>
            <select
              value={cityFilter}
              onChange={(e) => { setCityFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-sans text-xs rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All">All Cities ({citiesDropdownList.length})</option>
              {citiesDropdownList.map((ct) => (
                <option key={ct} value={ct}>
                  {ct}
                </option>
              ))}
            </select>
          </div>

          {/* Age Cohort Filter Slider */}
          <div className="space-y-1 bg-slate-50 border border-slate-200 rounded-lg p-2 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-0.5">
              <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">Age Cohort</label>
              <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 px-1 py-0.2 rounded shrink-0">
                {minAgeFilter} - {maxAgeFilter} Yrs
              </span>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-[9px] text-slate-500">
                <span className="w-4 shrink-0 font-mono">Min:</span>
                <input
                  type="range"
                  min="20"
                  max="85"
                  value={minAgeFilter}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMinAgeFilter(val);
                    if (val > maxAgeFilter) setMaxAgeFilter(val);
                    setCurrentPage(1);
                  }}
                  className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                />
              </div>
              <div className="flex items-center space-x-1.5 text-[9px] text-slate-500">
                <span className="w-4 shrink-0 font-mono">Max:</span>
                <input
                  type="range"
                  min="20"
                  max="85"
                  value={maxAgeFilter}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMaxAgeFilter(val);
                    if (val < minAgeFilter) setMinAgeFilter(val);
                    setCurrentPage(1);
                  }}
                  className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Gender Filter */}
          <div className="space-y-1">
            <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">Gender Identity</label>
            <select
              value={genderFilter}
              onChange={(e) => { setGenderFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-sans text-xs rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Job Role Filter */}
          <div className="space-y-1">
            <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">Domain Job Role</label>
            <select
              value={jobRoleFilter}
              onChange={(e) => { setJobRoleFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-sans text-xs rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All">All Job Roles ({jobRolesDropdownList.length})</option>
              {jobRolesDropdownList.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Dynamic Filter Applied Tags Summary */}
        {(statusFilter !== 'All' || schemeFilter !== 'All' || programFilter !== 'All' || stateFilter !== 'All' || capacityFilter !== 'All' || cityFilter !== 'All' || minAgeFilter > 20 || maxAgeFilter < 85 || genderFilter !== 'All' || jobRoleFilter !== 'All' || searchTerm.trim() !== '') && (
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 font-bold">Active Criteria:</span>
            {statusFilter !== 'All' && <span className="bg-white border border-slate-200 text-[10px] px-2 py-0.5 rounded text-slate-700 flex items-center gap-1">Status: {statusFilter}</span>}
            {schemeFilter !== 'All' && <span className="bg-white border border-slate-200 text-[10px] px-2 py-0.5 rounded text-slate-700 flex items-center gap-1">Scheme: {schemeFilter}</span>}
            {programFilter !== 'All' && <span className="bg-white border border-slate-200 text-[10px] px-2 py-0.5 rounded text-slate-700 flex items-center gap-1">Program: {programFilter}</span>}
            {stateFilter !== 'All' && <span className="bg-white border border-slate-200 text-[10px] px-2 py-0.5 rounded text-slate-700 flex items-center gap-1">State: {stateFilter}</span>}
            {capacityFilter !== 'All' && <span className="bg-white border border-slate-200 text-[10px] px-2 py-0.5 rounded text-slate-700 flex items-center gap-1">Capacity: {capacityFilter}</span>}
            {cityFilter !== 'All' && <span className="bg-white border border-slate-200 text-[10px] px-2 py-0.5 rounded text-slate-700 flex items-center gap-1">City: {cityFilter}</span>}
            {(minAgeFilter > 20 || maxAgeFilter < 85) && <span className="bg-white border border-slate-200 text-[10px] px-2 py-0.5 rounded text-slate-700 flex items-center gap-1">Age Span: {minAgeFilter}-{maxAgeFilter} Yrs</span>}
            {genderFilter !== 'All' && <span className="bg-white border border-slate-200 text-[10px] px-2 py-0.5 rounded text-slate-700 flex items-center gap-1">Gender: {genderFilter}</span>}
            {jobRoleFilter !== 'All' && <span className="bg-white border border-slate-200 text-[10px] px-2 py-0.5 rounded text-slate-700 flex items-center gap-1">Job Role: {jobRoleFilter}</span>}
            {searchTerm.trim() !== '' && <span className="bg-white border border-slate-200 text-[10px] px-2 py-0.5 rounded text-slate-700 flex items-center gap-1">Search Keyword: "{searchTerm}"</span>}
          </div>
        )}

      </div>

      {/* Roster Listing Grid Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left border-collapse table-auto">
            
            {/* Table Header Row */}
            <thead className="bg-slate-50 font-mono text-slate-500 text-[10px] uppercase tracking-wider select-none font-bold border-b border-slate-200">
              <tr>
                <th 
                  onClick={() => handleSortAndToggle('sNo')}
                  className="px-4 py-3.5 cursor-pointer hover:text-slate-900 transition-colors text-center w-16"
                >
                  <div className="inline-flex items-center justify-center space-x-1">
                    <span>S.No</span>
                    {sortBy === 'sNo' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3 text-blue-600" /> : <ChevronDown className="h-3 w-3 text-blue-600" />)}
                  </div>
                </th>
                <th 
                  onClick={() => handleSortAndToggle('assessorId')}
                  className="px-4 py-3.5 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="inline-flex items-center space-x-1">
                    <span>Assessor ID</span>
                    {sortBy === 'assessorId' && (sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-blue-600" /> : <ChevronDown className="h-3.5 w-3.5 text-blue-600" />)}
                  </div>
                </th>
                <th 
                  onClick={() => handleSortAndToggle('name')}
                  className="px-4 py-3.5 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="inline-flex items-center space-x-1">
                    <span>Assessor Name</span>
                    {sortBy === 'name' && (sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-blue-600" /> : <ChevronDown className="h-3.5 w-3.5 text-blue-600" />)}
                  </div>
                </th>
                <th className="px-4 py-3.5 hidden md:table-cell">Region & Designation</th>
                <th className="px-4 py-3.5">Scheme Program Links</th>
                <th className="px-4 py-3.5 text-center w-36">Roster Status</th>
                <th className="px-4 py-3.5 text-center w-28">Actions</th>
              </tr>
            </thead>

            {/* Table Corpus Body */}
            <tbody className="divide-y divide-slate-150 font-sans text-xs text-slate-650 text-slate-700">
              {paginatedAssessors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-mono">
                    ⚠️ No assessor matches the entered search parameters or filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedAssessors.map((a, index) => {
                  const isExpanded = !!expandedRowIds[a.assessorId];
                  
                  // Status Color Classes
                  const badgeStyles = {
                    Active: 'bg-emerald-50 text-emerald-700 border-emerald-250 border-emerald-200',
                    Inactive: 'bg-amber-55 bg-amber-50 text-amber-705 text-amber-700 border-amber-200',
                    Banned: 'bg-rose-50 text-rose-700 border-rose-200',
                    Expired: 'bg-slate-100 text-slate-500 border-slate-200'
                  };

                  return (
                    <React.Fragment key={`${a.assessorId}-${index}`}>
                      <tr 
                        className={`hover:bg-slate-50/80 transition-colors ${isExpanded ? 'bg-slate-50/50' : ''}`}
                      >
                        {/* Serial No */}
                        <td className="px-4 py-3.5 text-center text-slate-400 font-mono">
                          {a.sNo}
                        </td>

                        {/* ID & Certificate */}
                        <td className="px-4 py-3.5 font-mono text-slate-800">
                          <div className="font-bold">{a.assessorId}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{a.certificateNo}</div>
                          <div className="text-[9px] text-blue-700 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 inline-block font-bold mt-1 uppercase tracking-wider" title={a.dateOfEmpanelment ? `Empaneled on ${a.dateOfEmpanelment}` : undefined}>
                            Since {a.empaneledYear}{a.dateOfEmpanelment ? ` (${a.dateOfEmpanelment})` : ''}
                          </div>
                        </td>

                        {/* Name and Designation */}
                        <td className="px-4 py-3.5 text-slate-900">
                          <div className="text-sm font-extrabold text-slate-850">{a.name}</div>
                          <div className="text-[10px] text-slate-500 italic block mt-0.5 font-medium">
                            {a.qualification}
                            {a.specialization && (
                              <span className="text-amber-700 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 ml-1.5 font-normal italic font-sans inline-block">
                                Spec: {a.specialization}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] text-slate-600 font-mono bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-semibold">
                              Age: {a.age} • {a.gender}
                            </span>
                          </div>
                        </td>

                        {/* Region location details */}
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <div className="font-extrabold text-slate-800">{a.city}, {a.state}</div>
                          <div className="text-[11px] font-mono text-slate-600 mt-0.5 font-semibold">
                            +91 {a.contactNumber}
                          </div>
                          <div className="text-[10px] text-blue-600 hover:underline truncate max-w-[180px] block" title={a.email}>
                            {a.email}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium block mt-1">
                            {a.designation} &bull; <span className="bg-amber-50 text-amber-800 border border-amber-200/60 px-1 py-0.5 rounded font-mono text-[9px] font-bold">{a.jobRole || 'Clinician'}</span>
                          </div>
                        </td>

                        {/* Mapped Schemes & Programs Block */}
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1 max-w-sm">
                            {a.programs.map((p, pIndex) => (
                              <span 
                                key={pIndex} 
                                className="bg-slate-50 text-slate-700 text-[10px] px-2 py-0.5 rounded border border-slate-200 flex flex-col font-medium"
                              >
                                <span>{p.program}</span>
                                <span className="text-[9px] text-blue-600 font-bold font-mono uppercase">{p.scheme} • {p.capacity}</span>
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Status dropdown or tag */}
                        <td className="px-4 py-3.5 text-center">
                          {isAdmin ? (
                            <select
                              value={a.status}
                              onChange={(e) => handleStatusDropdownChange(a.assessorId, a.status, e.target.value as any)}
                              className={`text-[11px] rounded-lg font-mono font-bold px-2.5 py-1 select-none border focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${badgeStyles[a.status]}`}
                            >
                              <option value="Active">Operational (Active)</option>
                              <option value="Inactive">On Hold (Inactive)</option>
                              <option value="Banned">Revoked (Banned)</option>
                              <option value="Expired">Deceased (Expired)</option>
                            </select>
                          ) : (
                            <span className={`inline-block text-[10px] uppercase font-mono tracking-wider font-bold border px-2.5 py-0.5 rounded-full ${badgeStyles[a.status]}`}>
                              {a.status === 'Active' ? '🟢 Active' : a.status === 'Inactive' ? '🟡 Inactive' : a.status === 'Banned' ? '🔴 Banned' : '⚪ Expired'}
                            </span>
                          )}
                        </td>

                        {/* Custom Roster Actions Row column */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="inline-flex items-center space-x-1">
                            <button
                              id={`btn-expand-${a.assessorId}`}
                              onClick={() => toggleRowExpanded(a.assessorId)}
                              className="p-1 px-2 rounded hover:bg-slate-100 hover:text-blue-600 text-slate-400 transition-colors"
                              title="Expand core profile records"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4 text-blue-600" /> : <ChevronDown className="h-4 w-4" />}
                            </button>

                            <button
                              id={`btn-edit-${a.assessorId}`}
                              onClick={() => handleOpenEditModal(a)}
                              className="p-1 px-2 rounded hover:bg-slate-100 hover:text-amber-500 text-slate-400 transition-colors cursor-pointer"
                              title="Edit individual assessor profile details"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            {isAdmin && (
                              deleteConfId === a.assessorId ? (
                                <div className="flex items-center space-x-1 animate-in fade-in duration-200">
                                  <button
                                    onClick={() => {
                                      onDeleteAssessor(a.assessorId);
                                      setDeleteConfId(null);
                                    }}
                                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] px-2 py-1 rounded shadow-sm cursor-pointer"
                                    title="Confirm deletion"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfId(null)}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] px-2 py-1 rounded cursor-pointer font-semibold"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  id={`btn-delete-${a.assessorId}`}
                                  onClick={() => setDeleteConfId(a.assessorId)}
                                  className="p-1 px-1.5 rounded hover:bg-rose-50 hover:text-rose-700 text-slate-400 transition-colors cursor-pointer"
                                  title="Delete Assessor records from disk"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Sliding Nested Detail Record with White Theme Styling */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={7} className="px-6 py-4 border-l-2 border-blue-600">
                            
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-1.5">
                              
                              {/* Left Columns Profile Fields (7 Cols) */}
                              <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-slate-800">
                                
                                <div>
                                  <span className="text-[9px] font-mono text-slate-400 block font-bold uppercase tracking-wider">Official Registration</span>
                                  <div className="mt-1 flex flex-col space-y-0.5">
                                    <span className="text-xs text-slate-600">Year empaneled: <strong className="text-slate-900">{a.empaneledYear}</strong></span>
                                    {a.dateOfEmpanelment && <span className="text-xs text-slate-600">Empanelment Date: <strong className="text-indigo-600">{a.dateOfEmpanelment}</strong></span>}
                                    <span className="text-xs text-slate-600">Age / Gender: <strong className="text-slate-900">{a.age} ({a.gender})</strong></span>
                                    <span className="text-xs text-slate-600">DOB: <strong className="text-slate-900">{a.dob}</strong></span>
                                  </div>
                                </div>

                                <div>
                                  <span className="text-[9px] font-mono text-slate-400 block font-bold uppercase tracking-wider">Contact Coordinates</span>
                                  <div className="mt-1 flex flex-col space-y-0.5">
                                    <span className="text-xs text-blue-600 font-bold">{a.email}</span>
                                    <span className="text-xs text-slate-600 font-mono">+91 {a.contactNumber}</span>
                                    <span className="text-xs text-slate-500">Pincode: {a.pincode}</span>
                                  </div>
                                </div>

                                <div>
                                  <span className="text-[9px] font-mono text-slate-400 block font-bold uppercase tracking-wider">Academic Qualification</span>
                                  <div className="mt-1">
                                    <span className="text-xs text-slate-700 leading-normal font-sans block font-semibold">{a.qualification}</span>
                                    {a.specialization && <span className="text-xs text-amber-700 font-sans block font-semibold mt-0.5">Spec: {a.specialization}</span>}
                                    <span className="text-[9px] text-blue-600 uppercase font-mono tracking-widest block mt-0.5">{a.designation}</span>
                                  </div>
                                </div>

                                <div className="sm:col-span-2">
                                  <span className="text-[9px] font-mono text-slate-400 block font-bold uppercase tracking-wider">Official Address</span>
                                  <span className="text-xs text-slate-650 text-slate-600 leading-normal font-sans block mt-1">{a.officialAddress}</span>
                                </div>

                                <div className="sm:col-span-1 lg:col-span-1">
                                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block font-bold">Residential Location</span>
                                  <span className="text-xs text-slate-400 leading-normal font-sans block mt-1">{a.residentialAddress}</span>
                                </div>

                              </div>

                              {/* Right Columns Courses (4 Cols) */}
                              <div className="md:col-span-4 border-l border-slate-200 pl-6 space-y-4">
                                
                                <div className="space-y-2">
                                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block font-bold flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-blue-600" />
                                    <span>Completed Courses & Workshops</span>
                                  </span>
                                  
                                  {a.courses.length === 0 ? (
                                    <p className="text-xs text-slate-500 italic block">No reported training orientations found.</p>
                                  ) : (
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                      {a.courses.map((c, cIndex) => (
                                        <div key={cIndex} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                          <div className="text-xs font-bold text-slate-800">{c.courseName}</div>
                                          <div className="text-[10px] font-mono text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            <span>Date Completed: <strong className="text-slate-700">{c.date}</strong></span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Banned Status Reasons displays */}
                                {(a.status === 'Inactive' || a.status === 'Banned') && (
                                  <div className={`p-3 rounded border leading-relaxed text-xs space-y-1 ${
                                    a.status === 'Banned' 
                                      ? 'bg-rose-950/20 border-rose-900/40 text-rose-300' 
                                      : 'bg-amber-950/20 border-amber-900/40 text-amber-300'
                                  }`}>
                                    <div className="font-mono uppercase tracking-widest text-[9px] font-bold flex items-center gap-1">
                                      <AlertTriangle className="h-3.5 w-3.5" />
                                      <span>Ethics/Status Board Remarks</span>
                                    </div>
                                    <p className="font-sans leading-normal">{a.banReason || 'No documentation specified.'}</p>
                                  </div>
                                )}

                              </div>

                              {/* Status Life Transition Logs Timeline */}
                              <div className="col-span-1 md:col-span-12 mt-6 pt-5 border-t border-slate-200">
                                <h4 className="text-[11px] font-mono font-bold text-slate-700 uppercase tracking-widest mb-3 flex items-center gap-1.5 animate-in fade-in">
                                  <History className="h-4 w-4 text-slate-500 animate-spin-slow" />
                                  <span>Historical Status Transition Logs & Timeline Logs</span>
                                </h4>
                                
                                {(!a.statusLogs || a.statusLogs.length === 0) ? (
                                  <div className="bg-slate-50 border border-slate-200 text-slate-500 text-xs p-3.5 rounded-lg font-mono">
                                    No logged life transition logs for this assessor. Changes made to active status will be recorded automatically with remarks.
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {a.statusLogs.map((log) => {
                                      const logDate = log.dateOfChange ? new Date(log.dateOfChange).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      }) : log.timestamp ? new Date(log.timestamp).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      }) : 'N/A';
                                      
                                      const statusColors: Record<string, string> = {
                                        Active: 'bg-emerald-50 text-emerald-700 border-emerald-250 border-emerald-200',
                                        Inactive: 'bg-amber-50 text-amber-700 border-amber-250 border-amber-200',
                                        Banned: 'bg-rose-50 text-rose-700 border-rose-200',
                                        Expired: 'bg-slate-100 text-slate-500 border-slate-205 border-slate-200'
                                      };

                                      return (
                                        <div key={log.id} className="bg-white border border-slate-205 border-slate-200 rounded-xl p-3.5 shadow-sm space-y-2.5 flex flex-col justify-between animate-in slide-in-from-bottom-2 duration-200">
                                          <div className="flex items-center justify-between gap-2.5">
                                            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                              Change Date: {logDate}
                                            </span>
                                            <div className="flex items-center gap-1 text-[10px] font-mono font-bold">
                                              <span className={`px-1.5 py-0.2 border rounded ${statusColors[log.statusFrom || 'Active']}`}>
                                                {log.statusFrom || 'Active'}
                                              </span>
                                              <span className="text-slate-400">&rarr;</span>
                                              <span className={`px-1.5 py-0.2 border rounded ${statusColors[log.statusTo]}`}>
                                                {log.statusTo}
                                              </span>
                                            </div>
                                          </div>
                                          
                                          <div className="text-xs text-slate-650 text-slate-600 bg-slate-50/60 p-2.5 rounded-lg border border-slate-100 font-medium">
                                            <span className="text-[9px] font-mono font-extrabold text-slate-400 block uppercase mb-1">Board Justification Remarks</span>
                                            {log.remarks}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Assessor Role Level Progression & Career Trail */}
                              <div className="col-span-1 md:col-span-12 mt-6 pt-5 border-t border-slate-200">
                                <h4 className="text-[11px] font-mono font-bold text-slate-700 uppercase tracking-widest mb-3 flex items-center gap-1.5 animate-in fade-in">
                                  <GraduationCap className="h-4 w-4 text-blue-600 animate-pulse" />
                                  <span>Assessor Role Level Progression & Promotion History Trail</span>
                                </h4>
                                
                                {(!a.roleProgression || a.roleProgression.length === 0) ? (
                                  <div className="bg-slate-50 border border-slate-200 text-slate-500 text-xs p-3.5 rounded-lg font-mono">
                                    No logged role progressions. Update this assessor's mapping tags or capacities using the Edit modal to generate progression entries automatically.
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {[...a.roleProgression]
                                      .sort((m1, m2) => new Date(m2.effectiveDate).getTime() - new Date(m1.effectiveDate).getTime())
                                      .map((prog) => {
                                        const effDateStr = prog.effectiveDate ? new Date(prog.effectiveDate).toLocaleDateString(undefined, {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric'
                                        }) : 'N/A';
                                        
                                        const capacityStyles: Record<string, string> = {
                                          'Principal Assessor': 'bg-blue-50 text-blue-700 border-blue-250 border-blue-200',
                                          'Assessor': 'bg-emerald-50 text-emerald-700 border-emerald-250 border-emerald-200',
                                          'Co-Assessor': 'bg-violet-50 text-violet-700 border-violet-200',
                                          'Committee Member': 'bg-slate-100 text-slate-650 border-slate-200 border-slate-250',
                                          'None (Newly Mapped)': 'bg-gray-50 text-slate-500 border-gray-200'
                                        };

                                        return (
                                          <div key={prog.id} className="bg-white border border-slate-205 border-slate-200 rounded-xl p-3.5 shadow-sm space-y-2 flex flex-col justify-between animate-in slide-in-from-bottom-2 duration-200">
                                            <div className="space-y-1.5">
                                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                                  Effective Date: {effDateStr}
                                                </span>
                                                <span className="text-[9px] font-mono font-extrabold text-[#2563eb] tracking-wide uppercase">
                                                  {prog.scheme}
                                                </span>
                                              </div>
                                              
                                              <div className="text-xs font-bold text-slate-800 leading-snug">
                                                {prog.program}
                                              </div>

                                              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold pt-1 flex-wrap">
                                                <span className={`px-1.5 py-0.5 border rounded ${capacityStyles[prog.roleFrom] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                  {prog.roleFrom}
                                                </span>
                                                <span className="text-slate-400">&rarr;</span>
                                                <span className={`px-1.5 py-0.5 border rounded ${capacityStyles[prog.roleTo] || 'bg-slate-100 text-slate-700 border-slate-250'}`}>
                                                  {prog.roleTo}
                                                </span>
                                              </div>
                                            </div>

                                            {prog.remarks && (
                                              <div className="text-[11px] text-slate-650 text-slate-600 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 font-sans mt-2 italic leading-relaxed">
                                                "{prog.remarks}"
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                  </div>
                                )}
                              </div>

                              {/* Document Chest Section */}
                              <div className="col-span-1 md:col-span-12 mt-6 pt-5 border-t border-slate-200">
                                <h4 className="text-[11px] font-mono font-bold text-slate-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                  <FileText className="h-4 w-4 text-slate-500" />
                                  <span>Assessor Document Chest</span>
                                </h4>
                                <DocumentSection
                                  biographyDocs={a.biographyDocs || []}
                                  otherDocs={a.otherDocs || []}
                                  onUploadBiography={(doc) => handleDocUploadBio(a, doc)}
                                  onDeleteBiography={(id) => handleDocDeleteBio(a, id)}
                                  onUploadOther={(doc) => handleDocUploadOther(a, doc)}
                                  onDeleteOther={(id) => handleDocDeleteOther(a, id)}
                                  readOnly={!isAdmin}
                                />
                              </div>

                            </div>

                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Unified Table Dashboard Pagination Footer */}
        <div className="bg-slate-950 px-4 py-3.5 border-t border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-xs">
          <div>
            Showing <strong className="text-slate-200">{filteredAssessors.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> to{' '}
            <strong className="text-slate-200">{Math.min(currentPage * itemsPerPage, filteredAssessors.length)}</strong> of{' '}
            <strong className="text-slate-200">{filteredAssessors.length}</strong> Matching Records{' '}
            {filteredAssessors.length < assessors.length && (
              <span className="text-[10px] text-amber-500 font-mono italic">(filtered from {assessors.length} total)</span>
            )}
          </div>

          <div className="inline-flex space-x-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-[11px] font-bold"
            >
              &larr; Prev
            </button>
            
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1.5 rounded border text-[11px] font-mono ${
                  currentPage === i + 1
                    ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-[11px] font-bold"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Admin Status Transition Reason Modal dialog */}
      {statusChangeModal.show && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className={`flex items-center space-x-2 ${statusChangeModal.newStatus === 'Banned' ? 'text-rose-500' : 'text-amber-500'}`}>
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-100">
                  {statusChangeModal.newStatus === 'Banned' ? 'Mark Assessor as Banned' : 'Mark Assessor as Inactive'}
                </h3>
              </div>
              <button
                onClick={() => setStatusChangeModal(prev => ({ ...prev, show: false }))}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-3 leading-relaxed font-medium">
              Transitioning Assessor ID <strong className="font-mono text-slate-200">{statusChangeModal.assessorId}</strong> to status: <strong className="underline text-amber-500 uppercase">{statusChangeModal.newStatus}</strong>.
            </p>

            <form onSubmit={submitStatusChangeWithReason} className="mt-4 space-y-4">
              {/* Dropdown for Reasons */}
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1 font-bold">
                  {statusChangeModal.newStatus === 'Banned' ? 'Reason for Ban' : 'Reason for Inactive Status'}
                </label>
                <select
                  required
                  value={statusChangeModal.selectedReason}
                  onChange={(e) => setStatusChangeModal(prev => ({ ...prev, selectedReason: e.target.value }))}
                  className="w-full bg-slate-850 border border-slate-755 text-slate-100 rounded-lg p-2.5 text-xs focus:outline-none focus:border-amber-500"
                >
                  {(statusChangeModal.newStatus === 'Banned' ? banReasons : inactiveReasons).map((reason, idx) => (
                    <option key={idx} value={reason} className="bg-slate-900 text-slate-100">
                      {reason}
                    </option>
                  ))}
                  {(statusChangeModal.newStatus === 'Banned' ? banReasons : inactiveReasons).length === 0 && (
                    <option value="General Disciplinary Action" className="bg-slate-900 text-slate-100">General Disciplinary Action</option>
                  )}
                </select>
              </div>

              {/* Date of Change */}
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1 font-bold">
                  {statusChangeModal.newStatus === 'Banned' ? 'Date of Banning' : 'Date of marking Inactive'}
                </label>
                <div className="space-y-2">
                  <CalendarPicker
                    selectedDate={statusChangeModal.dateOfChange}
                    onChange={(dateStr) => setStatusChangeModal(prev => ({ ...prev, dateOfChange: dateStr }))}
                    accentColor={statusChangeModal.newStatus === 'Banned' ? 'rose' : 'amber'}
                  />
                  <div className="flex items-center space-x-2 bg-slate-950/40 border border-slate-800/80 rounded-lg px-2.5 py-1.5 justify-between">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Selected Date:</span>
                    <span className={`text-xs font-mono font-bold ${statusChangeModal.newStatus === 'Banned' ? 'text-rose-450 text-rose-400' : 'text-amber-500'}`}>
                      {statusChangeModal.dateOfChange}
                    </span>
                  </div>
                </div>
              </div>

              {/* Remarks Textarea */}
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1 font-bold">ADDITIONAL REMARKS</label>
                <textarea
                  rows={3}
                  placeholder="Provide additional details or custom remarks..."
                  value={statusChangeModal.remarks}
                  onChange={(e) => setStatusChangeModal(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full bg-slate-850 border border-slate-755 text-slate-100 rounded-lg p-2.5 text-xs focus:outline-none focus:border-amber-500 placeholder:text-slate-500"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStatusChangeModal(prev => ({ ...prev, show: false }))}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-755 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-amber-500 text-slate-950 hover:bg-amber-450 text-xs font-bold cursor-pointer"
                >
                  Confirm transition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Individual Assessor Details Edit Dialog Panel */}
      {editingAssessor && editForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 text-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 rounded-t-xl flex items-center justify-between border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-bold block">Assessor Operations Platform</span>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Edit className="h-5 w-5 text-amber-500" />
                  <span>Modify Assessor Record: {editingAssessor.name}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingAssessor(null);
                  setEditForm(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content Scrollable Area */}
            <form onSubmit={handleSaveAssessorEdits} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Section 1: Demographics & Core Profile */}
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-1.5 mb-3 flex items-center gap-2">
                  <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold">01</span>
                  Core Profile & Corporate Identity
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Assessor ID (Read-only for database identity consistency) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Assessor ID (Read-only)</label>
                    <input
                      type="text"
                      disabled
                      value={editForm.assessorId}
                      className="w-full bg-slate-100 border border-slate-200 text-slate-500 px-3 py-1.5 text-xs rounded-lg cursor-not-allowed font-mono"
                    />
                  </div>

                  {/* Certificate No */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Certificate No</label>
                    <input
                      type="text"
                      value={editForm.certificateNo || ''}
                      onChange={(e) => setEditForm({ ...editForm, certificateNo: e.target.value })}
                      className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:border-amber-500"
                      placeholder="e.g. NABH/CERT/1429"
                    />
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Full Name *</label>
                    <input
                      required
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Designation */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block font-bold">Designation *</label>
                    <select
                      value={editForm.designation}
                      onChange={(e) => setEditForm({ ...editForm, designation: e.target.value as DesignationType })}
                      className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:border-amber-500"
                    >
                      <option value="Principal Assessor">Principal Assessor</option>
                      <option value="Co assessor">Co assessor</option>
                      <option value="Observer">Observer</option>
                      <option value="Committee member">Committee member</option>
                    </select>
                  </div>

                  {/* Job Role */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block font-bold">Job Role *</label>
                    <select
                      value={editForm.jobRole || 'Clinician'}
                      onChange={(e) => setEditForm({...editForm, jobRole: e.target.value as JobRoleType})}
                      className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:border-amber-500 select-none"
                    >
                      <option value="Clinician">Clinician</option>
                      <option value="Nurse">Nurse</option>
                      <option value="Administrator">Administrator</option>
                    </select>
                  </div>

                  {/* Contact Number */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Contact Number</label>
                    <input
                      type="text"
                      value={editForm.contactNumber || ''}
                      onChange={(e) => setEditForm({...editForm, contactNumber: e.target.value})}
                      className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Email Address *</label>
                    <input
                      required
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Gender *</label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm({...editForm, gender: e.target.value as any})}
                      className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:border-amber-500 select-none animate-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Date of Birth</label>
                    <input
                      type="date"
                      value={editForm.dob || ''}
                      onChange={(e) => {
                        const newDob = e.target.value;
                        let calculatedAge = editForm.age;
                        if (newDob) {
                          calculatedAge = new Date().getFullYear() - new Date(newDob).getFullYear();
                        }
                        setEditForm({ ...editForm, dob: newDob, age: calculatedAge });
                      }}
                      className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:border-amber-500"
                    />
                    {editForm.dob && (
                      <span className="text-[9px] text-amber-600 font-mono font-bold block mt-0.5">
                        ⚡ Auto-calculated: {new Date().getFullYear() - new Date(editForm.dob).getFullYear()} Years
                      </span>
                    )}
                  </div>

                  {/* Age */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Age *</label>
                    <input
                      required
                      type="number"
                      value={editForm.age}
                      onChange={(e) => setEditForm({...editForm, age: Number(e.target.value)})}
                      className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Academic Qualification */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Academic Qualifications</label>
                    <input
                      type="text"
                      value={editForm.qualification || ''}
                      onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
                      className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:border-amber-500"
                      placeholder="e.g. MBBS, MD (Medicine)"
                    />
                  </div>

                  {/* Specialization */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Specialization *</label>
                    <input
                      required
                      type="text"
                      value={editForm.specialization || ''}
                      onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                      className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:border-amber-500"
                      placeholder="e.g. Cardiology, Pathology"
                    />
                  </div>

                  {/* Date of Empanelment */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Date of Empanelment</label>
                    <input
                      type="date"
                      value={editForm.dateOfEmpanelment || ''}
                      onChange={(e) => {
                        const dVal = e.target.value;
                        const y = new Date(dVal).getFullYear();
                        setEditForm({
                          ...editForm,
                          dateOfEmpanelment: dVal,
                          empaneledYear: isNaN(y) ? editForm.empaneledYear : y
                        });
                      }}
                      className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Year Empaneled */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Empaneled Year *</label>
                    <input
                      required
                      type="number"
                      value={editForm.empaneledYear}
                      onChange={(e) => setEditForm({...editForm, empaneledYear: Number(e.target.value)})}
                      className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block font-bold">Roster Status *</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as AssessorStatusType })}
                      className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:border-amber-500"
                    >
                      <option value="Active">Operational (Active)</option>
                      <option value="Inactive">On Hold (Inactive)</option>
                      <option value="Banned">Revoked (Banned)</option>
                      <option value="Expired">Deceased (Expired)</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* Section 2: Regional coordinates */}
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-1.5 mb-3 flex items-center gap-2">
                  <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold">02</span>
                  Regional Coordinates & Addresses
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* City */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">City *</label>
                    <input
                      required
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                      className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* State */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">State *</label>
                    <select
                      value={editForm.state}
                      onChange={(e) => setEditForm({...editForm, state: e.target.value})}
                      className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:border-amber-500"
                    >
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Pincode */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Pincode</label>
                    <input
                      type="text"
                      value={editForm.pincode || ''}
                      onChange={(e) => setEditForm({...editForm, pincode: e.target.value})}
                      className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Official Address */}
                  <div className="space-y-1 md:col-span-3">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Official / Hospital Address</label>
                    <textarea
                      rows={2}
                      value={editForm.officialAddress || ''}
                      onChange={(e) => setEditForm({...editForm, officialAddress: e.target.value})}
                      className="w-full bg-white border border-slate-200 text-slate-900 p-2 text-xs rounded-lg focus:outline-none focus:border-amber-500 resize-none animate-none"
                    />
                  </div>

                  {/* Residential Address */}
                  <div className="space-y-1 md:col-span-3">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Residential Coordinates</label>
                    <textarea
                      rows={2}
                      value={editForm.residentialAddress || ''}
                      onChange={(e) => setEditForm({...editForm, residentialAddress: e.target.value})}
                      className="w-full bg-white border border-slate-200 text-slate-900 p-2 text-xs rounded-lg focus:outline-none focus:border-amber-500 resize-none animate-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Programs & Dynamic mapping */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <span className="bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold">03</span>
                  Program Scheme & Capacity Association
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 font-bold block">Accreditation Category</label>
                    <select
                      value={editSelScheme}
                      onChange={(e) => setEditSelScheme(e.target.value as SchemeType)}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg p-2 focus:outline-none"
                    >
                      <option value="Accreditation">Accreditation</option>
                      <option value="Certification">Certification</option>
                      <option value="Empanelment">Empanelment</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 font-bold block">Assigned Program</label>
                    <select
                      value={editSelProgram}
                      onChange={(e) => setEditSelProgram(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg p-2 focus:outline-none animate-none"
                    >
                      {(catalog[editSelScheme] || []).map(prog => (
                        <option key={prog} value={prog}>{prog}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 font-bold block">Assessor Capacity</label>
                    <select
                      value={editSelCapacity}
                      onChange={(e) => setEditSelCapacity(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg p-2 focus:outline-none"
                    >
                      <option value="Principal Assessor">Principal Assessor</option>
                      <option value="Assessor">Assessor</option>
                      <option value="Co-Assessor">Co-Assessor</option>
                      <option value="Committee Member">Committee Member</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleEditAddProgram}
                    className="bg-slate-900 text-white hover:bg-slate-800 p-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer w-full"
                  >
                    <Plus className="h-4 w-4 text-amber-500" />
                    <span>Map Association</span>
                  </button>
                </div>

                {/* Sub-panel: Role effective date & promotion comment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-white/70 p-3 rounded-lg border border-slate-200 shadow-sm">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-600 font-bold block">
                      📆 Effective Date of Role Status
                    </label>
                    <input
                      type="date"
                      value={editSelEffectiveDate}
                      onChange={(e) => setEditSelEffectiveDate(e.target.value)}
                      className="w-full bg-white border border-slate-250 border-slate-200 text-slate-800 text-xs rounded-lg p-2 focus:outline-none focus:border-amber-500 font-mono cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-600 font-bold block">
                      📝 Progression Remarks / Promotion Comment
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Promoted from Co-Assessor, passed 5th Edition upgrade exam"
                      value={editSelProgressRemarks}
                      onChange={(e) => setEditSelProgressRemarks(e.target.value)}
                      className="w-full bg-white border border-slate-250 border-slate-200 text-slate-850 text-xs rounded-lg p-2 focus:outline-none focus:border-amber-500 font-sans text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Display Current Maps */}
                <div className="space-y-1 md:col-span-3">
                  <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">CURRENTLY ASSOCIATED PROGRAMS ({editForm.programs.length})</label>
                  {editForm.programs.length === 0 ? (
                    <p className="text-[10px] text-slate-400 font-mono italic">No programs mapped yet. Must map at least one.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1 border border-dashed border-slate-200 p-3 rounded-lg bg-white bg-[none]">
                      {editForm.programs.map((pa, idx) => (
                        <span 
                          key={idx} 
                          className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 font-sans"
                        >
                          <div>
                            <strong className="text-slate-900 block text-[11px] leading-snug">{pa.program}</strong>
                            <span className="text-[10px] text-blue-600 font-mono font-bold uppercase">{pa.scheme} &bull; {pa.capacity}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleEditRemoveProgram(idx)}
                            className="text-slate-400 hover:text-rose-600 font-bold ml-1.5 transition-colors text-sm hover:bg-rose-50 px-1 rounded cursor-pointer"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Training & Refresher classes */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <span className="bg-slate-900 text-amber-500 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold">04</span>
                  Specialized Training Courses & Workshops
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-mono text-slate-500 font-bold block">Class / Training Name</label>
                    <input
                      type="text"
                      placeholder="e.g. 5th Edition Standards Transition Refresher Course"
                      value={editCourseName}
                      onChange={(e) => setEditCourseName(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg p-2 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 font-bold block">Completion Date</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={editCourseDate}
                        onChange={(e) => setEditCourseDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg p-2 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleEditAddCourse}
                        className="bg-slate-900 text-white hover:bg-slate-800 p-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer px-4"
                      >
                        <Plus className="h-4 w-4 text-amber-500" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Listing of added courses */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">CERTIFIED INSTRUCTION HISTORY ({editForm.courses.length})</label>
                  {editForm.courses.length === 0 ? (
                    <p className="text-[10px] text-slate-400 font-mono italic">No workshops logged. Log key classes above.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border border-dashed border-slate-200 p-3 rounded-lg bg-white">
                      {editForm.courses.map((c, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-700"
                        >
                          <div>
                            <div className="font-extrabold text-slate-800">{c.courseName}</div>
                            <div className="text-[10px] font-mono text-slate-500 mt-0.5 flex items-center gap-1.5">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>Date Completed: <strong className="text-slate-700">{c.date}</strong></span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleEditRemoveCourse(idx)}
                            className="text-slate-400 hover:text-rose-600 font-bold ml-1.5 transition-colors text-base hover:bg-rose-50 px-2.5 py-1 rounded cursor-pointer"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 5: Document Uploads & Credentials */}
              <div className="bg-slate-55 bg-slate-50 p-4 rounded-xl border border-slate-250 border-slate-200 space-y-4">
                <h4 className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <span className="bg-slate-900 text-amber-500 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold">05</span>
                  Document Upload Checklist & Credentials
                </h4>
                <DocumentSection
                  biographyDocs={editForm.biographyDocs || []}
                  otherDocs={editForm.otherDocs || []}
                  onUploadBiography={(doc) => setEditForm({ ...editForm, biographyDocs: [...(editForm.biographyDocs || []), doc] })}
                  onDeleteBiography={(id) => setEditForm({ ...editForm, biographyDocs: (editForm.biographyDocs || []).filter(d => d.id !== id) })}
                  onUploadOther={(doc) => setEditForm({ ...editForm, otherDocs: [...(editForm.otherDocs || []), doc] })}
                  onDeleteOther={(id) => setEditForm({ ...editForm, otherDocs: (editForm.otherDocs || []).filter(d => d.id !== id) })}
                  readOnly={!isAdmin}
                />
              </div>

            </form>

            {/* Modal Footer Controls */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 rounded-b-xl flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => {
                  setEditingAssessor(null);
                  setEditForm(null);
                }}
                className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel Edits
              </button>
              <button
                type="button"
                onClick={handleSaveAssessorEdits}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-sm cursor-pointer"
              >
                Apply Modifications
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
