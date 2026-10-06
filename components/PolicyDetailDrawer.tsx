
import React from 'react';
import { X, Calendar, Shield, User, CreditCard, Building2, Tag, FileText } from 'lucide-react';
import { Policy } from '../types';

interface PolicyDetailDrawerProps {
  isOpen: boolean;
  policy: Policy | null;
  onClose: () => void;
}

const PolicyDetailDrawer: React.FC<PolicyDetailDrawerProps> = ({ isOpen, policy, onClose }) => {
  if (!isOpen || !policy) return null;

  const handleAddToCalendar = () => {
    if (!policy) return;

    // Create ICS content
    // Format: YYYYMMDD
    const endDate = new Date(policy.endDate);
    const startDateStr = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "").substring(0, 8); 
    
    // End date for all day event is usually +1 day in ICS standard
    const nextDay = new Date(endDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const endDateStr = nextDay.toISOString().replace(/-|:|\.\d\d\d/g, "").substring(0, 8);

    const title = `保险到期提醒: ${policy.name}`;
    const description = `险种: ${policy.category}\\n保险公司: ${policy.insurer}\\n保单号: ${policy.policyNumber}\\n被保险人: ${policy.insuredPerson}\\n\\n请及时处理续费或核对保单状态。`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//InsuranceDashboard//CN',
      'BEGIN:VEVENT',
      `DTSTART;VALUE=DATE:${startDateStr}`,
      `DTEND;VALUE=DATE:${endDateStr}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${policy.name}_到期提醒.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-2 ${
                policy.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                policy.status === 'Expired' ? 'bg-slate-100 text-slate-800' :
                'bg-amber-100 text-amber-800'
            }`}>
              {policy.status === 'Active' ? '保障中' : policy.status === 'Expired' ? '已过期' : '待生效'}
            </div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">{policy.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Key Dates Action */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-900">到期日: {policy.endDate}</p>
                <div className="flex items-center justify-between mt-1">
                   <p className="text-xs text-blue-700">生效日: {policy.startDate}</p>
                </div>
                
                <button 
                  onClick={handleAddToCalendar}
                  className="mt-3 w-full text-xs bg-white text-blue-600 border border-blue-200 px-3 py-2 rounded-lg font-medium hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Calendar className="w-3 h-3" /> 添加到日历提醒
                </button>
              </div>
            </div>
          </div>

          {/* Details Sections */}
          <section>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Building2 className="w-3 h-3" /> 保单信息
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">保险公司</span>
                <span className="font-medium text-slate-900 text-right">{policy.insurer}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">保单号</span>
                <span className="font-mono text-slate-900 text-right select-all">{policy.policyNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">险种分类</span>
                <span className="font-medium text-slate-900 text-right">{policy.category}</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className="w-3 h-3" /> 人员信息
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">主被保险人</span>
                <span className="font-medium text-slate-900">{policy.insuredPerson}</span>
              </div>
              {policy.otherInsuredPersons && policy.otherInsuredPersons.length > 0 && (
                <div className="pt-1">
                  <span className="text-slate-500 block mb-2 text-xs">其他被保险人</span>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {policy.otherInsuredPersons.map((p, i) => (
                      <span key={i} className="inline-block bg-slate-100 text-slate-600 px-2.5 py-1 rounded text-xs font-medium border border-slate-200">{p}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
              <CreditCard className="w-3 h-3" /> 费用与保障
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-500 mb-1">年度保费</p>
                <p className="font-mono font-bold text-slate-900">{policy.premiumDisplay}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                <p className="text-xs text-emerald-600 mb-1">总保额</p>
                <p className="font-medium font-bold text-emerald-800">{policy.coverageDisplay}</p>
              </div>
            </div>
          </section>

          {policy.tags && policy.tags.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Tag className="w-3 h-3" /> 标签特性
              </h3>
              <div className="flex flex-wrap gap-2">
                {policy.tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

           <section>
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Shield className="w-3 h-3" /> 源文件信息
             </h3>
             <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <FileText className="w-8 h-8 text-slate-300 shrink-0" />
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-700 truncate" title={policy.sourceFile}>{policy.sourceFile}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                        上次更新: {new Date(policy.lastModified || '').toLocaleDateString()}
                    </p>
                </div>
             </div>
           </section>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <button 
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
          >
            关闭
          </button>
        </div>

      </div>
    </div>
  );
};

export default PolicyDetailDrawer;
