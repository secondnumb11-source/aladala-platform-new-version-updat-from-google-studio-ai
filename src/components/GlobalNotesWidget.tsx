import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Edit3, X, Sun, Moon, Maximize2, Minimize2, Save, Check, Plus, Trash2, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const COLORS = [
  { id: 'yellow', bg: 'bg-yellow-200', text: 'text-yellow-950', border: 'border-yellow-300' },
  { id: 'blue', bg: 'bg-blue-200', text: 'text-blue-950', border: 'border-blue-300' },
  { id: 'green', bg: 'bg-green-200', text: 'text-green-950', border: 'border-green-300' },
  { id: 'pink', bg: 'bg-pink-200', text: 'text-pink-950', border: 'border-pink-300' },
  { id: 'purple', bg: 'bg-purple-200', text: 'text-purple-950', border: 'border-purple-300' },
  { id: 'dark', bg: 'bg-slate-900', text: 'text-white', border: 'border-slate-700' },
  { id: 'light', bg: 'bg-white', text: 'text-slate-800', border: 'border-slate-200' },
];

interface Note {
  id: string;
  user_id: string;
  note_text: string;
  created_at: string;
  updated_at: string;
}

export default function GlobalNotesWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  
  useEffect(() => {
    const fetchNotes = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) setNotes(data as any as Note[]);
    };

    fetchNotes();

    const chId = `notes_channel_${Math.random().toString(36).substring(7)}`;
    const channel = supabase.channel(chId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => fetchNotes())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  const [currentText, setCurrentText] = useState('');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(notes.length > 0 ? notes[0].id : null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(320);
  const [height, setHeight] = useState(380);
  const [isSaved, setIsSaved] = useState(false);
  const [showList, setShowList] = useState(notes.length === 0);
  
  useEffect(() => {
    if (activeNoteId) {
      const n = notes.find(n => n.id === activeNoteId);
      if (n) setCurrentText(n.note_text);
    } else {
      setCurrentText('');
    }
  }, [activeNoteId, notes]);

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (activeNoteId) {
      await supabase.from('notes').update({ 
        note_text: currentText,
        updated_at: new Date().toISOString()
      }).eq('id', activeNoteId);
    } else {
      const { data } = await supabase.from('notes').insert({
        user_id: user.id,
        note_text: currentText,
      }).select().single();
      if (data) setActiveNoteId(data.id);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleNewNote = () => {
    setActiveNoteId(null);
    setCurrentText('');
    setShowList(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('notes').delete().eq('id', id);
  };

  const activeTheme = isDarkMode ? COLORS.find(c => c.id === 'dark')! : selectedColor;

  return (
    <div className="relative z-[9999]" dir="rtl">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`absolute bottom-16 left-0 origin-bottom-left flex flex-col rounded-2xl shadow-2xl overflow-hidden border-2 ${activeTheme.border} ${activeTheme.bg} ${activeTheme.text} transition-colors duration-500 max-w-[90vw] max-h-[80vh]`}
            style={{ 
              width: `${width}px`, 
              height: `${height}px`,
              resize: 'both'
            }}
          >
            <div className="flex flex-shrink-0 items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10 cursor-default">
              <div className="flex items-center gap-2">
                {showList ? (
                  <span className="font-black text-sm">قائمة الملاحظات</span>
                ) : (
                  <>
                    <button onClick={() => setShowList(true)} className="p-1 rounded" title="العودة للقائمة">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <span className="font-black text-xs opacity-70">إضافة/تعديل ملاحظة</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={handleNewNote} className="p-1.5 rounded-lg transition-colors" title="ملاحظة جديدة">
                  <Plus className="w-4 h-4" />
                </button>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-1.5 rounded-lg transition-colors" title="تبديل المظهر">
                  {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => {
                   if (width === 320) {
                      setWidth(480);
                      setHeight(500);
                   } else {
                      setWidth(320);
                      setHeight(380);
                   }
                }} className="p-1.5 rounded-lg transition-colors" title="تكبير/تصغير">
                  {width > 350 ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg transition-colors" title="إغلاق">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {showList ? (
              <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
                {notes.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-50">
                    <Edit3 className="w-8 h-8 mb-2" />
                    <span className="text-xs font-bold">لا يوجد ملاحظات محفوظة</span>
                  </div>
                ) : (
                  notes.map(note => (
                    <div key={note.id} className="group relative flex flex-col bg-black/5 dark:bg-white/5 p-3 rounded-lg border border-black/5 dark:border-white/5 transition-all">
                      <div 
                        className="cursor-pointer mb-2"
                        onClick={() => {
                          setActiveNoteId(note.id);
                          setShowList(false);
                        }}
                      >
                        <p className="text-xs font-bold line-clamp-2">{note.note_text || 'ملاحظة فارغة...'}</p>
                        <span className="text-[11px] opacity-60 mt-1 block">{new Date(note.updated_at).toLocaleDateString()}</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                        className="absolute top-2 left-2 p-1.5 bg-rose-500/10 text-rose-600 rounded-md opacity-0 transition-opacity"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <>
                <textarea
                  value={currentText}
                  onChange={(e) => setCurrentText(e.target.value)}
                  className="flex-1 w-full bg-transparent p-4 resize-none outline-none font-bold placeholder-black/40 dark:placeholder-white/40"
                  placeholder="اكتب ملاحظاتك، استرجاعاتك أو أفكارك هنا..."
                  dir="rtl"
                />

                <div className="flex flex-shrink-0 items-center justify-between p-3 border-t border-black/10 dark:border-white/10 opacity-90 gap-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                   {COLORS.filter(c => c.id !== 'dark' && c.id !== 'light').map(c => (
                     <button
                       key={c.id}
                       onClick={() => {
                         setIsDarkMode(false);
                         setSelectedColor(c);
                       }}
                       className={`w-5 h-5 rounded-full ${c.bg} border-2 ${selectedColor.id === c.id && !isDarkMode ? 'border-emerald-500 scale-110' : 'border-black/10'} transition-transform`}
                       title="تغيير اللون"
                     />
                   ))}
                  </div>
                  
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-4 py-2 bg-black/10 text-blue-800 dark:text-blue-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-lg text-xs font-black transition-colors"
                  >
                    {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
                    {isSaved ? 'تم الحفظ' : 'حفظ'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 overflow-hidden bg-[#1E293B] border border-[#D4AF37]/50 rounded-full shadow-[0_4px_20px_rgba(212,175,55,0.3)] text-[#FACC15] font-black transition-all z-50 group px-4 py-3 cursor-pointer"
        title="مذكراتي"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#FACC15] flex items-center justify-center text-slate-900 shrink-0">
          <Edit3 className="w-3.5 h-3.5" />
        </div>
        <span className="font-black text-xs whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#FACC15]">إضافة الملاحظات</span>
      </motion.button>
    </div>
  );
}

