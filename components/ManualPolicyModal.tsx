
import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Calendar, User, CreditCard, Shield, AlertCircle } from 'lucide-react';
import { Policy, PolicyCategory, PolicyStatus } from '../types';

interface ManualPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (policy: Policy) => void;
  initialData?: Policy | null;
}

const ManualPolicyModal: React.FC<ManualPolicyModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    insurer: '',
    policyNumber: '',
    category: PolicyCategory.HEALTH,
    insuredPerson: '',
    otherInsuredPersons: '',
    premium: '',
    coverageAmount: '',
    startDate: '',
    endDate: '',
    tags: ''
  });

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        name: initialData.name,
        insurer: initialData.insurer,
        policyNumber: initialData.policyNumber,
        category: initialData.category,
        insuredPerson: initialData.insuredPerson,
        otherInsuredPersons: initialData.otherInsuredPersons?.join(', ') || '',
        premium: initialData.premium.toString(),
        coverageAmount: initialData.coverageAmount.toString(),
        startDate: initialData.startDate,
        endDate: initialData.endDate,
        tags: initialData.tags.join(', ')
      });
    } else if (isOpen && !initialData) {
      // Reset form for new entry
      setFormData({
        name: '',
        insurer: '',
        policyNumber: '',
        category: PolicyCategory.HEALTH,
        insuredPerson: '',
        otherInsuredPersons: '',
        premium: '',
        coverageAmount: '',
        startDate: '',
        endDate: '',
        tags: ''
      });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Validation
    if (!formData.name || !formData.insurer || !formData.premium || !formData.coverageAmount || !formData.startDate || !formData.endDate) {
      alert('请填写所有必填项');
      return;
    }

    const premium = parseFloat(formData.premium);
    const coverage = parseFloat(formData.coverageAmount);

    // Advanced Validation
    if (isNaN(premium) || premium < 0) {
      alert('年度保费必须为有效的非负数字');
      return;
    }

    if (isNaN(coverage) || coverage < 0) {
      alert('总保额必须为有效的非负数字');
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (end <= start) {
      alert('保单到期日期必须晚于生效日期');
      return;
    }

    // Determine status
    const now = new Date();
    // Normalize time for fair comparison if needed, generally raw comparison is okay for date inputs
    let status: PolicyStatus = 'Active';
    if (end < now) status = 'Expired';
    if (start > now) status = 'Pending';

    const newPolicy: Policy = {
      id: initialData ? initialData.id : Date.now().toString(),
      name: formData.name,
      insurer: formData.insurer,
      policyNumber: formData.policyNumber || 'N/A',
      category: formData.category as PolicyCategory,
      insuredPerson: formData.insuredPerson,
      otherInsuredPersons: formData.otherInsuredPersons ? formData.otherInsuredPersons.split(/[,，]/).map(s => s.trim()).filter(Boolean) : [],
      premium: premium,
      premiumDisplay: `¥${premium.toLocaleString()} / 年`,
      coverageAmount: coverage,
      coverageDisplay: `¥${(coverage / 10000).toFixed(0)}万`,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: status,
      tags: formData.tags ? formData.tags.split(/[,，]/).map(s => s.trim()).filter(Boolean) : ['手动录入'],
      sourceFile: initialData ? initialData.sourceFile : '手动录入',
      fileSize: initialData ? initialData.fileSize : 0,
      fileType: initialData ? initialData.fileType : 'manual',
      lastModified: new Date().toISOString()
    };

    onSave(newPolicy);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{initialData ? '编辑保单信息' : '手动录入保单'}</h3>
              <p className="text-xs text-slate-500">{initialData ? '修改现有保单详情' : '请填写保单关键信息'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Basic Info */}
            <div className="md:col-span-2 space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <Shield className="w-3 h-3" /> 基本信息
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">险种名称 <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange}
                    placeholder="例如：平安e生保2025"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">保险公司 <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="insurer" 
                    value={formData.insurer} 
                    onChange={handleChange}
                    placeholder="例如：平安健康"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">保单号</label>
                  <input 
                    type="text" 
                    name="policyNumber" 
                    value={formData.policyNumber} 
                    onChange={handleChange}
                    placeholder="可选"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">险种分类 <span className="text-red-500">*</span></label>
                  <select 
                    name="category" 
                    value={formData.category} 
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-white"
                  >
                    {Object.values(PolicyCategory).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* People */}
            <div className="md:col-span-2 space-y-4 pt-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <User className="w-3 h-3" /> 人员信息
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">主被保险人 <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="insuredPerson" 
                    value={formData.insuredPerson} 
                    onChange={handleChange}
                    placeholder="姓名"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">其他被保险人</label>
                  <input 
                    type="text" 
                    name="otherInsuredPersons" 
                    value={formData.otherInsuredPersons} 
                    onChange={handleChange}
                    placeholder="多个用逗号分隔"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  />
                </div>
              </div>
            </div>

            {/* Financials & Dates */}
            <div className="md:col-span-2 space-y-4 pt-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <CreditCard className="w-3 h-3" /> 费用与期限
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">年度保费 (元) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    name="premium" 
                    value={formData.premium} 
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">总保额 (元) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    name="coverageAmount" 
                    value={formData.coverageAmount} 
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">生效日期 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input 
                      type="date" 
                      name="startDate" 
                      value={formData.startDate} 
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">到期日期 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input 
                      type="date" 
                      name="endDate" 
                      value={formData.endDate} 
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="md:col-span-2 pt-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">标签 (特点/责任)</label>
              <input 
                type="text" 
                name="tags" 
                value={formData.tags} 
                onChange={handleChange}
                placeholder="例如：门诊, 意外, 保证续保 (用逗号分隔)"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              />
            </div>

          </div>
          
          {/* Submit Buttons */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-medium text-sm hover:bg-slate-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm"
            >
              <Save className="w-4 h-4" />
              {initialData ? '更新保单' : '保存保单'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualPolicyModal;
