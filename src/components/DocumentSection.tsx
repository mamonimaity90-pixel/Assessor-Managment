import React, { useState, useRef } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Trash2, 
  Eye, 
  FileCheck, 
  FileCode,
  Sparkles,
  Download,
  AlertCircle,
  X
} from 'lucide-react';
import { AssessorDocument } from '../types';

interface DocumentSectionProps {
  biographyDocs: AssessorDocument[];
  otherDocs: AssessorDocument[];
  onUploadBiography: (doc: AssessorDocument) => void;
  onDeleteBiography: (id: string) => void;
  onUploadOther: (doc: AssessorDocument) => void;
  onDeleteOther: (id: string) => void;
  readOnly?: boolean;
}

export default function DocumentSection({
  biographyDocs = [],
  otherDocs = [],
  onUploadBiography,
  onDeleteBiography,
  onUploadOther,
  onDeleteOther,
  readOnly = false
}: DocumentSectionProps) {
  const bioInputRef = useRef<HTMLInputElement>(null);
  const otherInputRef = useRef<HTMLInputElement>(null);

  const [bioDragActive, setBioDragActive] = useState(false);
  const [otherDragActive, setOtherDragActive] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<AssessorDocument | null>(null);

  const handleFileProcess = (file: File, category: 'biography' | 'other') => {
    const reader = new FileReader();
    reader.onload = () => {
      const doc: AssessorDocument = {
        id: 'doc_' + Math.random().toString(36).substring(2, 9),
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type || 'application/octet-stream',
        date: new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        dataUrl: reader.result as string
      };

      if (category === 'biography') {
        onUploadBiography(doc);
      } else {
        onUploadOther(doc);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, category: 'biography' | 'other') => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: any) => handleFileProcess(file as File, category));
    }
  };

  // Drag handers
  const handleDrag = (e: React.DragEvent, category: 'biography' | 'other', active: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (category === 'biography') {
      setBioDragActive(active);
    } else {
      setOtherDragActive(active);
    }
  };

  const handleDrop = (e: React.DragEvent, category: 'biography' | 'other') => {
    e.preventDefault();
    e.stopPropagation();
    if (category === 'biography') {
      setBioDragActive(false);
    } else {
      setOtherDragActive(false);
    }

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: any) => handleFileProcess(file as File, category));
    }
  };

  const getFileIcon = (mime: string) => {
    if (mime.includes('pdf')) return <FileText className="h-7 w-7 text-rose-500" />;
    if (mime.includes('image')) return <FileCheck className="h-7 w-7 text-emerald-500" />;
    if (mime.includes('word') || mime.includes('officedocument')) return <FileText className="h-7 w-7 text-blue-500" />;
    return <FileCode className="h-7 w-7 text-amber-500" />;
  };

  const startDownload = (doc: AssessorDocument) => {
    const link = document.createElement('a');
    link.href = doc.dataUrl;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Informational Header */}
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-600 text-xs shadow-sm">
        <Sparkles className="h-4.5 w-4.5 text-blue-600 shrink-0" />
        <div>
          <span className="font-bold text-slate-800">Dynamic Document Registry:</span> Upload biography, undertakings, academic qualifying degrees, and licenses. Documents are retained safely in local database memory.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Section 1: Biographies and Undertakings */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Section 1: Biographies & Undertakings</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">{biographyDocs.length} files</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3.5 leading-relaxed">Publish narrative bios, signed quality pledges, code of ethics, or personal undertakings.</p>

            {/* List */}
            {biographyDocs.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg bg-slate-50/50 mb-4 font-mono text-[11px] text-slate-400">
                No custom biography or undertaking paperwork registered.
              </div>
            ) : (
              <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
                {biographyDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between bg-slate-50 border border-slate-150 p-2.5 rounded-lg hover:border-slate-300 transition-all shadow-xs">
                    <div className="flex items-center space-x-2.5 truncate flex-1 min-w-0">
                      {getFileIcon(doc.type)}
                      <div className="truncate min-w-0">
                        <div className="text-xs font-bold text-slate-700 truncate" title={doc.name}>{doc.name}</div>
                        <div className="text-[9px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>{doc.size}</span>
                          <span className="text-slate-300">•</span>
                          <span>{doc.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 ml-2.5">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Instant Preview Attachment"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => startDownload(doc)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                        title="Download Attachment file"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => onDeleteBiography(doc.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                          title="Purge Document"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload Widget */}
          {!readOnly && (
            <div 
              onDragOver={(e) => handleDrag(e, 'biography', true)}
              onDragLeave={(e) => handleDrag(e, 'biography', false)}
              onDrop={(e) => handleDrop(e, 'biography')}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                bioDragActive 
                  ? 'border-amber-500 bg-amber-50/20' 
                  : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/50'
              }`}
              onClick={() => bioInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={bioInputRef}
                onChange={(e) => handleFileChange(e, 'biography')}
                multiple
                className="hidden" 
              />
              <UploadCloud className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
              <div className="text-xs font-bold text-slate-700">Drag or click to upload bios / undertakings</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF, DOCX, JPEG, PNG</p>
            </div>
          )}
        </div>

        {/* Section 2: Other Qualifications and Credentials */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Section 2: Qualifications & ID Proofs</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">{otherDocs.length} files</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3.5 leading-relaxed">Attach degrees, medical board certificate registrations, verification proofs or ID proofs.</p>

            {/* List */}
            {otherDocs.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg bg-slate-50/50 mb-4 font-mono text-[11px] text-slate-400">
                No qualifications degrees or identity verification documents loaded.
              </div>
            ) : (
              <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
                {otherDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between bg-slate-50 border border-slate-150 p-2.5 rounded-lg hover:border-slate-300 transition-all shadow-xs">
                    <div className="flex items-center space-x-2.5 truncate flex-1 min-w-0">
                      {getFileIcon(doc.type)}
                      <div className="truncate min-w-0">
                        <div className="text-xs font-bold text-slate-700 truncate" title={doc.name}>{doc.name}</div>
                        <div className="text-[9px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>{doc.size}</span>
                          <span className="text-slate-300">•</span>
                          <span>{doc.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 ml-2.5">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Instant Preview Attachment"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => startDownload(doc)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                        title="Download Attachment file"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => onDeleteOther(doc.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                          title="Purge Document"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload Widget */}
          {!readOnly && (
            <div 
              onDragOver={(e) => handleDrag(e, 'other', true)}
              onDragLeave={(e) => handleDrag(e, 'other', false)}
              onDrop={(e) => handleDrop(e, 'other')}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                otherDragActive 
                  ? 'border-amber-500 bg-amber-50/20' 
                  : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/50'
              }`}
              onClick={() => otherInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={otherInputRef}
                onChange={(e) => handleFileChange(e, 'other')}
                multiple
                className="hidden" 
              />
              <UploadCloud className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
              <div className="text-xs font-bold text-slate-700">Drag or click to upload credentials / ID proofs</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF, DOCX, JPEG, PNG</p>
            </div>
          )}
        </div>

      </div>

      {/* Attachment Simulated Lightbox Previewer */}
      {previewDoc && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-850 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            
            <div className="flex items-center justify-between p-4 border-b border-slate-850 bg-slate-900">
              <div className="flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-amber-500" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-100">{previewDoc.name}</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => startDownload(previewDoc)}
                  className="bg-slate-800 hover:bg-slate-700 font-mono text-[10px] text-slate-300 font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Download className="h-3 w-3 text-amber-500" /> Download {previewDoc.size}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="text-slate-450 text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-900 p-6 overflow-y-auto flex items-center justify-center min-h-[300px]">
              {previewDoc.type.includes('image') ? (
                <div className="text-center">
                  <img 
                    src={previewDoc.dataUrl} 
                    alt={previewDoc.name} 
                    className="max-h-[50vh] max-w-full rounded-lg border border-slate-800 object-contain shadow-md"
                    referrerPolicy="no-referrer"
                  />
                  <p className="text-[10px] text-slate-500 font-mono mt-3">Image dimensions may scale to fit the viewport.</p>
                </div>
              ) : (
                <div className="text-center max-w-md p-6 bg-slate-950 rounded-xl border border-slate-850 shadow-inner">
                  <FileText className="h-16 w-16 text-amber-500/80 mx-auto mb-4 animate-pulse" />
                  <h4 className="text-slate-100 font-bold text-sm">Inline Preview Simulator</h4>
                  <p className="text-slate-400 text-xs mt-2.5 leading-relaxed font-sans">
                    Document formatted as <strong className="font-mono text-slate-200">{previewDoc.type}</strong>. 
                    Due to sandboxed browser security, download the file to view the full verified signature, quality seals, and certificates offline.
                  </p>
                  
                  <div className="bg-slate-900/60 font-mono text-[9px] text-slate-500 p-3 rounded border border-slate-850 mt-4 text-left space-y-1">
                    <div>FILE ID: {previewDoc.id}</div>
                    <div>SIZE METRIC: {previewDoc.size}</div>
                    <div>REGISTRY TIMESTAMP: {previewDoc.date}</div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => startDownload(previewDoc)}
                    className="mt-5 w-full bg-amber-500 text-slate-950 hover:bg-amber-405 hover:bg-amber-400 font-sans font-bold text-xs py-2 rounded-lg transition-all shadow cursor-pointer"
                  >
                    Download and Open Official Copy
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
