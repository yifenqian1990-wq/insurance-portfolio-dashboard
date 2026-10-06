
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, GenerateContentResponse, FunctionDeclaration, Type } from "@google/genai";
import { 
  Send, Bot, User as UserIcon, Loader2, Sparkles, 
  X, Trash2, Globe, Copy, Edit2, RotateCcw, 
  Check, Info, MessageSquare, Paperclip, FileText, Image as ImageIcon,
  Eraser
} from 'lucide-react';
import { Policy, PolicyCategory } from '../types';
import { fileToBase64 } from '../services/gemini';
import { apiKeyManager } from '../services/apiKeyManager';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  attachmentName?: string;
  isError?: boolean;
}

interface AiAssistantViewProps {
  policies: Policy[];
  configVersion?: number; 
  onUpdatePolicy?: (policy: Policy) => void;
  onCreatePolicy?: (policy: Policy) => void;
  onDeletePolicy?: (id: string) => void;
  onRefreshPolicies?: () => void;
}

const MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: '极速响应，平衡性能与速度' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (高精度)', description: '深度推理，适合复杂分析' },
];

const AiAssistantView: React.FC<AiAssistantViewProps> = ({ 
    policies, 
    configVersion = 0, 
    onUpdatePolicy, 
    onCreatePolicy, 
    onDeletePolicy, 
    onRefreshPolicies
}) => {
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copyId, setCopyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  
  // File Upload States
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitialMessage = () => ({
    id: 'welcome',
    role: 'model' as const,
    content: '👋 您好！我是您的 AI 保险管家。\n\n我已为您整理好全家保单。您可以问我任何保单细节，或者上传保单图片/PDF 让我分析。',
    timestamp: new Date()
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const savedMessages = localStorage.getItem('insurance_ai_history');
      if (savedMessages) {
        return JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (e) {}
    return [getInitialMessage()];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    localStorage.setItem('insurance_ai_history', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Tools definitions
  const updatePolicyTool: FunctionDeclaration = {
    name: 'updatePolicy',
    description: 'Update specific fields of an insurance policy.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        insurer: { type: Type.STRING },
        premium: { type: Type.NUMBER },
        coverageAmount: { type: Type.NUMBER },
        category: { type: Type.STRING, enum: Object.values(PolicyCategory) },
      },
      required: ["id"],
    },
  };

  const createPolicyTool: FunctionDeclaration = {
    name: 'createPolicy',
    description: 'Create a new insurance policy record.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        insurer: { type: Type.STRING },
        category: { type: Type.STRING, enum: Object.values(PolicyCategory) },
        insuredPerson: { type: Type.STRING },
      },
      required: ["name", "category", "insuredPerson"]
    },
  };

  const systemInstruction = useMemo(() => {
    const policyContext = policies.map(p => ({
      id: p.id,
      name: p.name,
      insurer: p.insurer,
      category: p.category,
      insured: p.insuredPerson,
      coverage: p.coverageDisplay,
      premium: p.premiumDisplay,
      expires: p.endDate,
    }));
    return `您是专业的家庭保险管家。当前保单数据如下：${JSON.stringify(policyContext)}。
    如果用户上传了文件，请分析其中的保单信息。你可以使用 createPolicy 工具录入新保单，或 updatePolicy 工具修改。
    请用亲切、客观的语气回答。`;
  }, [policies]);

  const executeLocalFunction = async (functionCall: any) => {
    const args = functionCall.args;
    if (functionCall.name === 'updatePolicy') {
        const policyId = args.id;
        const existingPolicy = policies.find(p => p.id === policyId);
        if (!existingPolicy) return { result: "Policy not found" };
        onUpdatePolicy?.({ ...existingPolicy, ...args });
        return { result: "Success" };
    } else if (functionCall.name === 'createPolicy') {
        onCreatePolicy?.({
          id: Date.now().toString(),
          name: args.name,
          insurer: args.insurer || "未知",
          policyNumber: "N/A",
          category: args.category,
          insuredPerson: args.insuredPerson,
          premium: 0,
          premiumDisplay: "¥0",
          coverageAmount: 0,
          coverageDisplay: "¥0",
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          status: 'Active',
          tags: ['AI 创建'],
          sourceFile: 'AI 助手',
        });
        return { result: "Success" };
    }
    return { result: "Error" };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
    e.target.value = ''; // Reset for same file selection
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const handleSend = async (contentOverride?: string, retryCount = 0) => {
    const text = contentOverride !== undefined ? contentOverride : inputValue;
    const hasFiles = selectedFiles.length > 0;
    
    if ((!text.trim() && !hasFiles) || isLoading) return;

    if (retryCount === 0 && contentOverride === undefined) {
      const attachmentNames = hasFiles ? selectedFiles.map(f => f.name).join(', ') : undefined;
      const newUserMsg: Message = { 
        id: Date.now().toString(), 
        role: 'user', 
        content: text, 
        timestamp: new Date(),
        attachmentName: attachmentNames
      };
      setMessages(prev => [...prev, newUserMsg]);
      setInputValue('');
    }

    setIsLoading(true);
    const activeKey = apiKeyManager.getApiKey();
    const currentFiles = [...selectedFiles];
    if (retryCount === 0) setSelectedFiles([]);

    try {
      const ai = new GoogleGenAI({ apiKey: activeKey });
      let tools: any[] = isSearchEnabled ? [{ googleSearch: {} }] : [{ functionDeclarations: [updatePolicyTool, createPolicyTool] }];
      
      const chatHistory = messages
        .filter(m => m.id !== 'welcome' && !m.isError)
        .map(m => ({
          role: m.role === 'model' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

      const chat = ai.chats.create({
        model: selectedModel,
        config: { systemInstruction: systemInstruction, tools: tools },
        history: chatHistory
      });

      const responseId = Date.now().toString() + "-model";
      setMessages(prev => [...prev, { id: responseId, role: 'model', content: '', timestamp: new Date() }]);

      // Construct message parts
      let messageParts: any[] = [];
      if (text.trim()) messageParts.push({ text });
      
      if (currentFiles.length > 0) {
        const fileParts = await Promise.all(currentFiles.map(async (file) => {
          const base64Data = await fileToBase64(file);
          return {
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          };
        }));
        messageParts = [...messageParts, ...fileParts];
      }

      const responseStream = await chat.sendMessageStream({ message: messageParts });
      let fullText = "";
      let toolCalls: any[] = [];

      for await (const chunk of responseStream) {
        const c = chunk as GenerateContentResponse;
        fullText += c.text || "";
        if (c.candidates?.[0]?.content?.parts) {
          for (const part of c.candidates[0].content.parts) {
            if (part.functionCall) toolCalls.push(part.functionCall);
          }
        }
        setMessages(prev => prev.map(m => m.id === responseId ? { ...m, content: fullText } : m));
      }

      if (toolCalls.length > 0) {
        for (const call of toolCalls) {
          const result = await executeLocalFunction(call);
          await chat.sendMessage({ message: [{ functionResponse: { name: call.name, id: call.id, response: result } }] });
        }
        const finalConclusion = await chat.sendMessage({ message: "请基于刚才执行的操作，给出一个简短的总结确认。" });
        setMessages(prev => prev.map(m => m.id === responseId ? { ...m, content: fullText + "\n\n" + (finalConclusion.text || "") } : m));
      }
    } catch (error: any) {
      if ((error?.message?.includes('429') || error?.status === 429) && retryCount < 3) {
        apiKeyManager.markAsDepleted(activeKey);
        return handleSend(text, retryCount + 1);
      }
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: '服务响应异常，请检查网络或稍后重试。', timestamp: new Date(), isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopyId(id);
    setTimeout(() => setCopyId(null), 2000);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这条消息吗？这可能会影响对话上下文。')) {
      setMessages(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('确定要清空所有对话记录吗？')) {
      const initial = [getInitialMessage()];
      setMessages(initial);
      localStorage.removeItem('insurance_ai_history');
    }
  };

  const handleEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditValue(content);
  };

  const saveEdit = () => {
    if (!editingId || !editValue.trim()) return;
    setMessages(prev => prev.map(m => m.id === editingId ? { ...m, content: editValue } : m));
    setEditingId(null);
  };

  const handleRegenerate = (index: number) => {
    if (isLoading) return;
    const userMsg = messages[index - 1];
    if (userMsg && userMsg.role === 'user') {
      setMessages(prev => prev.slice(0, index));
      handleSend(userMsg.content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
  };

  return (
    <div 
      className={`flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-64px)] -m-4 md:-m-8 bg-white transition-all ${
        isDragging ? 'bg-blue-50/10 ring-4 ring-blue-500/10' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">AI 保险助手</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] text-slate-500 font-medium">多模态解析已就绪</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-600 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
            title="清空对话记录"
          >
            <Eraser className="w-3.5 h-3.5" />
            清空对话
          </button>
          <button 
            onClick={() => setIsSearchEnabled(!isSearchEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                isSearchEnabled ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            {isSearchEnabled ? '联网模式' : '离线模式'}
          </button>
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
          >
            {MODELS.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-10 md:px-12 space-y-8 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
        <div className="max-w-4xl mx-auto space-y-8">
          {messages.map((msg, index) => (
            <div key={msg.id} className={`group flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
                msg.role === 'model' ? 'bg-white border-slate-200 text-blue-600' : 'bg-blue-600 border-blue-500 text-white'
              }`}>
                {msg.role === 'model' ? <Bot className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
              </div>
              
              <div className={`flex flex-col max-w-[85%] sm:max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`relative px-5 py-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white shadow-blue-200 shadow-lg' 
                    : 'bg-white border border-slate-200 text-slate-800 shadow-xl shadow-slate-100'
                }`}>
                  {editingId === msg.id ? (
                    <div className="space-y-3 min-w-[200px]">
                      <textarea 
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-md">取消</button>
                        <button onClick={saveEdit} className="px-3 py-1.5 text-xs font-bold bg-blue-500 text-white rounded-md hover:bg-blue-600">保存修改</button>
                      </div>
                    </div>
                  ) : (
                    <div className={`whitespace-pre-wrap ${msg.role === 'model' ? 'font-normal text-slate-700' : 'font-medium'}`}>
                      {msg.content || (isLoading && index === messages.length - 1 ? (
                        <div className="flex gap-1 items-center py-1">
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                      ) : '')}
                    </div>
                  )}
                  {msg.attachmentName && (
                    <div className={`mt-2 flex items-center gap-2 px-2 py-1.5 rounded-lg border text-[10px] ${
                      msg.role === 'user' ? 'bg-white/10 border-white/20 text-white' : 'bg-slate-50 border-slate-100 text-slate-500'
                    }`}>
                      <FileText className="w-3 h-3" />
                      <span className="truncate max-w-[150px]">{msg.attachmentName}</span>
                    </div>
                  )}
                  {copyId === msg.id && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg animate-in fade-in slide-in-from-bottom-1">
                      已复制到剪贴板
                    </div>
                  )}
                </div>

                {!isLoading && !editingId && (
                  <div className={`mt-2 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity px-2`}>
                    <button onClick={() => handleCopy(msg.id, msg.content)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      {copyId === msg.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    {msg.role === 'user' && (
                      <>
                        <button onClick={() => handleEdit(msg.id, msg.content)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(msg.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </>
                    )}
                    {msg.role === 'model' && index > 0 && (
                      <button onClick={() => handleRegenerate(index)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><RotateCcw className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-100 space-y-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 px-2 animate-in slide-in-from-bottom-2">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 shadow-sm">
                  {file.type.startsWith('image/') ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                  <span className="truncate max-w-[120px] font-medium">{file.name}</span>
                  <button onClick={() => removeFile(idx)} className="p-1 hover:bg-blue-200 rounded-full transition-colors text-blue-400 hover:text-blue-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              multiple 
              accept="image/*,.pdf" 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 hover:text-blue-600 transition-all flex items-center justify-center shrink-0 shadow-sm mb-1"
              title="添加图片或 PDF 附件"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <div className="relative flex-1">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={selectedFiles.length > 0 ? "描述一下这些保单..." : "询问保单细节或上传保单分析..."}
                disabled={isLoading}
                className="w-full pl-6 pr-14 py-4 min-h-[56px] max-h-[200px] bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all shadow-inner resize-none overflow-y-auto leading-relaxed"
              />
              <button 
                  onClick={() => handleSend()} 
                  disabled={(!inputValue.trim() && selectedFiles.length === 0) || isLoading} 
                  className={`absolute right-2.5 bottom-2.5 p-3 rounded-xl transition-all shadow-md ${
                      (!inputValue.trim() && selectedFiles.length === 0) || isLoading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                  }`}
              >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="text-center">
              <p className="text-[11px] text-slate-400">Enter 发送，Shift + Enter 换行 | 支持拖拽文件至此进行分析 ✨</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistantView;
