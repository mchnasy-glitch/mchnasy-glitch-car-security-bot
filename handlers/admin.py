"""
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


# ---------------- ورود به پنل مدیریت ----------------

@admin_router.message(Command("admin"))
async def cmd_admin(message: Message, state: FSMContext):
    """ورود به پنل مدیریت با دستور /admin"""
    await state.clear()
    welcome_text = (
        "👑 **به پنل مدیریت سامانه خدمات ضدسرقت خوش آمدید**\n"
        "━━━━━━━━━━━━━━━━━━\n"
        "از طریق گزینه‌های زیر می‌توانید خودروها، خدمات و سفارش‌های ثبت‌شده را به راحتی مدیریت کنید:"
    )
    await message.answer(welcome_text, reply_markup=get_admin_main_keyboard())


@admin_router.callback_query(F.data == "admin_main_menu")
async def back_to_admin_main(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    welcome_text = (
        "👑 **پنل مدیریت خدمات ضدسرقت خودرو**\n"
        "━━━━━━━━━━━━━━━━━━\n"
        "لطفاً بخش مورد نظر خود را انتخاب نمایید:"
    )
    await callback.message.edit_text(welcome_text, reply_markup=get_admin_main_keyboard())
    await callback.answer()


@admin_router.callback_query(F.data == "admin_refresh")
async def handle_admin_refresh(callback: CallbackQuery):
    await callback.answer("اطلاعات به‌روزرسانی شد 🔄")


# ---------------- مدیریت خودروها ----------------

@admin_router.callback_query(F.data == "admin_cars_list")
async def admin_cars_list(callback: CallbackQuery, state: FSMContext):
    """نمایش لیست تمام خودروها (فعال و غیرفعال)"""
    await state.clear()
    cars = await database.get_all_cars()
    text = (
        "🚗 **مدیریت خودروها**\n\n"
        "جهت مشاهده جزئیات، ویرایش نام، تغییر وضعیت یا مدیریت خدمات اختصاصی، خودروی مورد نظر را لمس فرمایید:"
    )
    await callback.message.edit_text(text, reply_markup=get_admin_cars_keyboard(cars))
    await callback.answer()


@admin_router.callback_query(F.data.startswith("admin_view_car:"))
async def admin_view_car(callback: CallbackQuery, state: FSMContext):
    """مشاهده مشخصات یک خودرو"""
    await state.clear()
    car_id = int(callback.data.split(":")[1])
    car = await database.get_car_by_id(car_id)
    if not car:
        await callback.answer("خودرو یافت نشد!", show_alert=True)
        return

    services = await database.get_all_services_by_car(car_id)
    status_str = "🟢 فعال (قابل مشاهده برای مشتری)" if car["is_active"] else "🔴 غیرفعال (مخفی از دید مشتری)"

    text = (
        f"🚗 **مشخصات خودرو:** {car['name']}\n"
        "━━━━━━━━━━━━━━━━━━\n"
        f"وضعیت کنونی: {status_str}\n"
        f"تعداد خدمات تعریف شده: {len(services)} خدمت\n\n"
        "عملیات مورد نظر را انتخاب کنید:"
    )
    await callback.message.edit_text(text, reply_markup=get_admin_single_car_keyboard(car))
    await callback.answer()


@admin_router.callback_query(F.data.startswith("admin_toggle_car:"))
async def admin_toggle_car(callback: CallbackQuery):
    """تغییر وضعیت فعال/غیرفعال خودرو"""
    parts = callback.data.split(":")
    car_id = int(parts[1])
    new_status = bool(int(parts[2]))

    await database.toggle_car_active(car_id, new_status)
    car = await database.get_car_by_id(car_id)
    services = await database.get_all_services_by_car(car_id)

    status_str = "🟢 فعال (قابل مشاهده برای مشتری)" if car["is_active"] else "🔴 غیرفعال (مخفی از دید مشتری)"
    text = (
        f"🚗 **مشخصات خودرو:** {car['name']}\n"
        "━━━━━━━━━━━━━━━━━━\n"
        f"وضعیت کنونی: {status_str}\n"
        f"تعداد خدمات تعریف شده: {len(services)} خدمت\n\n"
        "وضعیت خودرو با موفقیت به‌روزرسانی شد."
    )
    await callback.message.edit_text(text, reply_markup=get_admin_single_car_keyboard(car))
    await callback.answer("وضعیت خودرو تغییر یافت.")


# --- افزودن خودرو جدید ---

@admin_router.callback_query(F.data == "admin_add_car")
async def admin_start_add_car(callback: CallbackQuery, state: FSMContext):
    await callback.message.edit_text(
        "➕ **افزودن خودرو جدید**\n\n"
        "لطفاً نام دقیق خودرو را به صورت پیام متنی ارسال کنید (مثلاً: تارا یا شاهین):\n\n"
        "برای لغو عملیات دستور /admin را ارسال کنید."
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
        f"✅ خودرو «{name}» با موفقیت اضافه شد.\nمی‌توانید اکنون خدمات ضدسرقت اختصاصی آن را تعریف نمایید.",
        reply_markup=get_admin_main_keyboard()
    )


# --- ویرایش نام خودرو ---

@admin_router.callback_query(F.data.startswith("admin_edit_car_name:"))
async def admin_start_edit_car_name(callback: CallbackQuery, state: FSMContext):
    car_id = int(callback.data.split(":")[1])
    car = await database.get_car_by_id(car_id)
    if not car:
        await callback.answer("خودرو یافت نشد!", show_alert=True)
        return

    await state.update_data(editing_car_id=car_id)
    await state.set_state(AdminState.editing_car_name)

    await callback.message.edit_text(
        f"✏️ **ویرایش نام خودرو**\n\n"
        f"نام فعلی: **{car['name']}**\n\n"
        "لطفاً نام جدید خودرو را ارسال نمایید (برای انصراف /admin را ارسال کنید):"
    )
    await callback.answer()


@admin_router.message(AdminState.editing_car_name, F.text)
async def admin_finish_edit_car_name(message: Message, state: FSMContext):
    new_name = message.text.strip()
    data = await state.get_data()
    car_id = data.get("editing_car_id")
    await state.clear()

    if not car_id:
        await message.answer("خطا در پردازش اطلاعات.", reply_markup=get_admin_main_keyboard())
        return

    success = await database.update_car_name(car_id, new_name)
    if success:
        await message.answer(
            f"✅ نام خودرو با موفقیت به «{new_name}» تغییر یافت.",
            reply_markup=get_admin_main_keyboard()
        )
    else:
        await message.answer(
            "❌ خطا: خودرویی با این نام در دیتابیس وجود دارد.",
            reply_markup=get_admin_main_keyboard()
        )


# ---------------- مدیریت خدمات اختصاصی هر خودرو ----------------

@admin_router.callback_query(F.data.startswith("admin_car_services:"))
async def admin_car_services_list(callback: CallbackQuery, state: FSMContext):
    """مشاهده لیست خدمات اختصاصی یک خودرو"""
    await state.clear()
    car_id = int(callback.data.split(":")[1])
    car = await database.get_car_by_id(car_id)
    if not car:
        await callback.answer("خودرو یافت نشد!", show_alert=True)
        return

    services = await database.get_all_services_by_car(car_id)
    text = (
        f"🛠 **مدیریت خدمات اختصاصی خودرو: {car['name']}**\n"
        "━━━━━━━━━━━━━━━━━━\n"
        "فهرست خدمات تعریف شده (برای ویرایش یا تغییر وضعیت لمس کنید):"
    )
    await callback.message.edit_text(
        text,
        reply_markup=get_admin_services_keyboard(car_id, car["name"], services)
    )
    await callback.answer()


@admin_router.callback_query(F.data.startswith("admin_view_service:"))
async def admin_view_service(callback: CallbackQuery, state: FSMContext):
    """مشاهده تنظیمات یک خدمت"""
    await state.clear()
    service_id = int(callback.data.split(":")[1])
    service = await database.get_service_by_id(service_id)
    if not service:
        await callback.answer("خدمت یافت نشد!", show_alert=True)
        return

    status_str = "🟢 فعال (قابل انتخاب برای مشتری)" if service["is_active"] else "🔴 غیرفعال (مخفی از دید مشتری)"
    text = (
        f"🛠 **مشخصات خدمت:**\n\n"
        f"عنوان: **{service['name']}**\n"
        f"وضعیت: {status_str}\n\n"
        "عملیات مورد نظر را انتخاب کنید:"
    )
    await callback.message.edit_text(
        text,
        reply_markup=get_admin_single_service_keyboard(service)
    )
    await callback.answer()


@admin_router.callback_query(F.data.startswith("admin_toggle_service:"))
async def admin_toggle_service(callback: CallbackQuery):
    """فعال یا غیرفعال‌سازی خدمت"""
    parts = callback.data.split(":")
    service_id = int(parts[1])
    new_status = bool(int(parts[2]))

    await database.toggle_service_active(service_id, new_status)
    service = await database.get_service_by_id(service_id)

    status_str = "🟢 فعال (قابل انتخاب برای مشتری)" if service["is_active"] else "🔴 غیرفعال (مخفی از دید مشتری)"
    text = (
        f"🛠 **مشخصات خدمت:**\n\n"
        f"عنوان: **{service['name']}**\n"
        f"وضعیت: {status_str}\n\n"
        "وضعیت خدمت با موفقیت به‌روزرسانی شد."
    )
    await callback.message.edit_text(
        text,
        reply_markup=get_admin_single_service_keyboard(service)
    )
    await callback.answer("وضعیت خدمت تغییر یافت.")


# --- افزودن خدمت جدید به خودرو ---

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
        f"➕ **افزودن خدمت به خودرو «{car['name']}»**\n\n"
        "لطفاً عنوان کامل خدمت ضدسرقت را به صورت پیام متنی ارسال فرمایید (مثال: نصب قفل پدال اختصاصی):\n\n"
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
        await message.answer("⚠️ داده‌های نامعتبر. عملیات لغو شد.", reply_markup=get_admin_main_keyboard())
        return

    await database.add_service(car_id, name)
    car = await database.get_car_by_id(car_id)
    car_name = car["name"] if car else "خودرو"

    await message.answer(
        f"✅ خدمت «{name}» با موفقیت به خودروی «{car_name}» اضافه شد.",
        reply_markup=get_admin_main_keyboard()
    )


# --- ویرایش عنوان خدمت ---

@admin_router.callback_query(F.data.startswith("admin_edit_service_name:"))
async def admin_start_edit_service_name(callback: CallbackQuery, state: FSMContext):
    service_id = int(callback.data.split(":")[1])
    service = await database.get_service_by_id(service_id)
    if not service:
        await callback.answer("خدمت یافت نشد!", show_alert=True)
        return

    await state.update_data(editing_service_id=service_id)
    await state.set_state(AdminState.editing_service_name)

    await callback.message.edit_text(
        f"✏️ **ویرایش عنوان خدمت**\n\n"
        f"عنوان فعلی: **{service['name']}**\n\n"
        "لطفاً عنوان جدید را ارسال کنید (جهت لغو /admin):"
    )
    await callback.answer()


@admin_router.message(AdminState.editing_service_name, F.text)
async def admin_finish_edit_service_name(message: Message, state: FSMContext):
    new_name = message.text.strip()
    data = await state.get_data()
    service_id = data.get("editing_service_id")
    await state.clear()

    if not service_id or len(new_name) < 2:
        await message.answer("⚠️ ورودی نامعتبر. عملیات لغو شد.", reply_markup=get_admin_main_keyboard())
        return

    await database.update_service_name(service_id, new_name)
    await message.answer(
        f"✅ عنوان خدمت با موفقیت به «{new_name}» تغییر یافت.",
        reply_markup=get_admin_main_keyboard()
    )


# ---------------- مشاهده سفارش‌های ثبت‌شده ----------------

@admin_router.callback_query(F.data == "admin_orders_list")
async def admin_view_orders(callback: CallbackQuery):
    """نمایش لیست سفارش‌های ثبت‌شده مشتریان همراه با کد پیگیری و جزئیات کامل"""
    orders = await database.get_all_orders(limit=25)

    if not orders:
        await callback.message.edit_text(
            "📦 **سفارش‌های ثبت‌شده:**\n\n"
            "هنوز هیچ سفارشی در سامانه ثبت نشده است.",
            reply_markup=get_admin_back_to_main_keyboard()
        )
        await callback.answer()
        return

    text_parts = ["📦 **آخرین سفارش‌های ثبت‌شده:**\n━━━━━━━━━━━━━━━━━━"]
    for idx, order in enumerate(orders, start=1):
        services_text = "\n".join([f"    • {s}" for s in order["services"]])
        part = (
            f"**{idx}. سفارش #{order['id']}** | کد پیگیری: `{order['tracking_code']}`\n"
            f"👤 مشتری: {order['customer_name']}\n"
            f"📞 تلفن: `{order['customer_phone']}`\n"
            f"🚗 خودرو (ثبت تاریخی): {order['car_name']}\n"
            f"🛠 خدمات ثبت شده:\n{services_text}\n"
            f"📅 تاریخ ثبت: {order['created_at']}\n"
            "──────────────────"
        )
        text_parts.append(part)

    full_text = "\n".join(text_parts)
    if len(full_text) > 4000:
        full_text = full_text[:3950] + "\n\n... (سفارش‌های قدیمی‌تر در دیتابیس محفوظ هستند)"

    await callback.message.edit_text(full_text, reply_markup=get_admin_back_to_main_keyboard())
    await callback.answer()
