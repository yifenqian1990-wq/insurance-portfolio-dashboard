
import React from 'react';
import { X, Download, Printer, FileText, ShieldCheck, Calendar, User, CreditCard, Users } from 'lucide-react';
import { Policy } from '../types';

interface FilePreviewModalProps {
  policy: Policy | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (policy: Policy) => void;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ policy, isOpen, onClose, onDownload }) => {
  if (!isOpen || !policy) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('printable-policy');
    if (printContent) {
      const windowUrl = 'about:blank';
      const uniqueName = new Date();
      const windowName = 'Print' + uniqueName.getTime();
      const printWindow = window.open(windowUrl, windowName, 'width=800,height=600');
      
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${policy.name} - 打印预览</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                body { padding: 40px; -webkit-print-color-adjust: exact; }
                @media print { .no-print { display: none; } }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:hidden">
      <div className="bg-slate-100 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">保单预览</h3>
              <p className="text-xs text-slate-500">{policy.policyNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="打印"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button 
              onClick={() => onDownload(policy)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="下载"
            >
              <Download className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-500/10">
          <div 
            id="printable-policy" 
            className="bg-white shadow-lg mx-auto max-w-[210mm] min-h-[297mm] p-[20mm] relative"
          >
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
              <div className="text-slate-100 text-[120px] font-bold -rotate-45 whitespace-nowrap select-none">
                电子保单副本
              </div>
            </div>

            {/* Document Header */}
            <div className="relative z-10 border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-widest">保险单</h1>
                <p className="text-sm text-slate-500 mt-1 uppercase tracking-wide">Insurance Policy Schedule</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-blue-900">{policy.insurer}</div>
                <div className="text-xs text-slate-500 mt-1">客户服务热线: 95xxx</div>
              </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 space-y-8">
              
              {/* Policy Basic Info */}
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-100">
                <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">保单号码 / Policy No.</p>
                    <p className="text-lg font-mono font-bold text-slate-800">{policy.policyNumber}</p>
                  </div>
                   <div>
                    <p className="text-xs text-slate-500 mb-1">险种名称 / Product Name</p>
                    <p className="text-lg font-bold text-slate-800">{policy.name}</p>
                  </div>
                </div>
              </div>

              {/* Parties Info */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase border-l-4 border-blue-600 pl-3 mb-4">人员信息</h3>
                <div className="grid grid-cols-3 gap-6">
                   <div className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-bold text-slate-500">主被保险人</span>
                      </div>
                      <p className="font-bold text-slate-800">{policy.insuredPerson}</p>
                   </div>
                   <div className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-500">投保人</span>
                      </div>
                      <p className="font-bold text-slate-800">王成</p>
                   </div>
                   <div className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-500">受益人</span>
                      </div>
                      <p className="font-bold text-slate-800">法定</p>
                   </div>
                </div>
                
                {/* Other Insured Persons Section */}
                {policy.otherInsuredPersons && policy.otherInsuredPersons.length > 0 && (
                    <div className="mt-4 p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-indigo-500" />
                            <span className="text-xs font-bold text-slate-500">其他被保险人 (连带被保)</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {policy.otherInsuredPersons.map((person, index) => (
                                <span key={index} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700">
                                    {person}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
              </div>

              {/* Coverage & Premium */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase border-l-4 border-blue-600 pl-3 mb-4">保障内容 & 缴费</h3>
                <div className="overflow-hidden border border-slate-200 rounded-lg">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">保障项目</th>
                        <th className="px-4 py-3 text-right">保险金额</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-4 py-3 text-slate-800 font-medium">基本保险责任</td>
                        <td className="px-4 py-3 text-right text-slate-800">{policy.coverageDisplay}</td>
                      </tr>
                      {policy.tags.map((tag, index) => (
                         <tr key={index}>
                           <td className="px-4 py-3 text-slate-600 pl-8">- {tag}责任</td>
                           <td className="px-4 py-3 text-right text-slate-600">包含</td>
                         </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                      <tr>
                         <td className="px-4 py-3">本期保费合计</td>
                         <td className="px-4 py-3 text-right text-lg">{policy.premiumDisplay}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Dates */}
              <div>
                 <h3 className="text-sm font-bold text-slate-900 uppercase border-l-4 border-blue-600 pl-3 mb-4">保险期间</h3>
                 <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">保险责任生效时间：{policy.startDate} 00:00:00</span>
                    </div>
                    <div className="text-sm font-medium text-blue-900">至 {policy.endDate} 23:59:59 止</div>
                 </div>
              </div>

              {/* Footer */}
              <div className="mt-16 pt-8 border-t border-slate-200 text-center">
                  <div className="inline-block p-4 border-2 border-red-600/30 rounded-full mb-4 rotate-12">
                    <div className="w-32 h-10 flex items-center justify-center text-red-600/50 font-bold text-xl border border-red-600/30">
                      电子签章
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">
                    本单证仅供参考，具体保险责任以正式出具的保险合同为准。<br/>
                    生成日期: {new Date().toLocaleDateString()}
                  </p>
              </div>

            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white p-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
           <button onClick={onClose} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
             关闭预览
           </button>
           <button onClick={() => onDownload(policy)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
             <Download className="w-4 h-4" />
             下载电子保单
           </button>
        </div>

      </div>
    </div>
  );
};

export default FilePreviewModal;
