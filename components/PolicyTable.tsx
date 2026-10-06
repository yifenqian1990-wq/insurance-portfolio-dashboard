
import React, { useState } from 'react';
import { Policy, PolicyCategory } from '../types';
import { Shield, Car, Heart, Home, AlertCircle, FileText, Archive } from 'lucide-react';
import PolicyDetailDrawer from './PolicyDetailDrawer';

interface PolicyTableProps {
  policies: Policy[];
  title?: string;
  variant?: 'default' | 'archive';
}

const getCategoryIcon = (category: PolicyCategory, isArchive: boolean) => {
  const className = `w-4 h-4 ${isArchive ? 'text-slate-400' : ''}`;
  
  // If archive, force gray icon, otherwise use colored icon
  if (isArchive) {
     switch (category) {
        case PolicyCategory.VEHICLE: return <Car className={className} />;
        case PolicyCategory.HEALTH: return <Heart className={className} />;
        case PolicyCategory.LIFE: return <Shield className={className} />;
        case PolicyCategory.LIABILITY: return <AlertCircle className={className} />;
        default: return <FileText className={className} />;
      }
  }

  switch (category) {
    case PolicyCategory.VEHICLE: return <Car className="w-4 h-4 text-blue-500" />;
    case PolicyCategory.HEALTH: return <Heart className="w-4 h-4 text-rose-500" />;
    case PolicyCategory.LIFE: return <Shield className="w-4 h-4 text-emerald-500" />;
    case PolicyCategory.LIABILITY: return <AlertCircle className="w-4 h-4 text-amber-500" />;
    default: return <FileText className="w-4 h-4 text-slate-500" />;
  }
};

const getStatusLabel = (endDate: string, startDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today
  
  const end = new Date(endDate);
  const start = new Date(startDate);
  
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(today.getDate() + 30);

  if (end < today) return '已过期';
  if (start > today) return '待生效';
  if (end <= thirtyDaysLater) return '即将到期';
  return '保障中';
};

const getStatusStyles = (endDate: string, startDate: string, isArchive: boolean) => {
  if (isArchive) {
      return 'bg-slate-100 text-slate-500 border border-slate-200';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  const start = new Date(startDate);
  
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(today.getDate() + 30);

  if (end < today) {
    return 'bg-red-100 text-red-700 border border-red-200';
  }
  if (start > today) {
    return 'bg-blue-100 text-blue-700 border border-blue-200';
  }
  if (end <= thirtyDaysLater) {
    return 'bg-amber-100 text-amber-700 border border-amber-200';
  }
  return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
};

const PolicyTable: React.FC<PolicyTableProps> = ({ 
    policies, 
    title = "保单明细列表", 
    variant = 'default' 
}) => {
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const isArchive = variant === 'archive';

  // Empty state
  if (policies.length === 0) {
      if (isArchive) return null; // Don't show empty archive table usually
      return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">暂无保单数据</p>
        </div>
      );
  }

  return (
    <>
      <div className={`rounded-xl shadow-sm border overflow-hidden animate-in slide-in-from-bottom-8 duration-700 ${
          isArchive ? 'bg-slate-50 border-slate-200 opacity-90' : 'bg-white border-slate-100'
      }`}>
        <div className={`p-6 border-b flex justify-between items-center ${
            isArchive ? 'border-slate-200 bg-slate-100/50' : 'border-slate-100'
        }`}>
          <h3 className={`text-lg font-semibold flex items-center gap-2 ${
              isArchive ? 'text-slate-600' : 'text-slate-800'
          }`}>
              {isArchive && <Archive className="w-4 h-4" />}
              {title}
          </h3>
          <span className="text-xs text-slate-400">共 {policies.length} 条记录</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className={`text-xs uppercase border-b ${
                isArchive ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-slate-50/50 text-slate-500 border-slate-100'
            }`}>
              <tr>
                <th className="px-6 py-4 font-medium">保单名称</th>
                <th className="px-6 py-4 font-medium">被保险人</th>
                <th className="px-6 py-4 font-medium">保险公司</th>
                <th className="px-6 py-4 font-medium">保额</th>
                <th className="px-6 py-4 font-medium">保费</th>
                <th className="px-6 py-4 font-medium">到期日</th>
                <th className="px-6 py-4 font-medium text-center">状态</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isArchive ? 'divide-slate-200' : 'divide-slate-50'}`}>
              {policies.map((policy) => (
                <tr 
                  key={policy.id} 
                  onClick={() => setSelectedPolicy(policy)}
                  className={`transition-colors group cursor-pointer ${
                      isArchive ? 'hover:bg-slate-200/50 text-slate-500' : 'hover:bg-slate-50/80 text-slate-600'
                  }`}
                  title="点击查看详情"
                >
                  <td className={`px-6 py-4 font-medium ${isArchive ? 'text-slate-600' : 'text-slate-900'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg transition-all ${
                          isArchive ? 'bg-slate-200 group-hover:bg-slate-300' : 'bg-slate-100 group-hover:bg-white group-hover:shadow-sm'
                      }`}>
                        {getCategoryIcon(policy.category, isArchive)}
                      </div>
                      <div className="flex flex-col">
                        <span className={`font-semibold ${isArchive ? 'text-slate-600' : 'text-slate-800'}`}>{policy.name}</span>
                        <span className="text-xs text-slate-400 font-normal font-mono mt-0.5">{policy.policyNumber}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          isArchive ? 'bg-slate-200 text-slate-500' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {policy.insuredPerson.charAt(0)}
                      </div>
                      {policy.insuredPerson}
                    </div>
                  </td>
                  <td className="px-6 py-4">{policy.insurer}</td>
                  <td className={`px-6 py-4 font-medium ${isArchive ? 'text-slate-500' : 'text-slate-600'}`}>{policy.coverageDisplay}</td>
                  <td className={`px-6 py-4 font-mono ${isArchive ? 'text-slate-500' : 'text-slate-600'}`}>{policy.premiumDisplay}</td>
                  <td className={`px-6 py-4 font-mono ${isArchive ? 'text-slate-500' : 'text-slate-600'}`}>{policy.endDate}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyles(policy.endDate, policy.startDate, isArchive)}`}>
                      {getStatusLabel(policy.endDate, policy.startDate)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PolicyDetailDrawer 
        isOpen={!!selectedPolicy} 
        policy={selectedPolicy} 
        onClose={() => setSelectedPolicy(null)} 
      />
    </>
  );
};

export default PolicyTable;
