"""
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
    """کیبورد درخواست شماره تلفن همراه با دکمه ارسال مستقیم و دکمه انصراف"""
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📱 ارسال شماره من", request_contact=True)],
            [KeyboardButton(text="❌ انصراف از ثبت سفارش")]
        ],
        resize_keyboard=True,
        one_time_keyboard=True,
        is_persistent=True
    )


def get_cancel_reply_keyboard() -> ReplyKeyboardMarkup:
    """کیبورد ساده انصراف"""
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="❌ انصراف")]
        ],
        resize_keyboard=True,
        one_time_keyboard=True
    )


def remove_keyboard() -> ReplyKeyboardRemove:
    """حذف کیبورد متنی"""
    return ReplyKeyboardRemove()


def get_cars_inline_keyboard(cars: List[Dict[str, Any]]) -> InlineKeyboardMarkup:
    """فهرست خودروهای فعال جهت انتخاب توسط مشتری"""
    buttons = []
    # دو خودرو در هر سطر برای دسترسی آسان در گوشی
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
    """
    فهرست خدمات خودرو با امکان انتخاب/لغو چندگانه پویا.
    هر خدمت دارای وضعیت تیک‌خورده ☑ یا خالی ◻ است.
    """
    buttons = []
    for srv in services:
        s_id = srv["id"]
        is_selected = s_id in selected_ids
        icon = "☑" if is_selected else "◻"
        text = f"{icon} {srv['name']}"
        buttons.append([
            InlineKeyboardButton(text=text, callback_data=f"toggle_srv:{s_id}")
        ])

    # دکمه تأیید و ادامه تنها در صورت انتخاب حداقل یک مورد فعال به نظر می‌رسد
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
    """کیبورد تأیید نهایی سفارش یا بازگشت جهت ویرایش"""
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ تأیید نهایی و ثبت قطعی سفارش", callback_data="confirm_final_order")],
        [
            InlineKeyboardButton(text="🔙 ویرایش خدمات", callback_data="back_to_services"),
            InlineKeyboardButton(text="❌ لغو کامل", callback_data="customer_cancel")
        ]
    ])


# ---------------- کیبوردهای پنل مدیریت ----------------

def get_admin_main_keyboard() -> InlineKeyboardMarkup:
    """منوی اصلی پنل مدیریت"""
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🚗 مدیریت خودروها و خدمات", callback_data="admin_cars_list")],
        [InlineKeyboardButton(text="📦 مشاهده سفارش‌های ثبت‌شده", callback_data="admin_orders_list")],
        [InlineKeyboardButton(text="🔄 تازه‌سازی اطلاعات", callback_data="admin_refresh")]
    ])


def get_admin_cars_keyboard(cars: List[Dict[str, Any]]) -> InlineKeyboardMarkup:
    """لیست خودروها در پنل مدیریت با نشانگر وضعیت فعال/غیرفعال"""
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
    """تنظیمات یک خودرو: تغییر نام، تغییر وضعیت و مدیریت خدمات اختصاصی"""
    toggle_text = "🔴 غیرفعال‌سازی این خودرو" if car["is_active"] else "🟢 فعال‌سازی این خودرو"
    toggle_cb = f"admin_toggle_car:{car['id']}:{0 if car['is_active'] else 1}"

    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🛠 مدیریت خدمات این خودرو", callback_data=f"admin_car_services:{car['id']}")],
        [InlineKeyboardButton(text="✏️ ویرایش نام خودرو", callback_data=f"admin_edit_car_name:{car['id']}")],
        [InlineKeyboardButton(text=toggle_text, callback_data=toggle_cb)],
        [InlineKeyboardButton(text="🔙 بازگشت به لیست خودروها", callback_data="admin_cars_list")]
    ])


def get_admin_services_keyboard(car_id: int, car_name: str, services: List[Dict[str, Any]]) -> InlineKeyboardMarkup:
    """لیست خدمات تعریف شده برای یک خودرو در پنل مدیریت"""
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
    """تنظیمات یک خدمت: ویرایش نام و تغییر وضعیت فعال/غیرفعال"""
    toggle_text = "🔴 غیرفعال‌سازی خدمت" if service["is_active"] else "🟢 فعال‌سازی خدمت"
    toggle_cb = f"admin_toggle_service:{service['id']}:{0 if service['is_active'] else 1}"

    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✏️ ویرایش عنوان خدمت", callback_data=f"admin_edit_service_name:{service['id']}")],
        [InlineKeyboardButton(text=toggle_text, callback_data=toggle_cb)],
        [InlineKeyboardButton(text="🔙 بازگشت به خدمات خودرو", callback_data=f"admin_car_services:{service['car_id']}")]
    ])


def get_admin_back_to_main_keyboard() -> InlineKeyboardMarkup:
    """دکمه بازگشت به منوی ادمین"""
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔙 بازگشت به منوی اصلی مدیریت", callback_data="admin_main_menu")]
    ])
