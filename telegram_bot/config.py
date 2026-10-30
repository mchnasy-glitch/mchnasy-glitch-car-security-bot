"""
ماژول تنظیمات و بارگذاری متغیرهای محیطی ربات پیام‌رسان بله (Bale)
پشتیبانی از API رسمی بله (tapi.bale.ai) با استفاده از aiogram 3
بدون هیچ‌گونه توکن یا شناسه هاردکد شده.
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# بارگذاری مقادیر از فایل .env
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# نوع پیام‌رسان: bale یا telegram (پیش‌فرض: bale)
MESSENGER = os.getenv("MESSENGER", "bale").strip().lower()

# آدرس سرور واسط بله (طبق مستندات رسمی بله)
BALE_API_URL = os.getenv("BALE_API_URL", "https://tapi.bale.ai").rstrip("/")

BOT_TOKEN = os.getenv("BOT_TOKEN")
ADMIN_ID_RAW = os.getenv("ADMIN_ID")
DB_PATH = os.getenv("DB_PATH", "bot_database.db")

# اعتبارسنجی توکن بازو (ربات) بله
if not BOT_TOKEN or BOT_TOKEN.strip() == "" or "123456789:ABCdef" in BOT_TOKEN:
    sys.exit(
        "❌ خطا: مقدار BOT_TOKEN در متغیرهای محیطی یا فایل .env تنظیم نشده است.\n"
        "لطفاً توکن بازوی خود را از بات‌فادر بله (@BotFather در پیام‌رسان بله) دریافت کرده و در فایل .env قرار دهید."
    )

# اعتبارسنجی شناسه عددی مدیر در بله
if not ADMIN_ID_RAW or not ADMIN_ID_RAW.strip().isdigit():
    sys.exit(
        "❌ خطا: مقدار ADMIN_ID معتبر در متغیرهای محیطی یا فایل .env یافت نشد.\n"
        "لطفاً شناسه عددی اکانت بله خود را در فایل .env درج کنید."
    )

ADMIN_ID = int(ADMIN_ID_RAW.strip())
