import React, { useState } from 'react';
import { BotProvider } from './context/BotContext';
import { Navbar } from './components/Navbar';
import { TelegramSimulator } from './components/TelegramSimulator';
import { CodeExplorer } from './components/CodeExplorer';
import { DatabaseViewer } from './components/DatabaseViewer';
import { DeploymentGuide } from './components/DeploymentGuide';
import {
  Shield,
  Sparkles,
  CheckCircle2,
  FolderArchive,
  Download,
  Check,
  Zap,
  Globe
} from 'lucide-react';
import { downloadProjectZip } from './utils/zipGenerator';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'code' | 'database' | 'guide'>('simulator');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = async () => {
    await downloadProjectZip();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  return (
    <BotProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" dir="rtl">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* بنر بزرگ دانلود مستقیم فایل ZIP برای پیام‌رسان بله */}
        <div className="bg-gradient-to-r from-emerald-950 via-teal-950/80 to-slate-900 border-b border-emerald-500/30 px-4 py-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-900/40">
                <FolderArchive className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    پکیج آماده بازوی پیام‌رسان بله (car_antitheft_bale_bot.zip)
                  </h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                    22 KB • 14 فایل
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  پیکربندی شده با سرور <code className="text-emerald-300">tapi.bale.ai</code>، دیتابیس SQLite، ثبت سفارش، پنل مدیریت، systemd و راهنمای فارسی
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <a
                href="/car_antitheft_bale_bot.zip"
                download="car_antitheft_bale_bot.zip"
                onClick={() => {
                  setDownloadSuccess(true);
                  setTimeout(() => setDownloadSuccess(false), 4000);
                }}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 py-2.5 px-5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                    <span>در حال دریافت فایل زیپ بله...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>دانلود مستقیم فایل ZIP بله</span>
                  </>
                )}
              </a>

              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-semibold transition-all"
                title="دانلود جایگزین از طریق موتور JSZip مرورگر"
              >
                <span>دانلود با موتور JSZip</span>
              </button>
            </div>
          </div>
        </div>

        {/* بنر مشخصات فنی پروژه */}
        <section className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800/80 py-5 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-xs mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>پروژه کامل پایتون و aiogram 3 متصل به سرور رسمی پیام‌رسان بله (tapi.bale.ai)</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  بازوی پیام‌رسان بله | خدمات ضدسرقت خودرو
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
                  بدون نیاز به پروکسی یا فیلترشکن، دارای جریان کامل مشتری (اعتبارسنجی مالکیت شماره، انتخاب چندگانه پویا، قفل ضدتکرار، کد پیگیری)، پنل مدیریت مستقل خودروها و خدمات با دستور <code className="text-emerald-400">/admin</code> و دیتابیس با اسنپ‌شات‌های دائمی.
                </p>
              </div>
            </div>

            {/* نشانگرهای اعتبارسنجی قابلیت‌ها */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900/70 border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>اتصال مستقیم به سرور بله (tapi.bale.ai)</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900/70 border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>بدون فیلترشکن و سرورهای داخلی</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900/70 border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>قفل ضد تکرار ثبت سفارش</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900/70 border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>اسنپ‌شات دائمی خودرو و خدمات</span>
              </div>
            </div>
          </div>
        </section>

        {/* بدنه اصلی صفحات بر اساس تب فعال */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'simulator' && <TelegramSimulator />}
          {activeTab === 'code' && <CodeExplorer />}
          {activeTab === 'database' && <DatabaseViewer />}
          {activeTab === 'guide' && <DeploymentGuide />}
        </main>

        {/* فوتر */}
        <footer className="bg-slate-950 border-t border-slate-800/80 py-6 px-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>پروژه آماده استقرار بازوی پیام‌رسان بله ضدسرقت خودرو • توسعه‌یافته با Python & aiogram 3</span>
            </div>
            <div>
              <span>سازگار با سرور اختصاصی بله و قابلیت اجرا روی VPS های لینوکسی ایران ۲۴/۷</span>
            </div>
          </div>
        </footer>
      </div>
    </BotProvider>
  );
}
