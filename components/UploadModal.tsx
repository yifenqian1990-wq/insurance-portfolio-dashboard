import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, FileText, CheckCircle, Loader2, Sparkles, ScanLine, AlertTriangle } from 'lucide-react';
import { Policy } from '../types';
import { analyzePolicyDocument } from '../services/gemini';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (policy: Policy) => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setStatus('idle');
      setProgress(0);
      setErrorMessage('');
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

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
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
      setFile(file);
      setStatus('idle');
      setProgress(0);
      setErrorMessage('');
    } else {
      alert('请上传 PDF 或图片格式的保单文件');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    setProgress(0);
    setErrorMessage('');

    // Fake upload progress then switch to processing
    setTimeout(async () => {
      setStatus('processing');
      
      // Start a visual progress bar that moves slowly while waiting for API
      let currentProgress = 0;
      intervalRef.current = window.setInterval(() => {
        if (currentProgress < 90) {
            currentProgress += (90 - currentProgress) * 0.1;
            setProgress(currentProgress);
        }
      }, 200);

      try {
        // Call Gemini API
        const analysisResult = await analyzePolicyDocument(file);
        
        if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setProgress(100);
        setStatus('success');
        
        setTimeout(() => {
             // Construct final policy object
             const newPolicy: Policy = {
                id: Math.random().toString(36).substr(2, 9),
                ...analysisResult as any, // Spread the analyzed fields
                sourceFile: file.name,
                fileSize: file.size,
                fileType: file.type,
                lastModified: new Date().toISOString()
            };
            
            onUploadSuccess(newPolicy);
            onClose();
        }, 1000);

      } catch (error) {
        if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        console.error(error);
        setStatus('error');
        setErrorMessage('AI 分析失败，请检查文件内容是否清晰或稍后重试。');
      }
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            上传保单
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-300">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-2">解析成功!</h4>
              <p className="text-slate-500">
                已成功提取文档内容并生成保单条目。
              </p>
            </div>
          ) : status === 'error' ? (
             <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-300">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-2">解析失败</h4>
              <p className="text-slate-500 mb-4 text-sm">
                {errorMessage}
              </p>
              <button 
                onClick={() => setStatus('idle')}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                返回重试
              </button>
            </div>
          ) : status === 'processing' ? (
            <div className="flex flex-col items-center justify-center py-6 text-center w-full max-w-xs mx-auto">
               <div className="relative w-16 h-16 mb-6">
                 <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                 <div className="relative w-16 h-16 bg-white border-2 border-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                    <ScanLine className="absolute w-14 h-14 text-blue-300 animate-[shimmer_2s_infinite]" />
                    <Sparkles className="w-8 h-8 text-blue-600 relative z-10" />
                 </div>
               </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">Gemini 正在分析内容...</h4>
              <p className="text-sm text-slate-500 mb-6">
                正在读取图像与文字，提取保险责任与条款细节
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden relative">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out relative overflow-hidden" 
                  style={{ width: `${Math.min(progress, 100)}%` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite] w-full"></div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div 
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
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
                
                {file ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-3">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="font-medium text-slate-700 break-all line-clamp-1 px-4">{file.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="mt-4 text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      移除文件
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="font-medium text-slate-700">点击上传 或 拖拽文件至此</p>
                    <p className="text-xs text-slate-400 mt-2">支持 PDF、JPG、PNG 格式</p>
                  </>
                )}
              </div>
              
              <div className="mt-4 flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                <ScanLine className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p>AI 引擎将智能识别文档内容，自动提取险种、保险公司、保额等关键信息。</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {status !== 'processing' && status !== 'success' && status !== 'error' && (
          <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-medium text-sm hover:bg-slate-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button 
              onClick={handleUpload}
              disabled={!file || status === 'uploading'}
              className={`px-4 py-2 text-white font-medium text-sm rounded-lg flex items-center gap-2 transition-all ${
                !file ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow'
              }`}
            >
              {status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin" />}
              {status === 'uploading' ? '上传中...' : '开始智能内容分析'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadModal;