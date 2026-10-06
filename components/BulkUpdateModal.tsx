
import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, FileText, CheckCircle, AlertCircle, Loader2, RefreshCw, ArrowRight, Sparkles, ScanLine } from 'lucide-react';
import { Policy } from '../types';
import { analyzePolicyDocument } from '../services/gemini';

interface BulkUpdateModalProps {
  isOpen: boolean;
  existingPolicies: Policy[];
  onClose: () => void;
  onComplete: (updatedPolicies: Policy[], newPolicies: Policy[]) => void;
}

interface StagedFile {
  file: File;
  matchId?: string; // ID of the policy it matches
  matchName?: string; // Name of the policy it matches
  status: 'pending' | 'analyzing' | 'done' | 'error';
}

const BulkUpdateModal: React.FC<BulkUpdateModalProps> = ({ 
  isOpen, 
  existingPolicies, 
  onClose, 
  onComplete 
}) => {
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [processingState, setProcessingState] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setStagedFiles([]);
      setProcessingState('idle');
      setProgress(0);
    }
  }, [isOpen]);

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
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = (files: File[]) => {
    const newStaged: StagedFile[] = files.map(file => {
      // Match by filename solely to determine if we are updating an existing record ID
      const match = existingPolicies.find(p => p.sourceFile === file.name);
      return {
        file,
        matchId: match?.id,
        matchName: match?.name,
        status: 'pending'
      };
    });
    setStagedFiles(prev => [...prev, ...newStaged]);
  };

  const removeFile = (index: number) => {
    setStagedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startProcessing = async () => {
    if (stagedFiles.length === 0) return;

    setProcessingState('processing');
    setProgress(0);

    const updatedPolicies: Policy[] = [];
    const newPolicies: Policy[] = [];
    const totalFiles = stagedFiles.length;
    
    // Process files sequentially (to avoid rate limits and manage state simply)
    // In a real app, we might use Promise.all with concurrency limit
    for (let i = 0; i < totalFiles; i++) {
      const sf = stagedFiles[i];
      
      // Update status of current file
      setStagedFiles(prev => {
        const copy = [...prev];
        copy[i] = { ...copy[i], status: 'analyzing' };
        return copy;
      });

      try {
        // Call Gemini Service
        const analysisResult = await analyzePolicyDocument(sf.file);

        // --- Logic to check for duplicate Policy Number ---
        let targetId = sf.matchId;
        let isUpdate = !!sf.matchId;
        let existingMatch: Policy | undefined;

        const extractedPolicyNo = (analysisResult as any).policyNumber;
        
        // If we have a valid policy number, check if it already exists in the database
        if (extractedPolicyNo && typeof extractedPolicyNo === 'string' && extractedPolicyNo.length > 3 && extractedPolicyNo !== 'N/A') {
             // Remove spaces for better matching
             const normalizedExtracted = extractedPolicyNo.replace(/\s+/g, '');
             
             existingMatch = existingPolicies.find(p => 
                 p.policyNumber && 
                 p.policyNumber.replace(/\s+/g, '') === normalizedExtracted
             );
             
             // If duplicate found by policy number, force overwrite
             if (existingMatch) {
                 targetId = existingMatch.id;
                 isUpdate = true;
             }
        }

        if (!targetId) {
             targetId = Math.random().toString(36).substr(2, 9);
        }

        const policyData: Policy = {
          id: targetId,
          ...analysisResult as any,
          sourceFile: sf.file.name,
          fileSize: sf.file.size,
          fileType: sf.file.type,
          lastModified: new Date().toISOString()
        };

        if (isUpdate) {
          updatedPolicies.push(policyData);
        } else {
          newPolicies.push(policyData);
        }

        setStagedFiles(prev => {
            const copy = [...prev];
            copy[i] = { 
                ...copy[i], 
                status: 'done',
                // Update match info in UI if we found a match dynamically by policy number
                matchId: isUpdate ? targetId : undefined,
                matchName: existingMatch ? existingMatch.name : copy[i].matchName
            };
            return copy;
        });

      } catch (error) {
        console.error(`Error analyzing file ${sf.file.name}:`, error);
        setStagedFiles(prev => {
            const copy = [...prev];
            copy[i] = { ...copy[i], status: 'error' };
            return copy;
        });
      }

      // Update progress
      setProgress(((i + 1) / totalFiles) * 100);
    }

    setProcessingState('success');
    
    setTimeout(() => {
      onComplete(updatedPolicies, newPolicies);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">批量导入与AI深度分析</h3>
              <p className="text-xs text-slate-500">Gemini 将智能读取文档内容提取信息</p>
            </div>
          </div>
          {processingState !== 'processing' && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {processingState === 'success' ? (
             <div className="flex flex-col items-center justify-center h-64 text-center animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h4 className="text-xl font-bold text-slate-800">批量分析完成!</h4>
                <p className="text-slate-500 mt-2">
                  AI 已完成任务。
                </p>
             </div>
          ) : processingState === 'processing' ? (
             <div className="flex flex-col items-center justify-center h-64">
                <div className="w-full max-w-md space-y-6">
                   <div className="flex items-center justify-center mb-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                        <div className="relative bg-white p-4 rounded-full border-2 border-blue-100 shadow-sm flex items-center justify-center overflow-hidden">
                           <ScanLine className="absolute w-12 h-12 text-blue-300 animate-[shimmer_2s_infinite]" />
                           <Sparkles className="w-8 h-8 text-blue-600 relative z-10" />
                        </div>
                      </div>
                   </div>
                   <div className="text-center">
                      <h4 className="text-lg font-bold text-slate-800">正在读取文档...</h4>
                      <p className="text-sm text-slate-500 mt-1">
                        Gemini 正在逐个分析 {stagedFiles.length} 份文件的内部信息...
                      </p>
                   </div>
                   
                   {/* Progress Bar */}
                   <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium text-slate-500">
                        <span>AI 识别中</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden relative">
                        <div 
                          className="bg-blue-600 h-full rounded-full transition-all duration-200 relative"
                          style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1s_infinite]"></div>
                        </div>
                      </div>
                   </div>
                </div>
             </div>
          ) : (
            <div className="space-y-6">
              {/* Drop Zone */}
              <div 
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
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
                  multiple 
                  accept=".pdf,image/*" 
                  onChange={handleFileSelect} 
                />
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="font-medium text-slate-700">点击选择多份文件 或 拖拽至此</p>
                <p className="text-xs text-slate-400 mt-2">支持 PDF / 图片 (AI 将自动识别内容)</p>
              </div>

              {/* File List */}
              {stagedFiles.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center justify-between">
                    待分析文件 ({stagedFiles.length})
                    <button onClick={() => setStagedFiles([])} className="text-xs text-red-500 hover:text-red-700 font-normal">清空列表</button>
                  </h4>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {stagedFiles.map((sf, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm group">
                         <div className="flex items-center gap-3 min-w-0">
                            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-slate-700 truncate max-w-[200px]">{sf.file.name}</p>
                              <p className="text-xs text-slate-400">{(sf.file.size / 1024).toFixed(0)} KB</p>
                            </div>
                         </div>
                         
                         <div className="flex items-center gap-3">
                            {sf.matchId ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-100 text-rose-700 border border-rose-200">
                                <RefreshCw className="w-3 h-3" /> 覆盖原有: {sf.matchName}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                                <CheckCircle className="w-3 h-3" /> 新增保单
                              </span>
                            )}
                            <button onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="w-4 h-4" />
                            </button>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {processingState === 'idle' && (
          <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
            <div className="text-xs text-slate-500 flex items-center gap-1">
               <AlertCircle className="w-4 h-4" />
               <p>AI 将直接读取文件内容进行分析。</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-slate-600 font-medium text-sm hover:bg-slate-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button 
                onClick={startProcessing}
                disabled={stagedFiles.length === 0}
                className={`px-4 py-2 text-white font-medium text-sm rounded-lg flex items-center gap-2 transition-all ${
                  stagedFiles.length === 0 ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-sm'
                }`}
              >
                开始智能识别
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkUpdateModal;
