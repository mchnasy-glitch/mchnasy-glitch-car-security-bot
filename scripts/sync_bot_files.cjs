const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const rootDir = path.resolve(__dirname, '..');

const fileConfigs = [
  {
    path: 'main.py',
    filename: 'main.py',
    language: 'python',
    category: 'core',
    description: 'نقطه ورود ربات (aiogram 3 + سرور سلامت aiohttp و میدلورهای امنیتی)'
  },
  {
    path: 'shamsi.py',
    filename: 'shamsi.py',
    language: 'python',
    category: 'core',
    description: 'ماژول تاریخ و ساعت شمسی بدون نیاز به کتابخانه جانبی (ساعت رسمی ایران UTC+3:30)'
  },
  {
    path: 'middlewares.py',
    filename: 'middlewares.py',
    language: 'python',
    category: 'core',
    description: 'میدلور امنیتی ضداسپم (AntiSpam / Rate Limiting) و کنترل نرخ درخواست‌ها'
  },
  {
    path: 'config.py',
    filename: 'config.py',
    language: 'python',
    category: 'config',
    description: 'اعتبارسنجی امن ADMIN_ID و توکن از متغیرهای محیطی بدون مقدار هاردکد'
  },
  {
    path: 'database.py',
    filename: 'database.py',
    language: 'python',
    category: 'core',
    description: 'اتصال ایمن SQLite با کوئری‌های ۱۰۰٪ پارامتری (ضد SQL Injection) و متدهای ویرایش و حذف خدمات'
  },
  {
    path: 'states.py',
    filename: 'states.py',
    language: 'python',
    category: 'core',
    description: 'ماشین وضعیت‌های FSM برای جریان سفارش مشتری و پنل مدیریت'
  },
  {
    path: 'keyboards.py',
    filename: 'keyboards.py',
    language: 'python',
    category: 'core',
    description: 'کیبوردهای اینلاین با دکمه ویرایش سریع خدمات، تیک‌های پویا و دکمه اشتراک شماره'
  },
  {
    path: 'handlers/__init__.py',
    filename: '__init__.py',
    language: 'python',
    category: 'handlers',
    description: 'پکیج هندلرها جهت شناسایی صحیح ماژول‌ها در Render و Docker'
  },
  {
    path: 'handlers/customer.py',
    filename: 'customer.py',
    language: 'python',
    category: 'handlers',
    description: 'جریان ثبت سفارش مشتری همراه با ثبت و نمایش تاریخ شمسی و ضد تکرار سفارش'
  },
  {
    path: 'handlers/admin.py',
    filename: 'admin.py',
    language: 'python',
    category: 'handlers',
    description: 'پنل مدیریت: ویرایش و حذف خدمات، ویرایش خودرو و مشاهده سفارش‌ها با تاریخ شمسی'
  },
  {
    path: 'requirements.txt',
    filename: 'requirements.txt',
    language: 'plaintext',
    category: 'deploy',
    description: 'پیش‌نیازهای خالص پایتون سازگار با Render'
  },
  {
    path: 'Dockerfile',
    filename: 'Dockerfile',
    language: 'dockerfile',
    category: 'deploy',
    description: 'داکرفایل استاندارد بدون بافر جهت نمایش آنی لاگ‌ها در Render'
  },
  {
    path: '.dockerignore',
    filename: '.dockerignore',
    language: 'plaintext',
    category: 'deploy',
    description: 'مستثنی کردن فایل‌های محیطی و کش'
  },
  {
    path: '.env.example',
    filename: '.env.example',
    language: 'plaintext',
    category: 'config',
    description: 'الگوی متغیرهای محیطی با راهنمای شفاف'
  },
  {
    path: 'render.yaml',
    filename: 'render.yaml',
    language: 'yaml',
    category: 'deploy',
    description: 'پیکربندی خودکار Render Blueprint (پلن کاملاً رایگان Web Service)'
  },
  {
    path: 'Procfile',
    filename: 'Procfile',
    language: 'plaintext',
    category: 'deploy',
    description: 'دستور اجرای وب‌سرویس پایتون'
  },
  {
    path: 'README.md',
    filename: 'README.md',
    language: 'markdown',
    category: 'docs',
    description: 'مستندات گام‌به‌گام راه‌اندازی در Render و نکات امنیتی'
  }
];

const botFiles = [];
const zip = new JSZip();

for (const cfg of fileConfigs) {
  const fullPath = path.join(rootDir, cfg.path);
  if (!fs.existsSync(fullPath)) {
    console.warn(`File not found: ${fullPath}`);
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  botFiles.push({
    ...cfg,
    content
  });
  zip.file(cfg.path, content);
}

// Write src/data/botFiles.ts
const tsContent = `export interface BotFile {
  path: string;
  filename: string;
  language: string;
  category: 'core' | 'handlers' | 'config' | 'deploy' | 'docs';
  description: string;
  content: string;
}

export const BOT_FILES: BotFile[] = ${JSON.stringify(botFiles, null, 2)};
`;

fs.writeFileSync(path.join(rootDir, 'src/data/botFiles.ts'), tsContent, 'utf8');
console.log('src/data/botFiles.ts updated successfully with', botFiles.length, 'files.');

// Write zip to /public
async function buildZips() {
  const content = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  const publicDir = path.join(rootDir, 'public');
  fs.writeFileSync(path.join(publicDir, 'car_security_bot.zip'), content);
  fs.writeFileSync(path.join(publicDir, 'car_antitheft_bale_bot.zip'), content);
  fs.writeFileSync(path.join(publicDir, 'car_antitheft_telegram_bot.zip'), content);
  console.log('Updated all 3 zip archives in /public/');
}

buildZips();
