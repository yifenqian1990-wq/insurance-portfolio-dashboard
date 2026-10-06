
import React from 'react';
import { Policy, DashboardStats } from '../types';
import { ShieldCheck, Wallet, FileText, User, Building2, PieChart as PieIcon, Users } from 'lucide-react';

interface ReportGeneratorProps {
  policies: Policy[];
  stats: DashboardStats;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#6366f1'];

// Helper to normalize names (remove extra info in parens like " (子女)")
const normalizeName = (name: string) => {
    if (!name) return 'Unknown';
    // Split by space, English parenthesis, or Chinese parenthesis
    return name.split(' ')[0].split('(')[0].split('（')[0].trim();
};

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ policies, stats }) => {
  
  // 1. Category Distribution Data
  const categoryData = Array.from(policies.reduce((acc, p) => {
    acc.set(p.category, (acc.get(p.category) || 0) + p.premium);
    return acc;
  }, new Map<string, number>())).map(([name, value]) => ({ name, value }));

  // Sort by value descending
  categoryData.sort((a, b) => b.value - a.value);

  // 2. Member Detailed Analysis Data (Logic aligned with MembersView)
  const memberAnalysis = new Map<string, { 
    totalPremium: number,
    totalCoverage: number, 
    count: number, 
    categories: Set<string>
  }>();

  policies.forEach(p => {
    // Combine primary insured and other insured persons
    const allInsured = [p.insuredPerson, ...(p.otherInsuredPersons || [])];

    allInsured.forEach(rawName => {
        if (!rawName) return;
        const name = normalizeName(rawName);
        
        if (!memberAnalysis.has(name)) {
            memberAnalysis.set(name, { totalPremium: 0, totalCoverage: 0, count: 0, categories: new Set() });
        }
        const stat = memberAnalysis.get(name)!;
        
        // Premium only counts for the primary insured (to avoid double counting household spend)
        if (normalizeName(p.insuredPerson) === name) {
            stat.totalPremium += p.premium;
        }

        stat.totalCoverage += p.coverageAmount;
        stat.count += 1;
        stat.categories.add(p.category);
    });
  });

  const memberData = Array.from(memberAnalysis.entries()).map(([name, data]) => ({ name, ...data }));

  return (
    <div className="hidden print:block bg-white p-8 max-w-[210mm] mx-auto text-slate-800 font-sans">
      {/* Report Header */}
      <div className="flex justify-between items-end border-b-2 border-slate-800 pb-6 mb-8">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">家庭保险资产分析报告</h1>
            <p className="text-sm text-slate-500">生成日期: {new Date().toLocaleDateString()} | 来源: 保险管家</p>
        </div>
        <div className="text-right">
            <div className="flex items-center gap-2 text-blue-600 font-bold justify-end">
                <ShieldCheck className="w-8 h-8" />
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">全家人的保障，一目了然</p>
        </div>
      </div>

      {/* 1. Executive Summary */}
      <section className="mb-10 break-inside-avoid">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-l-4 border-blue-600 pl-3">
          <Wallet className="w-5 h-5 text-blue-600" />
          资产总览
        </h2>
        
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-6">
            <div className="grid grid-cols-4 gap-6 text-center">
                <div className="border-r border-slate-200 last:border-0">
                    <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">年度总保费</p>
                    <p className="text-2xl font-bold text-slate-900">¥{stats.totalPremium.toLocaleString()}</p>
                </div>
                <div className="border-r border-slate-200 last:border-0">
                    <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">家庭总保额</p>
                    <p className="text-2xl font-bold text-emerald-600">¥{(stats.totalCoverage / 10000).toFixed(0)}万</p>
                </div>
                <div className="border-r border-slate-200 last:border-0">
                    <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">有效保单</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.activeCount} <span className="text-sm font-normal text-slate-400">份</span></p>
                </div>
                <div>
                    <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">即将到期</p>
                     <p className={`text-2xl font-bold ${stats.expiringSoon > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {stats.expiringSoon} <span className="text-sm font-normal text-slate-400">份</span>
                     </p>
                </div>
            </div>
        </div>

        {/* Spend Analysis Chart - HTML/CSS Implementation for Print Reliability */}
        <div className="mb-2">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <PieIcon className="w-4 h-4" />
                保费支出结构
            </h3>
            <div className="space-y-3">
                {categoryData.map((d, i) => (
                    <div key={d.name} className="flex items-center text-xs">
                        <span className="w-24 shrink-0 font-medium text-slate-600">{d.name}</span>
                        <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden mx-3 border border-slate-100">
                            <div 
                                className="h-full print:print-color-adjust-exact" 
                                style={{ 
                                    width: `${(d.value / stats.totalPremium) * 100}%`, 
                                    backgroundColor: COLORS[i % COLORS.length],
                                    printColorAdjust: 'exact'
                                }}
                            ></div>
                        </div>
                        <span className="w-24 text-right font-mono text-slate-700">
                            ¥{d.value.toLocaleString()} <span className="text-slate-400 ml-1">({(d.value / stats.totalPremium * 100).toFixed(1)}%)</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* 2. Family Member Analysis */}
      <section className="mb-10 break-inside-avoid">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-l-4 border-emerald-600 pl-3">
          <Users className="w-5 h-5 text-emerald-600" />
          家庭成员保障分析
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
            {memberData.map((member, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg p-4 break-inside-avoid shadow-sm bg-white">
                    <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs border border-slate-200">
                                {member.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-slate-900">{member.name}</h3>
                                <p className="text-[10px] text-slate-400">
                                    {Array.from(member.categories).join(' / ')}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                             <span className="text-xs text-slate-500">关联保单</span>
                             <span className="ml-1 font-bold text-slate-800">{member.count}</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <p className="text-slate-400 mb-0.5">年保费承担</p>
                            <p className="font-semibold text-slate-800">¥{member.totalPremium.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-400 mb-0.5">享受总保额</p>
                            <p className="font-semibold text-emerald-600">¥{(member.totalCoverage/10000).toFixed(0)}万</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* 3. Policy Register (Table View) */}
      <section>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-l-4 border-indigo-600 pl-3 break-before-page">
          <FileText className="w-5 h-5 text-indigo-600" />
          保单明细清单
        </h2>
        
        <div className="border rounded-lg overflow-hidden border-slate-200">
            <table className="w-full text-xs text-left">
                <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 print:print-color-adjust-exact">
                        <th className="py-2 px-3 font-bold text-slate-700 w-[30%]">险种名称 / 保单号</th>
                        <th className="py-2 px-3 font-bold text-slate-700 w-[15%]">被保险人</th>
                        <th className="py-2 px-3 font-bold text-slate-700 w-[15%]">保险公司</th>
                        <th className="py-2 px-3 font-bold text-slate-700 text-right w-[15%]">保费</th>
                        <th className="py-2 px-3 font-bold text-slate-700 text-right w-[15%]">保额</th>
                        <th className="py-2 px-3 font-bold text-slate-700 text-center w-[10%]">到期日</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {policies.map((policy, idx) => (
                        <tr key={idx} className="break-inside-avoid">
                            <td className="py-2 px-3 align-top">
                                <div className="font-bold text-slate-800 mb-0.5 line-clamp-2">{policy.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono scale-95 origin-left">{policy.policyNumber}</div>
                            </td>
                            <td className="py-2 px-3 align-top">
                                <div className="font-medium text-slate-800">{policy.insuredPerson}</div>
                                {policy.otherInsuredPersons && policy.otherInsuredPersons.length > 0 && (
                                    <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[100px]">
                                        及 {policy.otherInsuredPersons.length} 人
                                    </div>
                                )}
                            </td>
                            <td className="py-2 px-3 align-top text-slate-600">{policy.insurer}</td>
                            <td className="py-2 px-3 align-top text-right font-mono text-slate-700">{policy.premiumDisplay}</td>
                            <td className="py-2 px-3 align-top text-right font-medium text-emerald-700">{policy.coverageDisplay}</td>
                            <td className="py-2 px-3 align-top text-center font-mono text-slate-600">
                                {policy.endDate}
                                {new Date(policy.endDate) < new Date() && (
                                    <span className="block text-[10px] text-red-500 font-bold mt-0.5">(已过期)</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </section>

      {/* Footer */}
      <div className="mt-12 pt-4 border-t border-slate-200 text-center">
        <p className="text-[10px] text-slate-400">
            本报告基于您上传的保单文件自动生成，仅供家庭资产管理参考。具体保险责任、免除责任及理赔条件请以保险合同原件为准。<br />
            Generated by Insurance Dashboard
        </p>
      </div>
    </div>
  );
};

export default ReportGenerator;
