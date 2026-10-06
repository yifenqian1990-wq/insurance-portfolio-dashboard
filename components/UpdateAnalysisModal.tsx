import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, CheckCircle, X, RefreshCw, HardDrive, AlertTriangle } from 'lucide-react';
import { Policy } from '../types';
import { analyzePolicyDocument } from '../services/gemini';

interface UpdateAnalysisModalProps {
  isOpen: boolean;
  policy: Policy | null;
  fileToAnalyze: File | null;
  onClose: () => void;
  onUpdateComplete: (updatedPolicy: Policy) => void;
}

const UpdateAnalysisModal: React.FC<UpdateAnalysisModalProps> = ({ 
  isOpen, 
  policy, 
  fileToAnalyze,
  onClose, 
  onUpdateComplete 
}) => {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'connecting' | 'analyzing' | 'finalizing' | 'success' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState('');
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen && policy && fileToAnalyze) {
      startAnalysis();
    } else if (isOpen && policy && !fileToAnalyze) {
       // Fallback if no file provided (shouldn't happen in normal flow)
       setStage('success');
    } else {
      resetState();
    }
    return () => stopInterval();
  }, [isOpen, policy, fileToAnalyze]);

  const stopInterval = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resetState = () => {
    setProgress(0);
    setStage('connecting');
    setErrorMessage('');
    stopInterval();
  };

  const startAnalysis = async () => {
    if (!fileToAnalyze || !policy) return;

    setStage('connecting');
    setProgress(0);
    setErrorMessage('');

    // Artificial delay for UI polish
    setTimeout(async () => {
      setStage('analyzing');
      
      // Progress simulation while waiting
      let currentProgress = 10;
      intervalRef.current = window.setInterval(() => {
        if (currentProgress < 90) {
             currentProgress += (90 - currentProgress) * 0.1;
             setProgress(currentProgress);
        }
      }, 300);

      try {
          const analysisResult = await analyzePolicyDocument(fileToAnalyze);

          // Stop simulation
          stopInterval();
          setProgress(100);
          setStage('finalizing');
          
          setTimeout(() => {
            setStage('success');
            
            const updatedPolicy: Policy = {
                ...policy, // Keep original ID and metadata
                ...analysisResult as any, // Overwrite with new analysis
                sourceFile: fileToAnalyze.name,
                fileSize: fileToAnalyze.size,
                fileType: fileToAnalyze.type,
                lastModified: new Date().toISOString()
            };

            setTimeout(() => {
                onUpdateComplete(updatedPolicy);
                onClose();
            }, 1200);
          }, 600);

      } catch (error) {
        stopInterval();
        console.error(error);
        setStage('error');
        setErrorMessage('AI 无法分析该文件，请确认文件格式正确。');
      }

    }, 800);
  };

  if (!isOpen || !policy) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${stage !== 'success' && stage !== 'error' ? 'animate-spin' : ''} text-blue-600`} />
            更新保单信息
          </h3>
          {(stage === 'success' || stage === 'error') && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
          
          {stage === 'success' ? (
             <div className="animate-in zoom-in duration-300">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-7 h-7 text-emerald-600" />
                </div>
                <h4 className="text-lg font-bold text-slate-800">更新完成</h4>
                <p className="text-sm text-slate-500 mt-1">AI 已重新读取文档并更新保单信息</p>
             </div>
          ) : stage === 'error' ? (
             <div className="animate-in zoom-in duration-300">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-7 h-7 text-red-600" />
                </div>
                <h4 className="text-lg font-bold text-slate-800">更新失败</h4>
                <p className="text-sm text-slate-500 mt-1">{errorMessage}</p>
             </div>
          ) : (
            <div className="w-full">
               <div className="mb-6 relative w-14 h-14 mx-auto">
                  <div className="absolute inset-0 bg-blue-50 rounded-full animate-ping opacity-50"></div>
                  <div className="relative bg-white border-2 border-blue-100 w-14 h-14 rounded-full flex items-center justify-center z-10">
                    {stage === 'connecting' ? (
                      <HardDrive className="w-6 h-6 text-blue-500" />
                    ) : (
                      <Sparkles className="w-6 h-6 text-blue-600 animate-pulse" />
                    )}
                  </div>
               </div>

               <h4 className="text-md font-semibold text-slate-800 mb-1">
                 {stage === 'connecting' ? '正在读取源文件...' : 
                  stage === 'analyzing' ? 'Gemini 智能解析中...' : 
                  '整理数据中...'}
               </h4>
               <p className="text-xs text-slate-400 mb-5 font-mono truncate max-w-[250px] mx-auto bg-slate-50 px-2 py-1 rounded">
                 {fileToAnalyze?.name || policy.sourceFile}
               </p>

               {/* Progress Bar */}
               <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden relative">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out relative overflow-hidden" 
                    style={{ width: `${progress}%` }}
                  >
                      {/* Gradient Shimmer Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1s_infinite] w-full"></div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateAnalysisModal;