
import React, { useState } from 'react';
import { Plus, X, Save, StickyNote, Calendar, Pencil, Check } from 'lucide-react';
import { Note } from '../types';

interface NotesViewProps {
  notes: Note[];
  onAddNote: (content: string, color: string) => void;
  onDeleteNote: (id: string) => void;
  onUpdateNote: (id: string, content: string) => void;
}

const COLORS = [
  'bg-yellow-50 border-yellow-200 text-yellow-900',
  'bg-blue-50 border-blue-200 text-blue-900',
  'bg-green-50 border-green-200 text-green-900',
  'bg-rose-50 border-rose-200 text-rose-900',
  'bg-purple-50 border-purple-200 text-purple-900',
];

const NotesView: React.FC<NotesViewProps> = ({ notes, onAddNote, onDeleteNote, onUpdateNote }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  
  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleAddClick = () => {
    if (!newNoteContent.trim()) return;
    onAddNote(newNoteContent, selectedColor);
    setNewNoteContent('');
    setIsAdding(false);
  };

  const startEditing = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEdit = () => {
    if (editingId && editContent.trim()) {
      onUpdateNote(editingId, editContent);
      setEditingId(null);
      setEditContent('');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">便利贴</h2>
          <p className="text-slate-500 mt-1">记录保险相关的备忘事项、续费提醒或疑问。</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2"
        >
            <Plus className="w-4 h-4" /> 新建便利贴
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 animate-in zoom-in-95 duration-200 max-w-2xl">
            <div className="mb-3">
                <label className="block text-xs font-medium text-slate-500 mb-1.5">内容</label>
                <textarea
                    className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-slate-700"
                    rows={3}
                    placeholder="请输入备忘内容..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    autoFocus
                />
            </div>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-500">选择颜色:</span>
                    <div className="flex gap-2">
                        {COLORS.map((color, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedColor(color)}
                                className={`w-6 h-6 rounded-full border-2 transition-all ${color.split(' ')[0]} ${
                                    selectedColor === color ? 'border-slate-500 scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                                }`}
                                aria-label="Color option"
                            />
                        ))}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsAdding(false)}
                        className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg text-sm transition-colors"
                    >
                        取消
                    </button>
                    <button 
                        onClick={handleAddClick}
                        disabled={!newNoteContent.trim()}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 font-medium shadow-sm"
                    >
                        <Save className="w-3 h-3" /> 保存
                    </button>
                </div>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {notes.map(note => (
            <div key={note.id} className={`p-6 rounded-xl border shadow-sm relative group transition-all hover:-translate-y-1 hover:shadow-md flex flex-col min-h-[180px] ${note.color}`}>
                {editingId === note.id ? (
                    <div className="flex-1 flex flex-col animate-in fade-in duration-200">
                         <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full p-2 bg-white/50 border border-black/10 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black/10 mb-3 flex-1 text-inherit font-medium"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-auto">
                            <button 
                                onClick={cancelEdit}
                                className="p-1.5 bg-white/40 hover:bg-white/60 rounded-lg text-slate-600 transition-colors"
                                title="取消"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={saveEdit}
                                className="p-1.5 bg-white hover:bg-white/90 rounded-lg text-green-600 shadow-sm transition-colors"
                                title="保存"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                                onClick={() => startEditing(note)}
                                className="p-1.5 text-slate-400/70 hover:text-blue-600 hover:bg-white/50 rounded-full"
                                title="编辑"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => onDeleteNote(note.id)}
                                className="p-1.5 text-slate-400/70 hover:text-red-500 hover:bg-white/50 rounded-full"
                                title="删除"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="mb-4 flex-1">
                            <StickyNote className="w-5 h-5 mb-3 opacity-50" />
                            <p className="text-sm whitespace-pre-wrap leading-relaxed font-medium">{note.content}</p>
                        </div>
                        
                        <div className="flex items-center justify-end text-xs opacity-60 font-medium pt-3 border-t border-black/5">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" /> {note.date}
                            </span>
                        </div>
                    </>
                )}
            </div>
        ))}
        
        {notes.length === 0 && !isAdding && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <StickyNote className="w-8 h-8 text-slate-300" />
                </div>
                <p className="font-medium text-slate-600">暂无便利贴</p>
                <p className="text-sm mt-1">点击右上角按钮添加新的备忘</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default NotesView;
