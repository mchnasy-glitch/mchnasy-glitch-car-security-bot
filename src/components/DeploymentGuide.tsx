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
  Globe
} from 'lucide-react';

export const DeploymentGuide: React.FC = () => {
  const [messengerType, setMessengerType] = useState<'bale' | 'telegram'>('bale');
  const [tokenInput, setTokenInput] = useState('');
  const [adminIdInput, setAdminIdInput] = useState('');
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedSystemd, setCopiedSystemd] = useState(false);

  const generatedEnv = `# تنظیمات اتصال بازوی خدمات ضدسرقت خودرو
MESSENGER=${messengerType}
BALE_API_URL=https://tapi.bale.ai
BOT_TOKEN=${tokenInput.trim() || '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ_1234567'}
ADMIN_ID=${adminIdInput.trim() || '987654321'}
DB_PATH=bot_database.db
`;

  const systemdContent = `[Unit]
Description=Car Anti-Theft Bale Bot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/telegram_bot
ExecStart=/root/telegram_bot/venv/bin/python3 /root/telegram_bot/main.py
Restart=always
RestartSec=5
EnvironmentFile=/root/telegram_bot/.env

[Install]
WantedBy=multi-user.target
`;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* سربرگ */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
          <Server className="w-6 h-6 text-emerald-400" />
          <span>راهنمای راه‌اندازی بازوی پیام‌رسان بله (Bale Bot) و تحلیل میزبانی</span>
        </h2>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          تنظیم و اتصال بازوی aiogram 3 به سرور اختصاصی بله (<code className="text-emerald-400">tapi.bale.ai</code>) بدون نیاز به فیلترشکن و با قابلیت اجرا روی سرورهای داخلی ایران.
        </p>
      </div>

      {/* مزایای پیام‌رسان بله در ایران */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-2xl p-5 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-900/60 text-emerald-400 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-emerald-300">بدون نیاز به فیلترشکن و پروکسی</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            کاربران شما در داخل ایران بدون نیاز به فعال‌سازی VPN یا پروکسی به ربات شما دسترسی آنی و بدون قطعی دارند.
          </p>
        </div>

        <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-2xl p-5 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-900/60 text-emerald-400 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-emerald-300">اجرا روی سرورهای داخلی (VPS ایران)</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            می‌توانید ربات را روی ارزان‌ترین سرورهای لینوکس دیتاسنترهای داخلی (آروان، پارس‌آنلاین، شاتل و ...) با کمترین پینگ میزبانی کنید.
          </p>
        </div>

        <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-2xl p-5 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-900/60 text-emerald-400 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-emerald-300">سازگاری ۱۰۰٪ با aiogram 3</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            پروتکل <code className="text-emerald-300">tapi.bale.ai</code> بر پایه استاندارد وب ربات‌ها توسعه داده شده و از کلاس <code className="text-emerald-300">TelegramAPIServer</code> پشتیبانی کامل دارد.
          </p>
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
              چرا گیت‌هاب اکشنز (GitHub Actions) برای این بازو مناسب نیست؟
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              بازوی پیام‌رسان بله برای پاسخگویی در کمتر از ۱ ثانیه به مشتریان، باید از طریق فرآیند <code className="text-rose-200">dp.start_polling</code> به طور ۲۴ ساعته متصل بماند:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
              <div className="bg-slate-950/80 border border-rose-900/40 p-3.5 rounded-xl text-xs space-y-1.5">
                <div className="font-bold text-rose-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>تأخیر زیاد کران‌جاب‌ها</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  حداقل بازه زمانی اکشنز ۵ دقیقه است و معمولاً ۱۰ تا ۳۰ دقیقه تأخیر می‌خورد که مشتری را از ربات ناامید می‌کند.
                </p>
              </div>

              <div className="bg-slate-950/80 border border-rose-900/40 p-3.5 rounded-xl text-xs space-y-1.5">
                <div className="font-bold text-rose-300 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" />
                  <span>متوقف شدن مداوم فرآیند</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  کانتینرهای اکشنز پس از مدتی خاموش می‌شوند و حافظه محلی SQLite را کاملاً پاک می‌کنند.
                </p>
              </div>

              <div className="bg-slate-950/80 border border-rose-900/40 p-3.5 rounded-xl text-xs space-y-1.5">
                <div className="font-bold text-rose-300 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span>نقض قوانین استفاده گیت‌هاب</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  استفاده از گیت‌هاب اکشنز به عنوان سرور میزبانی خلاف قوانین گیت‌هاب است و سبب مسدود شدن اکانت می‌شود.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ابزار تولید فایل .env برای بله و تلگرام */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>تولیدکننده سریع فایل کانفیگ `.env` (تنظیم شده برای بله)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              توکن و شناسه را وارد کنید تا فایل <code className="text-emerald-400">.env</code> جهت قرارگیری در سرور آماده شود.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setMessengerType('bale')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                messengerType === 'bale'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              پیام‌رسان بله (Bale)
            </button>
            <button
              onClick={() => setMessengerType('telegram')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                messengerType === 'telegram'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              تلگرام (Telegram)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              توکن بازو (BOT_TOKEN) در {messengerType === 'bale' ? 'پیام‌رسان بله' : 'تلگرام'}:
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
                    @BotFather در بله <ExternalLink className="w-2.5 h-2.5" />
                  </a>{' '}
                  پیام دهید و با <code className="text-emerald-300">/newbot</code> توکن بگیرید.
                </>
              ) : (
                <>
                  در تلگرام از طریق{' '}
                  <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline inline-flex items-center gap-0.5">
                    @BotFather <ExternalLink className="w-2.5 h-2.5" />
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
              شناسه عددی اکانت شما در {messengerType === 'bale' ? 'بله' : 'تلگرام'}
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

      {/* دستورات استقرار سریع روی سرور */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>فرمان‌های ترمینال برای راه‌اندازی بازوی بله در سرور لینوکس</span>
        </h3>

        <div className="space-y-4 text-xs">
          <div>
            <div className="font-semibold text-slate-200 mb-1">
              ۱. نصب پیش‌نیازها و محیط مجازی پایتون:
            </div>
            <div className="bg-slate-950 p-3 rounded-xl font-mono text-slate-300 dir-ltr text-left border border-slate-800">
              sudo apt update && sudo apt install -y python3 python3-pip python3-venv<br />
              python3 -m venv venv<br />
              source venv/bin/activate
            </div>
          </div>

          <div>
            <div className="font-semibold text-slate-200 mb-1">
              ۲. نصب کتابخانه‌ها:
            </div>
            <div className="bg-slate-950 p-3 rounded-xl font-mono text-slate-300 dir-ltr text-left border border-slate-800">
              pip install -r requirements.txt
            </div>
          </div>

          <div>
            <div className="font-semibold text-slate-200 mb-1">
              ۳. اجرای پایدار با سرویس Systemd (اجرای دائم و خودکار ۲۴/۷):
            </div>
            <div className="bg-slate-950 p-3 rounded-xl font-mono text-slate-300 dir-ltr text-left border border-slate-800 relative">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(systemdContent);
                  setCopiedSystemd(true);
                  setTimeout(() => setCopiedSystemd(false), 2000);
                }}
                className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px]"
              >
                {copiedSystemd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>کپی bot.service</span>
              </button>
              sudo cp bot.service /etc/systemd/system/<br />
              sudo systemctl daemon-reload<br />
              sudo systemctl enable bot.service<br />
              sudo systemctl start bot.service<br />
              <span className="text-slate-500"># مشاهده لاگ زنده اتصال به tapi.bale.ai:</span><br />
              sudo journalctl -u bot.service -f
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
