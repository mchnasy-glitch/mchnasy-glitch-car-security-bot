"""
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
        # جدول خودروها
        await db.execute("""
            CREATE TABLE IF NOT EXISTS cars (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # جدول خدمات ضدسرقت به ازای هر خودرو
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

        # جدول سفارش‌ها (حاوی اسنپ‌شات دائمی از نام خودرو و خدمات برای جلوگیری از مخدوش شدن سوابق)
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

        # بررسی و درج داده‌های اولیه استاندارد در اولین راه‌اندازی
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

                # برای سایر خودروها هیچ خدمت حدسی درج نمی‌شود؛ مدیر بعداً اضافه خواهد کرد.
                await db.commit()
                logger.info("داده‌های اولیه با موفقیت درج شدند.")


# ---------------- توابع مدیریت خودروها ----------------

async def get_active_cars() -> List[Dict[str, Any]]:
    """دریافت لیست خودروهای فعال برای مشتری"""
    async with await get_db_connection() as db:
        async with db.execute("SELECT id, name FROM cars WHERE is_active = 1 ORDER BY id ASC") as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def get_all_cars() -> List[Dict[str, Any]]:
    """دریافت تمامی خودروها (فعال و غیرفعال) برای پنل مدیریت"""
    async with await get_db_connection() as db:
        async with db.execute("SELECT id, name, is_active FROM cars ORDER BY id ASC") as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def get_car_by_id(car_id: int) -> Optional[Dict[str, Any]]:
    """یافتن خودرو بر اساس شناسه"""
    async with await get_db_connection() as db:
        async with db.execute("SELECT id, name, is_active FROM cars WHERE id = ?", (car_id,)) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None


async def add_car(name: str) -> Optional[int]:
    """افزودن خودروی جدید"""
    async with await get_db_connection() as db:
        try:
            cursor = await db.execute("INSERT INTO cars (name, is_active) VALUES (?, 1)", (name.strip(),))
            await db.commit()
            return cursor.lastrowid
        except aiosqlite.IntegrityError:
            return None


async def update_car_name(car_id: int, new_name: str) -> bool:
    """ویرایش نام خودرو"""
    async with await get_db_connection() as db:
        try:
            await db.execute("UPDATE cars SET name = ? WHERE id = ?", (new_name.strip(), car_id))
            await db.commit()
            return True
        except aiosqlite.IntegrityError:
            return False


async def toggle_car_active(car_id: int, is_active: bool) -> bool:
    """فعال یا غیرفعال کردن خودرو"""
    async with await get_db_connection() as db:
        val = 1 if is_active else 0
        await db.execute("UPDATE cars SET is_active = ? WHERE id = ?", (val, car_id))
        await db.commit()
        return True


# ---------------- توابع مدیریت خدمات ----------------

async def get_active_services_by_car(car_id: int) -> List[Dict[str, Any]]:
    """دریافت خدمات فعال برای یک خودروی مشخص"""
    async with await get_db_connection() as db:
        async with db.execute(
            "SELECT id, car_id, name FROM services WHERE car_id = ? AND is_active = 1 ORDER BY id ASC",
            (car_id,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def get_all_services_by_car(car_id: int) -> List[Dict[str, Any]]:
    """دریافت تمامی خدمات یک خودرو برای پنل مدیر"""
    async with await get_db_connection() as db:
        async with db.execute(
            "SELECT id, car_id, name, is_active FROM services WHERE car_id = ? ORDER BY id ASC",
            (car_id,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def get_service_by_id(service_id: int) -> Optional[Dict[str, Any]]:
    """دریافت اطلاعات یک خدمت"""
    async with await get_db_connection() as db:
        async with db.execute("SELECT id, car_id, name, is_active FROM services WHERE id = ?", (service_id,)) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None


async def add_service(car_id: int, name: str) -> Optional[int]:
    """افزودن خدمت جدید به خودرو"""
    async with await get_db_connection() as db:
        cursor = await db.execute("INSERT INTO services (car_id, name, is_active) VALUES (?, ?, 1)", (car_id, name.strip()))
        await db.commit()
        return cursor.lastrowid


async def update_service_name(service_id: int, new_name: str) -> bool:
    """ویرایش نام خدمت"""
    async with await get_db_connection() as db:
        await db.execute("UPDATE services SET name = ? WHERE id = ?", (new_name.strip(), service_id))
        await db.commit()
        return True


async def toggle_service_active(service_id: int, is_active: bool) -> bool:
    """فعال یا غیرفعال کردن خدمت"""
    async with await get_db_connection() as db:
        val = 1 if is_active else 0
        await db.execute("UPDATE services SET is_active = ? WHERE id = ?", (val, service_id))
        await db.commit()
        return True


# ---------------- توابع مدیریت سفارشات ----------------

async def save_order(
    tracking_code: str,
    user_id: int,
    customer_name: str,
    customer_phone: str,
    car_id: int,
    car_name: str,
    services_list: List[str]
) -> int:
    """
    ثبت سفارش نهایی با اسنپ‌شات کامل نام خودرو و لیست خدمات.
    این ساختار تضمین می‌کند که تغییر یا حذف خودرو و خدمت در آینده هیچ تأثیری
    بر نام و جزئیات ثبت شده در این سفارش نخواهد داشت.
    """
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
    """دریافت آخرین سفارش‌ها برای مدیر همراه با دیکد کردن لیست خدمات"""
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


async def get_order_by_tracking_code(tracking_code: str) -> Optional[Dict[str, Any]]:
    """یافتن سفارش با کد پیگیری"""
    async with await get_db_connection() as db:
        async with db.execute(
            """
            SELECT id, tracking_code, user_id, customer_name, customer_phone,
                   car_name, services_snapshot, status, created_at
            FROM orders
            WHERE tracking_code = ?
            """,
            (tracking_code.strip(),)
        ) as cursor:
            row = await cursor.fetchone()
            if not row:
                return None
            item = dict(row)
            try:
                item["services"] = json.loads(item["services_snapshot"])
            except Exception:
                item["services"] = [item["services_snapshot"]]
            return item
