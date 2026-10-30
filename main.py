"""
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

# تنظیمات لاگینگ برای ثبت دقیق رویدادها
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("BaleCarAntiTheftBot")


async def on_startup(bot: Bot):
    """ایجاد دیتابیس و جداول در زمان راه‌اندازی و ارسال اعلان به مدیر در بله"""
    logger.info("در حال آماده‌سازی دیتابیس SQLite و جداول...")
    await database.init_db()
    logger.info("پایگاه داده با موفقیت آماده به کار شد.")

    messenger_title = "پیام‌رسان بله" if MESSENGER == "bale" else "تلگرام"
    try:
        await bot.send_message(
            chat_id=ADMIN_ID,
            text=(
                f"🚀 **بازوی خدمات ضدسرقت خودرو در {messenger_title} با موفقیت روشن شد.**\n\n"
                "🛡 سامانه آماده دریافت سفارش‌های مشتریان است.\n"
                "برای ورود به پنل مدیریت، دستور /admin را ارسال فرمایید."
            )
        )
    except Exception as e:
        logger.warning(f"عدم امکان ارسال پیام آغاز به مدیر ({ADMIN_ID}): {e}")


async def main():
    logger.info("در حال راه‌اندازی با aiogram 3...")

    # تنظیم اتصال به سرور API بله (tapi.bale.ai) یا تلگرام بر اساس فایل کانفیگ
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

    # استفاده از MemoryStorage برای مدیریت وضعیت‌های FSM
    dp = Dispatcher(storage=MemoryStorage())

    # اتصال روترها (ابتدا روتر ادمین و سپس مشتری)
    dp.include_router(admin_router)
    dp.include_router(customer_router)

    # ثبت هوک استارت‌آپ
    dp.startup.register(on_startup)

    # حذف پیام‌های صف‌کشیده در زمان خاموشی قبلی
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
