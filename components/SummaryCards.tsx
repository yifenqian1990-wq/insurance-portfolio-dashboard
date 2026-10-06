
import React from 'react';
import { FileType, HardDrive, ShieldAlert, Activity, CheckCircle2 } from 'lucide-react';
import { Policy, PolicyCategory } from '../types';

interface SummaryCardsProps {
  policies: Policy[];
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ policies }) => {
  const totalFiles = policies.length;
  const totalSize = policies.reduce((acc, p) => acc + (p.fileSize || 0), 0);
  
  // Calculate Portfolio Completeness Score
  // Essential categories: Health, Life/Accident
  const uniqueMembers = Array.from(new Set(policies.map(p => p.insuredPerson.split(' ')[0].split('(')[0])));
  let coveredPoints = 0;
  const totalPoints = uniqueMembers.length * 2; // Health and Life for each

  uniqueMembers.forEach(member => {
    const memberPolicies = policies.filter(p => p.insuredPerson.includes(member));
    if (memberPolicies.some(p => p.category === PolicyCategory.HEALTH)) coveredPoints++;
    if (memberPolicies.some(p => p.category === PolicyCategory.LIFE)) coveredPoints++;
  });

  const completeness = totalPoints > 0 ? Math.round((coveredPoints / totalPoints) * 100) : 0;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <FileType className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">文件总量</p>
          <p className="text-xl font-bold text-slate-800">{totalFiles} 份文档</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
          <HardDrive className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">存储占用</p>
          <p className="text-xl font-bold text-slate-800">{formatSize(totalSize)}</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">保障完善度</p>
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold text-slate-800">{completeness}%</p>
            <div className="flex-1 w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-indigo-500" style={{ width: `${completeness}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">待补全项</p>
          <p className="text-xl font-bold text-slate-800">{totalPoints - coveredPoints} 项缺口</p>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
