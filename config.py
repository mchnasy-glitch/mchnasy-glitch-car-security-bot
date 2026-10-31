"""
ماژول تنظیمات و بارگذاری متغیرهای محیطی ربات ضدسرقت خودرو
پشتیبانی از تلگرام (Telegram) و پیام‌رسان بله (Bale tapi.bale.ai) با aiogram 3.
کاملاً مبتنی بر Environment Variables بدون هیچ‌گونه اطلاعات یا توکن محرمانه هاردکد شده.
"""
import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# بارگذاری مقادیر از فایل .env در صورت وجود در ریشه مخزن
env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

# نوع پیام‌رسان: bale یا telegram (پیش‌فرض: bale طبق درخواست کاربر)
MESSENGER = os.getenv("MESSENGER", "bale").strip().lower()

# آدرس سرور بازوی بله (طبق مستندات رسمی بله: https://tapi.bale.ai)
BALE_API_URL = os.getenv("BALE_API_URL", "https://tapi.bale.ai").strip().rstrip("/")


# دریافت توکن ربات از متغیرهای محیطی (با حذف فاصله‌ها و کوتیشن‌های احتمالی)
_raw_bot_token = os.getenv("BOT_TOKEN", "").strip().strip('"').strip("'")
BOT_TOKEN = _raw_bot_token

# دریافت شناسه عددی مدیر (پشتیبانی از هر دو کلید ADMIN_ID و ADMIN_IDS)
_raw_admin_id = (os.getenv("ADMIN_ID") or os.getenv("ADMIN_IDS", "")).strip().strip('"').strip("'")

# اگر مدیران چندگانه با کاما وارد شده باشند، اولین شناسه معتبر را انتخاب می‌کند
if "," in _raw_admin_id:
    _raw_admin_id = _raw_admin_id.split(",")[0].strip()

# مسیر فایل دیتابیس SQLite
_default_db = str(Path(__file__).resolve().parent / "bot_database.db")
DB_PATH = os.getenv("DB_PATH", _default_db).strip().strip('"').strip("'")

# پورت وب‌سرور جهت استقرار به عنوان Web Service رایگان در Render (پلن کاملاً رایگان Free Tier)
_raw_port = os.getenv("PORT", "10000").strip().strip('"').strip("'")
PORT = int(_raw_port) if _raw_port.isdigit() else 10000

# اطمینان از وجود پوشه والد دیتابیس جهت جلوگیری از خطای دسترسی در Render و Docker
try:
    Path(DB_PATH).resolve().parent.mkdir(parents=True, exist_ok=True)
except Exception as e:
    logger.warning(f"عدم امکان ایجاد پوشه دیتابیس در {DB_PATH}: {e}")


# اعتبارسنجی توکن ربات
INVALID_TOKENS = {"", "YOUR_BOT_TOKEN_HERE", "your_token_here", "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ_1234567"}
if not BOT_TOKEN or BOT_TOKEN in INVALID_TOKENS:
    sys.stderr.write(
        "\n"
        "====================================================================\n"
        "❌ خطا: مقدار متغیر محیطی BOT_TOKEN در سامانه تعریف نشده است!\n"
        "لطفاً در پنل Render در تب Environment مقدار BOT_TOKEN را تنظیم کنید:\n"
        "Key: BOT_TOKEN\n"
        "Value: <توکن دریافتی از @BotFather>\n"
        "====================================================================\n\n"
    )
    sys.exit(1)

# اعتبارسنجی شناسه عددی مدیر
if not _raw_admin_id or not _raw_admin_id.isdigit():
    sys.stderr.write(
        "\n"
        "====================================================================\n"
        "❌ خطا: مقدار متغیر محیطی ADMIN_ID نامعتبر یا خالی است!\n"
        "لطفاً شناسه عددی اکانت خود را در پنل Render در تب Environment اضافه کنید:\n"
        "Key: ADMIN_ID\n"
        "Value: <شناسه عددی کاربری تلگرام یا بله شما>\n"
        "====================================================================\n\n"
    )
    sys.exit(1)

ADMIN_ID = int(_raw_admin_id)
