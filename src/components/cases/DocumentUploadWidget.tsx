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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
    <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-sm font-sans" dir="rtl">
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
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border-2 ${
                fileCategory === cat.id
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                  : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Upload Area */}
        <div 
          className={`relative border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3 text-center ${
            selectedFile 
              ? 'border-emerald-500 bg-emerald-50/20' 
              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          <input
            type="file"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          
          {selectedFile ? (
            <>
              <div className="p-3 bg-white rounded-full shadow-sm text-emerald-600">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 truncate max-w-[200px]">
                  {selectedFile.name}
                </p>
                <p className="text-[10px] text-slate-500 font-bold">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
                className="absolute top-2 left-2 p-1.5 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-rose-500 transition-colors"
                title="إلغاء الملف"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <div className="p-3 bg-white rounded-full shadow-sm text-slate-400">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">اضغط للرفع أو اسحب الملف هنا</p>
                <p className="text-[10px] text-slate-500 font-bold mt-1"> PDF, JPEG, PNG (بحد أقصى 10MB)</p>
              </div>
            </>
          )}
        </div>

        {/* Progress Bar */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black text-slate-600">
              <span>جاري المعالجة والأرشفة...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                className="h-full bg-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Status Messages */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 text-[10px] font-bold"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
          {success && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-[10px] font-bold"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>تم رفع الملف وأرشفته في ملف القضية بنجاح!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className={`w-full py-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${
            !selectedFile || isUploading
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : 'bg-slate-950 text-white hover:bg-slate-800'
          }`}
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          ) : (
            <Database className="w-4 h-4 text-emerald-400" />
          )}
          <span>{isUploading ? 'جاري الحفظ الآمن...' : 'تأكيد الحفظ في الأرشيف'}</span>
        </button>
      </div>
    </div>
  );
}
