"""
ماژول کنترل‌کننده‌های پیام‌ها و دستورات ربات تلگرام و بله
"""
from handlers.customer import customer_router
from handlers.admin import admin_router

__all__ = ["customer_router", "admin_router"]
