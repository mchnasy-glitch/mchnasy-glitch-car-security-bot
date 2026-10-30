# 🛡 بازوی پیام‌رسان بله (و تلگرام) خدمات ضدسرقت خودرو

این مخزن شامل کد کامل بازوی پیام‌رسان بله و تلگرام بر پایه **Python 3.10+**، فریم‌ورک مدرن **aiogram 3** و دیتابیس **SQLite** است.
تمام فایل‌های اجرایی ربات مستقیماً در **ریشه اصلی (Root)** قرار دارند تا در پلتفرم‌هایی مانند **Render** یا **Railway** بدون نیاز به تنظیم Root Directory مستقیماً شناسایی و اجرا شوند.

---

## 🚀 استقرار آنی در رندر (Render Deployment - بدون نیاز به Root Directory)

برای اجرای ۲۴ ساعته بازو در رندر:

1. وارد حساب کاربری خود در [Render.com](https://render.com) شوید.
2. روی دکمه **New +** کلیک کرده و گزینه **Background Worker** را انتخاب کنید.
3. مخزن (Repository) گیت‌هاب خود را متصل کنید.
4. تنظیمات زیر به دلیل قرارگیری فایل‌ها در ریشه مخزن به صورت خودکار شناسایی می‌شوند:
   - **Root Directory**: خالی بگذارید (Default /)
   - **Environment**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`
5. در بخش **Environment Variables** متغیرهای زیر را اضافه کنید:
   - `MESSENGER`: مقدار `bale` (برای بله) یا `telegram` (برای تلگرام)
   - `BALE_API_URL`: مقدار `https://tapi.bale.ai`
   - `BOT_TOKEN`: توکن دریافتی از @BotFather در بله
   - `ADMIN_ID`: شناسه کاربری عددی شما در بله
   - `DB_PATH`: مقدار `bot_database.db`
6. دکمه **Create Background Worker** را بزنید. ربات شما فوراً اجرا شده و همیشه روشن خواهد ماند.

*(همچنین فایل `render.yaml` و `Procfile` در ریشه قرار دارند و Render Blueprint پشتیبانی می‌شود)*

---

## 📂 ساختار فایل‌ها در ریشه مخزن (Root)

```text
/
├── main.py              # نقطه ورود و اجرای بازوی بله/تلگرام با aiogram 3
├── config.py            # بارگذاری امن متغیرها بدون اطلاعات هاردکد
├── database.py          # مدیریت SQLite و اسنپ‌شات دائمی سفارش‌ها
├── states.py            # ماشین FSM مشتری و مدیر
├── keyboards.py         # کیبوردهای اینلاین با چک‌باکس پویا (☑/◻)
├── requirements.txt     # کتابخانه‌ها (aiogram>=3.4.1, aiosqlite, python-dotenv)
├── .env.example         # نمونه متغیرهای محیطی
├── Procfile             # دستور اجرای Worker در رندر: worker: python main.py
├── render.yaml          # کانفیگ آماده Render Blueprint
├── Dockerfile           # ایمیج داکر
├── docker-compose.yml   # داکر کامپوز با ولوم دائمی
├── bot.service          # سرویس لینوکس systemd برای سرورهای VPS
│
└── handlers/
    ├── __init__.py
    ├── customer.py      # مسیر مشتری: نام، اعتبارسنجی مالکیت شماره، انتخاب خدمات، کد پیگیری
    └── admin.py         # پنل اختصاصی مدیر (/admin): مدیریت خودروها، خدمات و سفارش‌ها
```

---

## ⚡️ اجرای محلی (Local Run)

```bash
python3 -m venv venv
source venv/bin/activate  # در ویندوز: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# مقادیر BOT_TOKEN و ADMIN_ID را در .env قرار دهید
python main.py
```
