/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Assessor, CourseAttended, ProgramAssociation, INDIAN_STATES, SchemeType, DesignationType, JobRoleType, AssessorStatusType, AssessorDocument } from '../types';
import * as XLSX from 'xlsx';
import { Plus, Trash2, ShieldAlert, Upload, CheckCircle2, ChevronDown, Award, Calendar, RefreshCw, Star, FileText } from 'lucide-react';
import DocumentSection from './DocumentSection';

const CITY_TO_STATE: Record<string, string> = {
  'indore': 'Madhya Pradesh',
  'bhopal': 'Madhya Pradesh',
  'gwalior': 'Madhya Pradesh',
  'jabalpur': 'Madhya Pradesh',
  'mumbai': 'Maharashtra',
  'pune': 'Maharashtra',
  'nagpur': 'Maharashtra',
  'thane': 'Maharashtra',
  'bengaluru': 'Karnataka',
  'bangalore': 'Karnataka',
  'mysore': 'Karnataka',
  'chennai': 'Tamil Nadu',
  'coimbatore': 'Tamil Nadu',
  'madurai': 'Tamil Nadu',
  'hyderabad': 'Telangana',
  'kolkata': 'West Bengal',
  'calcutta': 'West Bengal',
  'new delhi': 'Delhi',
  'delhi': 'Delhi',
  'ahmedabad': 'Gujarat',
  'surat': 'Gujarat',
  'vadodara': 'Gujarat',
  'rajkot': 'Gujarat',
  'jaipur': 'Rajasthan',
  'jodhpur': 'Rajasthan',
  'udaipur': 'Rajasthan',
  'lucknow': 'Uttar Pradesh',
  'kanpur': 'Uttar Pradesh',
  'noida': 'Uttar Pradesh',
  'ghaziabad': 'Uttar Pradesh',
  'agra': 'Uttar Pradesh',
  'patna': 'Bihar',
  'chandigarh': 'Punjab',
  'amritsar': 'Punjab',
  'ludhiana': 'Punjab',
  'kochi': 'Kerala',
  'trivandrum': 'Kerala',
  'thiruvananthapuram': 'Kerala',
  'bhubaneswar': 'Odisha',
  'raipur': 'Chhattisgarh',
  'ranchi': 'Jharkhand',
  'dehradun': 'Uttarakhand',
  'guwahati': 'Assam',
  'srinagar': 'Jammu & Kashmir',
  'jammu': 'Jammu & Kashmir',
  'panaji': 'Goa',
  'goa': 'Goa',
};

function parseExcelDate(val: any): string {
  if (!val) return '1980-01-01';
  
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  
  // If it's a number (or string of a number that isn't empty) e.g. Excel numeric serial date code
  const num = Number(val);
  if (!isNaN(num) && num > 10000 && num < 100000) {
    // Dec 30 1899 epoch due to Excel serial date leap year bug
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const msPerDay = 24 * 60 * 60 * 1000;
    const dateObj = new Date(excelEpoch.getTime() + num * msPerDay);
    
    const y = dateObj.getUTCFullYear();
    const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  
  const str = String(val).trim();
  if (!str) return '1980-01-01';
  
  // Standard parser for formats like DD/MM/YYYY or DD-MM-YYYY or DD/MM/YY
  const indianParts = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (indianParts) {
    const d = String(indianParts[1]).padStart(2, '0');
    const m = String(indianParts[2]).padStart(2, '0');
    let y = indianParts[3];
    if (y.length === 2) {
      const yearNum = Number(y);
      y = String(yearNum < 50 ? 2000 + yearNum : 1900 + yearNum);
    }
    return `${y}-${m}-${d}`;
  }
  
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  
  return '1980-01-01';
}

interface AdminPanelProps {
  assessors: Assessor[];
  onAddAssessor: (assessor: Assessor) => void;
  onBulkImport: (assessors: Assessor[], override: boolean) => void;
  onResetDatabase: () => void;
  catalog: Record<SchemeType, string[]>;
  onCreateProgram: (scheme: SchemeType, newProgramName: string) => boolean;
  onDeleteProgram: (scheme: SchemeType, programToDelete: string) => void;
  onRenameProgram: (scheme: SchemeType, oldName: string, newName: string) => boolean;
  isAdmin: boolean;
  banReasons: string[];
  inactiveReasons: string[];
  onAddBanReason: (reason: string) => void;
  onDeleteBanReason: (reason: string) => void;
  onAddInactiveReason: (reason: string) => void;
  onDeleteInactiveReason: (reason: string) => void;
}

export default function AdminPanel({ 
  assessors, 
  onAddAssessor, 
  onBulkImport, 
  onResetDatabase,
  catalog,
  onCreateProgram,
  onDeleteProgram,
  onRenameProgram,
  isAdmin,
  banReasons,
  inactiveReasons,
  onAddBanReason,
  onDeleteBanReason,
  onAddInactiveReason,
  onDeleteInactiveReason
}: AdminPanelProps) {
  
  // Tab selector inside Admin Settings
  const [adminTab, setAdminTab] = useState<'individual' | 'bulk' | 'programs' | 'reasons' | 'maintenance'>('individual');
  
  // Custom reasons inputs
  const [newBanReasonInput, setNewBanReasonInput] = useState('');
  const [newInactiveReasonInput, setNewInactiveReasonInput] = useState('');

  // Multi Scheme-Program-Capacity Tagger State
  const [tempAssociations, setTempAssociations] = useState<ProgramAssociation[]>([]);
  const [selScheme, setSelScheme] = useState<SchemeType>('Accreditation');
  const [selProgram, setSelProgram] = useState<string>('');
  const [selCapacity, setSelCapacity] = useState<'Principal Assessor' | 'Assessor' | 'Co-Assessor' | 'Committee Member'>('Assessor');

  // Program CRUD Management Sub-states
  const [progScheme, setProgScheme] = useState<SchemeType>('Accreditation');
  const [newProgramName, setNewProgramName] = useState('');
  const [programError, setProgramError] = useState('');
  const [programSuccess, setProgramSuccess] = useState('');

  // Inline rename and delete trackers
  const [renamingProgram, setRenamingProgram] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingProgram, setDeletingProgram] = useState<string | null>(null);

  React.useEffect(() => {
    if (catalog[selScheme] && catalog[selScheme].length > 0) {
      if (!catalog[selScheme].includes(selProgram)) {
        setSelProgram(catalog[selScheme][0]);
      }
    } else {
      setSelProgram('');
    }
  }, [selScheme, catalog]);

  // Dynamic Course Tagger state
  const [tempCourses, setTempCourses] = useState<CourseAttended[]>([]);
  const [courseNameInput, setCourseNameInput] = useState('');
  const [courseDateInput, setCourseDateInput] = useState('');

  // Individual Form Document Attachments state
  const [tempBiographyDocs, setTempBiographyDocs] = useState<AssessorDocument[]>([]);
  const [tempOtherDocs, setTempOtherDocs] = useState<AssessorDocument[]>([]);

  // Individual Form Fields
  const [formData, setFormData] = useState({
    assessorId: '',
    certificateNo: '',
    name: '',
    email: '',
    contactNumber: '',
    city: '',
    state: INDIAN_STATES[0],
    pincode: '',
    dob: '',
    designation: 'Principal Assessor' as DesignationType,
    jobRole: 'Clinician' as JobRoleType,
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    officialAddress: '',
    residentialAddress: '',
    qualification: '',
    specialization: '',
    dateOfEmpanelment: new Date().toISOString().split('T')[0],
    empaneledYear: new Date().getFullYear(),
    status: 'Active' as AssessorStatusType,
  });

  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // Bulk Excel import state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [excelRows, setExcelRows] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [importStatus, setImportStatus] = useState('');

  // Inline confirmation trackers to bypass window.confirm and window.alert in sandbox environments
  const [replaceConfirmActive, setReplaceConfirmActive] = useState<boolean>(false);
  const [resetConfirmActive, setResetConfirmActive] = useState<boolean>(false);

  // Column Mappers: Maps spreadsheet headers to assessor database fields
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({
    assessorId: '',
    certificateNo: '',
    name: '',
    email: '',
    contactNumber: '',
    city: '',
    state: '',
    pincode: '',
    dob: '',
    gender: '',
    designation: '',
    jobRole: '',
    qualification: '',
    specialization: '',
    dateOfEmpanelment: '',
    officialAddress: '',
    residentialAddress: '',
    empaneledYear: '',
    status: '',
    scheme: '',
    program: '',
  });

  const requiredFields = [
    { key: 'assessorId', label: 'Assessor ID' },
    { key: 'name', label: 'Name of Assessor' },
    { key: 'email', label: 'Email ID' },
    { key: 'contactNumber', label: 'Contact Number' },
    { key: 'state', label: 'State' },
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto program select adjuster on scheme toggle
  const handleSchemeChange = (scheme: SchemeType) => {
    setSelScheme(scheme);
  };

  const addAssociationTag = () => {
    // Prevent duplicates
    const duplicate = tempAssociations.some(
      a => a.scheme === selScheme && a.program === selProgram
    );
    if (duplicate) {
      setFormError("This exact Program Association is already configured for this record below.");
      return;
    }
    setTempAssociations(prev => [...prev, {
      scheme: selScheme,
      program: selProgram,
      capacity: selCapacity
    }]);
  };

  const removeAssociationTag = (index: number) => {
    setTempAssociations(prev => prev.filter((_, i) => i !== index));
  };

  const addCourseTag = () => {
    if (!courseNameInput.trim()) return;
    setTempCourses(prev => [...prev, {
      courseName: courseNameInput.trim(),
      date: courseDateInput || new Date().toISOString().slice(0, 10)
    }]);
    setCourseNameInput('');
    setCourseDateInput('');
  };

  const removeCourseTag = (index: number) => {
    setTempCourses(prev => prev.filter((_, i) => i !== index));
  };

  // Submit Individual Assessor
  const handleIndividualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccess('');
    setFormError('');

    // Pre-validating
    if (!formData.assessorId.trim()) {
      setFormError('Assessor ID is a hard unique database parameter.');
      return;
    }
    if (assessors.some(a => a.assessorId.toLowerCase() === formData.assessorId.trim().toLowerCase())) {
      setFormError(`An assessor with ID "${formData.assessorId}" already exists.`);
      return;
    }

    if (tempAssociations.length === 0) {
      setFormError('Please add at least one Scheme-Program association mapping.');
      return;
    }

    // Age calculation
    let calculatedAge = 40;
    if (formData.dob) {
      calculatedAge = new Date().getFullYear() - new Date(formData.dob).getFullYear();
    }

    const nextSNo = assessors.length > 0 ? Math.max(...assessors.map(a => a.sNo)) + 1 : 1;

    const newAssessor: Assessor = {
      sNo: nextSNo,
      assessorId: formData.assessorId.trim(),
      certificateNo: formData.certificateNo.trim() || `GEN/${Math.floor(Math.random() * 8999) + 1000}`,
      name: formData.name.trim(),
      email: formData.email.trim(),
      contactNumber: formData.contactNumber.trim(),
      city: formData.city.trim() || 'Not Defined',
      state: formData.state,
      pincode: formData.pincode.trim() || 'Not Provided',
      dob: formData.dob || '1980-01-01',
      designation: formData.designation,
      jobRole: formData.jobRole,
      age: calculatedAge,
      gender: formData.gender,
      officialAddress: formData.officialAddress.trim() || 'Not Mapped',
      residentialAddress: formData.residentialAddress.trim() || 'Not Mapped',
      qualification: formData.qualification.trim() || 'MBBS / Graduate',
      specialization: formData.specialization.trim() || 'General Healthcare',
      dateOfEmpanelment: formData.dateOfEmpanelment || `${formData.empaneledYear}-04-01`,
      empaneledYear: Number(formData.empaneledYear) || new Date().getFullYear(),
      status: formData.status,
      courses: tempCourses,
      programs: tempAssociations,
      roleProgression: tempAssociations.map((assoc, idx) => ({
        id: `RP-INIT-${formData.assessorId.trim()}-${idx}-${Date.now()}`,
        scheme: assoc.scheme,
        program: assoc.program,
        roleFrom: "None (Newly Mapped)",
        roleTo: assoc.capacity,
        effectiveDate: formData.dateOfEmpanelment || `${formData.empaneledYear}-04-01`,
        remarks: "Initial empanelment mapping during registration.",
        timestamp: new Date().toISOString()
      })),
      biographyDocs: tempBiographyDocs,
      otherDocs: tempOtherDocs
    };

    onAddAssessor(newAssessor);
    setFormSuccess(`Assessor "${newAssessor.name}" successfully added under ID "${newAssessor.assessorId}"!`);
    
    // Clear state fields
    setFormData({
      assessorId: '',
      certificateNo: '',
      name: '',
      email: '',
      contactNumber: '',
      city: '',
      state: INDIAN_STATES[0],
      pincode: '',
      dob: '',
      designation: 'Principal Assessor',
      jobRole: 'Clinician',
      gender: 'Male',
      officialAddress: '',
      residentialAddress: '',
      qualification: '',
      specialization: '',
      dateOfEmpanelment: new Date().toISOString().split('T')[0],
      empaneledYear: new Date().getFullYear(),
      status: 'Active',
    });
    setTempAssociations([]);
    setTempCourses([]);
    setTempBiographyDocs([]);
    setTempOtherDocs([]);
    setTempCourses([]);
  };

  // Excel binary parse handler
  const handleExcelFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
    setIsParsing(true);
    setImportStatus('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const u8Data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(u8Data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet);

        if (rows.length === 0) {
          throw new Error('No rows detected inside the excel worksheet.');
        }

        const headers = Object.keys(rows[0] as object);
        setExcelHeaders(headers);
        setExcelRows(rows);

        // Auto guessing mappers based on substring similarities! (extremely professional user feature!)
        const guessedMappings = { ...columnMappings };
        headers.forEach(h => {
          const l = h.toLowerCase().trim();
          if (l.includes('assessor id') || l === 'id' || l.includes('ass_id')) guessedMappings.assessorId = h;
          else if (l.includes('cert') || l.includes('certificate')) guessedMappings.certificateNo = h;
          else if (l.includes('name') || l.includes('assessor name') || l === 'assessor') guessedMappings.name = h;
          else if (l.includes('email') || l.includes('mail')) guessedMappings.email = h;
          else if (l.includes('contact') || l.includes('phone') || l.includes('number') || l === 'mobile') guessedMappings.contactNumber = h;
          else if (l.includes('city') && !l.includes('capacity')) guessedMappings.city = h;
          else if (l.includes('state')) guessedMappings.state = h;
          else if (l.includes('pincode') || l.includes('pin')) guessedMappings.pincode = h;
          else if (l.includes('birth') || l.includes('dob') || l === 'date of birth') guessedMappings.dob = h;
          else if (l.includes('gender')) guessedMappings.gender = h;
          else if (l.includes('designation') || l.includes('desig')) guessedMappings.designation = h;
          else if (l.includes('role') || l.includes('job') || l.includes('jobrole')) guessedMappings.jobRole = h;
          else if (l.includes('qualification') || l.includes('qual')) guessedMappings.qualification = h;
          else if (l.includes('speciali') || l.includes('spec')) guessedMappings.specialization = h;
          else if (l.includes('official address') || l.includes('off_addr')) guessedMappings.officialAddress = h;
          else if (l.includes('residential address') || l.includes('res_addr')) guessedMappings.residentialAddress = h;
          else if (l.includes('empan') && (l.includes('date') || l.includes('dt'))) guessedMappings.dateOfEmpanelment = h;
          else if (l.includes('date of empanel') || l.includes('empanelment date') || l === 'date_of_empanelment') guessedMappings.dateOfEmpanelment = h;
          else if (l.includes('empanel') || l.includes('year of empanelment')) guessedMappings.empaneledYear = h;
          else if (l.includes('status')) guessedMappings.status = h;
          else if (l === 'scheme') guessedMappings.scheme = h;
          else if (l === 'program') guessedMappings.program = h;
        });

        // Cell-value based backup scan for State and empanelment fields (insanely robust fallback!)
        headers.forEach(h => {
          const l = h.toLowerCase().trim();
          let stateMatchCount = 0;
          let dateMatchCount = 0;

          // Check first 10 rows
          const sample = rows.slice(0, 10);
          sample.forEach((r: any) => {
            const v = String(r[h] || '').trim();
            if (v) {
              const matchedStateInput = INDIAN_STATES.some(s => s.toLowerCase().trim() === v.toLowerCase().trim());
              if (matchedStateInput) stateMatchCount++;

              const isDatePattern = v.match(/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/) || v.match(/^\d{4}-\d{2}-\d{2}$/);
              if (isDatePattern && (l.includes('empan') || l.includes('date') || l.includes('dt'))) {
                dateMatchCount++;
              }
            }
          });

          if (stateMatchCount >= 2 && !guessedMappings.state) {
            guessedMappings.state = h;
          }
          if (dateMatchCount >= 1 && !guessedMappings.dateOfEmpanelment) {
            guessedMappings.dateOfEmpanelment = h;
          }
        });

        setColumnMappings(guessedMappings);
        setImportStatus(`Workbook parsed successfully. Loaded ${rows.length} rows with ${headers.length} headers.`);
      } catch (err: any) {
        setImportStatus(`Excel load error: ${err.message || err}`);
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExecuteImport = (policy: 'merge' | 'replace') => {
    if (excelRows.length === 0) return;

    // Build assessor constructs based on mapped schemas
    const parsedAssessors: Assessor[] = [];
    let errorCount = 0;

    const baseSNo = policy === 'merge' && assessors.length > 0 
      ? Math.max(...assessors.map(a => a.sNo)) 
      : 0;

    excelRows.forEach((row, idx) => {
      // Direct reader helper
      const getVal = (fieldKey: string) => {
        const header = columnMappings[fieldKey];
        return header ? String(row[header] || '').trim() : '';
      };

      const assessorId = getVal('assessorId');
      const name = getVal('name');
      const email = getVal('email');
      const contactNumber = getVal('contactNumber');
      
      // Case-insensitive state matching
      const stateInput = getVal('state');
      const cityInput = getVal('city').toLowerCase().trim();
      let matchedState = '';
      
      if (stateInput) {
        matchedState = INDIAN_STATES.find(
          s => s.toLowerCase().trim() === stateInput.toLowerCase().trim()
        ) || INDIAN_STATES.find(
          s => s.toLowerCase().replace(/\s+/g, '') === stateInput.toLowerCase().replace(/\s+/g, '')
        ) || stateInput;
      }
      
      // If no valid state matched or state was blank, fallback on city lookup! (e.g., Indore -> Madhya Pradesh)
      if (!matchedState || matchedState === 'Andhra Pradesh') {
        const fallback = CITY_TO_STATE[cityInput];
        if (fallback) {
          matchedState = fallback;
        } else if (!matchedState) {
          matchedState = INDIAN_STATES[0]; // Default to first state (Andhra Pradesh)
        }
      }

      // Reject row if both ID and name is missing
      if (!assessorId && !name) {
        errorCount++;
        return;
      }

      const rawDobVal = columnMappings['dob'] ? row[columnMappings['dob']] : null;
      const rawDob = parseExcelDate(rawDobVal);
      let age = 40;
      if (rawDob) {
        const bYear = new Date(rawDob).getFullYear();
        if (!isNaN(bYear)) {
          age = new Date().getFullYear() - bYear || 40;
        }
      }

      // Specialization Parsing
      const specialization = getVal('specialization') || 'General Healthcare';

      // Empanelment Date & Year Parsing
      const rawEmpanelVal = columnMappings['dateOfEmpanelment'] ? row[columnMappings['dateOfEmpanelment']] : (columnMappings['empaneledYear'] ? row[columnMappings['empaneledYear']] : null);
      let dateOfEmpanelment = '';
      let empaneledYear = 2020;
      if (rawEmpanelVal) {
        const parsedEmp = parseExcelDate(rawEmpanelVal);
        if (parsedEmp && parsedEmp !== '1980-01-01') {
          dateOfEmpanelment = parsedEmp;
          const y = new Date(parsedEmp).getFullYear();
          if (!isNaN(y)) {
            empaneledYear = y;
          }
        } else {
          const testNum = Number(rawEmpanelVal);
          if (!isNaN(testNum) && testNum > 1900 && testNum < 2100) {
            empaneledYear = testNum;
            dateOfEmpanelment = `${testNum}-04-01`;
          }
        }
      }

      // Resolve mapping scheme & program
      const rawScheme = getVal('scheme') as SchemeType || 'Accreditation';
      const rawProgram = getVal('program') || 'Hospitals (Full Accreditation)';
      const rawStatus = getVal('status') || 'Active';

      // Parse designation category
      let rawDesig = getVal('designation').trim();
      let finalDesig: DesignationType = 'Principal Assessor';
      if (/co[- ]?assessor/i.test(rawDesig)) {
        finalDesig = 'Co assessor';
      } else if (/observer/i.test(rawDesig)) {
        finalDesig = 'Observer';
      } else if (/committee/i.test(rawDesig)) {
        finalDesig = 'Committee member';
      }

      // Parse jobRole
      let rawRole = getVal('jobRole').trim();
      let finalJobRole: JobRoleType = 'Clinician';
      if (/nurse/i.test(rawRole)) {
        finalJobRole = 'Nurse';
      } else if (/admin/i.test(rawRole)) {
        finalJobRole = 'Administrator';
      }

      // Map designation to capacity
      let capVal: 'Principal Assessor' | 'Assessor' | 'Co-Assessor' | 'Committee Member' = 'Assessor';
      if (finalDesig === 'Principal Assessor') capVal = 'Principal Assessor';
      else if (finalDesig === 'Co assessor') capVal = 'Co-Assessor';
      else if (finalDesig === 'Committee member') capVal = 'Committee Member';

      const programAssoc: ProgramAssociation = {
        scheme: ['Accreditation', 'Certification', 'Empanelment'].includes(rawScheme) ? rawScheme : 'Accreditation',
        program: rawProgram,
        capacity: capVal
      };

      // Check if this assessor was already processed in the current file parse loop
      const existingIdx = parsedAssessors.findIndex(item => 
        (assessorId && item.assessorId && item.assessorId.toLowerCase() === assessorId.toLowerCase()) ||
        (name && item.name && item.name.toLowerCase().trim() === name.toLowerCase().trim())
      );

      if (existingIdx !== -1) {
        // Consolidated entry! Merge program associations
        const existingAssessor = parsedAssessors[existingIdx];
        const alreadyHasProgram = existingAssessor.programs.some(p => p.program === programAssoc.program);
        if (!alreadyHasProgram) {
          existingAssessor.programs.push(programAssoc);
        }
        // Take other fields if the current excel row has them and the original is empty
        if (assessorId && !existingAssessor.assessorId) existingAssessor.assessorId = assessorId;
        if (email && !existingAssessor.email) existingAssessor.email = email;
        if (contactNumber && !existingAssessor.contactNumber) existingAssessor.contactNumber = contactNumber;
        if (rawDob && !existingAssessor.dob) {
          existingAssessor.dob = rawDob;
          existingAssessor.age = age;
        }
      } else {
        // Create new unique assessor record
        const assessorObj: Assessor = {
          sNo: baseSNo + parsedAssessors.length + 1,
          assessorId: assessorId || `NABH-AS-IMP-${baseSNo + parsedAssessors.length + 1001}`,
          certificateNo: getVal('certificateNo') || `CERT-${idx + 101}`,
          name: name,
          email: email || `${(assessorId || name.replace(/\s+/g, '')).toLowerCase()}@example-nabh.org`,
          contactNumber: contactNumber || '9999999999',
          city: getVal('city') || 'Not Mapped',
          state: matchedState,
          pincode: getVal('pincode') || '110001',
          dob: rawDob || '1980-01-01',
          designation: finalDesig,
          jobRole: finalJobRole,
          age: age,
          gender: (getVal('gender') as any) || 'Male',
          officialAddress: getVal('officialAddress') || 'Not Specified',
          residentialAddress: getVal('residentialAddress') || 'Not Specified',
          qualification: getVal('qualification') || 'Medical Graduate',
          specialization: specialization,
          dateOfEmpanelment: dateOfEmpanelment,
          empaneledYear: empaneledYear,
          status: ['Active', 'Inactive', 'Banned', 'Expired'].includes(rawStatus) ? (rawStatus as any) : 'Active',
          courses: [],
          programs: [programAssoc],
          biographyDocs: [],
          otherDocs: []
        };
        parsedAssessors.push(assessorObj);
      }
    });

    onBulkImport(parsedAssessors, policy === 'replace');
    
    setImportStatus(`Import Complete! Successfully processed and consolidated ${parsedAssessors.length} unique assessor profiles. Row processing errors skipped: ${errorCount}.`);
    
    // Clear workbook
    setExcelFile(null);
    setExcelHeaders([]);
    setExcelRows([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-305">
      
      {/* Settings Navigation */}
      <div className="flex flex-wrap bg-slate-900 border border-slate-800 rounded-xl p-1 max-w-3xl gap-1">
        <button
          type="button"
          onClick={() => setAdminTab('individual')}
          className={`flex-grow md:flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold font-mono uppercase tracking-wider transition-all ${
            adminTab === 'individual' ? 'bg-amber-500 text-slate-950 font-bold font-sans' : 'text-slate-400 hover:text-white'
          }`}
        >
          ➕ Register
        </button>
        <button
          type="button"
          onClick={() => setAdminTab('bulk')}
          className={`flex-grow md:flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold font-mono uppercase tracking-wider transition-all ${
            adminTab === 'bulk' ? 'bg-amber-500 text-slate-950 font-bold font-sans' : 'text-slate-400 hover:text-white'
          }`}
        >
          📄 Bulk Import
        </button>
        <button
          type="button"
          onClick={() => setAdminTab('programs')}
          className={`flex-grow md:flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold font-mono uppercase tracking-wider transition-all ${
            adminTab === 'programs' ? 'bg-amber-500 text-slate-950 font-bold font-sans' : 'text-slate-400 hover:text-white'
          }`}
        >
          ⚙️ Programs
        </button>
        <button
          type="button"
          onClick={() => setAdminTab('reasons')}
          className={`flex-grow md:flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold font-mono uppercase tracking-wider transition-all ${
            adminTab === 'reasons' ? 'bg-amber-500 text-slate-950 font-bold font-sans' : 'text-slate-400 hover:text-white'
          }`}
        >
          🛑 Status Reasons
        </button>
        <button
          type="button"
          onClick={() => setAdminTab('maintenance')}
          className={`flex-grow md:flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold font-mono uppercase tracking-wider transition-all ${
            adminTab === 'maintenance' ? 'bg-amber-500 text-slate-950 font-bold font-sans' : 'text-slate-400 hover:text-white'
          }`}
        >
          🚨 Danger Zone
        </button>
      </div>

      {/* Tab Panel 1: Individual manual registry form */}
      {adminTab === 'individual' && (
        <form onSubmit={handleIndividualSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-6">
          
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">Manual Assessor Registration Form</h3>
              <p className="text-xs text-slate-400 mt-0.5">Initialize a single assessor profile with complete regional details and multiple programs.</p>
            </div>
            <Award className="h-5 w-5 text-amber-500" />
          </div>

          {/* Form system feedback notifications */}
          {formSuccess && (
            <div className="bg-emerald-950/40 border border-emerald-800 p-3.5 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4.5 w-4.5" />
              <span>{formSuccess}</span>
            </div>
          )}
          {formError && (
            <div className="bg-rose-950/40 border border-rose-800 p-3.5 rounded-lg text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Core details column Block */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-450 text-slate-400 uppercase tracking-widest block">Assessor ID *</label>
              <input
                required
                type="text"
                placeholder="e.g. NABH-AS-2026-611"
                value={formData.assessorId}
                onChange={(e) => setFormData(prev => ({ ...prev, assessorId: e.target.value }))}
                className="w-full bg-slate-850 border border-slate-755 text-slate-100 px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Certificate No</label>
              <input
                type="text"
                placeholder="e.g. NABH/CERT/1429"
                value={formData.certificateNo}
                onChange={(e) => setFormData(prev => ({ ...prev, certificateNo: e.target.value }))}
                className="w-full bg-slate-850 border border-slate-755 text-slate-100 px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block font-bold">Name of Assessor *</label>
              <input
                required
                type="text"
                placeholder="e.g. Dr. Mamoni Maity"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-slate-850 border border-slate-755 text-slate-100 px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Email ID *</label>
              <input
                required
                type="email"
                placeholder="e.g. assessor@nabh.in"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-slate-850 border border-slate-755 text-slate-100 px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block font-bold">Contact Number *</label>
              <input
                required
                type="tel"
                placeholder="10-digit mobile eg: 9812345678"
                value={formData.contactNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                className="w-full bg-slate-850 border border-slate-755 text-slate-100 px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Date of Birth *</label>
              <input
                required
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData(prev => ({ ...prev, dob: e.target.value }))}
                className="w-full bg-slate-850 border border-slate-755 text-slate-100 px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-amber-500"
              />
              {formData.dob && (
                <div className="text-[10px] text-amber-500 font-mono font-bold mt-1 animate-pulse">
                  ⚡ Auto-calculated Age: {new Date().getFullYear() - new Date(formData.dob).getFullYear()} Years
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as any }))}
                className="w-full bg-slate-850 border border-slate-755 text-slate-300 px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-amber-500 text-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block font-bold">Designation *</label>
              <select
                required
                value={formData.designation}
                onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value as DesignationType }))}
                className="w-full bg-slate-850 border border-slate-755 text-slate-300 px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-amber-500 text-white"
              >
                <option value="Principal Assessor">Principal Assessor</option>
                <option value="Co assessor">Co assessor</option>
                <option value="Observer">Observer</option>
                <option value="Committee member">Committee member</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block font-bold">Job Role *</label>
              <select
                required
                value={formData.jobRole}
                onChange={(e) => setFormData(prev => ({ ...prev, jobRole: e.target.value as JobRoleType }))}
                className="w-full bg-slate-850 border border-slate-755 text-slate-300 px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-amber-500 text-white"
              >
                <option value="Clinician">Clinician</option>
                <option value="Nurse">Nurse</option>
                <option value="Administrator">Administrator</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block font-bold">Initial Status *</label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as AssessorStatusType }))}
                className="w-full bg-slate-850 border border-slate-755 text-slate-300 px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-amber-500 text-white"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Banned">Banned</option>
                <option value="Expired">Deceased (Expired)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Date of Empanelment</label>
              <input
                type="date"
                required
                value={formData.dateOfEmpanelment}
                onChange={(e) => {
                  const dVal = e.target.value;
                  const year = new Date(dVal).getFullYear();
                  setFormData(prev => ({
                    ...prev,
                    dateOfEmpanelment: dVal,
                    empaneledYear: isNaN(year) ? prev.empaneledYear : year
                  }));
                }}
                className="w-full bg-slate-850 border border-slate-755 text-slate-100 px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Empanelment Year</label>
              <input
                type="number"
                min="2005"
                max="2030"
                value={formData.empaneledYear}
                onChange={(e) => setFormData(prev => ({ ...prev, empaneledYear: Number(e.target.value) }))}
                className="w-full bg-slate-850 border border-slate-755 text-slate-100 px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Academic Qualifications</label>
              <input
                type="text"
                placeholder="e.g. MBBS, MD (Medicine), PGDHM Quality"
                value={formData.qualification}
                onChange={(e) => setFormData(prev => ({ ...prev, qualification: e.target.value }))}
                className="w-full bg-slate-850 border border-slate-755 text-slate-100 px-3 py-2 text-xs rounded-lg col-span-1 md:col-span-3 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Specialization *</label>
              <input
                type="text"
                required
                placeholder="e.g. Cardiology, Pathology"
                value={formData.specialization}
                onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                className="w-full bg-slate-850 border border-slate-755 text-slate-100 px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">City</label>
              <input
                type="text"
                placeholder="e.g. Indore"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full bg-slate-850 border border-slate-755 text-slate-100 px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">State *</label>
              <select
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                className="w-full bg-slate-850 border border-slate-755 text-slate-300 px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-amber-500 text-white"
              >
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Pincode</label>
              <input
                type="text"
                placeholder="6-digit PIN eg: 110029"
                value={formData.pincode}
                onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                className="w-full bg-slate-850 border border-slate-755 text-slate-100 px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Official Office Address</label>
              <textarea
                rows={2}
                placeholder="Official correspondence clinic / hospital address details"
                value={formData.officialAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, officialAddress: e.target.value }))}
                className="w-full bg-slate-850 border border-slate-755 text-slate-100 p-2.5 text-xs rounded-lg focus:outline-none focus:border-amber-500"
              ></textarea>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Residential Address</label>
              <textarea
                rows={2}
                placeholder="Personal correspondence coordinates details"
                value={formData.residentialAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, residentialAddress: e.target.value }))}
                className="w-full bg-slate-850 border border-slate-755 text-slate-100 p-2.5 text-xs rounded-lg focus:outline-none focus:border-amber-500"
              ></textarea>
            </div>

          </div>

          {/* Core Dynamic Tagger: Associated multiple programs & multiple categories */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="block border-b border-slate-850 pb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500 block font-bold">Multiple Program & Category Mappings *</span>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">Define multi-role mappings beneath distinct accreditation categories. Supports associating one assessor across multiple programs.</p>
            </div>

            <div className="flex flex-col md:flex-row items-end gap-3.5 pt-1">
              <div className="space-y-1 flex-1">
                <label className="text-[10px] font-mono text-slate-400 block font-semibold">Classification Categories</label>
                <select
                  value={selScheme}
                  onChange={(e) => handleSchemeChange(e.target.value as SchemeType)}
                  className="w-full bg-slate-850 border border-slate-750 text-slate-300 text-xs rounded-lg p-2.5 focus:outline-none"
                >
                  <option value="Accreditation">Accreditation</option>
                  <option value="Certification">Certification</option>
                  <option value="Empanelment">Empanelment</option>
                </select>
              </div>

              <div className="space-y-1 flex-1">
                <label className="text-[10px] font-mono text-slate-400 block font-semibold">Assigned Program</label>
                <select
                  value={selProgram}
                  onChange={(e) => setSelProgram(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-750 text-slate-300 text-xs rounded-lg p-2.5 focus:outline-none"
                >
                  {(catalog[selScheme] || []).map(prog => (
                    <option key={prog} value={prog}>{prog}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 flex-1">
                <label className="text-[10px] font-mono text-slate-400 block font-semibold">Officer Capacity</label>
                <select
                  value={selCapacity}
                  onChange={(e) => setSelCapacity(e.target.value as any)}
                  className="w-full bg-slate-850 border border-slate-750 text-slate-300 text-xs rounded-lg p-2.5 focus:outline-none"
                >
                  <option value="Principal Assessor">Principal Assessor</option>
                  <option value="Assessor">Assessor</option>
                  <option value="Co-Assessor">Co-Assessor</option>
                  <option value="Committee Member">Committee Member</option>
                </select>
              </div>

              <button
                type="button"
                onClick={addAssociationTag}
                className="bg-amber-500 text-slate-950 hover:bg-amber-400 p-2.5 rounded-lg text-xs font-bold font-sans transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>Map Association</span>
              </button>
            </div>

            {/* List mapped tags */}
            {tempAssociations.length === 0 ? (
              <p className="text-[11px] text-slate-500 font-mono italic text-center py-2.5">
                ❌ No programs mapped yet. Must map at least one above.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-2">
                {tempAssociations.map((pa, idx) => (
                  <span 
                    key={idx} 
                    className="inline-flex items-center gap-2 bg-slate-850 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-300"
                  >
                    <div>
                      <strong className="text-white block text-[11px] leading-snug">{pa.program}</strong>
                      <span className="text-[10px] text-amber-500 font-mono tracking-wider font-bold uppercase">{pa.scheme} • {pa.capacity}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAssociationTag(idx)}
                      className="text-slate-500 hover:text-rose-400 font-bold ml-1 transition-colors text-xs"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Workshop Training attended builder */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="block border-b border-slate-850 pb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block font-bold">Specialized Training Courses & Refresher Classes</span>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5 font-sans">Report certified workshops attended with exact evaluation dates.</p>
            </div>

            <div className="flex flex-col md:flex-row items-end gap-3.5 pt-1">
              <div className="space-y-1 flex-1">
                <label className="text-[10px] font-mono text-slate-400 block">Class Name</label>
                <input
                  type="text"
                  placeholder="e.g. 5th Edition Standards Transition Refresher Course"
                  value={courseNameInput}
                  onChange={(e) => setCourseNameInput(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-750 text-slate-100 text-xs rounded-lg p-2.5 focus:outline-none"
                />
              </div>

              <div className="space-y-1 w-full md:w-56">
                <label className="text-[10px] font-mono text-slate-400 block">Date of completion</label>
                <input
                  type="date"
                  value={courseDateInput}
                  onChange={(e) => setCourseDateInput(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-750 text-slate-100 text-xs rounded-lg p-2.5 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={addCourseTag}
                className="bg-slate-800 text-slate-300 hover:text-white p-2.5 rounded-lg text-xs font-bold font-sans border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>Log Training</span>
              </button>
            </div>

            {/* List logged courses tags */}
            {tempCourses.length === 0 ? (
              <p className="text-[11px] text-slate-500 font-mono italic text-center py-1">
                No workshops declared yet (Optional).
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1 font-mono">
                {tempCourses.map((c, idx) => (
                  <span 
                    key={idx} 
                    className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-[11px] shadow-sm animate-in zoom-in-95 duration-200"
                  >
                    <span>{c.courseName} <span className="text-amber-400 font-bold ml-1">• Date Completed: {c.date}</span></span>
                    <button
                      type="button"
                      onClick={() => removeCourseTag(idx)}
                      className="text-slate-500 hover:text-rose-400 font-bold font-sans text-xs ml-1 hover:scale-110 transition-transform"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Document Attachments */}
          <div className="bg-slate-955 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              <span className="bg-slate-900 border border-slate-800 text-amber-500 font-mono text-[10px] h-5 w-5 rounded-full flex items-center justify-center font-bold">04</span>
              <span>Individual Registration Document Checklist</span>
            </h3>
            
            <DocumentSection
              biographyDocs={tempBiographyDocs}
              otherDocs={tempOtherDocs}
              onUploadBiography={(doc) => setTempBiographyDocs(prev => [...prev, doc])}
              onDeleteBiography={(id) => setTempBiographyDocs(prev => prev.filter(d => d.id !== id))}
              onUploadOther={(doc) => setTempOtherDocs(prev => [...prev, doc])}
              onDeleteOther={(id) => setTempOtherDocs(prev => prev.filter(d => d.id !== id))}
              readOnly={false}
            />
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-800">
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans text-sm font-bold tracking-tight px-6 py-3 rounded-lg shadow-md transition-all cursor-pointer"
            >
              Add Assessor Record to Database
            </button>
          </div>

        </form>
      )}

      {/* Tab Panel 2: Bulk CSV Excel Sheet Parsing */}
      {adminTab === 'bulk' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-6">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">Excel / CSV Directory Bulk Importer</h3>
              <p className="text-xs text-slate-400 mt-0.5">Accepts spreadsheets in .xlsx, .xls, or .csv. Maps headers on-the-fly and processes bulk records in memory.</p>
            </div>
            <Upload className="h-5 w-5 text-amber-500" />
          </div>

          {/* Upload Drop Zone Container */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-750 hover:border-amber-500 rounded-xl p-8 text-center bg-slate-950/40 hover:bg-slate-950/80 transition-all cursor-pointer select-none group"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              onChange={handleExcelFileSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center space-y-3">
              <Upload className="h-10 w-10 text-slate-500 group-hover:text-amber-500 transition-colors" />
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-300 block">
                  {excelFile ? `Selected: ${excelFile.name}` : 'Drag & Drop sheet or click to browse'}
                </span>
                <span className="text-[10px] font-mono text-slate-500 block">Supports .xlsx, .xls, and .csv formats</span>
              </div>
            </div>
          </div>

          {importStatus && (
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-amber-500 tracking-normal break-all">
              🔔 {importStatus}
            </div>
          )}

          {/* Mapper Section if excel parse success to map fields */}
          {excelRows.length > 0 && excelHeaders.length > 0 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="bg-slate-950 p-4 border border-slate-800 rounded-lg space-y-3">
                <div className="border-b border-slate-850 pb-2">
                  <span className="text-xs font-bold font-mono text-slate-300 uppercase tracking-widest block flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-500" />
                    <span>Table Columns Mapping Wizard</span>
                  </span>
                  <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                    Match fields in your custom spreadsheet (left columns) to our official NABH databases model attributes (dropdowns). We have prefilled similar-sounding names.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
                  {Object.keys(columnMappings).map((fieldKey) => {
                    // Prettify label tag
                    const rField = requiredFields.find(f => f.key === fieldKey);
                    const label = fieldKey.toUpperCase().replace(/([A-Z])/g, ' $1');
                    
                    return (
                      <div key={fieldKey} className="space-y-1 font-mono text-xs">
                        <span className="text-[10px] text-slate-400 block">
                          {label} {rField && <strong className="text-rose-500 font-bold">*</strong>}
                        </span>
                        <select
                          value={columnMappings[fieldKey]}
                          onChange={(e) => setColumnMappings(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                          className="w-full bg-slate-850 border border-slate-750 text-slate-300 text-[11px] rounded p-1.5 focus:outline-none"
                        >
                          <option value="">-- Let Empty / Set Default --</option>
                          {excelHeaders.map((h, hIdx) => (
                            <option key={`${h}-${hIdx}`} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Excel Preview Panel (Top 3) */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">Raw Spreadsheet Preview (Top 3 Records)</span>
                <div className="overflow-x-auto border border-slate-800 rounded-lg">
                  <table className="min-w-full divide-y divide-slate-800 text-left font-mono text-[10px] text-slate-400">
                    <thead className="bg-slate-950 text-slate-300 uppercase">
                      <tr>
                        {excelHeaders.slice(0, 7).map((h, hIdx) => <th key={`${h}-${hIdx}`} className="px-3 py-2">{h}</th>)}
                        {excelHeaders.length > 7 && <th className="px-3 py-2 text-slate-500">+{excelHeaders.length - 7} more</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 bg-slate-900/40">
                      {excelRows.slice(0, 3).map((r, i) => (
                        <tr key={i}>
                          {excelHeaders.slice(0, 7).map((h, hIdx) => <td key={`${h}-${hIdx}`} className="px-3 py-2 truncate max-w-xs">{String(r[h] || '')}</td>)}
                          {excelHeaders.length > 7 && <td className="px-3 py-2 text-slate-600">...</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Import trigger decision split keys content */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  onClick={() => handleExecuteImport('merge')}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 px-5 py-2.5 rounded-lg text-xs font-bold font-sans transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="h-4.5 w-4.5" />
                  <span>Merge (Append Sheets to LocalStorage)</span>
                </button>
                {replaceConfirmActive ? (
                  <div className="flex items-center gap-2 bg-rose-950/20 border border-slate-700 p-1.5 rounded-lg animate-in fade-in slide-in-from-right-2 duration-200">
                    <span className="text-[11px] font-mono text-rose-300 font-bold px-2">Wipe existing directory?</span>
                    <button
                      type="button"
                      onClick={() => {
                        handleExecuteImport('replace');
                        setReplaceConfirmActive(false);
                      }}
                      className="bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-1.5 rounded text-xs font-bold font-sans transition-all"
                    >
                      Yes, Overwrite Entire List
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplaceConfirmActive(false)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded text-xs font-semibold font-sans transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setReplaceConfirmActive(true)}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2.5 rounded-lg text-xs font-bold font-sans transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <RefreshCw className="h-4.5 w-4.5" />
                    <span>Replace (Overwrite Current Registry)</span>
                  </button>
                )}
              </div>

            </div>
          )}

        </div>
      )}

      {/* Tab Panel 4: Manage Programs */}
      {adminTab === 'programs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-6">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">Programs Catalog Manager</h3>
              <p className="text-xs text-slate-400 mt-0.5">Create, rename, or delete NABH programs within each Scheme. Changes persist and auto-update active assessors.</p>
            </div>
            <Award className="h-5 w-5 text-amber-500" />
          </div>

          {/* Quick Stats or Warning about Admin Privileges */}
          {!isAdmin && (
            <div className="bg-amber-150/10 border border-amber-800/40 p-4 rounded-lg text-amber-300 text-xs flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block uppercase tracking-wider mb-1">Viewer Only Mode</span>
                You can browse the registered programs under each scheme, but you must enable <strong>Admin Mode</strong> in the header to add, edit, or delete entries.
              </div>
            </div>
          )}

          {/* Scheme Tabbing for Program Manager */}
          <div className="flex border-b border-slate-800">
            {(['Accreditation', 'Certification', 'Empanelment'] as SchemeType[]).map(sc => (
              <button
                key={sc}
                type="button"
                onClick={() => {
                  setProgScheme(sc);
                  setRenamingProgram(null);
                  setDeletingProgram(null);
                  setProgramError('');
                  setProgramSuccess('');
                }}
                className={`py-2 px-4 transition-all text-xs font-mono font-bold tracking-wider uppercase border-b-2 cursor-pointer ${
                  progScheme === sc
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {sc} ({catalog[sc]?.length || 0})
              </button>
            ))}
          </div>

          {/* Notifications */}
          {programError && (
            <div className="bg-rose-950/20 border border-rose-800 p-3 rounded-lg text-rose-300 text-xs animate-in fade-in">
              {programError}
            </div>
          )}
          {programSuccess && (
            <div className="bg-emerald-950/20 border border-emerald-800 p-3 rounded-lg text-emerald-300 text-xs animate-in fade-in">
              {programSuccess}
            </div>
          )}

          {/* Create Program Panel */}
          {isAdmin && (
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-[11px] font-mono tracking-wider text-slate-300 uppercase font-bold">Create New {progScheme} Program</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Specialized Dental Center Certification"
                  value={newProgramName}
                  onChange={(e) => setNewProgramName(e.target.value)}
                  className="flex-grow bg-slate-900 border border-slate-755 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-amber-500 font-sans"
                />
                <button
                  type="button"
                  onClick={() => {
                    setProgramError('');
                    setProgramSuccess('');
                    if (!newProgramName.trim()) {
                      setProgramError('Program name cannot be empty.');
                      return;
                    }
                    const res = onCreateProgram(progScheme, newProgramName);
                    if (res) {
                      setProgramSuccess(`Successfully created program "${newProgramName.trim()}" under ${progScheme}!`);
                      setNewProgramName('');
                    } else {
                      setProgramError(`Program "${newProgramName.trim()}" already exists under ${progScheme}.`);
                    }
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create</span>
                </button>
              </div>
            </div>
          )}

          {/* Registered Programs List */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-bold">Registered Programs List</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {(catalog[progScheme] || []).map((prog, idx) => {
                const isRenaming = renamingProgram === prog;
                const isDeleting = deletingProgram === prog;
                const mappedCount = assessors.filter(a => a.programs.some(p => p.scheme === progScheme && p.program === prog)).length;

                return (
                  <div
                    key={`${prog}-${idx}`}
                    className="bg-slate-950/20 border border-slate-800/80 hover:border-slate-800 p-3.5 rounded-xl flex flex-col justify-between gap-3 transition-all"
                  >
                    {isRenaming ? (
                      <div className="space-y-2 w-full">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="w-full bg-slate-900 border border-amber-500 text-slate-200 text-xs rounded p-2 focus:outline-none"
                        />
                        <div className="flex gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setProgramError('');
                              setProgramSuccess('');
                              if (!renameValue.trim()) {
                                setProgramError('Program name cannot be empty.');
                                return;
                              }
                              const ok = onRenameProgram(progScheme, prog, renameValue);
                              if (ok) {
                                setProgramSuccess(`Successfully renamed "${prog}" to "${renameValue.trim()}"!`);
                                setRenamingProgram(null);
                              } else {
                                setProgramError(`Program name "${renameValue.trim()}" already exists or remains unchanged.`);
                              }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 text-[11px] rounded transition-colors"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setRenamingProgram(null)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 text-[11px] rounded transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-slate-200 leading-snug">{prog}</span>
                          <span className="text-[10px] block font-mono text-slate-500">
                            Assessors Empaneled: <strong className="text-amber-500">{mappedCount}</strong>
                          </span>
                        </div>
                      </div>
                    )}

                    {!isRenaming && isAdmin && (
                      <div className="flex items-center gap-2 justify-end border-t border-slate-850/50 pt-2.5 mt-1">
                        {isDeleting ? (
                          <div className="flex items-center gap-1.5 bg-rose-950/30 p-1.5 rounded border border-rose-900 animate-in fade-in">
                            <span className="text-[10px] text-rose-300 font-mono font-bold px-1">Wipe associations?</span>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteProgram(progScheme, prog);
                                setDeletingProgram(null);
                                setProgramSuccess(`Successfully deleted program "${prog}" and unmapped its assessors.`);
                              }}
                              className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingProgram(null)}
                              className="bg-slate-850 hover:bg-slate-800 text-slate-300 text-[10px] px-2 py-1 rounded cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setRenamingProgram(prog);
                                setRenameValue(prog);
                                setDeletingProgram(null);
                                setProgramError('');
                                setProgramSuccess('');
                              }}
                              className="text-[10px] font-mono text-amber-500/85 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 px-2 py-1 rounded transition-all cursor-pointer"
                            >
                              Rename
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingProgram(prog);
                                setRenamingProgram(null);
                                setProgramError('');
                                setProgramSuccess('');
                              }}
                              className="text-[10px] font-mono text-rose-400 hover:text-rose-350 bg-rose-500/10 hover:bg-rose-500/15 px-2 py-1 rounded transition-all cursor-pointer"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab Panel: Status Reasons management */}
      {adminTab === 'reasons' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-6">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">Configure Status Dropdown Reasons</h3>
              <p className="text-xs text-slate-400 mt-0.5">Control the standard lists of reasons available when placing assessors on Banned or Inactive status.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Banned reasons card */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h4 className="text-xs uppercase font-mono tracking-wider font-bold text-rose-500">🚫 Reasons for Banning</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Define standard board violations or disciplinary classifications.</p>
              </div>

              {/* Add reason form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Create standard banning reason..."
                  value={newBanReasonInput}
                  onChange={(e) => setNewBanReasonInput(e.target.value)}
                  className="flex-grow bg-slate-900 border border-slate-700 text-slate-100 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none placeholder:text-slate-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = newBanReasonInput.trim();
                    if (val) {
                      onAddBanReason(val);
                      setNewBanReasonInput('');
                    }
                  }}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-sans text-xs font-bold px-3 py-1.5 rounded cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Reasons list */}
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {banReasons.length === 0 ? (
                  <p className="text-xs font-mono text-slate-500 italic">No custom banning reasons defined.</p>
                ) : (
                  banReasons.map((reason, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-900/40 border border-slate-800/80 rounded px-3 py-2 text-xs">
                      <span className="text-slate-300 pr-2">{reason}</span>
                      <button
                        type="button"
                        onClick={() => onDeleteBanReason(reason)}
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                        title="Delete reason"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Inactive reasons card */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h4 className="text-xs uppercase font-mono tracking-wider font-bold text-amber-500">⏳ Reasons for marking Inactive</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Define typical deactivation statuses or sabbatical triggers.</p>
              </div>

              {/* Add reason form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Create standard inactive reason..."
                  value={newInactiveReasonInput}
                  onChange={(e) => setNewInactiveReasonInput(e.target.value)}
                  className="flex-grow bg-slate-900 border border-slate-700 text-slate-100 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none placeholder:text-slate-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = newInactiveReasonInput.trim();
                    if (val) {
                      onAddInactiveReason(val);
                      setNewInactiveReasonInput('');
                    }
                  }}
                  className="bg-amber-500 hover:bg-amber-450 text-slate-955 text-slate-900 font-sans text-xs font-bold px-3 py-1.5 rounded cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Reasons list */}
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {inactiveReasons.length === 0 ? (
                  <p className="text-xs font-mono text-slate-500 italic">No custom inactive reasons defined.</p>
                ) : (
                  inactiveReasons.map((reason, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-900/40 border border-slate-800/80 rounded px-3 py-2 text-xs">
                      <span className="text-slate-300 pr-2">{reason}</span>
                      <button
                        type="button"
                        onClick={() => onDeleteInactiveReason(reason)}
                        className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer"
                        title="Delete reason"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab Panel 3: Reset and Safety controls */}
      {adminTab === 'maintenance' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-6">
          <div className="border-b border-slate-800 pb-3 flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-rose-500" />
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">Board Danger Maintenance Block</h3>
              <p className="text-xs text-slate-400 mt-0.5">Global configuration modifiers and sandbox wipe scripts. Restricted workspace privileges apply.</p>
            </div>
          </div>

          {importStatus && importStatus.includes("Database reset") && (
            <div className="bg-emerald-950/40 border border-emerald-800 p-3.5 rounded-lg text-emerald-300 text-xs flex items-center gap-2 select-none animate-in fade-in duration-300">
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
              <span>{importStatus}</span>
            </div>
          )}

          <div className="bg-rose-950/20 border border-rose-900/60 rounded-xl p-5 space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs uppercase font-mono tracking-wider font-bold text-rose-300">Option 1: Hard Factory Reset Database</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Will erase standard local storage variables and bulk spreadsheet overrides entirely. Restores the registry back to its pristine default pre-populated list of 8 authentic Indian medical assessors as delivered by the sandbox initial repository.
              </p>
            </div>

            <div className="flex flex-col items-end gap-3.5">
              {resetConfirmActive ? (
                <div className="flex items-center gap-2 bg-rose-950/40 p-2.5 rounded-lg border border-rose-800 animate-in fade-in duration-200">
                  <span className="text-xs text-rose-300 font-mono font-bold px-1">Absolutely sure? This clears all overrides!</span>
                  <button
                    type="button"
                    onClick={() => {
                      onResetDatabase();
                      setResetConfirmActive(false);
                      setImportStatus("Database reset successfully completed. Default assessor roster restored successfully.");
                    }}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-sans text-xs font-bold px-3 py-1.5 rounded"
                  >
                    Yes, Reset Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetConfirmActive(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-350 px-3 py-1.5 rounded text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setResetConfirmActive(true)}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-sans text-xs font-bold px-4 py-2 rounded-lg shadow transition-all cursor-pointer"
                >
                  Execute Database Wipe & Reset
                </button>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
