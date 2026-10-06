
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { MOCK_POLICIES } from './constants';
import { Policy, Note, AuditLogEntry, PolicyStatus, SavedKey } from './types';
import KpiCard from './components/KpiCard';
import PolicyTable from './components/PolicyTable';
import ManualPolicyModal from './components/ManualPolicyModal';
import BulkUpdateModal from './components/BulkUpdateModal';
import DocumentsView from './components/DocumentsView';
import MembersView from './components/MembersView';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import ReportGenerator from './components/ReportGenerator';
import NotesView from './components/NotesView';
import AiAssistantView from './components/AiAssistantView';
import AuditLogView from './components/AuditLogView';
import SettingsModal from './components/SettingsModal';
import { PremiumDistributionChart, CoverageByPersonChart } from './components/Charts';
import { Wallet, ShieldCheck, FileText, AlertTriangle, Menu, User, LayoutDashboard, StickyNote, Plus, Download, X, CheckCircle, FileX, UploadCloud, PenTool, Sparkles, Trash2, ArchiveRestore, Save, Key, Settings, Database, RefreshCw, Lock, LogIn, HardDrive, LogOut, ChevronDown, ChevronRight, Archive, History, ClipboardList, Zap, Book, Pencil } from 'lucide-react';
import { openFileHandle, saveFileHandle, readFromFile, writeToFile, isFileSystemSupported, AppData, storeFileHandle, getStoredFileHandle, removeStoredFileHandle, verifyPermission } from './services/fileSystem';
import { apiKeyManager } from './services/apiKeyManager';

type Tab = 'dashboard' | 'documents' | 'members' | 'notes' | 'assistant' | 'archive' | 'audit';

const DEFAULT_NOTES: Note[] = [];

// Helper to generate a readable diff string between two policies
const generatePolicyDiff = (oldP: Policy, newP: Policy): string => {
    const changes: string[] = [];
    
    if (oldP.name !== newP.name) changes.push(`名称: "${oldP.name}" -> "${newP.name}"`);
    if (oldP.insurer !== newP.insurer) changes.push(`保险公司: "${oldP.insurer}" -> "${newP.insurer}"`);
    if (oldP.policyNumber !== newP.policyNumber) changes.push(`单号: ${oldP.policyNumber} -> ${newP.policyNumber}`);
    if (oldP.category !== newP.category) changes.push(`分类: ${oldP.category} -> ${newP.category}`);
    if (oldP.insuredPerson !== newP.insuredPerson) changes.push(`被保人: ${oldP.insuredPerson} -> ${newP.insuredPerson}`);
    if (oldP.premium !== newP.premium) changes.push(`保费: ${oldP.premium} -> ${newP.premium}`);
    if (oldP.coverageAmount !== newP.coverageAmount) changes.push(`保额: ${oldP.coverageAmount} -> ${newP.coverageAmount}`);
    if (oldP.startDate !== newP.startDate) changes.push(`生效日: ${oldP.startDate} -> ${newP.startDate}`);
    if (oldP.endDate !== newP.endDate) changes.push(`到期日: ${oldP.endDate} -> ${newP.endDate}`);
    if (oldP.status !== newP.status) changes.push(`状态: ${oldP.status} -> ${newP.status}`);
    
    // Arrays Comparison
    const oldOthers = (oldP.otherInsuredPersons || []).sort().join(',');
    const newOthers = (newP.otherInsuredPersons || []).sort().join(',');
    if (oldOthers !== newOthers) changes.push(`其他被保人: [${oldP.otherInsuredPersons?.join(',') || '无'}] -> [${newP.otherInsuredPersons?.join(',') || '无'}]`);

    const oldTags = (oldP.tags || []).sort().join(',');
    const newTags = (newP.tags || []).sort().join(',');
    if (oldTags !== newTags) changes.push(`标签: [${oldP.tags.join(',')}] -> [${newP.tags.join(',')}]`);

    return changes.join('; ');
};

const App: React.FC = () => {
  // Login State
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('insurance_session_active') === 'true');
  const [loginUser, setLoginUser] = useState(() => localStorage.getItem('insurance_last_user') || '');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Added: Config version to force component refreshes when settings change
  const [configVersion, setConfigVersion] = useState(0);

  // File System State
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [connectedFileName, setConnectedFileName] = useState<string | null>(null);
  const [isSavingToFile, setIsSavingToFile] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pendingHandle, setPendingHandle] = useState<FileSystemFileHandle | null>(null); // Handle waiting for permission
  const saveTimeoutRef = useRef<number | null>(null);
  
  // Refresh loading state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data State
  const [policies, setPolicies] = useState<Policy[]>(() => {
    try {
      const savedPolicies = localStorage.getItem('insurance_policies');
      return savedPolicies ? JSON.parse(savedPolicies) : MOCK_POLICIES;
    } catch (e) {
      console.error("Failed to load policies from storage", e);
      return MOCK_POLICIES;
    }
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const savedNotes = localStorage.getItem('insurance_notes');
      return savedNotes ? JSON.parse(savedNotes) : DEFAULT_NOTES;
    } catch (e) {
      return DEFAULT_NOTES;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
      try {
          const savedLogs = localStorage.getItem('insurance_audit_logs');
          return savedLogs ? JSON.parse(savedLogs) : [];
      } catch (e) {
          return [];
      }
  });

  const [apiKeys, setApiKeys] = useState<SavedKey[]>(() => apiKeyManager.getSavedKeys());

  // UI State
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showSidebar, setShowSidebar] = useState(false);
  
  // Edit Policy State
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);

  // Delete Policy State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<Policy | null>(null);
  
  // Import File Input Ref
  const fileImportRef = useRef<HTMLInputElement>(null);

  // Split policies into Active and Expired
  const { activePolicies, expiredPolicies } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const active: Policy[] = [];
    const expired: Policy[] = [];

    policies.forEach(p => {
        const endDate = new Date(p.endDate);
        if (endDate < today) {
            expired.push(p);
        } else {
            active.push(p);
        }
    });

    // Sort active by expire date (soonest first)
    active.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    
    // Sort expired by expire date (most recent first)
    expired.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

    return { activePolicies: active, expiredPolicies: expired };
  }, [policies]);

  // --- Audit Logging ---
  const addLog = useCallback((action: AuditLogEntry['action'], policyName: string, details: string, isAI = false) => {
      const newLog: AuditLogEntry = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          action,
          policyName,
          details,
          operator: isAI ? 'AI System' : 'User'
      };
      setAuditLogs(prev => [newLog, ...prev]);
  }, []);

  // --- Policy Status Logic ---
  const calculateStatus = (startDate: string, endDate: string): PolicyStatus => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end < today) return 'Expired';
      if (start > today) return 'Pending';
      return 'Active';
  };

  const handleRefreshPolicies = useCallback(() => {
      setIsRefreshing(true);
      
      // Simulate a brief delay for UX
      setTimeout(() => {
          setPolicies(prevPolicies => {
              let changedCount = 0;
              const updatedPolicies = prevPolicies.map(policy => {
                  const newStatus = calculateStatus(policy.startDate, policy.endDate);
                  
                  if (newStatus !== policy.status) {
                      changedCount++;
                      // Log update if status changed
                      addLog(
                          'update', 
                          policy.name, 
                          `系统自动更新状态: ${policy.status} -> ${newStatus}`, 
                          true
                      );
                      return { ...policy, status: newStatus };
                  }
                  return policy;
              });
              
              if (changedCount > 0) {
                   console.log(`Updated status for ${changedCount} policies.`);
              }
              return updatedPolicies;
          });
          setIsRefreshing(false);
      }, 600);
  }, [addLog]);

  // Auto-refresh on login
  useEffect(() => {
      if (isLoggedIn) {
          handleRefreshPolicies();
      }
  }, [isLoggedIn, handleRefreshPolicies]);

  // --- Restore File Handle Logic ---
  useEffect(() => {
      const checkStoredHandle = async () => {
          if (!isFileSystemSupported()) return;
          
          try {
              const handle = await getStoredFileHandle();
              if (handle) {
                  console.log("Found stored file handle:", handle.name);
                  
                  // Attempt auto-restore if permission is already granted
                  try {
                      const permission = await (handle as any).queryPermission({ mode: 'readwrite' });
                      
                      if (permission === 'granted') {
                           console.log("Permission already granted. Auto-reconnecting...");
                           // Load data FIRST to avoid overwrite race condition
                           const data = await readFromFile(handle);
                           if (data.policies) setPolicies(data.policies);
                           if (data.notes) setNotes(data.notes);
                           if (data.logs) setAuditLogs(data.logs);
                           if (data.apiKeys) {
                               setApiKeys(data.apiKeys);
                               apiKeyManager.setAllKeys(data.apiKeys);
                           }

                           setFileHandle(handle);
                           setConnectedFileName(handle.name);
                           
                           setLastSyncTime(new Date());
                           // Trigger refresh after loading data
                           handleRefreshPolicies();
                      } else {
                          setPendingHandle(handle);
                      }
                  } catch (err) {
                      setPendingHandle(handle);
                  }
              }
          } catch (e) {
              console.error("Error retrieving stored handle:", e);
          }
      };
      if (isLoggedIn) {
          checkStoredHandle();
      }
  }, [isLoggedIn, handleRefreshPolicies]);

  const restoreConnection = async () => {
      if (!pendingHandle) return;
      
      try {
          // This must be triggered by a user click
          const hasPermission = await verifyPermission(pendingHandle, true);
          
          if (hasPermission) {
              // Load data immediately BEFORE setting file handle to prevent auto-save overwriting data
              const data = await readFromFile(pendingHandle);
              if (data.policies) setPolicies(data.policies);
              if (data.notes) setNotes(data.notes);
              if (data.logs) setAuditLogs(data.logs);
              if (data.apiKeys) {
                  setApiKeys(data.apiKeys);
                  apiKeyManager.setAllKeys(data.apiKeys);
              }

              setFileHandle(pendingHandle);
              setConnectedFileName(pendingHandle.name);
              
              setLastSyncTime(new Date());
              setPendingHandle(null); // Clear pending state
              handleRefreshPolicies(); // Refresh statuses after load
              alert(`成功重新连接到: ${pendingHandle.name}`);
          } else {
              // Permission denied or dismissed
              alert('连接未授权，请手动重新选择文件。');
              removeStoredFileHandle();
              setPendingHandle(null);
          }
      } catch (e) {
          console.error("Failed to restore connection:", e);
          alert('恢复连接失败，文件可能已被移动或删除。');
          removeStoredFileHandle();
          setPendingHandle(null);
      }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUser === 'root' && loginPass === '1234') {
      setIsLoggedIn(true);
      setLoginError('');
      localStorage.setItem('insurance_session_active', 'true');
      localStorage.setItem('insurance_last_user', loginUser);
      // handleRefreshPolicies is triggered by useEffect on isLoggedIn
    } else {
      setLoginError('用户名或密码错误');
    }
  };

  const handleLogout = () => {
      if (window.confirm('确定要退出登录吗？')) {
        setIsLoggedIn(false);
        setLoginPass('');
        localStorage.removeItem('insurance_session_active');
      }
  };

  // --- File System Logic ---

  // Connect to existing file
  const handleConnectFile = async () => {
      try {
          const handle = await openFileHandle();
          
          // Load data immediately BEFORE setting file handle to prevent auto-save overwriting data
          const data = await readFromFile(handle);
          if (data.policies) setPolicies(data.policies);
          if (data.notes) setNotes(data.notes);
          if (data.logs) setAuditLogs(data.logs);
          if (data.apiKeys) {
              setApiKeys(data.apiKeys);
              apiKeyManager.setAllKeys(data.apiKeys);
          }

          setFileHandle(handle);
          setConnectedFileName(handle.name);
          setPendingHandle(null); // Clear any pending reconnection
          
          // Store handle for next time
          await storeFileHandle(handle);
          
          setLastSyncTime(new Date());
          handleRefreshPolicies(); // Refresh statuses after load
          alert(`成功连接到数据库: ${handle.name}\n数据已加载。`);
      } catch (error: any) {
          if (error.name !== 'AbortError') {
              console.error("File open error:", error);
              alert("无法打开文件，请重试。");
          }
      }
  };

  // Create new file
  const handleCreateFile = async () => {
      try {
          const handle = await saveFileHandle();
          setFileHandle(handle);
          setConnectedFileName(handle.name);
          setPendingHandle(null);
          
          // Store handle
          await storeFileHandle(handle);

          // Save current state immediately
          await saveToLocalFile(handle);
          alert(`成功创建并连接数据库: ${handle.name}`);
      } catch (error: any) {
           if (error.name !== 'AbortError') {
              console.error("File create error:", error);
              alert("创建文件失败。");
          }
      }
  };

  const handleDisconnectFile = () => {
      setFileHandle(null);
      setConnectedFileName(null);
      setLastSyncTime(null);
      removeStoredFileHandle(); // Clear storage so we don't prompt next time
  };

  // Internal save function
  const saveToLocalFile = useCallback(async (handle: FileSystemFileHandle) => {
      setIsSavingToFile(true);
      try {
          const data: AppData = {
              policies,
              notes,
              logs: auditLogs,
              apiKeys,
              history: [], // We could store chat history here too
              timestamp: new Date().toISOString(),
              version: '1.0'
          };
          await writeToFile(handle, data);
          setLastSyncTime(new Date());
      } catch (error) {
          console.error("Auto-save failed:", error);
      } finally {
          setIsSavingToFile(false);
      }
  }, [policies, notes, auditLogs, apiKeys]);

  // Auto-save effect
  useEffect(() => {
      if (!fileHandle) return;

      // Debounce save to avoid too many writes
      if (saveTimeoutRef.current) {
          window.clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = window.setTimeout(() => {
          saveToLocalFile(fileHandle);
      }, 2000); // 2 second debounce

      return () => {
          if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
      };
  }, [policies, notes, auditLogs, apiKeys, fileHandle, saveToLocalFile]);


  // --- Persistence Logic (LocalStorage Fallback) ---
  useEffect(() => {
    try {
      localStorage.setItem('insurance_policies', JSON.stringify(policies));
    } catch (e) { console.error(e); }
  }, [policies]);

  useEffect(() => {
    try {
      localStorage.setItem('insurance_notes', JSON.stringify(notes));
    } catch (e) { console.error(e); }
  }, [notes]);

  useEffect(() => {
    try {
      localStorage.setItem('insurance_audit_logs', JSON.stringify(auditLogs));
    } catch (e) { console.error(e); }
  }, [auditLogs]);


  // --- Stats Calculation ---
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 30);

    return policies.reduce((acc, policy) => {
      const endDate = new Date(policy.endDate);
      const startDate = new Date(policy.startDate);
      
      const isExpiringSoon = endDate > today && endDate <= thirtyDaysLater;
      const isExpired = endDate < today;
      const isPending = startDate > today; 

      const isActive = !isExpired && !isPending;

      if (isActive) {
        acc.totalPremium += policy.premium;
        acc.totalCoverage += policy.coverageAmount;
        acc.activeCount += 1;
      }

      if (isExpiringSoon) {
          acc.expiringSoon += 1;
      }
      
      if (isExpired) {
          acc.expiredCount += 1;
      }
      
      acc.policyCount += 1;

      return acc;
    }, { totalPremium: 0, totalCoverage: 0, policyCount: 0, activeCount: 0, expiringSoon: 0, expiredCount: 0 });
  }, [policies]);

  // --- Handlers ---
  
  // This is used by Documents view, AI Assistant (Update), etc.
  const handleUpdatePolicy = (updatedPolicy: Policy) => {
    setPolicies(prev => {
        const oldPolicy = prev.find(p => p.id === updatedPolicy.id);
        if (oldPolicy) {
            const diff = generatePolicyDiff(oldPolicy, updatedPolicy);
            // If explicit diff exists, use it. Otherwise assume file metadata update or generic update.
            const logDetail = diff || '无关键信息变更（仅更新了文件元数据）';
            
            // Log update if there's a difference or if the source file changed
            if (diff || oldPolicy.sourceFile !== updatedPolicy.sourceFile) {
                 addLog('update', updatedPolicy.name, logDetail, activeTab === 'assistant');
            }
        }
        return prev.map(p => p.id === updatedPolicy.id ? updatedPolicy : p);
    });
  };

  // Specific handlers for AI to Create and Delete with 'AI System' logging
  const handleAiCreatePolicy = (policy: Policy) => {
      setPolicies(prev => [policy, ...prev]);
      addLog('create', policy.name, 'AI 助手创建了新保单', true);
  };

  const handleAiDeletePolicy = (id: string) => {
      const policy = policies.find(p => p.id === id);
      if (policy) {
          setPolicies(prev => prev.filter(p => p.id !== id));
          addLog('delete', policy.name, 'AI 助手删除了保单', true);
      }
  };

  const handleManualSave = (policy: Policy) => {
    setPolicies(prev => {
      const existing = prev.find(p => p.id === policy.id);
      if (existing) {
        const diff = generatePolicyDiff(existing, policy);
        addLog('update', policy.name, diff || '手动保存（无关键信息变更）', false);
        return prev.map(p => p.id === policy.id ? policy : p);
      } else {
        addLog('create', policy.name, '手动录入新保单', false);
        return [policy, ...prev];
      }
    });
  };

  const handleEditPolicy = (policy: Policy) => {
    setEditingPolicy(policy);
    setIsManualModalOpen(true);
  };

  const handleBulkUpdates = (updatedPolicies: Policy[], newPolicies: Policy[]) => {
    // Log updates
    updatedPolicies.forEach(p => {
        addLog('update', p.name, `通过文件重新分析更新了保单 (源文件: ${p.sourceFile})`, false);
    });
    // Log new
    newPolicies.forEach(p => {
        addLog('bulk_import', p.name, `批量导入新保单 (源文件: ${p.sourceFile})`, false);
    });

    setPolicies(prev => {
      const updateMap = new Map(updatedPolicies.map(p => [p.id, p]));
      const nextPolicies = prev.map(p => updateMap.get(p.id) || p);
      return [...newPolicies, ...nextPolicies];
    });
  };

  const handleDeleteClick = (policy: Policy) => {
    setPolicyToDelete(policy);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (policyToDelete) {
        addLog('delete', policyToDelete.name, '删除了保单', false);
        setPolicies(prev => prev.filter(p => p.id !== policyToDelete.id));
        setPolicyToDelete(null);
        setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteAllPolicies = () => {
    if (policies.length > 0) {
        addLog('delete', '全部保单', `清空了数据库中的 ${policies.length} 条保单`, false);
        setPolicies([]);
    }
  };

  const handleAddNote = (content: string, color: string) => {
    const newNote: Note = {
      id: Date.now().toString(),
      content: content,
      color: color,
      date: new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const handleUpdateNote = (id: string, content: string) => {
    setNotes(prev => prev.map(n => 
      n.id === id 
        ? { ...n, content: content, date: new Date().toLocaleDateString('zh-CN').replace(/\//g, '-') } 
        : n
    ));
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleDownloadReport = () => {
    window.print();
  };

  const handleKeysChange = () => {
    setApiKeys(apiKeyManager.getSavedKeys());
  };

  const handleExportData = () => {
    const backupData = {
      policies,
      notes,
      logs: auditLogs,
      history: localStorage.getItem('insurance_ai_history'),
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `insurance_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        
        if (window.confirm(`准备恢复数据。\n当前未保存的数据将被覆盖，确定继续吗？`)) {
          if (data.policies) setPolicies(data.policies);
          if (data.notes) setNotes(data.notes);
          if (data.logs) setAuditLogs(data.logs);
          if (data.history) localStorage.setItem('insurance_ai_history', data.history);
          
          addLog('restore', '系统数据', '从备份文件恢复了数据', false);
          alert('数据恢复成功。');
        }
      } catch (error) {
        alert('导入失败：文件格式不正确。');
        console.error(error);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border border-slate-200 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3 hover:rotate-6 transition-transform">
             <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">保险管家</h2>
          <p className="text-slate-500 text-sm text-center mb-8">请登录以管理您的家庭资产</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1 ml-1">用户名</label>
              <input 
                type="text" 
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                placeholder="请输入用户名"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1 ml-1">密码</label>
              <input 
                type="password" 
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                placeholder="请输入密码"
              />
            </div>
            
            {loginError && (
              <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 p-3 rounded-lg border border-red-100">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {loginError}
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-4"
            >
              <LogIn className="w-4 h-4" /> 登录系统
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans bg-slate-50">
      
      {/* PRINT ONLY COMPONENT */}
      <ReportGenerator policies={policies} stats={stats} />

      {/* MAIN APP UI */}
      <div className="flex flex-col md:flex-row print:hidden h-screen relative">

        {/* --- Restore File Handle Banner --- */}
        {pendingHandle && !fileHandle && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500 max-w-[90vw] md:max-w-xl border border-slate-700">
                <HardDrive className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">检测到上次使用的数据库</p>
                    <p className="text-xs text-slate-400 truncate">{pendingHandle.name}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <button 
                        onClick={() => {
                            setPendingHandle(null);
                            removeStoredFileHandle();
                        }}
                        className="px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        忽略
                    </button>
                    <button 
                        onClick={restoreConnection}
                        className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        恢复连接
                    </button>
                </div>
            </div>
        )}
        
        {/* Mobile Header */}
        <header className="bg-white border-b border-slate-200 p-4 md:hidden flex justify-between items-center sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-slate-800 text-lg">保险管家</span>
          </div>
          <button onClick={() => setShowSidebar(!showSidebar)}>
            {showSidebar ? <X className="w-6 h-6 text-slate-600" /> : <Menu className="w-6 h-6 text-slate-600" />}
          </button>
        </header>

        {/* Sidebar Navigation */}
        <aside className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-6 flex items-center gap-3 border-b border-slate-800 hidden md:flex shrink-0">
            <ShieldCheck className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="font-bold text-lg tracking-tight">保险管家</h1>
              <p className="text-xs text-slate-400">家庭资产看板</p>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <button 
              onClick={() => { setActiveTab('dashboard'); setShowSidebar(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">总览</span>
            </button>
            <button 
              onClick={() => { setActiveTab('assistant'); setShowSidebar(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'assistant' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span className="font-medium">AI 助手</span>
            </button>
            <button 
              onClick={() => { setActiveTab('members'); setShowSidebar(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'members' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <User className="w-5 h-5" />
              <span className="font-medium">家庭成员</span>
            </button>
            <button 
              onClick={() => { setActiveTab('documents'); setShowSidebar(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'documents' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">保单文档</span>
            </button>
            <button 
              onClick={() => { setActiveTab('notes'); setShowSidebar(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'notes' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <StickyNote className="w-5 h-5" />
              <span className="font-medium">便利贴</span>
            </button>
            <button 
              onClick={() => { setActiveTab('audit'); setShowSidebar(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'audit' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <ClipboardList className="w-5 h-5" />
              <span className="font-medium">修改日志</span>
            </button>
            <div className="pt-2 mt-2 border-t border-slate-800">
               <button 
                onClick={() => { setActiveTab('archive'); setShowSidebar(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'archive' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}
              >
                <History className="w-5 h-5" />
                <span className="font-medium">已过期/作废归档</span>
              </button>
            </div>
          </nav>

          <div className="p-4 border-t border-slate-800 shrink-0 space-y-1">
            {/* File System Indicator */}
            {fileHandle && (
                <div className="mb-3 px-2 py-1.5 bg-emerald-900/30 border border-emerald-800 rounded flex items-center gap-2 text-[10px] text-emerald-400">
                    <Database className="w-3 h-3" />
                    <span className="truncate flex-1" title={connectedFileName || ''}>{connectedFileName}</span>
                    {isSavingToFile && <RefreshCw className="w-3 h-3 animate-spin" />}
                </div>
            )}

            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg text-xs">
                {loginUser.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{loginUser}</p>
                <p className="text-xs text-slate-400">管理员</p>
              </div>
              <button 
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                  title="退出登录"
              >
                  <LogOut className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-1 border-t border-slate-800 pt-3">
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="w-full text-left px-2 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors flex items-center gap-2"
                title="打开系统设置"
              >
                <Settings className="w-3 h-3" /> 系统设置
              </button>
              <button 
                onClick={handleExportData}
                className="w-full text-left px-2 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors flex items-center gap-2"
                title="将数据导出为文件备份"
              >
                <Download className="w-3 h-3" /> 备份数据
              </button>
              <button 
                onClick={() => fileImportRef.current?.click()}
                className="w-full text-left px-2 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors flex items-center gap-2"
                title="从备份文件恢复数据"
              >
                <ArchiveRestore className="w-3 h-3" /> 恢复数据
              </button>
              <input type="file" ref={fileImportRef} className="hidden" accept=".json" onChange={handleImportData} />
            </div>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {showSidebar && (
          <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setShowSidebar(false)} />
        )}

        {/* Main Content */}
        <main className="flex-1 bg-slate-50 overflow-y-auto h-[calc(100vh-64px)] md:h-screen">
          <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
            
            {activeTab === 'dashboard' && (
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">保险资产总览</h2>
                    <p className="text-slate-500 mt-1">您家庭本年度的所有保险配置摘要。</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                        onClick={handleRefreshPolicies} 
                        disabled={isRefreshing}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm flex items-center gap-2"
                        title="刷新保单状态"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> 
                      {isRefreshing ? '刷新中' : '刷新状态'}
                    </button>
                    <button onClick={handleDownloadReport} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm flex items-center gap-2">
                      <Download className="w-4 h-4" /> 导出报告
                    </button>
                    <button onClick={() => { setEditingPolicy(null); setIsManualModalOpen(true); }} className="px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-all shadow-sm flex items-center gap-2">
                      <PenTool className="w-4 h-4" /> 手动录入
                    </button>
                    <button onClick={() => setIsBulkUploadOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2">
                      <UploadCloud className="w-4 h-4" /> 上传保单
                    </button>
                  </div>
                </div>

                {(stats.expiringSoon > 0) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 animate-in zoom-in-95 duration-300">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-800">保单到期提醒</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        您有 <span className="font-bold">{stats.expiringSoon}</span> 份保单即将在30天内到期，
                        请及时检查续费以免保障中断。
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <KpiCard title="年度总保费" value={`¥${stats.totalPremium.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`} icon={Wallet} colorClass="text-blue-600 bg-blue-50"/>
                  <KpiCard title="总保障额度" value={`¥${(stats.totalCoverage / 10000).toFixed(0)}万`} icon={ShieldCheck} colorClass="text-emerald-600 bg-emerald-50"/>
                  <KpiCard title="有效保单" value={stats.activeCount.toString()} icon={CheckCircle} trend={stats.expiringSoon > 0 ? "有保单即将到期" : "保障状态良好"} colorClass="text-purple-600 bg-purple-50"/>
                  <KpiCard title="已过期保单" value={stats.expiredCount.toString()} icon={FileX} colorClass="text-slate-500 bg-slate-100"/>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PremiumDistributionChart policies={activePolicies} />
                  <CoverageByPersonChart policies={activePolicies} />
                </div>

                {/* Main Active Policies Table */}
                <PolicyTable 
                    policies={activePolicies} 
                    title="生效中 & 待生效保单"
                />
              </>
            )}

            {activeTab === 'archive' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <Archive className="w-6 h-6 text-slate-500" />
                                已过期/作废保单归档
                            </h2>
                            <p className="text-slate-500 mt-1">在此查看历史保单记录。这些保单已从总览和分析中移除。</p>
                        </div>
                    </div>

                    <div className="bg-slate-100 rounded-xl border border-slate-200 p-1 mb-6 inline-flex text-xs text-slate-500">
                        <span className="px-3 py-1 bg-white rounded-lg shadow-sm text-slate-700 font-medium">提示</span>
                        <span className="px-3 py-1">归档保单不参与家庭保障额度统计，也不影响年度保费计算。</span>
                    </div>

                    <PolicyTable 
                        policies={expiredPolicies} 
                        title="已过期归档列表" 
                        variant="archive"
                    />
                </div>
            )}

            {activeTab === 'members' && <MembersView policies={activePolicies} />}
            {activeTab === 'documents' && (
              <DocumentsView 
                policies={activePolicies} 
                onDelete={handleDeleteClick} 
                onUpdatePolicy={handleUpdatePolicy}
                onBulkUpdate={handleBulkUpdates}
                onDeleteAll={handleDeleteAllPolicies}
                onEdit={handleEditPolicy}
              />
            )}
            {activeTab === 'notes' && (
              <NotesView 
                notes={notes}
                onAddNote={handleAddNote}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
              />
            )}
            {activeTab === 'assistant' && (
              <AiAssistantView 
                  policies={policies} 
                  configVersion={configVersion}
                  onUpdatePolicy={handleUpdatePolicy}
                  onCreatePolicy={handleAiCreatePolicy}
                  onDeletePolicy={handleAiDeletePolicy}
                  onRefreshPolicies={handleRefreshPolicies}
              />
            )}
            {activeTab === 'audit' && (
                <AuditLogView logs={auditLogs} />
            )}
          </div>
        </main>

        <BulkUpdateModal isOpen={isBulkUploadOpen} onClose={() => setIsBulkUploadOpen(false)} existingPolicies={policies} onComplete={handleBulkUpdates}/>
        <ManualPolicyModal isOpen={isManualModalOpen} onClose={() => { setIsManualModalOpen(false); setEditingPolicy(null); }} onSave={handleManualSave} initialData={editingPolicy}/>
        <DeleteConfirmationModal isOpen={isDeleteModalOpen} policyName={policyToDelete?.name || ''} onClose={() => { setIsDeleteModalOpen(false); setPolicyToDelete(null); }} onConfirm={confirmDelete}/>
        
        {/* Settings Modal */}
        <SettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)}
            // File System
            isConnected={!!fileHandle}
            connectedFileName={connectedFileName}
            lastSyncTime={lastSyncTime}
            onConnectFile={handleConnectFile}
            onCreateFile={handleCreateFile}
            onDisconnect={handleDisconnectFile}
            isSaving={isSavingToFile}
            onKeysChange={handleKeysChange}
        />
      </div>
    </div>
  );
};

export default App;
