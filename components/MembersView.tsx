import React from 'react';
import { Policy, PolicyCategory } from '../types';
import { Shield, Coins, FileText, Plus, User, TrendingUp, Users } from 'lucide-react';

interface MembersViewProps {
  policies: Policy[];
}

interface MemberStat {
  name: string;
  totalPremium: number;
  totalCoverage: number;
  policyCount: number;
  categories: Set<PolicyCategory>;
  policies: Policy[];
}

// Helper to normalize names (remove extra info in parens like " (子女)")
const normalizeName = (name: string) => name.split(' ')[0].split('(')[0].trim();

const MembersView: React.FC<MembersViewProps> = ({ policies }) => {
  // Aggregate data by member
  const memberStats = policies.reduce((acc: Record<string, MemberStat>, policy) => {
    // Combine primary insured and other insured persons
    const allInsured = [policy.insuredPerson, ...(policy.otherInsuredPersons || [])];

    allInsured.forEach(rawName => {
      if (!rawName) return;
      
      const name = normalizeName(rawName);
      const isPrimary = rawName === policy.insuredPerson;

      if (!acc[name]) {
        acc[name] = {
          name,
          totalPremium: 0,
          totalCoverage: 0,
          policyCount: 0,
          categories: new Set<PolicyCategory>(),
          policies: []
        };
      }

      // Logic: 
      // 1. Premium: Attribute ONLY to the primary insured to avoid double-counting household spend.
      // 2. Coverage: Attribute to ALL insured persons as they all enjoy the protection.
      // 3. Policy Count: Attribute to ALL.

      if (isPrimary) {
        acc[name].totalPremium += policy.premium;
      }

      acc[name].totalCoverage += policy.coverageAmount;
      acc[name].policyCount += 1;
      acc[name].categories.add(policy.category);
      acc[name].policies.push(policy);
    });

    return acc;
  }, {} as Record<string, MemberStat>);

  const members: MemberStat[] = Object.values(memberStats);

  // Calculate total household premium for percentage calc
  // Note: totalPremium in memberStats is already de-duplicated (only on primary)
  const totalHouseholdPremium = members.reduce((sum, m) => sum + m.totalPremium, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">家庭成员保障分析</h2>
          <p className="text-slate-500 mt-1">查看每位家庭成员的保险配置详情。共同受保的保单已自动关联至相关成员。</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {members.map((member, idx) => {
           const premiumShare = totalHouseholdPremium > 0 ? ((member.totalPremium / totalHouseholdPremium) * 100).toFixed(1) : '0.0';
           const palette = ['bg-blue-500', 'bg-rose-400', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500'];
           const avatarColor = palette[[...member.name].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length];

           return (
            <div key={member.name} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
               {/* Member Card Header */}
               <div className="p-6 border-b border-slate-50 bg-gradient-to-br from-slate-50/50 to-white flex items-start justify-between">
                  <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-sm shrink-0 ${avatarColor}`}>
                          {member.name.charAt(0)}
                      </div>
                      <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-800">{member.name}</h3>
                            {idx === 0 && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-full font-medium">投保人</span>}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                              {Array.from(member.categories).map(cat => (
                                  <span key={cat} className="px-2 py-0.5 bg-white text-slate-600 text-xs rounded border border-slate-200 shadow-sm">
                                      {cat}
                                  </span>
                              ))}
                          </div>
                      </div>
                  </div>
                  <div className="text-right hidden sm:block">
                     <div className="text-xs text-slate-400 mb-1">家庭保费占比</div>
                     <div className="text-lg font-bold text-slate-700">{premiumShare}%</div>
                  </div>
               </div>

               {/* Stats Grid */}
               <div className="grid grid-cols-3 divide-x divide-slate-50 border-b border-slate-50 bg-white">
                  <div className="p-4 flex flex-col items-center justify-center">
                      <p className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
                          <Coins className="w-3.5 h-3.5" /> 年保费承担
                      </p>
                      <p className="font-bold text-slate-800 text-lg">
                        ¥{member.totalPremium.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
                      </p>
                  </div>
                   <div className="p-4 flex flex-col items-center justify-center">
                      <p className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5" /> 享受保额
                      </p>
                      <p className="font-bold text-slate-800 text-lg">
                        ¥{(member.totalCoverage / 10000).toFixed(0)}万
                      </p>
                  </div>
                   <div className="p-4 flex flex-col items-center justify-center">
                      <p className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" /> 关联保单
                      </p>
                      <p className="font-bold text-slate-800 text-lg">{member.policyCount} <span className="text-xs font-normal text-slate-400">份</span></p>
                  </div>
               </div>

               {/* Policy List Summary */}
               <div className="p-5 bg-slate-50/30 flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> 配置详情
                    </p>
                  </div>
                  <div className="space-y-2.5">
                      {member.policies.map((p, idx) => {
                          // Check if this policy is shared (has multiple insured persons)
                          const isShared = p.otherInsuredPersons && p.otherInsuredPersons.length > 0;
                          const isSecondary = normalizeName(p.insuredPerson) !== member.name;

                          return (
                            <div key={`${p.id}-${idx}`} className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-100 hover:border-blue-200 transition-colors shadow-sm">
                                <div className="flex flex-col min-w-0 pr-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-700 truncate" title={p.name}>{p.name}</span>
                                    {isShared && (
                                        <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] rounded border border-indigo-100 flex items-center gap-0.5" title={`共同被保人: ${p.otherInsuredPersons?.join(', ')}`}>
                                            <Users className="w-3 h-3" /> {isSecondary ? '连带被保' : '含多人'}
                                        </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-slate-400 mt-0.5">{p.category} · {p.insurer}</span>
                                </div>
                                <span className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap font-medium ${
                                    p.status === 'Active' 
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                      : 'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                    {p.status === 'Active' ? '保障中' : '待续费'}
                                </span>
                            </div>
                          );
                      })}
                  </div>
               </div>
            </div>
           );
        })}
      </div>
    </div>
  );
};

export default MembersView;