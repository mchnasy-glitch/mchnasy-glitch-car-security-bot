export interface BotFile {
  path: string;
  filename: string;
  language: string;
  category: 'core' | 'handlers' | 'config' | 'deploy' | 'docs';
  description: string;
  content: string;
}

export const BOT_FILES: BotFile[] = [
  {
    path: 'main.py',
    filename: 'main.py',
    language: 'python',
    category: 'core',
    description: 'نقطه ورود و راه‌اندازی بازوی پیام‌رسان بله با aiogram 3 و ثبت روترها',
    content: `"""
فایل اصلی اجرای بازوی (ربات) پیام‌رسان بله برای خدمات ضدسرقت خودرو
توسعه‌داده شده با aiogram 3، اتصال مستقیم به سرور API بله (tapi.bale.ai) و دیتابیس SQLite
"""
import os
import sys
from pathlib import Path

# افزودن تضمینی دایرکتوری ریشه پروژه به مسیر جستجوی ماژول‌های پایتون (sys.path)
# این کار مانع از بروز خطای ModuleNotFoundError: No module named 'handlers' در Render و Docker می‌شود
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.client.telegram import TelegramAPIServer
from aiogram.enums import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage

import database
from config import BOT_TOKEN, ADMIN_ID, MESSENGER, BALE_API_URL
from handlers.customer import customer_router
from handlers.admin import admin_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("BaleCarAntiTheftBot")


async def on_startup(bot: Bot):
    logger.info("در حال آماده‌سازی دیتابیس SQLite و جداول...")
    await database.init_db()
    logger.info("پایگاه داده با موفقیت آماده به کار شد.")

    messenger_title = "پیام‌رسان بله" if MESSENGER == "bale" else "تلگرام"
    try:
        await bot.send_message(
            chat_id=ADMIN_ID,
            text=(
                f"🚀 **بازوی خدمات ضدسرقت خودرو در {messenger_title} روشن شد.**\\n\\n"
                "🛡 سامانه آماده دریافت سفارش‌های مشتریان است.\\n"
                "برای ورود به پنل مدیریت، دستور /admin را ارسال فرمایید."
            )
        )
    except Exception as e:
        logger.warning(f"عدم امکان ارسال پیام آغاز به مدیر ({ADMIN_ID}): {e}")


async def main():
    logger.info("در حال راه‌اندازی با aiogram 3...")

    if MESSENGER == "bale":
        logger.info(f"✅ تنظیم آدرس سرور بازوهای پیام‌رسان بله: {BALE_API_URL}")
        bale_api_server = TelegramAPIServer(
            base=f"{BALE_API_URL}/bot{{token}}/{{method}}",
            file=f"{BALE_API_URL}/file/bot{{token}}/{{path}}"
        )
        session = AiohttpSession(api=bale_api_server)
        bot = Bot(
            token=BOT_TOKEN,
            session=session,
            default=DefaultBotProperties(parse_mode=ParseMode.MARKDOWN)
        )
    else:
        logger.info("تنظیم اتصال به سرور استاندارد تلگرام")
        bot = Bot(
            token=BOT_TOKEN,
            default=DefaultBotProperties(parse_mode=ParseMode.MARKDOWN)
        )

    dp = Dispatcher(storage=MemoryStorage())

    dp.include_router(admin_router)
    dp.include_router(customer_router)

    dp.startup.register(on_startup)

    await bot.delete_webhook(drop_pending_updates=True)
    logger.info("در حال اجرای حالت Polling زنده...")

    try:
        await dp.start_polling(bot)
    finally:
        await bot.session.close()
        logger.info("نشست بازو با موفقیت بسته شد.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("بازوی بله به صورت دستی متوقف شد.")
`
  },
  {
    path: 'config.py',
    filename: 'config.py',
    language: 'python',
    category: 'config',
    description: 'بارگذاری امن متغیرهای محیطی بله و تلگرام بدون هیچ اطلاعات هاردکد',
    content: `"""
ماژول تنظیمات و بارگذاری متغیرهای محیطی ربات پیام‌رسان بله (Bale)
پشتیبانی از API رسمی بله (tapi.bale.ai) با استفاده از aiogram 3
بدون هیچ‌گونه توکن یا شناسه هاردکد شده.
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

MESSENGER = os.getenv("MESSENGER", "bale").strip().lower()
BALE_API_URL = os.getenv("BALE_API_URL", "https://tapi.bale.ai").rstrip("/")

BOT_TOKEN = os.getenv("BOT_TOKEN")
ADMIN_ID_RAW = os.getenv("ADMIN_ID")
DB_PATH = os.getenv("DB_PATH", "bot_database.db")

if not BOT_TOKEN or BOT_TOKEN.strip() == "" or "123456789:ABCdef" in BOT_TOKEN:
    sys.exit(
        "❌ خطا: مقدار BOT_TOKEN در متغیرهای محیطی یا فایل .env تنظیم نشده است.\\n"
        "لطفاً توکن بازوی خود را از بات‌فادر بله (@BotFather در بله) دریافت کرده و در فایل .env قرار دهید."
    )

if not ADMIN_ID_RAW or not ADMIN_ID_RAW.strip().isdigit():
    sys.exit(
        "❌ خطا: مقدار ADMIN_ID معتبر در متغیرهای محیطی یا فایل .env یافت نشد.\\n"
        "لطفاً شناسه عددی اکانت بله خود را در فایل .env درج کنید."
    )

ADMIN_ID = int(ADMIN_ID_RAW.strip())
`
  },
  {
    path: 'database.py',
    filename: 'database.py',
    language: 'python',
    category: 'core',
    description: 'مدیریت پایگاه داده SQLite با aiosqlite و ثبت اسنپ‌شات غیرقابل تغییر سفارش‌ها',
    content: `"""
ماژول مدیریت پایگاه داده SQLite با استفاده از aiosqlite
طراحی شده با قابلیت حفظ کامل سوابق سفارشات مستقل از تغییرات بعدی خودروها یا خدمات.
"""
import json
import logging
from typing import List, Optional, Dict, Any
import aiosqlite
from config import DB_PATH

logger = logging.getLogger(__name__)


async def get_db_connection() -> aiosqlite.Connection:
    """ایجاد اتصال با فعال‌سازی کلیدهای خارجی و سطر به‌صورت دیکشنری"""
    db = await aiosqlite.connect(DB_PATH)
    await db.execute("PRAGMA foreign_keys = ON;")
    db.row_factory = aiosqlite.Row
    return db


async def init_db():
    """ایجاد جداول و بارگذاری داده‌های اولیه مطابق مشخصات درخواست"""
    async with await get_db_connection() as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS cars (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS services (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                car_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tracking_code TEXT NOT NULL UNIQUE,
                user_id INTEGER NOT NULL,
                customer_name TEXT NOT NULL,
                customer_phone TEXT NOT NULL,
                car_id INTEGER,
                car_name TEXT NOT NULL,
                services_snapshot TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'ثبت شده',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        await db.commit()

        # داده‌های اولیه استاندارد
        async with db.execute("SELECT COUNT(*) as count FROM cars") as cursor:
            row = await cursor.fetchone()
            if row and row["count"] == 0:
                logger.info("در حال بارگذاری خودروها و خدمات اولیه در دیتابیس...")
                initial_cars = [
                    "پژو ۲۰۶/۲۰۷",
                    "رانا",
                    "دنا",
                    "پژو ۴۰۵",
                    "پراید"
                ]
                car_ids = {}
                for car_name in initial_cars:
                    cur = await db.execute("INSERT INTO cars (name, is_active) VALUES (?, 1)", (car_name,))
                    car_ids[car_name] = cur.lastrowid

                # خدمات اولیه پراید
                pride_services = [
                    "تعویض قفلهای فابریک و نصب قفل ضدسرقت تیتان",
                    "نصب قفل ضدسرقت باتری",
                    "حذف شاسی دربها"
                ]
                for s_name in pride_services:
                    await db.execute(
                        "INSERT INTO services (car_id, name, is_active) VALUES (?, ?, 1)",
                        (car_ids["پراید"], s_name)
                    )

                # خدمت اولیه پژو ۲۰۶/۲۰۷
                peugeot_service = "نصب محافظ باتری و کامپیوتر"
                await db.execute(
                    "INSERT INTO services (car_id, name, is_active) VALUES (?, ?, 1)",
                    (car_ids["پژو ۲۰۶/۲۰۷"], peugeot_service)
                )

                await db.commit()
                logger.info("داده‌های اولیه با موفقیت درج شدند.")


# ---------------- توابع خودروها ----------------

async def get_active_cars() -> List[Dict[str, Any]]:
    async with await get_db_connection() as db:
        async with db.execute("SELECT id, name FROM cars WHERE is_active = 1 ORDER BY id ASC") as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def get_all_cars() -> List[Dict[str, Any]]:
    async with await get_db_connection() as db:
        async with db.execute("SELECT id, name, is_active FROM cars ORDER BY id ASC") as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def get_car_by_id(car_id: int) -> Optional[Dict[str, Any]]:
    async with await get_db_connection() as db:
        async with db.execute("SELECT id, name, is_active FROM cars WHERE id = ?", (car_id,)) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None


async def add_car(name: str) -> Optional[int]:
    async with await get_db_connection() as db:
        try:
            cursor = await db.execute("INSERT INTO cars (name, is_active) VALUES (?, 1)", (name.strip(),))
            await db.commit()
            return cursor.lastrowid
        except aiosqlite.IntegrityError:
            return None


async def update_car_name(car_id: int, new_name: str) -> bool:
    async with await get_db_connection() as db:
        try:
            await db.execute("UPDATE cars SET name = ? WHERE id = ?", (new_name.strip(), car_id))
            await db.commit()
            return True
        except aiosqlite.IntegrityError:
            return False


async def toggle_car_active(car_id: int, is_active: bool) -> bool:
    async with await get_db_connection() as db:
        val = 1 if is_active else 0
        await db.execute("UPDATE cars SET is_active = ? WHERE id = ?", (val, car_id))
        await db.commit()
        return True


# ---------------- توابع خدمات ----------------

async def get_active_services_by_car(car_id: int) -> List[Dict[str, Any]]:
    async with await get_db_connection() as db:
        async with db.execute(
            "SELECT id, car_id, name FROM services WHERE car_id = ? AND is_active = 1 ORDER BY id ASC",
            (car_id,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def get_all_services_by_car(car_id: int) -> List[Dict[str, Any]]:
    async with await get_db_connection() as db:
        async with db.execute(
            "SELECT id, car_id, name, is_active FROM services WHERE car_id = ? ORDER BY id ASC",
            (car_id,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def get_service_by_id(service_id: int) -> Optional[Dict[str, Any]]:
    async with await get_db_connection() as db:
        async with db.execute("SELECT id, car_id, name, is_active FROM services WHERE id = ?", (service_id,)) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None


async def add_service(car_id: int, name: str) -> Optional[int]:
    async with await get_db_connection() as db:
        cursor = await db.execute("INSERT INTO services (car_id, name, is_active) VALUES (?, ?, 1)", (car_id, name.strip()))
        await db.commit()
        return cursor.lastrowid


async def update_service_name(service_id: int, new_name: str) -> bool:
    async with await get_db_connection() as db:
        await db.execute("UPDATE services SET name = ? WHERE id = ?", (new_name.strip(), service_id))
        await db.commit()
        return True


async def toggle_service_active(service_id: int, is_active: bool) -> bool:
    async with await get_db_connection() as db:
        val = 1 if is_active else 0
        await db.execute("UPDATE services SET is_active = ? WHERE id = ?", (val, service_id))
        await db.commit()
        return True


# ---------------- توابع سفارشات ----------------

async def save_order(
    tracking_code: str,
    user_id: int,
    customer_name: str,
    customer_phone: str,
    car_id: int,
    car_name: str,
    services_list: List[str]
) -> int:
    services_json = json.dumps(services_list, ensure_ascii=False)
    async with await get_db_connection() as db:
        cursor = await db.execute(
            """
            INSERT INTO orders (
                tracking_code, user_id, customer_name, customer_phone,
                car_id, car_name, services_snapshot, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ثبت شده')
            """,
            (tracking_code, user_id, customer_name, customer_phone, car_id, car_name, services_json)
        )
        await db.commit()
        return cursor.lastrowid


async def get_all_orders(limit: int = 50) -> List[Dict[str, Any]]:
    async with await get_db_connection() as db:
        async with db.execute(
            """
            SELECT id, tracking_code, user_id, customer_name, customer_phone,
                   car_name, services_snapshot, status, created_at
            FROM orders
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,)
        ) as cursor:
            rows = await cursor.fetchall()
            result = []
            for r in rows:
                item = dict(r)
                try:
                    item["services"] = json.loads(item["services_snapshot"])
                except Exception:
                    item["services"] = [item["services_snapshot"]]
                result.append(item)
            return result
`
  },
  {
    path: 'states.py',
    filename: 'states.py',
    language: 'python',
    category: 'core',
    description: 'وضعیت‌های ماشین حالت FSM برای مدیریت مکالمه مشتری و پنل ادمین',
    content: `"""
وضعیت‌های ماشین حالت (FSM) برای مدیریت جریان مشتری و مدیر در aiogram 3
"""
from aiogram.fsm.state import State, StatesGroup


class CustomerOrderState(StatesGroup):
    waiting_for_name = State()       # دریافت نام و نام خانوادگی
    waiting_for_phone = State()      # دریافت شماره تماس (دکمه یا دستی)
    selecting_car = State()          # انتخاب مدل خودرو
    selecting_services = State()     # انتخاب چندگانه خدمات
    confirming_order = State()       # مشاهده خلاصه و تأیید نهایی
    submitting_order = State()       # حالت قفل برای جلوگیری از ثبت تکراری


class AdminState(StatesGroup):
    managing_cars = State()          # مدیریت خودروها
    adding_car_name = State()        # ورود نام خودرو جدید
    editing_car_name = State()       # ورود نام جدید برای ویرایش خودرو
    managing_services = State()      # مدیریت خدمات یک خودرو
    adding_service_name = State()    # ورود نام خدمت جدید
    editing_service_name = State()   # ورود نام جدید برای ویرایش خدمت
`
  },
  {
    path: 'keyboards.py',
    filename: 'keyboards.py',
    language: 'python',
    category: 'core',
    description: 'کیبوردهای درون‌خطی و متنی با چک‌باکس‌های پویا و طراحی راست‌به‌چپ',
    content: `"""
کیبوردهای شیشه‌ای (Inline) و معمولی (Reply) برای تعامل روان و کاملاً فارسی
"""
from typing import List, Dict, Any, Set
from aiogram.types import (
    ReplyKeyboardMarkup,
    KeyboardButton,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    ReplyKeyboardRemove
)


def get_phone_request_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📱 ارسال شماره من", request_contact=True)],
            [KeyboardButton(text="❌ انصراف از ثبت سفارش")]
        ],
        resize_keyboard=True,
        one_time_keyboard=True,
        is_persistent=True
    )


def remove_keyboard() -> ReplyKeyboardRemove:
    return ReplyKeyboardRemove()


def get_cars_inline_keyboard(cars: List[Dict[str, Any]]) -> InlineKeyboardMarkup:
    buttons = []
    row = []
    for car in cars:
        btn = InlineKeyboardButton(
            text=f"🚗 {car['name']}",
            callback_data=f"select_car:{car['id']}"
        )
        row.append(btn)
        if len(row) == 2:
            buttons.append(row)
            row = []
    if row:
        buttons.append(row)

    buttons.append([
        InlineKeyboardButton(text="❌ انصراف و لغو", callback_data="customer_cancel")
    ])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def get_services_inline_keyboard(
    services: List[Dict[str, Any]],
    selected_ids: Set[int]
) -> InlineKeyboardMarkup:
    buttons = []
    for srv in services:
        s_id = srv["id"]
        is_selected = s_id in selected_ids
        icon = "☑" if is_selected else "◻"
        text = f"{icon} {srv['name']}"
        buttons.append([
            InlineKeyboardButton(text=text, callback_data=f"toggle_srv:{s_id}")
        ])

    count = len(selected_ids)
    if count > 0:
        continue_text = f"✅ تأیید و مشاهده خلاصه ({count} مورد انتخابی)"
        continue_cb = "proceed_to_summary"
    else:
        continue_text = "⚠️ حداقل یک خدمت را انتخاب کنید"
        continue_cb = "alert_empty_services"

    buttons.append([
        InlineKeyboardButton(text=continue_text, callback_data=continue_cb)
    ])

    buttons.append([
        InlineKeyboardButton(text="🔙 تغییر خودرو", callback_data="back_to_cars"),
        InlineKeyboardButton(text="❌ انصراف", callback_data="customer_cancel")
    ])

    return InlineKeyboardMarkup(inline_keyboard=buttons)


def get_summary_confirmation_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ تأیید نهایی و ثبت قطعی سفارش", callback_data="confirm_final_order")],
        [
            InlineKeyboardButton(text="🔙 ویرایش خدمات", callback_data="back_to_services"),
            InlineKeyboardButton(text="❌ لغو کامل", callback_data="customer_cancel")
        ]
    ])


# ---------------- کیبوردهای پنل مدیریت ----------------

def get_admin_main_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🚗 مدیریت خودروها و خدمات", callback_data="admin_cars_list")],
        [InlineKeyboardButton(text="📦 مشاهده سفارش‌های ثبت‌شده", callback_data="admin_orders_list")],
        [InlineKeyboardButton(text="🔄 تازه‌سازی اطلاعات", callback_data="admin_refresh")]
    ])


def get_admin_cars_keyboard(cars: List[Dict[str, Any]]) -> InlineKeyboardMarkup:
    buttons = []
    for car in cars:
        status_icon = "🟢 فعال" if car["is_active"] else "🔴 غیرفعال"
        buttons.append([
            InlineKeyboardButton(
                text=f"{car['name']} ({status_icon})",
                callback_data=f"admin_view_car:{car['id']}"
            )
        ])

    buttons.append([
        InlineKeyboardButton(text="➕ افزودن خودرو جدید", callback_data="admin_add_car")
    ])
    buttons.append([
        InlineKeyboardButton(text="🔙 بازگشت به منوی مدیریت", callback_data="admin_main_menu")
    ])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def get_admin_single_car_keyboard(car: Dict[str, Any]) -> InlineKeyboardMarkup:
    toggle_text = "🔴 غیرفعال‌سازی این خودرو" if car["is_active"] else "🟢 فعال‌سازی این خودرو"
    toggle_cb = f"admin_toggle_car:{car['id']}:{0 if car['is_active'] else 1}"

    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🛠 مدیریت خدمات این خودرو", callback_data=f"admin_car_services:{car['id']}")],
        [InlineKeyboardButton(text="✏️ ویرایش نام خودرو", callback_data=f"admin_edit_car_name:{car['id']}")],
        [InlineKeyboardButton(text=toggle_text, callback_data=toggle_cb)],
        [InlineKeyboardButton(text="🔙 بازگشت به لیست خودروها", callback_data="admin_cars_list")]
    ])


def get_admin_services_keyboard(car_id: int, car_name: str, services: List[Dict[str, Any]]) -> InlineKeyboardMarkup:
    buttons = []
    for srv in services:
        status_icon = "🟢" if srv["is_active"] else "🔴"
        buttons.append([
            InlineKeyboardButton(
                text=f"{status_icon} {srv['name']}",
                callback_data=f"admin_view_service:{srv['id']}"
            )
        ])

    buttons.append([
        InlineKeyboardButton(text="➕ افزودن خدمت جدید به این خودرو", callback_data=f"admin_add_service:{car_id}")
    ])
    buttons.append([
        InlineKeyboardButton(text="🔙 بازگشت به مشخصات خودرو", callback_data=f"admin_view_car:{car_id}")
    ])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def get_admin_single_service_keyboard(service: Dict[str, Any]) -> InlineKeyboardMarkup:
    toggle_text = "🔴 غیرفعال‌سازی خدمت" if service["is_active"] else "🟢 فعال‌سازی خدمت"
    toggle_cb = f"admin_toggle_service:{service['id']}:{0 if service['is_active'] else 1}"

    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✏️ ویرایش عنوان خدمت", callback_data=f"admin_edit_service_name:{service['id']}")],
        [InlineKeyboardButton(text=toggle_text, callback_data=toggle_cb)],
        [InlineKeyboardButton(text="🔙 بازگشت به خدمات خودرو", callback_data=f"admin_car_services:{service['car_id']}")]
    ])


def get_admin_back_to_main_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔙 بازگشت به منوی اصلی مدیریت", callback_data="admin_main_menu")]
    ])
`
  },
  {
    path: 'handlers/__init__.py',
    filename: '__init__.py',
    language: 'python',
    category: 'handlers',
    description: 'فایل بسته‌بندی پایتون برای پکیج handlers و خروجی مستقیم روترها',
    content: `"""
ماژول کنترل‌کننده‌های پیام‌ها و دستورات ربات تلگرام و بله
"""
from handlers.customer import customer_router
from handlers.admin import admin_router

__all__ = ["customer_router", "admin_router"]
`
  },
  {
    path: 'handlers/customer.py',
    filename: 'customer.py',
    language: 'python',
    category: 'handlers',
    description: 'کنترل‌کننده مسیر مشتری: اعتبارسنجی مالکیت شماره، انتخاب خدمات، پیش‌فاکتور و کد پیگیری',
    content: `"""
کنترل‌کننده جریان سفارش مشتری (Customer Flow)
شامل ثبت نام، اعتبارسنجی مالکیت شماره تلفن، انتخاب چندگانه خدمات،
جلوگیری از ثبت تکراری با قفل Idempotency و ارسال نوتیفیکیشن اختصاصی به مدیر.
"""
import re
import random
import datetime
import logging
from typing import List

from aiogram import Router, F, Bot
from aiogram.types import Message, CallbackQuery, ReplyKeyboardRemove
from aiogram.filters import CommandStart
from aiogram.fsm.context import FSMContext

import database
from config import ADMIN_ID
from states import CustomerOrderState
from keyboards import (
    get_phone_request_keyboard,
    get_cars_inline_keyboard,
    get_services_inline_keyboard,
    get_summary_confirmation_keyboard,
    remove_keyboard
)

logger = logging.getLogger(__name__)
customer_router = Router(name="customer_router")


def normalize_persian_numbers(text: str) -> str:
    persian_digits = "۰۱۲۳۴۵۶۷۸۹"
    arabic_digits = "٠١٢٣٤٥٦٧٨٩"
    english_digits = "0123456789"
    translation_table = str.maketrans(persian_digits + arabic_digits, english_digits * 2)
    return text.translate(translation_table)


def validate_iranian_phone(phone_raw: str) -> str | None:
    cleaned = normalize_persian_numbers(phone_raw).strip()
    cleaned = re.sub(r"[\\s\\-\\(\\)]", "", cleaned)
    patterns = [r"^(?:\\+98|0098|0)?(9\\d{9})$"]
    for pattern in patterns:
        match = re.match(pattern, cleaned)
        if match:
            return f"0{match.group(1)}"
    return None


def generate_tracking_code() -> str:
    now = datetime.datetime.now()
    random_part = random.randint(1000, 9999)
    return f"AT-{now.strftime('%y%m')}-{random_part}"


@customer_router.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext):
    await state.clear()
    welcome_text = (
        "سلام! به سامانه ثبت سفارش خدمات ضدسرقت خودرو خوش آمدید 🛡🚗\\n\\n"
        "جهت ثبت سفارش و هماهنگی نصب، لطفاً ابتدا **نام و نام خانوادگی** خود را ارسال کنید:"
    )
    await message.answer(welcome_text, reply_markup=remove_keyboard())
    await state.set_state(CustomerOrderState.waiting_for_name)


@customer_router.message(F.text == "❌ انصراف از ثبت سفارش")
@customer_router.callback_query(F.data == "customer_cancel")
async def handle_cancel(event: Message | CallbackQuery, state: FSMContext):
    await state.clear()
    text = "❌ فرآیند ثبت سفارش لغو شد.\\nبرای شروع مجدد، دستور /start را ارسال کنید."
    if isinstance(event, CallbackQuery):
        await event.message.edit_text(text)
        await event.answer("عملیات لغو شد")
    else:
        await event.answer(text, reply_markup=remove_keyboard())


@customer_router.message(CustomerOrderState.waiting_for_name, F.text)
async def process_customer_name(message: Message, state: FSMContext):
    name = message.text.strip()
    if len(name) < 3 or name.startswith("/"):
        await message.answer("⚠️ لطفاً نام و نام خانوادگی معتبر (حداقل ۳ حرف) را وارد کنید:")
        return

    await state.update_data(customer_name=name)
    await state.set_state(CustomerOrderState.waiting_for_phone)

    prompt_phone = (
        f"بسیار عالی، جناب **{name}** گرامی.\\n\\n"
        "اکنون لطفاً شماره تماس همراه خود را ارسال کنید.\\n"
        "می‌توانید دکمه «📱 ارسال شماره من» در پایین صفحه را لمس کنید یا شماره خود را به صورت دستی (مثلاً 09123456789) تایپ کنید:"
    )
    await message.answer(prompt_phone, reply_markup=get_phone_request_keyboard())


@customer_router.message(CustomerOrderState.waiting_for_phone, F.contact)
async def process_phone_contact(message: Message, state: FSMContext):
    contact = message.contact

    # شرط امنیتی اجباری: شماره ارسالی با دکمه تماس فقط وقتی پذیرفته شود که متعلق به خود کاربر باشد
    if contact.user_id != message.from_user.id:
        await message.answer(
            "⛔️ خطا: شماره ارسال‌شده متعلق به این حساب کاربری نیست!\\n"
            "برای امنیت سامانه، لطفاً فقط شماره متعلق به خودتان را به اشتراک بگذارید یا شماره را به صورت دستی تایپ فرمایید:",
            reply_markup=get_phone_request_keyboard()
        )
        return

    normalized_phone = validate_iranian_phone(contact.phone_number)
    if not normalized_phone:
        raw = contact.phone_number.replace("+", "")
        if raw.startswith("98") and len(raw) == 12:
            normalized_phone = "0" + raw[2:]
        else:
            normalized_phone = contact.phone_number

    await _proceed_to_car_selection(message, state, normalized_phone)


@customer_router.message(CustomerOrderState.waiting_for_phone, F.text)
async def process_phone_manual(message: Message, state: FSMContext):
    raw_text = message.text.strip()
    if raw_text == "❌ انصراف از ثبت سفارش":
        await handle_cancel(message, state)
        return

    normalized = validate_iranian_phone(raw_text)
    if not normalized:
        await message.answer(
            "⚠️ شماره وارد شده نامعتبر است.\\n"
            "لطفاً شماره تلفن همراه ایران را با ۱۱ رقم و با پیش‌شماره 09 وارد فرمایید (مثال: 09121234567)\\n"
            "یا از دکمه «📱 ارسال شماره من» استفاده کنید:",
            reply_markup=get_phone_request_keyboard()
        )
        return

    await _proceed_to_car_selection(message, state, normalized)


async def _proceed_to_car_selection(message: Message, state: FSMContext, phone: str):
    await state.update_data(customer_phone=phone)

    cars = await database.get_active_cars()
    if not cars:
        await message.answer(
            "⚠️ در حال حاضر هیچ خودرویی در سامانه فعال نیست.\\n"
            "لطفاً دقایقی دیگر مجدداً بررسی فرمایید.",
            reply_markup=remove_keyboard()
        )
        await state.clear()
        return

    await message.answer(
        "✅ شماره تماس شما با موفقیت ثبت شد.\\n\\n"
        "🚗 اکنون لطفاً مدل خودروی خود را از فهرست زیر انتخاب فرمایید:",
        reply_markup=remove_keyboard()
    )

    await message.answer(
        "فهرست خودروهای تحت پوشش:",
        reply_markup=get_cars_inline_keyboard(cars)
    )
    await state.set_state(CustomerOrderState.selecting_car)


@customer_router.callback_query(CustomerOrderState.selecting_car, F.data.startswith("select_car:"))
async def handle_car_selection(callback: CallbackQuery, state: FSMContext):
    car_id = int(callback.data.split(":")[1])
    car = await database.get_car_by_id(car_id)

    if not car or not car["is_active"]:
        await callback.answer("این خودرو در حال حاضر فعال نیست.", show_alert=True)
        cars = await database.get_active_cars()
        await callback.message.edit_reply_markup(reply_markup=get_cars_inline_keyboard(cars))
        return

    services = await database.get_active_services_by_car(car_id)
    await state.update_data(
        car_id=car["id"],
        car_name=car["name"],
        selected_service_ids=[]
    )

    if not services:
        no_service_text = (
            f"🚗 خودرو انتخاب شده: **{car['name']}**\\n\\n"
            "⚠️ در حال حاضر هیچ خدمت فعال اختصاصی برای این خودرو در سیستم ثبت نشده است.\\n"
            "مدیریت به زودی خدمات تکمیلی این خودرو را در سامانه قرار خواهد داد."
        )
        await callback.message.edit_text(
            no_service_text,
            reply_markup=get_cars_inline_keyboard(await database.get_active_cars())
        )
        await callback.answer("خدماتی برای این خودرو ثبت نشده است.")
        return

    await state.set_state(CustomerOrderState.selecting_services)
    msg_text = (
        f"🚗 خودرو انتخابی: **{car['name']}**\\n\\n"
        "🛠 لطفاً یک یا چند خدمت ضدسرقت مورد نظر خود را با لمس گزینه‌های زیر انتخاب کنید:\\n"
        "(با هر بار لمس، وضعیت گزینه بین ☑ و ◻ تغییر می‌کند)\\n\\n"
        "پس از اتمام انتخاب، دکمه «تأیید و مشاهده خلاصه» را لمس فرمایید:"
    )
    await callback.message.edit_text(
        msg_text,
        reply_markup=get_services_inline_keyboard(services, selected_ids=set())
    )
    await callback.answer()


@customer_router.callback_query(CustomerOrderState.selecting_services, F.data.startswith("toggle_srv:"))
async def handle_toggle_service(callback: CallbackQuery, state: FSMContext):
    service_id = int(callback.data.split(":")[1])
    data = await state.get_data()
    car_id = data.get("car_id")
    selected_ids = set(data.get("selected_service_ids", []))

    if service_id in selected_ids:
        selected_ids.remove(service_id)
    else:
        selected_ids.add(service_id)

    await state.update_data(selected_service_ids=list(selected_ids))

    services = await database.get_active_services_by_car(car_id)
    await callback.message.edit_reply_markup(
        reply_markup=get_services_inline_keyboard(services, selected_ids)
    )
    await callback.answer()


@customer_router.callback_query(CustomerOrderState.selecting_services, F.data == "alert_empty_services")
async def alert_empty_selection(callback: CallbackQuery):
    await callback.answer("⚠️ لطفاً حداقل یک خدمت را از لیست انتخاب کنید تا بتوانید ادامه دهید.", show_alert=True)


@customer_router.callback_query(CustomerOrderState.selecting_services, F.data == "proceed_to_summary")
async def proceed_to_order_summary(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    selected_ids = set(data.get("selected_service_ids", []))

    if not selected_ids:
        await callback.answer("⚠️ لطفاً حداقل یک خدمت را انتخاب کنید.", show_alert=True)
        return

    car_id = data.get("car_id")
    car_name = data.get("car_name")
    customer_name = data.get("customer_name")
    customer_phone = data.get("customer_phone")

    services = await database.get_active_services_by_car(car_id)
    selected_names = [s["name"] for s in services if s["id"] in selected_ids]

    await state.update_data(selected_service_names=selected_names)
    await state.set_state(CustomerOrderState.confirming_order)

    services_formatted = "\\n".join([f"  • {name}" for name in selected_names])

    summary_text = (
        "📋 **پیش‌فاکتور و خلاصه مشخصات سفارش شما:**\\n"
        "━━━━━━━━━━━━━━━━━━\\n"
        f"👤 **نام مشتری:** {customer_name}\\n"
        f"📞 **شماره تماس:** \`{customer_phone}\`\\n"
        f"🚗 **خودرو انتخابی:** {car_name}\\n\\n"
        f"🛠 **خدمات ضدسرقت انتخابی ({len(selected_names)} مورد):**\\n"
        f"{services_formatted}\\n"
        "━━━━━━━━━━━━━━━━━━\\n"
        "لطفاً در صورت صحت اطلاعات بالا، جهت قطعی شدن ثبت سفارش دکمه «تأیید نهایی» را لمس کنید:"
    )

    await callback.message.edit_text(
        summary_text,
        reply_markup=get_summary_confirmation_keyboard()
    )
    await callback.answer()


@customer_router.callback_query(CustomerOrderState.confirming_order, F.data == "confirm_final_order")
async def finalize_order(callback: CallbackQuery, state: FSMContext, bot: Bot):
    current_state = await state.get_state()
    # جلوگیری از ثبت تکراری بر اثر چند بار لمس دکمه
    if current_state != CustomerOrderState.confirming_order.state:
        await callback.answer("این سفارش در حال پردازش یا قبلاً ثبت شده است.", show_alert=True)
        return

    await state.set_state(CustomerOrderState.submitting_order)

    data = await state.get_data()
    customer_name = data.get("customer_name")
    customer_phone = data.get("customer_phone")
    car_id = data.get("car_id")
    car_name = data.get("car_name")
    selected_services: List[str] = data.get("selected_service_names", [])

    if not selected_services:
        await callback.answer("خطا در انتخاب خدمات.", show_alert=True)
        await state.clear()
        return

    tracking_code = generate_tracking_code()
    user_id = callback.from_user.id
    user_username = f"@{callback.from_user.username}" if callback.from_user.username else "ندارد"

    order_id = await database.save_order(
        tracking_code=tracking_code,
        user_id=user_id,
        customer_name=customer_name,
        customer_phone=customer_phone,
        car_id=car_id,
        car_name=car_name,
        services_list=selected_services
    )

    services_list_text = "\\n".join([f"  🔹 {s}" for s in selected_services])

    customer_success_text = (
        "🎉 **سفارش شما با موفقیت ثبت شد!**\\n"
        "━━━━━━━━━━━━━━━━━━\\n"
        f"🔖 **کد پیگیری شما:** \`{tracking_code}\`\\n"
        f"👤 نام: {customer_name}\\n"
        f"🚗 خودرو: {car_name}\\n\\n"
        f"🛠 **خدمات درخواستی:**\\n"
        f"{services_list_text}\\n"
        "━━━━━━━━━━━━━━━━━━\\n"
        "📞 کارشناس فنی ما به زودی با شماره تماس شما هماهنگی‌های لازم را به عمل خواهد آورد.\\n\\n"
        "با سپاس از اعتماد شما 🛡\\n"
        "برای ثبت سفارش جدید می‌توانید از /start استفاده کنید."
    )

    await callback.message.edit_text(customer_success_text)
    await callback.answer("سفارش شما ثبت شد ✅")
    await state.clear()

    # ارسال نوتیفیکیشن اختصاصی به مدیر
    now_str = datetime.datetime.now().strftime("%Y/%m/%d - %H:%M")
    admin_notification = (
        "🔔 **سفارش جدید خدمات ضدسرقت خودرو!**\\n"
        "━━━━━━━━━━━━━━━━━━\\n"
        f"🔖 **کد پیگیری:** \`{tracking_code}\` (ثبت: #{order_id})\\n"
        f"👤 **نام مشتری:** {customer_name}\\n"
        f"📞 **شماره تماس:** \`{customer_phone}\`\\n"
        f"🆔 **شناسه تلگرام:** \`{user_id}\` ({user_username})\\n"
        f"🚗 **خودرو:** {car_name}\\n\\n"
        f"🛠 **خدمات انتخاب‌شده ({len(selected_services)} مورد):**\\n"
        f"{services_list_text}\\n"
        "━━━━━━━━━━━━━━━━━━\\n"
        f"⏰ زمان ثبت: {now_str}\\n"
        "💡 جهت مشاهده تمام سفارشات دستور /admin را ارسال کنید."
    )

    try:
        await bot.send_message(
            chat_id=ADMIN_ID,
            text=admin_notification
        )
    except Exception as e:
        logger.error(f"خطا در ارسال اعلان به چت خصوصی ادمین ({ADMIN_ID}): {e}")
`
  },
  {
    path: 'handlers/admin.py',
    filename: 'admin.py',
    language: 'python',
    category: 'handlers',
    description: 'کنترل‌کننده پنل مدیریت: مدیریت خودروها، خدمات اختصاصی هر خودرو و مشاهده سفارش‌ها با کد پیگیری',
    content: `"""
کنترل‌کننده پنل مدیریت ربات (Admin Panel)
دسترسی منحصراً برای ADMIN_ID، امکان مدیریت خودروها، خدمات هر خودرو به تفکیک
و مشاهده لیست کامل سفارش‌ها به همراه جزئیات و کد پیگیری.
"""
import logging
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext

import database
from config import ADMIN_ID
from states import AdminState
from keyboards import (
    get_admin_main_keyboard,
    get_admin_cars_keyboard,
    get_admin_single_car_keyboard,
    get_admin_services_keyboard,
    get_admin_single_service_keyboard,
    get_admin_back_to_main_keyboard
)

logger = logging.getLogger(__name__)
admin_router = Router(name="admin_router")

# فیلتر امنیتی سراسری برای این روتِر: فقط ادمین مجاز است
admin_router.message.filter(F.from_user.id == ADMIN_ID)
admin_router.callback_query.filter(F.from_user.id == ADMIN_ID)


@admin_router.message(Command("admin"))
async def cmd_admin(message: Message, state: FSMContext):
    await state.clear()
    welcome_text = (
        "👑 **به پنل مدیریت سامانه خدمات ضدسرقت خوش آمدید**\\n"
        "━━━━━━━━━━━━━━━━━━\\n"
        "از طریق گزینه‌های زیر می‌توانید خودروها، خدمات و سفارش‌های ثبت‌شده را مدیریت کنید:"
    )
    await message.answer(welcome_text, reply_markup=get_admin_main_keyboard())


@admin_router.callback_query(F.data == "admin_main_menu")
async def back_to_admin_main(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    welcome_text = (
        "👑 **پنل مدیریت خدمات ضدسرقت خودرو**\\n"
        "━━━━━━━━━━━━━━━━━━\\n"
        "لطفاً بخش مورد نظر خود را انتخاب نمایید:"
    )
    await callback.message.edit_text(welcome_text, reply_markup=get_admin_main_keyboard())
    await callback.answer()


@admin_router.callback_query(F.data == "admin_cars_list")
async def admin_cars_list(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    cars = await database.get_all_cars()
    text = (
        "🚗 **مدیریت خودروها**\\n\\n"
        "جهت مشاهده جزئیات، ویرایش نام، تغییر وضعیت یا مدیریت خدمات، خودروی مورد نظر را لمس فرمایید:"
    )
    await callback.message.edit_text(text, reply_markup=get_admin_cars_keyboard(cars))
    await callback.answer()


@admin_router.callback_query(F.data.startswith("admin_view_car:"))
async def admin_view_car(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    car_id = int(callback.data.split(":")[1])
    car = await database.get_car_by_id(car_id)
    if not car:
        await callback.answer("خودرو یافت نشد!", show_alert=True)
        return

    services = await database.get_all_services_by_car(car_id)
    status_str = "🟢 فعال (قابل مشاهده برای مشتری)" if car["is_active"] else "🔴 غیرفعال (مخفی از دید مشتری)"

    text = (
        f"🚗 **مشخصات خودرو:** {car['name']}\\n"
        "━━━━━━━━━━━━━━━━━━\\n"
        f"وضعیت کنونی: {status_str}\\n"
        f"تعداد خدمات تعریف شده: {len(services)} خدمت\\n\\n"
        "عملیات مورد نظر را انتخاب کنید:"
    )
    await callback.message.edit_text(text, reply_markup=get_admin_single_car_keyboard(car))
    await callback.answer()


@admin_router.callback_query(F.data.startswith("admin_toggle_car:"))
async def admin_toggle_car(callback: CallbackQuery):
    parts = callback.data.split(":")
    car_id = int(parts[1])
    new_status = bool(int(parts[2]))

    await database.toggle_car_active(car_id, new_status)
    car = await database.get_car_by_id(car_id)
    services = await database.get_all_services_by_car(car_id)

    status_str = "🟢 فعال (قابل مشاهده برای مشتری)" if car["is_active"] else "🔴 غیرفعال (مخفی از دید مشتری)"
    text = (
        f"🚗 **مشخصات خودرو:** {car['name']}\\n"
        "━━━━━━━━━━━━━━━━━━\\n"
        f"وضعیت کنونی: {status_str}\\n"
        f"تعداد خدمات تعریف شده: {len(services)} خدمت\\n\\n"
        "وضعیت خودرو با موفقیت به‌روزرسانی شد."
    )
    await callback.message.edit_text(text, reply_markup=get_admin_single_car_keyboard(car))
    await callback.answer("وضعیت خودرو تغییر یافت.")


@admin_router.callback_query(F.data == "admin_add_car")
async def admin_start_add_car(callback: CallbackQuery, state: FSMContext):
    await callback.message.edit_text(
        "➕ **افزودن خودرو جدید**\\n\\n"
        "لطفاً نام دقیق خودرو را ارسال کنید (مثلاً: تارا یا شاهین):\\n\\n"
        "جهت لغو دستور /admin را ارسال کنید."
    )
    await state.set_state(AdminState.adding_car_name)
    await callback.answer()


@admin_router.message(AdminState.adding_car_name, F.text)
async def admin_finish_add_car(message: Message, state: FSMContext):
    name = message.text.strip()
    if len(name) < 2:
        await message.answer("⚠️ لطفاً نام معتبری وارد کنید:")
        return

    car_id = await database.add_car(name)
    await state.clear()

    if not car_id:
        await message.answer(
            f"❌ خودرویی با نام «{name}» از قبل در سیستم وجود دارد.",
            reply_markup=get_admin_back_to_main_keyboard()
        )
        return

    await message.answer(
        f"✅ خودرو «{name}» با موفقیت اضافه شد.\\nمی‌توانید اکنون خدمات ضدسرقت اختصاصی آن را تعریف نمایید.",
        reply_markup=get_admin_main_keyboard()
    )


@admin_router.callback_query(F.data.startswith("admin_car_services:"))
async def admin_car_services_list(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    car_id = int(callback.data.split(":")[1])
    car = await database.get_car_by_id(car_id)
    if not car:
        await callback.answer("خودرو یافت نشد!", show_alert=True)
        return

    services = await database.get_all_services_by_car(car_id)
    text = (
        f"🛠 **مدیریت خدمات اختصاصی خودرو: {car['name']}**\\n"
        "━━━━━━━━━━━━━━━━━━\\n"
        "فهرست خدمات تعریف شده (برای ویرایش یا تغییر وضعیت لمس کنید):"
    )
    await callback.message.edit_text(
        text,
        reply_markup=get_admin_services_keyboard(car_id, car["name"], services)
    )
    await callback.answer()


@admin_router.callback_query(F.data.startswith("admin_add_service:"))
async def admin_start_add_service(callback: CallbackQuery, state: FSMContext):
    car_id = int(callback.data.split(":")[1])
    car = await database.get_car_by_id(car_id)
    if not car:
        await callback.answer("خودرو یافت نشد!", show_alert=True)
        return

    await state.update_data(target_car_id=car_id)
    await state.set_state(AdminState.adding_service_name)

    await callback.message.edit_text(
        f"➕ **افزودن خدمت به خودرو «{car['name']}»**\\n\\n"
        "لطفاً عنوان کامل خدمت ضدسرقت را ارسال فرمایید (مثال: نصب قفل پدال ضدبرش):\\n\\n"
        "برای لغو /admin را ارسال کنید."
    )
    await callback.answer()


@admin_router.message(AdminState.adding_service_name, F.text)
async def admin_finish_add_service(message: Message, state: FSMContext):
    name = message.text.strip()
    data = await state.get_data()
    car_id = data.get("target_car_id")
    await state.clear()

    if not car_id or len(name) < 2:
        await message.answer("⚠️ داده نامعتبر. عملیات لغو شد.", reply_markup=get_admin_main_keyboard())
        return

    await database.add_service(car_id, name)
    car = await database.get_car_by_id(car_id)
    car_name = car["name"] if car else "خودرو"

    await message.answer(
        f"✅ خدمت «{name}» با موفقیت به خودروی «{car_name}» اضافه شد.",
        reply_markup=get_admin_main_keyboard()
    )


@admin_router.callback_query(F.data.startswith("admin_view_service:"))
async def admin_view_service(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    service_id = int(callback.data.split(":")[1])
    service = await database.get_service_by_id(service_id)
    if not service:
        await callback.answer("خدمت یافت نشد!", show_alert=True)
        return

    status_str = "🟢 فعال (قابل انتخاب برای مشتری)" if service["is_active"] else "🔴 غیرفعال (مخفی از دید مشتری)"
    text = (
        f"🛠 **مشخصات خدمت:**\\n\\n"
        f"عنوان: **{service['name']}**\\n"
        f"وضعیت: {status_str}\\n\\n"
        "عملیات مورد نظر را انتخاب کنید:"
    )
    await callback.message.edit_text(
        text,
        reply_markup=get_admin_single_service_keyboard(service)
    )
    await callback.answer()


@admin_router.callback_query(F.data.startswith("admin_toggle_service:"))
async def admin_toggle_service(callback: CallbackQuery):
    parts = callback.data.split(":")
    service_id = int(parts[1])
    new_status = bool(int(parts[2]))

    await database.toggle_service_active(service_id, new_status)
    service = await database.get_service_by_id(service_id)

    status_str = "🟢 فعال (قابل انتخاب برای مشتری)" if service["is_active"] else "🔴 غیرفعال (مخفی از دید مشتری)"
    text = (
        f"🛠 **مشخصات خدمت:**\\n\\n"
        f"عنوان: **{service['name']}**\\n"
        f"وضعیت: {status_str}\\n\\n"
        "وضعیت خدمت با موفقیت به‌روزرسانی شد."
    )
    await callback.message.edit_text(
        text,
        reply_markup=get_admin_single_service_keyboard(service)
    )
    await callback.answer("وضعیت خدمت تغییر یافت.")


@admin_router.callback_query(F.data == "admin_orders_list")
async def admin_view_orders(callback: CallbackQuery):
    orders = await database.get_all_orders(limit=25)

    if not orders:
        await callback.message.edit_text(
            "📦 **سفارش‌های ثبت‌شده:**\\n\\n"
            "هنوز هیچ سفارشی در سامانه ثبت نشده است.",
            reply_markup=get_admin_back_to_main_keyboard()
        )
        await callback.answer()
        return

    text_parts = ["📦 **آخرین سفارش‌های ثبت‌شده:**\\n━━━━━━━━━━━━━━━━━━"]
    for idx, order in enumerate(orders, start=1):
        services_text = "\\n".join([f"    • {s}" for s in order["services"]])
        part = (
            f"**{idx}. سفارش #{order['id']}** | کد پیگیری: \`{order['tracking_code']}\`\\n"
            f"👤 مشتری: {order['customer_name']}\\n"
            f"📞 تلفن: \`{order['customer_phone']}\`\\n"
            f"🚗 خودرو: {order['car_name']}\\n"
            f"🛠 خدمات:\\n{services_text}\\n"
            f"📅 تاریخ ثبت: {order['created_at']}\\n"
            "──────────────────"
        )
        text_parts.append(part)

    full_text = "\\n".join(text_parts)
    if len(full_text) > 4000:
        full_text = full_text[:3950] + "\\n\\n... (سوابق در دیتابیس محفوظ است)"

    await callback.message.edit_text(full_text, reply_markup=get_admin_back_to_main_keyboard())
    await callback.answer()
`
  },
  {
    path: 'requirements.txt',
    filename: 'requirements.txt',
    language: 'plaintext',
    category: 'config',
    description: 'وابستگی‌های پایتون (aiogram 3، aiosqlite، python-dotenv)',
    content: `aiogram>=3.4.1,<4.0.0
aiosqlite>=0.20.0
python-dotenv>=1.0.1
`
  },
  {
    path: '.env.example',
    filename: '.env.example',
    language: 'plaintext',
    category: 'config',
    description: 'نمونه متغیرهای محیطی برای پیام‌رسان بله یا تلگرام',
    content: `# تنظیمات اتصال بازوی پیام‌رسان بله (یا تلگرام) برای ثبت سفارش ضدسرقت خودرو
# این فایل نمونه است؛ برای اجرای ربات نام آن را به .env تغییر داده و مقادیر را تکمیل کنید.

# نوع پیام‌رسان: bale یا telegram
MESSENGER=bale

# آدرس سرور API بازوهای بله
BALE_API_URL=https://tapi.bale.ai

# توکن بازوی دریافتی از @BotFather در پیام‌رسان بله
BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ_1234567

# شناسه عددی اکانت بله مدیر (از بات @userinfobot یا پروفایل بله)
ADMIN_ID=987654321

# مسیر فایل دیتابیس SQLite
DB_PATH=bot_database.db
`
  },
  {
    path: 'README.md',
    filename: 'README.md',
    language: 'markdown',
    category: 'docs',
    description: 'راهنمای راه‌اندازی فارسی بازوی پیام‌رسان بله، ساخت توکن با BotFather و سرور ۲۴/۷',
    content: `# 🛡 بازوی پیام‌رسان بله برای ثبت سفارش خدمات ضدسرقت خودرو

این پروژه یک بازوی (ربات) حرفه‌ای، راست‌به‌چپ (RTL) و کاملاً فارسی برای **پیام‌رسان بله (Bale)** است که با استفاده از کتابخانه پرقدرت **aiogram 3** و پایگاه داده سبک و پرسرعت **SQLite** توسعه داده شده و از سرور رسمی \`https://tapi.bale.ai\` پشتیبانی می‌کند.

---

## 📌 مزایای بله در ایران
1. **بدون نیاز به فیلترشکن و پروکسی**: در سرتاسر ایران بدون افت سرعت یا قطعی کار می‌کند.
2. **قابلیت اجرا بر روی سرورهای داخلی (VPS ایران)**: هزینه کمتر و پایداری حداکثری.
3. **سازگاری کامل با معماری aiogram 3**.

---

## 🚀 راهنمای سریع راه‌اندازی
1. در پیام‌رسان بله به [@BotFather](https://ble.ir/botfather) پیام داده و با دستور \`/newbot\` توکن بگیرید.
2. شناسه اکانت بله خود را با [@userinfobot](https://ble.ir/userinfobot) دریافت کنید.
3. در فایل \`.env\` مقادیر \`MESSENGER=bale\` و توکن را قرار دهید.
4. با دستور \`python3 main.py\` ربات را اجرا کنید.
`
  },
  {
    path: 'Dockerfile',
    filename: 'Dockerfile',
    language: 'dockerfile',
    category: 'deploy',
    description: 'فایل کانتینرسازی برای اجرای سریع و ایزوله در داکر با تنظیم PYTHONPATH=/app',
    content: `FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \\
    PYTHONUNBUFFERED=1 \\
    PYTHONPATH=/app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

CMD ["python", "main.py"]
`
  },
  {
    path: '.dockerignore',
    filename: '.dockerignore',
    language: 'plaintext',
    category: 'deploy',
    description: 'نادیده‌گرفتن فایل‌های اضافی و پوشه node_modules در بیلد داکر',
    content: `__pycache__/
*.py[cod]
.git/
node_modules/
dist/
.env
*.db
`
  },
  {
    path: 'docker-compose.yml',
    filename: 'docker-compose.yml',
    language: 'yaml',
    category: 'deploy',
    description: 'فایل راه‌اندازی سریع داکر با ولوم دائمی برای دیتابیس SQLite',
    content: `version: '3.8'

services:
  telegram_bot:
    build: .
    container_name: car_antitheft_bot
    restart: always
    env_file:
      - .env
    volumes:
      - ./data:/app/data
    environment:
      - DB_PATH=/app/data/bot_database.db
`
  },
  {
    path: 'Procfile',
    filename: 'Procfile',
    language: 'plaintext',
    category: 'deploy',
    description: 'دستور شروع خودکار فرآیند در رندر (Render Background Worker)',
    content: `worker: python main.py
`
  },
  {
    path: 'render.yaml',
    filename: 'render.yaml',
    language: 'yaml',
    category: 'deploy',
    description: 'کانفیگ خودکار استقرار در رندر (Render Blueprint) بدون نیاز به Root Directory',
    content: `services:
  - type: worker
    name: car-antitheft-bot
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: python main.py
    autoDeploy: true
    envVars:
      - key: MESSENGER
        value: bale
      - key: BALE_API_URL
        value: https://tapi.bale.ai
      - key: BOT_TOKEN
        sync: false
      - key: ADMIN_ID
        sync: false
      - key: DB_PATH
        value: bot_database.db
      - key: PYTHONPATH
        value: .
`
  },
  {
    path: 'bot.service',
    filename: 'bot.service',
    language: 'ini',
    category: 'deploy',
    description: 'سرویس لینوکس systemd برای اجرای همیشه روشن ربات در سرور مجازی (VPS)',
    content: `[Unit]
Description=Car Anti-Theft Services Telegram/Bale Bot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/telegram_bot
ExecStart=/var/www/telegram_bot/venv/bin/python3 /var/www/telegram_bot/main.py
Restart=always
RestartSec=5
EnvironmentFile=/var/www/telegram_bot/.env

[Install]
WantedBy=multi-user.target
`
  }
];

