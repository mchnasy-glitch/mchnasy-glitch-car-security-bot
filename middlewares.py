"""
ماژول میدلورهای امنیتی و کنترل ترافیک ربات (Security & Anti-Spam Middlewares)
شامل کنترل نرخ ارسال پیام (Throttling / Rate-Limiting) برای مقابله با اسپم،
جلوگیری از مصرف بیش از حد منابع پردازنده و ممانعت از محدودسازی توسط سرورهای تلگرام و بله (FloodWait).
"""
import time
import logging
from typing import Callable, Dict, Any, Awaitable
from aiogram import BaseMiddleware
from aiogram.types import TelegramObject, Message, CallbackQuery

logger = logging.getLogger(__name__)


class AntiSpamMiddleware(BaseMiddleware):
    """
    میدلور مقابله با اسپم و ارسال رگباری پیام‌ها (Flood Prevention).
    کاربرانی که در بازه زمانی کمتر از `limit` ثانیه مجدداً پیام بفرستند را کنترل می‌کند.
    """
    def __init__(self, limit: float = 0.8):
        self.limit = limit
        self._user_last_action: Dict[int, float] = {}

    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any]
    ) -> Any:
        user = data.get("event_from_user")
        
        # اگر رویداد از سمت کاربر واقعی (نه بات) باشد
        if user and not user.is_bot:
            now = time.monotonic()
            last_time = self._user_last_action.get(user.id, 0.0)
            elapsed = now - last_time

            # اگر فاصله دو پیام کمتر از حد مجاز باشد
            if elapsed < self.limit:
                self._user_last_action[user.id] = now
                logger.warning(f"⚠️ شناسایی ارسال رگباری (Spam) از کاربر {user.id} - فاصله: {elapsed:.2f} ثانیه")
                
                if isinstance(event, Message):
                    await event.answer("⚠️ لطفاً کمی صبر کنید و پیام‌های پشت سر هم ارسال نفرمایید.")
                elif isinstance(event, CallbackQuery):
                    await event.answer("⚠️ لطفاً شکیبا باشید...", show_alert=False)
                return None

            # ثبت زمان آخرین فعالیت معتبر
            self._user_last_action[user.id] = now

            # پاک‌سازی دوره‌ای دیکشنری جهت جلوگیری از انباشت حافظه در سرور
            if len(self._user_last_action) > 5000:
                self._user_last_action.clear()

        return await handler(event, data)
