import React from 'react';
import {
  Shield,
  Smartphone,
  FileCode2,
  Database,
  BookOpen,
  Download
} from 'lucide-react';
import { downloadProjectZip } from '../utils/zipGenerator';

interface NavbarProps {
  activeTab: 'simulator' | 'code' | 'database' | 'guide';
  setActiveTab: (tab: 'simulator' | 'code' | 'database' | 'guide') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* لوگو و عنوان برند بله */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-white">
                  بازوی پیام‌رسان بله | خدمات ضدسرقت خودرو
                </h1>
                <span className="hidden sm:inline-block text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full font-mono">
                  bale.ai • aiogram 3 • SQLite
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                متصل به tapi.bale.ai • بدون نیاز به فیلترشکن و سازگار با سرورهای ایران
              </p>
            </div>
          </div>

          {/* تب‌های ناوبری اصلی */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'simulator'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>شبیه‌ساز بله</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'code'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>سورس کدهای بله</span>
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'database'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>دیتابیس SQLite</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'guide'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>راهنمای بله</span>
            </button>
          </nav>

          {/* دکمه دانلود کل پروژه */}
          <div className="shrink-0">
            <button
              onClick={downloadProjectZip}
              className="flex items-center gap-2 py-2 px-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">دانلود ZIP بله</span>
              <span className="md:hidden">ZIP</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
