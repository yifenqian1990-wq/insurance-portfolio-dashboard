import React from 'react';
import { X, Trash2 } from 'lucide-react';

interface DeleteAllModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
}

const DeleteAllModal: React.FC<DeleteAllModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  count,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="flex justify-end p-2">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
             <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 pb-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">清空所有文档?</h3>
          <p className="text-sm text-slate-500 mb-6">
            您确定要删除全部 <span className="font-bold text-slate-800">{count}</span> 份保单文档吗？<br/>
            <span className="text-red-500 text-xs mt-1 block">此操作无法撤销，所有分析数据都将丢失。</span>
          </p>
          
          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
            >
              确认清空
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteAllModal;