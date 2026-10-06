
import React, { useState, useRef } from 'react';
import { X, FileText, Upload, Calendar, HardDrive, AlertCircle, Check, Trash2 } from 'lucide-react';
import { Policy } from '../types';

interface DocumentManagerModalProps {
  isOpen: boolean;
  policy: Policy | null;
  onClose: () => void;
  onUpdateFile: (policy: Policy, newFile: File) => void;
  onDownload: (policy: Policy) => void;
  onDelete: (policy: Policy) => void;
}

const DocumentManagerModal: React.FC<DocumentManagerModalProps> = ({ 
  isOpen, 
  policy, 
  onClose, 
  onUpdateFile,
  onDownload,
  onDelete
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !policy) return null;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '未知大小';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知日期';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        setNewFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewFile(e.target.files[0]);
    }
  };

  const handleConfirmUpdate = () => {
    if (newFile) {
        onUpdateFile(policy, newFile);
        setNewFile(null);
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">文档管理</h3>
              <p className="text-xs text-slate-500">管理保单源文件及元数据</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
            {/* Current File Info Card */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">当前关联文件</h4>
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0 shadow-sm text-red-500">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                        <p className="font-semibold text-slate-800 text-sm break-all line-clamp-2" title={policy.sourceFile}>
                            {policy.sourceFile}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                                <HardDrive className="w-3 h-3" /> {formatFileSize(policy.fileSize)}
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {formatDate(policy.lastModified)}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
                    <button 
                        onClick={() => onDownload(policy)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                        查看/下载原件
                    </button>
                </div>
            </div>

            {/* Update/Replace Section */}
            <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">更新源文件</h4>
                
                {!newFile ? (
                    <div 
                        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                            isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept=".pdf,image/*" 
                            onChange={handleFileSelect} 
                        />
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
                            <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-medium text-slate-700">点击替换文件 或 拖拽至此</p>
                        <p className="text-xs text-slate-400 mt-1">支持 PDF、图片格式</p>
                    </div>
                ) : (
                    <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-4">
                         <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">待更新</span>
                            <button onClick={() => setNewFile(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-4 h-4" />
                            </button>
                         </div>
                         <div className="flex items-center gap-3 mb-3">
                            <FileText className="w-8 h-8 text-blue-500" />
                            <div className="min-w-0">
                                <p className="font-medium text-slate-800 text-sm truncate">{newFile.name}</p>
                                <p className="text-xs text-slate-500">{formatFileSize(newFile.size)}</p>
                            </div>
                         </div>
                         <div className="flex items-start gap-2 text-xs text-blue-800 bg-blue-100/50 p-2 rounded">
                             <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                             <p>确认更新后，系统将自动重新分析文档内容并覆盖当前保单信息。</p>
                         </div>
                    </div>
                )}
            </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
            <button 
                onClick={() => onDelete(policy)}
                className="px-3 py-2 text-red-600 font-medium text-sm hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
            >
                <Trash2 className="w-4 h-4" />
                删除文档
            </button>

            <div className="flex gap-3">
                <button 
                    onClick={onClose}
                    className="px-4 py-2 text-slate-600 font-medium text-sm hover:bg-slate-200 rounded-lg transition-colors"
                >
                    取消
                </button>
                <button 
                    onClick={handleConfirmUpdate}
                    disabled={!newFile}
                    className={`px-4 py-2 text-white font-medium text-sm rounded-lg flex items-center gap-2 transition-all ${
                        !newFile ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-sm'
                    }`}
                >
                    <Check className="w-4 h-4" />
                    确认替换并分析
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentManagerModal;
