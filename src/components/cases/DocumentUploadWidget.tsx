/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Paperclip, 
  Upload, 
  FileText, 
  X, 
  CheckCircle2, 
  AlertCircle,
  File,
  Loader2,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';

interface DocumentUploadWidgetProps {
  caseId: string;
  onUploadComplete?: () => void;
}

export default function DocumentUploadWidget({ caseId, onUploadComplete }: DocumentUploadWidgetProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fileCategory, setFileCategory] = useState('other');

  const categories = [
    { id: 'pleading', label: 'لائحة/مذكرة' },
    { id: 'evidence', label: 'بينة/مستند' },
    { id: 'judgment', label: 'صك حكم' },
    { id: 'poa', label: 'وكالة شرعية' },
    { id: 'other', label: 'أخرى' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)');
        return;
      }
      setSelectedFile(file);
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !caseId) return;

    setIsUploading(true);
    setUploadProgress(10);
    setError(null);

    try {
      // 1. Upload to Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${caseId}/${Date.now()}.${fileExt}`;
      const filePath = `case-attachments/${fileName}`;

      setUploadProgress(30);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      setUploadProgress(60);

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      setUploadProgress(80);

      // 3. Save Record to Database (attachments table)
      const { error: dbError } = await supabase
        .from('attachments')
        .insert({
          id: crypto.randomUUID(),
          case_id: caseId,
          file_name: selectedFile.name,
          file_size: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
          file_url: publicUrl,
          category: fileCategory,
          uploaded_at: new Date().toISOString()
        });

      if (dbError) throw dbError;

      setUploadProgress(100);
      setSuccess(true);
      setSelectedFile(null);
      if (onUploadComplete) onUploadComplete();
      
      setTimeout(() => setSuccess(false), 3000);

    } catch (err: any) {
      console.error('[Upload Error]', err);
      setError(err.message || 'حدث خطأ أثناء الرفع');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="bg-[#0a1628] border-2 border-slate-100 rounded-3xl p-6 shadow-sm font-sans" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
          <Paperclip className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900 leading-tight">أرشفة وإيداع المستندات</h3>
          <p className="text-[10px] text-slate-500 font-bold mt-0.5">ارفع أوراق القضية والبينات بصورة آمنة ومفرزة.</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Category Picker */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFileCategory(cat.id)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-black transition-all ${
                fileCategory === cat.id
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-[#0a1628] text-slate-500 border-[#1e3a5f] hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* File Dropzone / Selector */}
        <div className="relative border-2 border-dashed border-[#1e3a5f] rounded-2xl p-6 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center text-center group">
          <input
            type="file"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.csv,.xlsx"
          />
          
          {selectedFile ? (
            <div className="flex flex-col items-center gap-2">
              <File className="w-8 h-8 text-emerald-500" />
              <p className="text-xs font-black text-slate-900">{selectedFile.name}</p>
              <p className="text-[10px] text-slate-500 font-bold">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <>
              <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-500 transition-colors mb-2" />
              <p className="text-sm font-black text-slate-700">اضغط أو اسحب الملف هنا</p>
              <p className="text-[10px] text-slate-400 mt-1">يدعم PDF, Word, Excel, Images (Max 10MB)</p>
            </>
          )}
        </div>

        {/* Status Indicators */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-3 py-2 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-bold"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-600 text-xs font-bold"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تم حفظ وإيداع المستند بنجاح</span>
            </motion.div>
          )}

          {isUploading && (
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  className="bg-emerald-500 h-full"
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>{uploadProgress}%</span>
                <span>جاري الرفع والأرشفة...</span>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Save/Upload Action Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="bg-transparent border-2 border-emerald-500 text-emerald-600 font-extrabold py-2.5 px-6 rounded-xl text-sm transition-all hover:bg-emerald-500 hover:text-white flex items-center justify-center gap-2 outline-none disabled:opacity-50 shadow-sm w-full"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Database className="w-4 h-4" />
          )}
          <span>{isUploading ? 'جاري الحفظ الآمن...' : 'تأكيد الحفظ في الأرشيف'}</span>
        </button>
      </div>
    </div>
  );
}
