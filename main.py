"""
فایل اصلی اجرای ربات ضدسرقت خودرو
توسعه‌داده شده با aiogram 3، پشتیبانی از تلگرام و پیام‌رسان بله (tapi.bale.ai)
طراحی شده برای اجرا به صورت دائم‌روشن (Background Worker) در Render، داکر و سرور لینوکس.
"""
import os
import sys
from pathlib import Path

# افزودن تضمینی دایرکتوری ریشه پروژه به مسیر ماژول‌های پایتون (sys.path)
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import asyncio
import logging

from aiohttp import web
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.client.telegram import TelegramAPIServer
from aiogram.enums import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage

import database
from config import BOT_TOKEN, ADMIN_ID, MESSENGER, BALE_API_URL, PORT
from handlers.customer import customer_router
from handlers.admin import admin_router


# تنظیمات لاگ استاندارد خروجی به stdout برای نمایش لحظه‌ای در لاگ‌های Render
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("CarSecurityBot")


async def on_startup(bot: Bot):
    """مقداردهی اولیه پایگاه‌داده و اعلام آمادگی به مدیر"""
    logger.info("در حال اعتبارسنجی و آماده‌سازی پایگاه داده SQLite...")
    try:
        await database.init_db()
        logger.info("پایگاه داده SQLite با موفقیت آماده به کار شد.")
    except Exception as e:
        logger.critical(f"خطا در مقداردهی اولیه پایگاه داده: {e}", exc_info=True)
        raise

    messenger_name = "پیام‌رسان بله" if MESSENGER == "bale" else "تلگرام"
    try:
        await bot.send_message(
            chat_id=ADMIN_ID,
            text=(
                f"🚀 **ربات خدمات ضدسرقت خودرو در {messenger_name} با موفقیت روشن شد.**\n\n"
                "🛡 سامانه آماده دریافت سفارش‌های مشتریان است.\n"
                "برای ورود به پنل مدیریت، دستور /admin را ارسال فرمایید."
            )
        )
        logger.info(f"پیام استارت‌آپ به مدیر ({ADMIN_ID}) ارسال شد.")
    except Exception as e:
        # در صورتی که مدیر هنوز دکمه Start ربات را نزده باشد، نباید ربات متوقف شود
        logger.warning(f"عدم امکان ارسال پیام استارت به مدیر ({ADMIN_ID}): {e}")


async def handle_health_check(request: web.Request) -> web.Response:
    """
    پاسخگویی سریع با کد 200 به پینگ‌های Render جهت برطرف کردن خطای No open ports detected
    و فعال‌سازی استقرار رایگان (Free Plan Web Service).
    """
    return web.json_response({
        "status": "ok",
        "service": "car-security-bot",
        "type": "Render Free Web Service",
        "messenger": MESSENGER,
        "database": "sqlite_ready"
    })


async def start_health_server(host: str = "0.0.0.0", port: int = 10000) -> web.AppRunner:
    """ایجاد وب‌سرور سبک ناهمگام روی پورت اختصاصی رندر"""
    app = web.Application()
    app.router.add_get("/", handle_health_check)
    app.router.add_get("/healthz", handle_health_check)
    app.router.add_get("/ping", handle_health_check)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, host=host, port=port)
    await site.start()
    logger.info(f"🌐 وب‌سرور Health Check با موفقیت روی {host}:{port} فعال شد (سازگار با Web Service رایگان Render).")
    return runner


async def main():
    logger.info("در حال آغاز به کار با aiogram 3...")
    logger.info(f"نوع سرویس: Render Web Service (پلن رایگان) | پیام‌رسان فعال: {MESSENGER.upper()} | پورت: {PORT}")

    # راه‌اندازی وب‌سرور سبک روی پورت درخواستی Render
    http_runner = await start_health_server(host="0.0.0.0", port=PORT)

    # تنظیم کلاینت بات برای بله یا تلگرام
    if MESSENGER == "bale":
        logger.info(f"اتصال به سرور API بله: {BALE_API_URL}")
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
        logger.info("اتصال مستقیم به سرورهای تلگرام")
        bot = Bot(
            token=BOT_TOKEN,
            default=DefaultBotProperties(parse_mode=ParseMode.MARKDOWN)
        )

    dp = Dispatcher(storage=MemoryStorage())

    # اتصال روترهای مشتری و مدیر
    dp.include_router(admin_router)
    dp.include_router(customer_router)

    # اتصال هوک راه‌اندازی
    dp.startup.register(on_startup)

    # پاک‌سازی وب‌هوک احتمالی و آپدیت‌های معلق پیشین
    try:
        await bot.delete_webhook(drop_pending_updates=True)
    except Exception as e:
        logger.warning(f"عدم امکان حذف وب‌هوک پیشین: {e}")

    logger.info("حالت Long Polling با موفقیت فعال شد. در حال گوش دادن به پیام‌ها...")

    try:
        await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())
    finally:
        try:
            await http_runner.cleanup()
            logger.info("وب‌سرور Health Check متوقف شد.")
        except Exception as e:
            logger.warning(f"خطا در تمیزکاری وب‌سرور: {e}")
        await bot.session.close()
        logger.info("نشست ربات با موفقیت بسته شد.")



if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("ربات به دستور سیستم یا کاربر متوقف شد.")
    except Exception as e:
        logger.critical(f"خطای توقف‌ناپذیر در اجرای ربات: {e}", exc_info=True)
        sys.exit(1)
