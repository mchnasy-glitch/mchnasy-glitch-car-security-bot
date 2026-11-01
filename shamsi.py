"""
ماژول اختصاصی و سبک تبدیل تاریخ میلادی به تقویم هجری شمسی (جلالی)
طراحی شده به صورت کاملاً بومی و مستقل بدون هیچ‌گونه کتابخانه جانبی یا وابستگی اضافی.
پشتیبانی از ساعت رسمی ایران (+03:30) و فرمت‌بندی استاندارد تاریخ شمسی.
"""
import re
from datetime import datetime, timezone, timedelta
from typing import Tuple, Optional, Union

# اختلاف زمان رسمی ایران با UTC
TEHRAN_TIMEZONE = timezone(timedelta(hours=3, minutes=30))

PERSIAN_MONTH_NAMES = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
]

PERSIAN_DAY_NAMES = [
    "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه", "شنبه", "یکشنبه"
]


def gregorian_to_jalali(gy: int, gm: int, gd: int) -> Tuple[int, int, int]:
    """
    الگوریتم دقیق تبدیل تاریخ میلادی به تقویم هجری شمسی
    بر اساس الگوریتم استاندارد نجومی روزبه پورنادر و کاظم برکوفسکی
    """
    g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    gy2 = gy if gm > 2 else gy - 1
    days = 355666 + (365 * gy) + ((gy2 + 4) // 4) - ((gy2 + 100) // 100) + ((gy2 + 400) // 400) + gd + g_d_m[gm - 1]
    
    jy = -1595 + (33 * (days // 12053))
    days %= 12053
    jy += 4 * (days // 1461)
    days %= 1461
    
    if days > 365:
        jy += (days - 1) // 365
        days = (days - 1) % 365
        
    if days < 186:
        jm = 1 + (days // 31)
        jd = 1 + (days % 31)
    else:
        jm = 7 + ((days - 186) // 30)
        jd = 1 + ((days - 186) % 30)
        
    return jy, jm, jd


def get_current_shamsi_datetime() -> str:
    """دریافت تاریخ و زمان کنونی ایران به صورت شمسی خوانا"""
    now = datetime.now(TEHRAN_TIMEZONE)
    jy, jm, jd = gregorian_to_jalali(now.year, now.month, now.day)
    time_str = now.strftime("%H:%M")
    month_name = PERSIAN_MONTH_NAMES[jm - 1]
    return f"{jd} {month_name} {jy} - ساعت {time_str}"


def format_shamsi_short(now: Optional[datetime] = None) -> str:
    """دریافت تاریخ شمسی فشرده به صورت YYYY/MM/DD - HH:MM"""
    if now is None:
        now = datetime.now(TEHRAN_TIMEZONE)
    jy, jm, jd = gregorian_to_jalali(now.year, now.month, now.day)
    return f"{jy}/{jm:02d}/{jd:02d} - {now.strftime('%H:%M')}"


def to_shamsi_string(val: Union[str, datetime, None]) -> str:
    """
    تبدیل هر نوع رشته زمانی پایگاه داده SQLite یا شیء datetime به فرمت شمسی خوانا
    نمونه خروجی: ۱۴۰۵/۰۸/۱۰ - ساعت ۱۴:۳۰
    """
    if val is None:
        return get_current_shamsi_datetime()

    if isinstance(val, datetime):
        dt = val
        if dt.tzinfo is None:
            # فرض ساعت ایران
            pass
    elif isinstance(val, str):
        val_clean = val.strip()
        # اگر در حال حاضر شمسی است
        if "/" in val_clean:
            first_part = val_clean.split("/")[0]
            if first_part.isdigit() and int(first_part) > 1300:
                return val_clean

        # پارس کردن قالب استاندارد SQLite (YYYY-MM-DD HH:MM:SS)
        try:
            cleaned = val_clean.replace("T", " ").split(".")[0]
            dt = datetime.strptime(cleaned, "%Y-%m-%d %H:%M:%S")
            # اگر تایم‌استمپ UTC ذخیره شده، تبدیل به وقت ایران (+3:30)
            dt = dt + timedelta(hours=3, minutes=30)
        except Exception:
            try:
                dt = datetime.strptime(val_clean.split()[0], "%Y-%m-%d")
            except Exception:
                return val_clean
    else:
        return str(val)

    jy, jm, jd = gregorian_to_jalali(dt.year, dt.month, dt.day)
    time_str = dt.strftime("%H:%M")
    return f"{jy}/{jm:02d}/{jd:02d} - ساعت {time_str}"
