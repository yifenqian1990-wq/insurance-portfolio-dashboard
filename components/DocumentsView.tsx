

import React, { useState, useMemo } from 'react';
import { Policy, PolicyCategory } from '../types';
import { FileText, Download, Eye, Search, Filter, Calendar, HardDrive, Settings, UploadCloud, Trash2, Building2, Users, Pencil, X } from 'lucide-react';
import FilePreviewModal from './FilePreviewModal';
import UpdateAnalysisModal from './UpdateAnalysisModal';
import DocumentManagerModal from './DocumentManagerModal';
import BulkUpdateModal from './BulkUpdateModal';
import DeleteAllModal from './DeleteAllModal';

interface DocumentsViewProps {
  policies: Policy[];
  onDelete?: (policy: Policy) => void;
  onUpdatePolicy?: (policy: Policy) => void;
  onBulkUpdate: (updatedPolicies: Policy[], newPolicies: Policy[]) => void;
  onDeleteAll: () => void;
  onEdit: (policy: Policy) => void;
}

const DocumentsView: React.FC<DocumentsViewProps> = ({ policies, onDelete, onUpdatePolicy, onBulkUpdate, onDeleteAll, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter States
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterInsured, setFilterInsured] = useState<string>('all');

  const [previewPolicy, setPreviewPolicy] = useState<Policy | null>(null);
  const [managingPolicy, setManagingPolicy] = useState<Policy | null>(null);
  
  // We track the policy being updated AND the new file associated with the update
  const [updatingPolicy, setUpdatingPolicy] = useState<Policy | null>(null);
  const [updatingFile, setUpdatingFile] = useState<File | null>(null);

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);

  // Derived unique lists for dropdowns
  const uniqueInsured = useMemo(() => {
    return Array.from(new Set(policies.map(p => p.insuredPerson))).sort();
  }, [policies]);

  const filteredPolicies = policies.filter(p => {
    const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.policyNumber.includes(searchTerm) ||
        p.insurer.includes(searchTerm);
    
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchesInsured = filterInsured === 'all' || p.insuredPerson === filterInsured;

    return matchesSearch && matchesCategory && matchesStatus && matchesInsured;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setFilterStatus('all');
    setFilterInsured('all');
  };

  const hasActiveFilters = searchTerm || filterCategory !== 'all' || filterStatus !== 'all' || filterInsured !== 'all';

  const handleDownload = (policy: Policy) => {
    // HTML Generation Logic
    const otherInsuredHtml = policy.otherInsuredPersons && policy.otherInsuredPersons.length > 0 
        ? `<div class="row"><span class="label">其他被保险人</span><span class="value">${policy.otherInsuredPersons.join(', ')}</span></div>`
        : '';

    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>${policy.name} - 电子保单</title>
    <style>
        body { font-family: 'Microsoft YaHei', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; line-height: 1.6; }
        .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
        .company { font-size: 24px; font-weight: bold; color: #1e40af; }
        .doc-title { text-align: center; font-size: 32px; font-weight: bold; margin: 40px 0; letter-spacing: 8px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 16px; font-weight: bold; border-left: 4px solid #2563eb; padding-left: 10px; margin-bottom: 15px; background: #f8fafc; padding-top: 5px; padding-bottom: 5px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .row { margin-bottom: 10px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 5px; }
        .label { font-size: 12px; color: #64748b; display: block; margin-bottom: 2px; }
        .value { font-size: 16px; font-weight: 500; }
        .footer { margin-top: 60px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #eee; pt: 20px; }
        .tag { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company">${policy.insurer}</div>
        <div style="font-family: monospace; color: #64748b;">NO. ${policy.policyNumber}</div>
    </div>
    <div class="doc-title">保险单</div>
    <div class="section">
        <div class="section-title">基本信息</div>
        <div class="grid">
            <div class="row"><span class="label">险种名称</span><span class="value">${policy.name}</span></div>
             <div class="row"><span class="label">保单状态</span><span class="value">${policy.status === 'Active' ? '保障中' : '已失效'}</span></div>
        </div>
    </div>
    <div class="section">
        <div class="section-title">人员信息</div>
        <div class="grid">
            <div class="row"><span class="label">主被保险人</span><span class="value">${policy.insuredPerson}</span></div>
            <div class="row"><span class="label">投保人</span><span class="value">${policy.insuredPerson}</span></div>
        </div>
        ${otherInsuredHtml ? `<div style="margin-top: 10px;">${otherInsuredHtml}</div>` : ''}
    </div>
    <div class="section">
        <div class="section-title">保障详情</div>
        <div class="row"><span class="label">保险金额</span><span class="value" style="color: #059669; font-weight: bold;">${policy.coverageDisplay}</span></div>
        <div class="row"><span class="label">保障期限</span><span class="value">${policy.startDate} 至 ${policy.endDate}</span></div>
    </div>
    <div class="footer"><p>此文件由保险管家系统生成。<br>生成时间: ${new Date().toLocaleString()}</p></div>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${policy.name}_${policy.policyNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpdate = (policy: Policy, newFile: File) => {
    const updatedPolicyInfo: Policy = {
        ...policy,
        sourceFile: newFile.name,
        fileSize: newFile.size,
        fileType: newFile.type,
        lastModified: new Date().toISOString()
    };

    setManagingPolicy(null);
    setUpdatingFile(newFile);
    setUpdatingPolicy(updatedPolicyInfo); 
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         {/* Header and Search */}
         <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">保单文档管理</h2>
                    <p className="text-slate-500 mt-1">集中管理您的所有电子保单及相关附件。</p>
                </div>
                
                <div className="flex gap-3 w-full md:w-auto">
                    <button 
                        onClick={() => setIsDeleteAllOpen(true)}
                        disabled={policies.length === 0}
                        className={`px-3 py-2 border border-red-200 bg-white text-red-600 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${policies.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50'}`}
                    >
                        <Trash2 className="w-4 h-4" /> 清空所有
                    </button>
                    <button 
                        onClick={() => setIsBulkModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2 whitespace-nowrap"
                    >
                        <UploadCloud className="w-4 h-4" /> 批量导入
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="搜索保单名称、单号或公司..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    />
                </div>
                
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <select 
                        value={filterCategory} 
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 min-w-[100px] cursor-pointer"
                    >
                        <option value="all">所有险种</option>
                        {Object.values(PolicyCategory).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>

                    <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 min-w-[100px] cursor-pointer"
                    >
                        <option value="all">所有状态</option>
                        <option value="Active">保障中</option>
                        <option value="Pending">待生效</option>
                        <option value="Expired">已过期</option>
                    </select>

                    <select 
                        value={filterInsured} 
                        onChange={(e) => setFilterInsured(e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 min-w-[100px] cursor-pointer"
                    >
                        <option value="all">所有被保人</option>
                        {uniqueInsured.map(person => (
                            <option key={person} value={person}>{person}</option>
                        ))}
                    </select>

                    {hasActiveFilters && (
                        <button 
                            onClick={clearFilters}
                            className="px-3 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
                            title="重置筛选"
                        >
                            <X className="w-4 h-4" />
                            <span className="hidden md:inline text-xs">重置</span>
                        </button>
                    )}
                </div>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredPolicies.length > 0 ? (
                filteredPolicies.map(policy => (
                    <div key={policy.id} className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all overflow-hidden relative group flex flex-col">
                        {/* Status Indicator Bar */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                            policy.status === 'Active' ? 'bg-emerald-500' : 
                            policy.status === 'Expired' ? 'bg-slate-400' : 'bg-amber-500'
                        }`}></div>

                        <div className="p-5 pl-7 flex-1 flex flex-col">
                            {/* Card Header */}
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex gap-2">
                                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md font-medium">{policy.category}</span>
                                    <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                                        policy.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 
                                        policy.status === 'Expired' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-600'
                                    }`}>
                                        {policy.status === 'Active' ? '保障中' : policy.status === 'Expired' ? '已过期' : '待生效'}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-slate-400 mb-0.5">主被保险人</div>
                                    <div className="text-sm font-bold text-slate-700 flex items-center justify-end gap-1">
                                        {policy.insuredPerson}
                                        {policy.otherInsuredPersons && policy.otherInsuredPersons.length > 0 && (
                                            /* Fix: Wrap Lucide icon to avoid 'title' prop error */
                                            <span title={`+ ${policy.otherInsuredPersons.join(', ')}`}>
                                                <Users className="w-3 h-3 text-blue-500" />
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Policy Title */}
                            <h3 className="text-lg font-bold text-slate-800 leading-tight mb-2 line-clamp-2 min-h-[3.5rem]" title={policy.name}>
                                {policy.name}
                            </h3>

                            {/* Insurer & Policy No */}
                            <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                                <Building2 className="w-3 h-3 shrink-0" />
                                <span className="truncate max-w-[80px]" title={policy.insurer}>{policy.insurer}</span>
                                <span className="text-slate-300">|</span>
                                <span className="font-mono truncate max-w-[100px]" title={policy.policyNumber}>{policy.policyNumber}</span>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-dashed border-slate-200 my-2"></div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-4 pt-2">
                                <div>
                                    <div className="text-xs text-slate-400 mb-1">保障期限</div>
                                    <div className="text-sm font-semibold text-slate-800">
                                        至 {policy.endDate.split('-')[0]}年
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400 mb-1">保费</div>
                                    <div className="text-sm font-semibold text-slate-800 font-mono truncate" title={policy.premiumDisplay}>
                                        {policy.premiumDisplay}
                                    </div>
                                </div>
                            </div>

                            {/* Core Benefits Box */}
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 mt-auto">
                                <div className="text-xs font-bold text-blue-600 mb-2">核心权益</div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs items-center">
                                        <span className="text-slate-500">总保额</span>
                                        <span className="font-bold text-slate-700">{policy.coverageDisplay}</span>
                                    </div>
                                    {policy.tags.slice(0, 2).map((tag, idx) => (
                                        <div key={idx} className="flex justify-between text-xs items-center">
                                            <span className="text-slate-500 truncate max-w-[100px]">{tag}</span>
                                            <span className="font-bold text-slate-700 shrink-0">包含</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Hover Footer Actions */}
                        <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-100 flex justify-between items-center pl-7">
                             <div className="text-[10px] text-slate-400 flex items-center gap-1 max-w-[120px]">
                                 <FileText className="w-3 h-3 shrink-0" />
                                 <span className="truncate" title={policy.sourceFile}>{policy.sourceFile}</span>
                             </div>
                             <div className="flex gap-1">
                                 <button onClick={() => onEdit(policy)} className="p-1.5 text-slate-400 hover:bg-white hover:text-blue-600 hover:shadow-sm rounded-md transition-all" title="编辑信息">
                                     <Pencil className="w-4 h-4" />
                                 </button>
                                 <button onClick={() => setPreviewPolicy(policy)} className="p-1.5 text-slate-400 hover:bg-white hover:text-blue-600 hover:shadow-sm rounded-md transition-all" title="预览">
                                     <Eye className="w-4 h-4" />
                                 </button>
                                 <button onClick={() => handleDownload(policy)} className="p-1.5 text-slate-400 hover:bg-white hover:text-blue-600 hover:shadow-sm rounded-md transition-all" title="下载">
                                     <Download className="w-4 h-4" />
                                 </button>
                                 <button onClick={() => setManagingPolicy(policy)} className="p-1.5 text-slate-400 hover:bg-white hover:text-blue-600 hover:shadow-sm rounded-md transition-all" title="管理文件">
                                     <Settings className="w-4 h-4" />
                                 </button>
                                  <button onClick={(e) => { e.stopPropagation(); onDelete?.(policy); }} className="p-1.5 text-slate-400 hover:bg-white hover:text-red-600 hover:shadow-sm rounded-md transition-all" title="删除">
                                     <Trash2 className="w-4 h-4" />
                                 </button>
                             </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <Filter className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p>没有找到符合条件的保单</p>
                    <button onClick={clearFilters} className="text-blue-600 text-sm mt-2 hover:underline">清除筛选条件</button>
                </div>
            )}
         </div>
      </div>

      {/* Preview Modal */}
      <FilePreviewModal 
        policy={previewPolicy} 
        isOpen={!!previewPolicy} 
        onClose={() => setPreviewPolicy(null)}
        onDownload={handleDownload}
      />

      {/* Document Manager Modal */}
      <DocumentManagerModal
        isOpen={!!managingPolicy}
        policy={managingPolicy}
        onClose={() => setManagingPolicy(null)}
        onUpdateFile={handleFileUpdate}
        onDownload={handleDownload}
        onDelete={(policy) => {
            setManagingPolicy(null);
            onDelete?.(policy);
        }}
      />

      {/* Update Analysis Modal */}
      <UpdateAnalysisModal
        isOpen={!!updatingPolicy}
        policy={updatingPolicy}
        fileToAnalyze={updatingFile}
        onClose={() => {
             setUpdatingPolicy(null);
             setUpdatingFile(null);
        }}
        onUpdateComplete={(updated) => {
            if (onUpdatePolicy) onUpdatePolicy(updated);
        }}
      />

      {/* Bulk Update Modal */}
      <BulkUpdateModal
        isOpen={isBulkModalOpen}
        existingPolicies={policies}
        onClose={() => setIsBulkModalOpen(false)}
        onComplete={onBulkUpdate}
      />

      {/* Delete All Confirmation Modal */}
      <DeleteAllModal
        isOpen={isDeleteAllOpen}
        onClose={() => setIsDeleteAllOpen(false)}
        onConfirm={() => {
            onDeleteAll();
            setIsDeleteAllOpen(false);
        }}
        count={policies.length}
      />
    </>
  );
};

export default DocumentsView;