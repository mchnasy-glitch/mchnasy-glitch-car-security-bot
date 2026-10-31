import React, { useState } from 'react';
import {
  Server,
  AlertOctagon,
  CheckCircle,
  Copy,
  Check,
  Terminal,
  Shield,
  Clock,
  ExternalLink,
  Cpu,
  Zap,
  Globe,
  Bug,
  Info,
  Radio,
  FileText,
  DollarSign,
  HeartPulse
} from 'lucide-react';

export const DeploymentGuide: React.FC = () => {
  const [messengerType, setMessengerType] = useState<'telegram' | 'bale'>('telegram');
  const [tokenInput, setTokenInput] = useState('');
  const [adminIdInput, setAdminIdInput] = useState('');
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVar(id);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  const generatedEnv = `# تنظیمات اتصال بازوی خدمات ضدسرقت خودرو
BOT_TOKEN=${tokenInput.trim() || 'your_bot_token_here'}
ADMIN_ID=${adminIdInput.trim() || '123456789'}
PORT=10000
MESSENGER=${messengerType}
BALE_API_URL=https://tapi.bale.ai
DB_PATH=bot_database.db
PYTHONPATH=.
`;

  const envVariables = [
    {
      key: 'BOT_TOKEN',
      required: true,
      sample: '123456789:ABCdefGhIJKlmNo...',
      description: 'توکن ربات دریافتی از BotFather@ (در تلگرام یا پیام‌رسان بله)'
    },
    {
      key: 'ADMIN_ID',
      required: true,
      sample: '987654321',
      description: 'شناسه عددی اکانت کاربری شما برای دسترسی کامل به پنل مدیریت /admin'
    },
    {
      key: 'PORT',
      required: false,
      sample: '10000',
      description: 'پورت وب‌سرور برای شناسایی سلامت سرویس در پلن رایگان Web Service (توسط Render خودکار تنظیم می‌شود)'
    },
    {
      key: 'MESSENGER',
      required: false,
      sample: 'telegram یا bale',
      description: 'انتخاب نوع پیام‌رسان هدف (پیش‌فرض: telegram)'
    },
    {
      key: 'BALE_API_URL',
      required: false,
      sample: 'https://tapi.bale.ai',
      description: 'آدرس سرور رسمی بله (تنها در صورتی که MESSENGER=bale باشد)'
    },
    {
      key: 'DB_PATH',
      required: false,
      sample: 'bot_database.db',
      description: 'مسیر ذخیره‌سازی فایل پایگاه داده SQLite در کانتینر رندر'
    },
    {
      key: 'PYTHONPATH',
      required: false,
      sample: '.',
      description: 'جهت شناسایی فوری ماژول‌های پوشه handlers بدون وابستگی به مسیر اجرا'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* سربرگ */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              <span>پلن ۱۰۰٪ رایگان (Free Web Service)</span>
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <Server className="w-6 h-6 text-emerald-400" />
            <span>راهنمای استقرار در Render (پلن کاملاً رایگان Web Service)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            از آنجا که سرویس‌های Background Worker در رندر پولی هستند ($۷/ماه)، پروژه با یک وب‌سرور سبک درونی ارتقا یافت تا بتوانید آن را به صورت <strong>کاملاً رایگان ($0)</strong> در قالب <strong>Web Service</strong> مستقر نمایید.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs shrink-0">
          <button
            onClick={() => setMessengerType('telegram')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
              messengerType === 'telegram'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            تلگرام (Telegram)
          </button>
          <button
            onClick={() => setMessengerType('bale')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
              messengerType === 'bale'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            پیام‌رسان بله (Bale)
          </button>
        </div>
      </div>

      {/* بنر توضیح تغییر از Background Worker به Free Web Service */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-slate-900 border border-emerald-500/40 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
          <Zap className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>چرا و چگونه ربات روی پلن رایگان (Free Tier) رندر بدون مشکل پورت اجرا می‌شود؟</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>۱. مشکل هزینه ورکر</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              سرویس Background Worker در رندر پلن رایگان ندارد و ماهانه ۷ دلار هزینه برمی‌دارد.
            </p>
          </div>
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5">
              <span>۲. راه‌حل وب‌سرور داخلی</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              یک وب‌سرور فوق‌سبک (<code className="text-emerald-300 font-mono">aiohttp.web</code>) به <code className="text-white font-mono">main.py</code> اضافه شد که پورت <code className="text-white font-mono">$PORT</code> را باز کرده و با کد 200 به پینگ‌های رندر پاسخ می‌دهد.
            </p>
          </div>
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <span>۳. اجرای همزمان Long Polling</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              ربات تلگرام و بله همزمان با باز بودن پورت، در همان حلقه رویداد (Event Loop) پیام‌ها را با سرعت بالا پردازش می‌کنند.
            </p>
          </div>
        </div>
      </div>

      {/* بخش اختصاصی تحلیل و رفع قطعی ۲ خطای لاگ Render */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* خطای ۱: threads can only be started once */}
        <div className="bg-slate-900/90 border border-emerald-500/50 rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Bug className="w-5 h-5 shrink-0" />
            <span>۱. رفع خطای threads can only be started once</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-rose-300 dir-ltr text-left">
            RuntimeError: threads can only be started once<br />
            File &quot;main.py&quot;, line 44, on_startup<br />
            await database.init_db()
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong>علت ریشه‌ای:</strong> در کتابخانه <code className="text-emerald-300 font-mono">aiosqlite</code> ساختار <code className="text-rose-300 font-mono">async with await get_db_connection()</code> سبب می‌شد متد <code className="text-rose-300 font-mono">_thread.start()</code> روی اتصالی که قبلاً ترد آن استارت خورده بود دوباره اجرا شود که در پایتون مجاز نیست.
          </p>
          <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-[11px] text-emerald-200 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>اصلاح اعمال‌شده:</strong> ماژول <code className="text-white font-mono">database.py</code> با الگوی اختصاصی <code className="text-white font-mono">@asynccontextmanager</code> بازنویسی شد و یک قفل همزمانی <code className="text-white font-mono">asyncio.Lock</code> برای مقداردهی تک‌باره (Idempotent) افزوده شد.
            </span>
          </div>
        </div>

        {/* رفع خطای ۲: No open ports detected */}
        <div className="bg-slate-900/90 border border-cyan-500/50 rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <HeartPulse className="w-5 h-5 shrink-0" />
            <span>۲. رفع خطای No open ports detected در Web Service</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-300 dir-ltr text-left">
            ==&gt; Listening on 0.0.0.0:10000...<br />
            ==&gt; GET /healthz 200 OK<br />
            ==&gt; Your service is live 🎉
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong>علت ریشه‌ای قبلی:</strong> وب‌سرویس‌های رندر منتظر باز شدن پورت HTTP می‌مانند. چون ربات تنها Polling انجام می‌داد، رندر پورت باز پیدا نمی‌کرد.
          </p>
          <div className="p-2.5 bg-cyan-950/40 border border-cyan-800/40 rounded-xl text-[11px] text-cyan-200 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              <strong>اصلاح اعمال‌شده:</strong> در فایل <code className="text-white font-mono">main.py</code> وب‌سرور <code className="text-white font-mono">aiohttp.web</code> روی پورت <code className="text-white font-mono">PORT</code> فعال شد تا رندر پورت را فورا شناسایی کرده و سرویس بدون هزینه در پلن رایگان سبز (Live) شود.
            </span>
          </div>
        </div>
      </div>

      {/* مراحل گام به گام ساخت Web Service رایگان در Render */}
      <div className="bg-slate-900/90 border-2 border-emerald-500/40 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
            R
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>مراحل دقیق ساخت Web Service کاملاً رایگان در داشبورد Render</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                Render Free Web Service
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              جهت استقرار بدون هزینه در پلن Free، این مراحل را در پنل Render طی فرمایید:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] flex items-center justify-center border border-emerald-700">۱</span>
              <span>نوع سرویس</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              در پنل Render روی <strong>New +</strong> کلیک کرده و گزینه <strong>Web Service</strong> را انتخاب کنید (مخزن گیت‌هاب را انتخاب کنید).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] flex items-center justify-center border border-emerald-700">۲</span>
              <span>ریشه و نوع پلن</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              فیلد <strong>Root Directory</strong> را <strong>خالی</strong> بگذارید. در بخش <strong>Instance Type</strong> گزینه <strong>Free</strong> را علامت بزنید.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] flex items-center justify-center border border-emerald-700">۳</span>
              <span>فرمان‌های بیلد و استارت</span>
            </div>
            <div className="text-[11px] text-slate-300 leading-relaxed space-y-1">
              <div><strong>Build:</strong> <code className="text-emerald-300 font-mono">pip install -r requirements.txt</code></div>
              <div><strong>Start:</strong> <code className="text-emerald-300 font-mono">python main.py</code></div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] flex items-center justify-center border border-emerald-700">۴</span>
              <span>متغیرهای محیطی</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              در تب <strong>Environment</strong> دو متغیر ضروری <code className="text-slate-200 font-mono">BOT_TOKEN</code> و <code className="text-slate-200 font-mono">ADMIN_ID</code> را ثبت کنید.
            </p>
          </div>
        </div>

        {/* کادر نکته بیدار نگه داشتن دائم */}
        <div className="p-3.5 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-cyan-300">راهکار بیدار نگه‌داشتن همیشگی (۲۴/۷) در پلن رایگان رندر:</strong>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              سرورهای رایگان رندر پس از ۱۵ دقیقه عدم درخواست به خواب می‌روند. شما می‌توانید آدرس عمومی ربات خود (مثلاً <code className="text-cyan-300 font-mono">https://car-security-bot.onrender.com/ping</code>) را در سامانه‌های رایگان پینگ مثل <a href="https://uptimerobot.com" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">UptimeRobot</a> یا <a href="https://cron-job.org" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">cron-job.org</a> ثبت کنید تا هر ۱۰ دقیقه یک پینگ ارسال کرده و ربات را همیشه بیدار نگه دارد.
            </p>
          </div>
        </div>
      </div>

      {/* جدول متغیرهای محیطی با قابلیت کپی سریع */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>فهرست کامل متغیرهای محیطی مورد نیاز در Render Web Service</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              هیچ توکن یا شناسه‌ای درون کد قرار ندارد و تمامی مقادیر محرمانه از این متغیرها خوانده می‌شوند.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">نام متغیر (Key)</th>
                <th className="py-2.5 px-3">وضعیت</th>
                <th className="py-2.5 px-3">توضیحات و کاربرد</th>
                <th className="py-2.5 px-3">مقدار پیش‌فرض / نمونه</th>
                <th className="py-2.5 px-3 text-center">کپی کلید</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {envVariables.map((v) => (
                <tr key={v.key} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-400 dir-ltr text-left">
                    {v.key}
                  </td>
                  <td className="py-2.5 px-3">
                    {v.required ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                        اجباری
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                        اختیاری
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {v.description}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 dir-ltr text-left">
                    {v.sample}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => copyText(v.key, v.key)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-all inline-flex items-center justify-center"
                      title="کپی نام متغیر"
                    >
                      {copiedVar === v.key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ابزار تولید فایل .env زنده */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>تولیدکننده سریع فایل کانفیگ .env بر اساس پیام‌رسان {messengerType === 'bale' ? 'بله' : 'تلگرام'}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            توکن و شناسه را وارد کنید تا فایل <code className="text-emerald-400">.env</code> جهت استفاده محلی یا کپی در Render آماده شود.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              توکن ربات (BOT_TOKEN) در {messengerType === 'bale' ? 'پیام‌رسان بله' : 'تلگرام'}:
            </label>
            <input
              type="text"
              placeholder="مثال: 7123456789:ABCdefGhI..."
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500 dir-ltr text-left"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              {messengerType === 'bale' ? (
                <>
                  در پیام‌رسان بله به بازوی{' '}
                  <a href="https://ble.ir/botfather" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline inline-flex items-center gap-0.5">
                    BotFather@ در بله <ExternalLink className="w-2.5 h-2.5" />
                  </a>{' '}
                  پیام دهید و با <code className="text-emerald-300">/newbot</code> توکن بگیرید.
                </>
              ) : (
                <>
                  در تلگرام از طریق{' '}
                  <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline inline-flex items-center gap-0.5">
                    BotFather@ <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </>
              )}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              شناسه عددی اکانت مدیر (ADMIN_ID):
            </label>
            <input
              type="text"
              placeholder="مثال: 987654321"
              value={adminIdInput}
              onChange={e => setAdminIdInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500 dir-ltr text-left"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              شناسه عددی اکانت شما در {messengerType === 'bale' ? 'بله' : 'تلگرام'} جهت دسترسی به دستور <code className="text-emerald-300">/admin</code>
            </span>
          </div>
        </div>

        {/* کادر پیش‌نمایش .env */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-400">محتوای فایل .env :</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedEnv);
                setCopiedEnv(true);
                setTimeout(() => setCopiedEnv(false), 2000);
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg text-slate-200"
            >
              {copiedEnv ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 text-[11px]">کپی شد</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span className="text-[11px]">کپی .env</span>
                </>
              )}
            </button>
          </div>
          <pre className="text-xs font-mono text-emerald-300 dir-ltr text-left overflow-x-auto">
            {generatedEnv}
          </pre>
        </div>
      </div>

      {/* بخش نامناسب بودن GitHub Actions */}
      <div className="bg-rose-950/30 border-2 border-rose-800/60 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-900/40 border border-rose-700/60 text-rose-400 flex items-center justify-center shrink-0">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div className="space-y-3">
            <h3 className="text-base font-bold text-rose-300">
              چرا گیت‌هاب اکشنز (GitHub Actions) برای میزبانی این ربات نامناسب است؟
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              ربات ضدسرقت خودرو برای پاسخگویی در کمتر از ۱ ثانیه به مشتریان، باید از طریق فرآیند <code className="text-rose-200 font-mono">dp.start_polling</code> به طور ۲۴ ساعته متصل بماند:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
              <div className="bg-slate-950/80 border border-rose-900/40 p-3.5 rounded-xl text-xs space-y-1.5">
                <div className="font-bold text-rose-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>تأخیر غیرقابل قبول کران‌جاب‌ها</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  حداقل بازه زمانی زمان‌بندی اکشنز ۵ دقیقه است و معمولاً ۱۰ تا ۳۰ دقیقه تأخیر می‌خورد که مشتری را معطل خواهد کرد.
                </p>
              </div>

              <div className="bg-slate-950/80 border border-rose-900/40 p-3.5 rounded-xl text-xs space-y-1.5">
                <div className="font-bold text-rose-300 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" />
                  <span>از بین رفتن حافظه SQLite</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  کانتینرهای اکشنز پس از مدتی خاموش می‌شوند و فایل دیتابیس سفارش‌ها و خودروها کاملاً حذف می‌شود.
                </p>
              </div>

              <div className="bg-slate-950/80 border border-rose-900/40 p-3.5 rounded-xl text-xs space-y-1.5">
                <div className="font-bold text-rose-300 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span>ریسک مسدود شدن حساب GitHub</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  استفاده از گیت‌هاب اکشنز به عنوان سرور میزبانی دائمی خلاف ضوابط گیت‌هاب (Terms of Service) است.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
