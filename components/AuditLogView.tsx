
import React, { useState } from 'react';
import { AuditLogEntry } from '../types';
import { ClipboardList, PlusCircle, Edit3, Trash2, UploadCloud, RotateCcw, Search, Clock, Bot, User } from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
}

const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(log => 
    log.policyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return <PlusCircle className="w-4 h-4 text-emerald-600" />;
      case 'update': return <Edit3 className="w-4 h-4 text-blue-600" />;
      case 'delete': return <Trash2 className="w-4 h-4 text-red-600" />;
      case 'bulk_import': return <UploadCloud className="w-4 h-4 text-indigo-600" />;
      case 'restore': return <RotateCcw className="w-4 h-4 text-amber-600" />;
      default: return <ClipboardList className="w-4 h-4 text-slate-600" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create': return '新增保单';
      case 'update': return '修改保单';
      case 'delete': return '删除保单';
      case 'bulk_import': return '批量导入';
      case 'restore': return '数据恢复';
      default: return action;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">保单修改日志</h2>
          <p className="text-slate-500 mt-1">追踪所有针对保单数据的增删改操作记录。</p>
        </div>
        
        <div className="relative w-full md:w-auto">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
                 type="text" 
                 placeholder="搜索日志..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
             />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>暂无日志记录</p>
            </div>
        ) : (
            <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-px bg-slate-200 hidden md:block"></div>
                
                <div className="divide-y divide-slate-100">
                    {filteredLogs.map((log, idx) => (
                        <div key={log.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row gap-4 relative">
                            {/* Timestamp Column */}
                            <div className="md:w-48 shrink-0 flex items-center gap-3 md:pl-3 z-10">
                                <div className={`w-2 h-2 rounded-full border-2 border-white shadow-sm shrink-0 hidden md:block ${
                                    log.action === 'delete' ? 'bg-red-500' : 'bg-blue-500'
                                }`}></div>
                                <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" />
                                    {new Date(log.timestamp).toLocaleString('zh-CN', {
                                        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                                    })}
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${
                                         log.action === 'create' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                         log.action === 'delete' ? 'bg-red-50 text-red-700 border-red-100' :
                                         log.action === 'update' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                         'bg-slate-50 text-slate-700 border-slate-200'
                                    }`}>
                                        {getActionIcon(log.action)}
                                        {getActionLabel(log.action)}
                                    </span>
                                    <span className="font-bold text-slate-800 text-sm truncate">{log.policyName}</span>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">{log.details}</p>
                            </div>

                            {/* Operator Column */}
                            <div className="md:w-32 shrink-0 flex md:justify-end items-start">
                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${
                                    log.operator === 'AI System' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {log.operator === 'AI System' ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                    {log.operator === 'AI System' ? 'AI 助手' : '管理员'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogView;
