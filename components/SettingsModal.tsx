
import React, { useState, useEffect } from 'react';
import { X, HardDrive, AlertCircle, FileJson, CheckCircle, FolderOpen, RefreshCw, Key, Plus, Trash2, ShieldCheck, Zap, Eye, EyeOff, Edit2, Check } from 'lucide-react';
import { isFileSystemSupported } from '../services/fileSystem';
import { apiKeyManager } from '../services/apiKeyManager';
import { SavedKey } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // File System Props
  isConnected: boolean;
  connectedFileName: string | null;
  lastSyncTime: Date | null;
  onConnectFile: () => void;
  onCreateFile: () => void;
  onDisconnect: () => void;
  isSaving: boolean;
  onKeysChange: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isConnected,
  connectedFileName,
  lastSyncTime,
  onConnectFile,
  onCreateFile,
  onDisconnect,
  isSaving,
  onKeysChange,
}) => {
  const supported = isFileSystemSupported();
  const [keys, setKeys] = useState<SavedKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [activeTab, setActiveTab] = useState<'storage' | 'api'>('storage');
  
  // States for viewing and editing
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setKeys(apiKeyManager.getSavedKeys());
    }
  }, [isOpen]);

  const handleAddKey = () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) return;
    apiKeyManager.addKey(newKeyName.trim(), newKeyValue.trim());
    setKeys(apiKeyManager.getSavedKeys());
    setNewKeyName('');
    setNewKeyValue('');
    onKeysChange();
  };

  const handleRemoveKey = (index: number) => {
    if (window.confirm('确定要删除此密钥吗？')) {
      apiKeyManager.removeKey(index);
      setKeys(apiKeyManager.getSavedKeys());
      onKeysChange();
    }
  };

  const toggleKeyVisibility = (index: number) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(index)) newVisible.delete(index);
    else newVisible.add(index);
    setVisibleKeys(newVisible);
  };

  const startEditing = (index: number, key: SavedKey) => {
    setEditingIndex(index);
    setEditName(key.name);
    setEditValue(key.key);
  };

  const saveEdit = (index: number) => {
    if (!editName.trim() || !editValue.trim()) return;
    apiKeyManager.updateKey(index, editName, editValue);
    setKeys(apiKeyManager.getSavedKeys());
    setEditingIndex(null);
    onKeysChange();
  };

  if (!isOpen) return null;

  const currentActiveKey = apiKeyManager.getApiKey();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-slate-800 text-lg">系统设置</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 shrink-0">
            <button 
                onClick={() => setActiveTab('storage')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'storage' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
                存储与连接
            </button>
            <button 
                onClick={() => setActiveTab('api')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'api' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
                Gemini API 管理
            </button>
        </div>

        <div className="p-6 overflow-y-auto">
            {activeTab === 'storage' && (
                <div className="space-y-6">
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-2">数据库连接状态</h4>
                        <div className={`p-4 rounded-xl border-2 ${isConnected ? 'border-emerald-100 bg-emerald-50' : 'border-slate-100 bg-slate-50'} transition-colors`}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isConnected ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                        {isConnected ? <CheckCircle className="w-6 h-6" /> : <HardDrive className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <p className={`font-bold ${isConnected ? 'text-emerald-800' : 'text-slate-700'}`}>
                                            {isConnected ? '已连接本地数据库' : '使用浏览器缓存 (默认)'}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {isConnected 
                                                ? `当前文件: ${connectedFileName}` 
                                                : '数据仅存储在当前浏览器中，清除缓存可能会丢失。'}
                                        </p>
                                        {isConnected && lastSyncTime && (
                                            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                                                <RefreshCw className={`w-3 h-3 ${isSaving ? 'animate-spin' : ''}`} />
                                                {isSaving ? '正在同步...' : `上次同步: ${lastSyncTime.toLocaleTimeString()}`}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {isConnected && (
                                    <button 
                                        onClick={onDisconnect}
                                        className="text-xs text-red-500 hover:text-red-700 underline px-2"
                                    >
                                        断开连接
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {supported ? (
                        <div>
                            <h4 className="text-sm font-bold text-slate-800 mb-3">本地数据库管理</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button 
                                    onClick={onConnectFile}
                                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                                >
                                    <FolderOpen className="w-8 h-8 text-slate-400 group-hover:text-blue-600 mb-2" />
                                    <span className="font-medium text-slate-700 group-hover:text-blue-700">打开现有数据库</span>
                                </button>

                                <button 
                                    onClick={onCreateFile}
                                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                                >
                                    <FileJson className="w-8 h-8 text-slate-400 group-hover:text-blue-600 mb-2" />
                                    <span className="font-medium text-slate-700 group-hover:text-blue-700">新建数据库</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-800 text-sm flex gap-2">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p>您的浏览器不支持文件系统访问 API。</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'api' && (
                <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                        <Zap className="w-5 h-5 text-blue-600 shrink-0" />
                        <div className="text-xs text-blue-800 space-y-1">
                            <p className="font-bold">密钥自动切换机制</p>
                            <p>当首选密钥触发额度限制 (429 Error) 时，系统会自动尝试密钥列表中的下一个可用密钥。默认优先使用 <b>gemini-2.5-flash</b> 系列模型以保证处理速度。</p>
                        </div>
                    </div>

                    {/* Add New Key Form */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <Plus className="w-4 h-4" /> 添加新密钥
                        </h4>
                        <div className="space-y-3">
                            <input 
                                type="text" 
                                placeholder="密钥备注名称 (如: 开发者Key 1)"
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <div className="flex gap-2">
                                <input 
                                    type="password" 
                                    placeholder="输入 Gemini API Key"
                                    value={newKeyValue}
                                    onChange={(e) => setNewKeyValue(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <button 
                                    onClick={handleAddKey}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    添加
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Key List */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
                            已保存的密钥 ({keys.length})
                            <button 
                                onClick={() => apiKeyManager.resetDepleted()} 
                                className="text-[10px] text-blue-600 hover:underline font-normal"
                            >
                                重置额度状态
                            </button>
                        </h4>
                        <div className="space-y-2">
                            {keys.map((k, idx) => {
                                const isDepleted = apiKeyManager.isDepleted(k.key);
                                const isActive = k.key === currentActiveKey;
                                const isVisible = visibleKeys.has(idx);
                                const isEditing = editingIndex === idx;

                                return (
                                    <div key={idx} className={`flex flex-col p-3 rounded-xl border transition-all ${
                                        isActive ? 'border-blue-200 bg-blue-50/50' : 'border-slate-100 bg-white'
                                    }`}>
                                        {isEditing ? (
                                            <div className="space-y-2 animate-in fade-in duration-200">
                                                <input 
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="w-full text-xs font-bold px-2 py-1 border border-blue-200 rounded bg-white"
                                                    placeholder="备注名称"
                                                />
                                                <div className="flex gap-2">
                                                    <input 
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        className="flex-1 text-[10px] font-mono px-2 py-1 border border-blue-200 rounded bg-white"
                                                        placeholder="API Key"
                                                    />
                                                    <button onClick={() => saveEdit(idx)} className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700">
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => setEditingIndex(null)} className="p-1.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                    <div className={`p-2 rounded-lg shrink-0 ${
                                                        isDepleted ? 'bg-red-50 text-red-400' : (isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400')
                                                    }`}>
                                                        <Key className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-sm text-slate-800 truncate">{k.name}</span>
                                                            {isActive && <span className="text-[10px] px-1.5 py-0.5 bg-blue-600 text-white rounded-full font-bold">使用中</span>}
                                                            {isDepleted && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full font-bold">额度耗尽</span>}
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 font-mono truncate flex items-center gap-2">
                                                            {isVisible ? k.key : `${k.key.substring(0, 8)}****************${k.key.substring(k.key.length - 4)}`}
                                                            <button onClick={() => toggleKeyVisibility(idx)} className="hover:text-slate-600">
                                                                {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                            </button>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                                    <button 
                                                        onClick={() => startEditing(idx, k)}
                                                        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                                                        title="编辑"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleRemoveKey(idx)}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                        title="删除"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            
                            {keys.length === 0 && (
                                <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <Key className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-xs">暂无备选密钥，将优先使用系统预设密钥</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
