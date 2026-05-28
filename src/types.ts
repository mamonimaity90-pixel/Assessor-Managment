/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SchemeType = 'Accreditation' | 'Certification' | 'Empanelment';

export type DesignationType = 'Principal Assessor' | 'Co assessor' | 'Observer' | 'Committee member';

export type JobRoleType = 'Clinician' | 'Nurse' | 'Administrator';

export type AssessorStatusType = 'Active' | 'Inactive' | 'Banned' | 'Expired';

export interface StatusLogEntry {
  id: string;
  timestamp: string;
  statusFrom: AssessorStatusType;
  statusTo: AssessorStatusType;
  remarks: string;
  dateOfChange: string; // Date of deactivation, ban, or reinstatement
}

export interface RoleProgressionLog {
  id: string;
  scheme: SchemeType;
  program: string;
  roleFrom: string;
  roleTo: string;
  effectiveDate: string;
  remarks?: string;
  timestamp: string;
}

export interface AssessorDocument {
  id: string;
  name: string;
  size: string;
  type: string;
  date: string;
  dataUrl: string; // Base64 data URL
}

export interface CourseAttended {
  courseName: string;
  date: string;
}

export interface ProgramAssociation {
  scheme: SchemeType;
  program: string;
  capacity: 'Principal Assessor' | 'Assessor' | 'Co-Assessor' | 'Committee Member';
}

export interface Assessor {
  sNo: number;
  assessorId: string;
  certificateNo: string;
  name: string;
  email: string;
  contactNumber: string;
  city: string;
  state: string;
  pincode: string;
  dob: string;
  designation: DesignationType;
  jobRole: JobRoleType;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  officialAddress: string;
  residentialAddress: string;
  qualification: string;
  specialization: string;
  dateOfEmpanelment?: string;
  empaneledYear: number;
  status: AssessorStatusType;
  banReason?: string;
  courses: CourseAttended[];
  programs: ProgramAssociation[];
  statusLogs?: StatusLogEntry[];
  roleProgression?: RoleProgressionLog[];
  biographyDocs?: AssessorDocument[];
  otherDocs?: AssessorDocument[];
}

// Full 20-25 NABH programs catalog
export const NABH_SCHEMES_CATALOG: Record<SchemeType, string[]> = {
  Accreditation: [
    'Hospitals (Full Accreditation)',
    'Small Healthcare Organizations (SHCO)',
    'Blood Centres / Blood Banks',
    'Medical Imaging Services (MIS)',
    'Dental Healthcare Service Providers',
    'AYUSH Hospitals',
    'Eye Care Providers',
    'Clinical Trial Sites'
  ],
  Certification: [
    'Pre-Accreditation Entry Level Hospitals',
    'Pre-Accreditation Entry Level SHCO',
    'Nursing Excellence Certification',
    'Emergency Department Certification',
    'Medical Laboratory Programme',
    'AYUSH Entry Level Certification',
    'Digital Health Standards Certification'
  ],
  Empanelment: [
    'CGHS Empanelment Scheme',
    'ECHS Empanelment Scheme',
    'State Government Insurance Empanelment',
    'Specialized Medical Center Empanelment'
  ]
};

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Puducherry', 'Jammu & Kashmir'
];

export const INITIAL_ASSESSORS: Assessor[] = [
  {
    sNo: 1,
    assessorId: "NABH-AS-2015-081",
    certificateNo: "NABH/CERT/9810",
    name: "Dr. Rajesh Kumar Sharma",
    email: "rajesh.sharma@aims.org",
    contactNumber: "9810234567",
    city: "New Delhi",
    state: "Delhi",
    pincode: "110029",
    dob: "1972-04-12",
    designation: "Principal Assessor",
    jobRole: "Clinician",
    age: 54,
    gender: "Male",
    officialAddress: "Department of Hospital Administration, AIIMS, Safdarjung Enclave, New Delhi - 110029",
    residentialAddress: "Flat 4B, Sector 15, Rohini, New Delhi - 110085",
    qualification: "MBBS, MS (General Surgery), MHA (Hospital Administration)",
    specialization: "General Surgery",
    dateOfEmpanelment: "2015-05-12",
    empaneledYear: 2015,
    status: "Active",
    courses: [
      { courseName: "NABH Assessor Training Course on 5th Edition Standards", date: "2019-05-14" },
      { courseName: "Medical Imaging Services (MIS) Specialist Course", date: "2021-09-10" }
    ],
    programs: [
      { scheme: "Accreditation", program: "Hospitals (Full Accreditation)", capacity: "Principal Assessor" },
      { scheme: "Accreditation", program: "Medical Imaging Services (MIS)", capacity: "Assessor" }
    ],
    roleProgression: [
      {
        id: "RP-081-1",
        scheme: "Accreditation",
        program: "Hospitals (Full Accreditation)",
        roleFrom: "Co-Assessor",
        roleTo: "Principal Assessor",
        effectiveDate: "2019-06-01",
        remarks: "Promoted to Principal Assessor after successfully passing the 5th Edition Conversion certification.",
        timestamp: "2019-06-01T10:00:00Z"
      }
    ],
    biographyDocs: [],
    otherDocs: []
  },
  {
    sNo: 2,
    assessorId: "NABH-AS-2018-104",
    certificateNo: "NABH/CERT/1014",
    name: "Dr. Meenakshi Iyer",
    email: "meenakshi.iyer@apollo.co.in",
    contactNumber: "9444056789",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600006",
    dob: "1979-08-25",
    designation: "Co assessor",
    jobRole: "Nurse",
    age: 46,
    gender: "Female",
    officialAddress: "Apollo Hospitals, Greams Road, Thousand Lights, Chennai - 600006",
    residentialAddress: "New No. 12, Sriman Srinivasa Road, Alwarpet, Chennai - 600018",
    qualification: "B.Sc (Nursing), M.Sc (Nursing), PhD in Healthcare Quality",
    specialization: "Nursing Excellence",
    dateOfEmpanelment: "2018-11-05",
    empaneledYear: 2018,
    status: "Active",
    courses: [
      { courseName: "NABH Nursing Excellence Standard Training", date: "2018-11-05" },
      { courseName: "5th Edition Assessor Conversion Programme", date: "2020-02-18" }
    ],
    programs: [
      { scheme: "Certification", program: "Nursing Excellence Certification", capacity: "Principal Assessor" },
      { scheme: "Accreditation", program: "Hospitals (Full Accreditation)", capacity: "Assessor" }
    ],
    roleProgression: [
      {
        id: "RP-104-1",
        scheme: "Certification",
        program: "Nursing Excellence Certification",
        roleFrom: "Co-Assessor",
        roleTo: "Principal Assessor",
        effectiveDate: "2021-01-15",
        remarks: "Elevated to Principal status following consecutive flawless audits peer reviews.",
        timestamp: "2021-01-15T14:30:00Z"
      }
    ],
    biographyDocs: [],
    otherDocs: []
  },
  {
    sNo: 3,
    assessorId: "NABH-AS-2016-012",
    certificateNo: "NABH/CERT/8721",
    name: "Dr. Aniruddh S. Kulkarni",
    email: "aniruddh.kulkarni@gmail.com",
    contactNumber: "9822012345",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411004",
    dob: "1965-11-30",
    designation: "Committee member",
    jobRole: "Clinician",
    age: 60,
    gender: "Male",
    officialAddress: "Kulkarni Diagnostics, Bhandarkar Road, Deccan Gymkhana, Pune - 411004",
    residentialAddress: "Rowhouse No. 5, Silver Oak Apartments, Aundh, Pune - 411007",
    qualification: "MBBS, MD (Pathology), DCP",
    specialization: "Pathology",
    dateOfEmpanelment: "2014-04-18",
    empaneledYear: 2014,
    status: "Inactive",
    banReason: "Voluntarily inactive due to health reasons (retired from intensive active field duties)",
    courses: [
      { courseName: "ISO 15189 & NABH Lab Program Standard Alignment", date: "2016-08-12" },
      { courseName: "Assessor Refresher Program on Emergency Department Standards", date: "2019-10-22" }
    ],
    programs: [
      { scheme: "Certification", program: "Medical Laboratory Programme", capacity: "Principal Assessor" },
      { scheme: "Certification", program: "Emergency Department Certification", capacity: "Assessor" }
    ],
    statusLogs: [
      {
        id: "LOG-INIT-1",
        timestamp: "2023-05-15T09:00:00Z",
        statusFrom: "Active",
        statusTo: "Inactive",
        remarks: "Voluntarily inactive due to health reasons (retired from intensive active field duties)",
        dateOfChange: "2023-05-15"
      }
    ],
    biographyDocs: [],
    otherDocs: []
  },
  {
    sNo: 4,
    assessorId: "NABH-AS-2022-311",
    certificateNo: "NABH/CERT/1209",
    name: "Dr. Priya Sen Gupta",
    email: "priya.sengupta@rubyhall.com",
    contactNumber: "9830055221",
    city: "Kolkata",
    state: "West Bengal",
    pincode: "700029",
    dob: "1983-01-15",
    designation: "Co assessor",
    jobRole: "Clinician",
    age: 43,
    gender: "Female",
    officialAddress: "Ruby General Hospital, Kasba Connector, EM Bypass, Kolkata - 700107",
    residentialAddress: "Flat 2A, Gariahat Road South, Jodhpur Park, Kolkata - 700068",
    qualification: "MBBS, MS (Ophthalmology), Fellow-AEH",
    specialization: "Ophthalmology",
    dateOfEmpanelment: "2022-02-15",
    empaneledYear: 2022,
    status: "Active",
    courses: [
      { courseName: "Eye Care Provider Specific Assessor Training", date: "2022-03-08" },
      { courseName: "Pre-Accreditation Standards Training", date: "2023-01-11" }
    ],
    programs: [
      { scheme: "Accreditation", program: "Eye Care Providers", capacity: "Assessor" },
      { scheme: "Certification", program: "Pre-Accreditation Entry Level Hospitals", capacity: "Co-Assessor" }
    ],
    biographyDocs: [],
    otherDocs: []
  },
  {
    sNo: 5,
    assessorId: "NABH-AS-2012-005",
    certificateNo: "NABH/CERT/7722",
    name: "Dr. Gurpreet Singh Sandhu",
    email: "gurpreet.sandhu@fortis.com",
    contactNumber: "9814099881",
    city: "Mohali",
    state: "Punjab",
    pincode: "160062",
    dob: "1960-03-02",
    designation: "Principal Assessor",
    jobRole: "Clinician",
    age: 66,
    gender: "Male",
    officialAddress: "Fortis Hospital, Sector 62, Phase VIII, Sahibzada Ajit Singh Nagar, Mohali - 160062",
    residentialAddress: "Sector 11-A, Chandigarh - 160011",
    qualification: "MBBS, MD (Medicine), DM (Cardiology), FACC",
    specialization: "Cardiology",
    dateOfEmpanelment: "2012-08-01",
    empaneledYear: 2012,
    status: "Banned",
    banReason: "Flagrant conflict of interest: Consulting privately with active assessment candidate sites without disclosing board affiliation.",
    courses: [
      { courseName: "NABH Elite Ethics & Assessment Integrity Course", date: "2013-09-02" },
      { courseName: "Full Program Quality Implementation Standard Course", date: "2015-11-20" }
    ],
    programs: [
      { scheme: "Accreditation", program: "Hospitals (Full Accreditation)", capacity: "Principal Assessor" },
      { scheme: "Empanelment", program: "CGHS Empanelment Scheme", capacity: "Principal Assessor" }
    ],
    statusLogs: [
      {
        id: "LOG-INIT-2",
        timestamp: "2024-09-12T11:45:00Z",
        statusFrom: "Active",
        statusTo: "Banned",
        remarks: "Flagrant conflict of interest: Consulting privately with active assessment candidate sites without disclosing board affiliation.",
        dateOfChange: "2024-09-12"
      }
    ],
    biographyDocs: [],
    otherDocs: []
  },
  {
    sNo: 6,
    assessorId: "NABH-AS-2020-192",
    certificateNo: "NABH/CERT/1105",
    name: "Dr. Swathi K. Reddy",
    email: "swathi.reddy@ayurveda-care.org",
    contactNumber: "8048201234",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560011",
    dob: "1981-07-10",
    designation: "Observer",
    jobRole: "Clinician",
    age: 44,
    gender: "Female",
    officialAddress: "Sri Sri College of Ayurvedic Science, Kanakapura Road, Udayapura, Bengaluru - 560082",
    residentialAddress: "Narayana Block, Jayanagar 4th T Block, Bengaluru - 560041",
    qualification: "BAMS, MD (Ayurveda), PhD (Panchakarma)",
    specialization: "Ayurveda",
    dateOfEmpanelment: "2020-10-05",
    empaneledYear: 2020,
    status: "Active",
    courses: [
      { courseName: "NABH Assessor Training on AYUSH Hospitals Standard", date: "2020-08-25" },
      { courseName: "AYUSH Entry Level Certification Orientation", date: "2021-03-12" }
    ],
    programs: [
      { scheme: "Accreditation", program: "AYUSH Hospitals", capacity: "Principal Assessor" },
      { scheme: "Certification", program: "AYUSH Entry Level Certification", capacity: "Assessor" }
    ],
    biographyDocs: [],
    otherDocs: []
  },
  {
    sNo: 7,
    assessorId: "NABH-AS-2021-267",
    certificateNo: "NABH/CERT/1183",
    name: "Dr. Vikram Pradhan",
    email: "vikram.pradhan@dentalexcel.com",
    contactNumber: "9826071425",
    city: "Indore",
    state: "Madhya Pradesh",
    pincode: "452001",
    dob: "1985-09-18",
    designation: "Co assessor",
    jobRole: "Clinician",
    age: 40,
    gender: "Male",
    officialAddress: "Modern Dental College & Hospital, Gandhinagar, Indore - 452005",
    residentialAddress: "Sch. No. 114, Vijay Nagar, Indore - 452010",
    qualification: "BDS, MDS (Periodontics), PGDHM (Hospital Management)",
    specialization: "Periodontics",
    dateOfEmpanelment: "2021-03-22",
    empaneledYear: 2021,
    status: "Active",
    courses: [
      { courseName: "NABH Technical Assessor Orientation for Dental Clinics", date: "2021-06-20" }
    ],
    programs: [
      { scheme: "Accreditation", program: "Dental Healthcare Service Providers", capacity: "Assessor" }
    ],
    biographyDocs: [],
    otherDocs: []
  },
  {
    sNo: 8,
    assessorId: "NABH-AS-2017-098",
    certificateNo: "NABH/CERT/9546",
    name: "Dr. Suresh Chand Verma",
    email: "suresh.verma@cghs.nic.in",
    contactNumber: "9910411223",
    city: "Lucknow",
    state: "Uttar Pradesh",
    pincode: "226001",
    dob: "1968-02-15",
    designation: "Committee member",
    jobRole: "Administrator",
    age: 58,
    gender: "Male",
    officialAddress: "CGHS Wellness Centre, Pragati Vihar, Lucknow - 226010",
    residentialAddress: "Sector A, Aliganj Housing Board Colony, Lucknow - 226024",
    qualification: "MBBS, MD (Community Medicine)",
    specialization: "Community Medicine",
    dateOfEmpanelment: "2017-06-18",
    empaneledYear: 2017,
    status: "Active",
    courses: [
      { courseName: "Empanelment Guidelines & Compliance Standards Workshop", date: "2017-10-15" },
      { courseName: "NABH-CGHS Joint Audits Refresher Programme", date: "2022-11-04" }
    ],
    programs: [
      { scheme: "Empanelment", program: "CGHS Empanelment Scheme", capacity: "Principal Assessor" },
      { scheme: "Empanelment", program: "State Government Insurance Empanelment", capacity: "Assessor" }
    ],
    biographyDocs: [],
    otherDocs: []
  }
];
