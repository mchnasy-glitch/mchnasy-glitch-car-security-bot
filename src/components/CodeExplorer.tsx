import React, { useState } from 'react';
import { BOT_FILES, BotFile } from '../data/botFiles';
import {
  FileCode,
  Copy,
  Check,
  Download,
  FolderTree,
  Terminal,
  Settings,
  BookOpen,
  Server,
  Layers
} from 'lucide-react';
import { downloadProjectZip } from '../utils/zipGenerator';

export const CodeExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<BotFile>(BOT_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categories = [
    { id: 'all', label: 'همه فایل‌ها', icon: FolderTree },
    { id: 'core', label: 'هسته و دیتابیس', icon: Layers },
    { id: 'handlers', label: 'روترها و جریان‌ها', icon: FileCode },
    { id: 'config', label: 'تنظیمات و پیش‌نیازها', icon: Settings },
    { id: 'deploy', label: 'داکر و سرویس لینوکس', icon: Server },
    { id: 'docs', label: 'مستندات و راهنما', icon: BookOpen }
  ];

  const filteredFiles =
    activeCategory === 'all'
      ? BOT_FILES
      : BOT_FILES.filter(f => f.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* سربرگ بخش کد */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <span>مشاهده و کپی کدهای پایتون پروژه (aiogram 3 + SQLite)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            تمامی فایل‌ها به صورت ماژولار و تمیز آماده اجرا در محیط واقعی هستند.
          </p>
        </div>

        <button
          onClick={downloadProjectZip}
          className="flex items-center gap-2 py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>دانلود مستقیم سورس‌کد به صورت ZIP</span>
        </button>
      </div>

      {/* فیلتر دسته‌بندی */}
      <div className="flex flex-wrap gap-2">
        {categories.map(c => {
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                activeCategory === c.id
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* نمای دو ستونه: فایل‌ها و کد ویوئر */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* لیست فایل‌ها */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="text-xs font-bold text-slate-400 px-2 py-1 mb-2">
            فایل‌های پروژه ({filteredFiles.length} فایل):
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredFiles.map(file => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-right p-3 rounded-xl transition-all border ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-500/60 shadow-sm text-cyan-300'
                      : 'bg-slate-950/60 border-slate-850 hover:border-slate-700 text-slate-300 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold dir-ltr text-left">
                      {file.path}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      {file.language}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1">
                    {file.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* نمایشگر محتوای کد انتخابی */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {/* نوار بالای ادیتور */}
          <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="font-mono text-xs text-slate-300 font-semibold dir-ltr">
                {selectedFile.path}
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-all active:scale-95 border border-slate-700/60"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>کپی کد</span>
                </>
              )}
            </button>
          </div>

          {/* توضیح فایل */}
          <div className="bg-slate-900 px-5 py-2.5 text-xs text-slate-400 border-b border-slate-800/80 flex items-center gap-2">
            <span className="font-semibold text-slate-300">توضیح فایل:</span>
            <span>{selectedFile.description}</span>
          </div>

          {/* کادر کد با هایلایت و اسکرول */}
          <div className="p-4 bg-slate-950 max-h-[550px] overflow-auto">
            <pre className="font-mono text-xs text-slate-200 leading-relaxed whitespace-pre dir-ltr text-left">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
