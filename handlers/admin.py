"""
کنترل‌کننده پنل مدیریت ربات (Admin Panel)
دسترسی منحصراً برای ADMIN_ID، امکان مدیریت خودروها، خدمات هر خودرو به تفکیک
و مشاهده لیست کامل سفارش‌ها به همراه جزئیات و کد پیگیری.
"""
import logging
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
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
    get_admin_confirm_delete_service_keyboard,
    get_admin_back_to_main_keyboard,
    get_admin_order_notification_keyboard,
    get_admin_orders_menu_keyboard,
    get_admin_orders_list_keyboard
)
from shamsi import to_shamsi_string


logger = logging.getLogger(__name__)
admin_router = Router(name="admin_router")


# فیلتر امنیتی سراسری برای این روتِر: دسترسی منحصراً برای ADMIN_ID مجاز است
admin_router.message.filter(F.from_user.id == ADMIN_ID)
admin_router.callback_query.filter(F.from_user.id == ADMIN_ID)


def sanitize_input(text: str, max_length: int = 70) -> str:
    """پاک‌سازی نام خودرو و عنوان خدمت جهت جلوگیری از خطاهای مارک‌داون و تزریق کدهای مخرب"""
    if not text:
        return ""
    cleaned = "".join(ch for ch in text if ch.isprintable())
    for char in ["*", "_", "`", "[", "]", "(", ")", "~", ">", "#", "+", "=", "|", "{", "}"]:
        cleaned = cleaned.replace(char, "")
    return cleaned.strip()[:max_length]



# ---------------- ورود به پنل مدیریت ----------------

@admin_router.message(Command("admin"))
async def cmd_admin(message: Message, state: FSMContext):
    """ورود به پنل مدیریت با دستور /admin همراه با خلاصه CRM"""
    await state.clear()
    counts = await database.get_orders_counts()
    welcome_text = (
        "👑 **به پنل مدیریت سامانه خدمات ضدسرقت خوش آمدید**\n"
        "━━━━━━━━━━━━━━━━━━\n"
        f"📊 **خلاصه وضعیت سفارش‌ها (CRM):**\n"
        f"⏳ در انتظار تماس: **{counts['pending']}** | ✅ تماس‌گرفته‌شده: **{counts['contacted']}**\n\n"
        "از طریق گزینه‌های زیر بخش مورد نظر خود را انتخاب فرمایید:"
    )
    await message.answer(welcome_text, reply_markup=get_admin_main_keyboard(counts))


@admin_router.callback_query(F.data == "admin_main_menu")
async def back_to_admin_main(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    counts = await database.get_orders_counts()
    welcome_text = (
        "👑 **پنل مدیریت خدمات ضدسرقت خودرو**\n"
        "━━━━━━━━━━━━━━━━━━\n"
        f"📊 **خلاصه وضعیت سفارش‌ها (CRM):**\n"
        f"⏳ در انتظار تماس: **{counts['pending']}** | ✅ تماس‌گرفته‌شده: **{counts['contacted']}**\n\n"
        "لطفاً بخش مورد نظر خود را انتخاب نمایید:"
    )
    await callback.message.edit_text(welcome_text, reply_markup=get_admin_main_keyboard(counts))
    await callback.answer()


@admin_router.callback_query(F.data == "admin_refresh")
async def handle_admin_refresh(callback: CallbackQuery):
    counts = await database.get_orders_counts()
    welcome_text = (
        "👑 **پنل مدیریت خدمات ضدسرقت خودرو**\n"
        "━━━━━━━━━━━━━━━━━━\n"
        "اطلاعات به‌روزرسانی شد 🔄\n\n"
        f"📊 **خلاصه وضعیت سفارش‌ها (CRM):**\n"
        f"⏳ در انتظار تماس: **{counts['pending']}** | ✅ تماس‌گرفته‌شده: **{counts['contacted']}**\n\n"
        "لطفاً بخش مورد نظر خود را انتخاب نمایید:"
    )
    await callback.message.edit_text(welcome_text, reply_markup=get_admin_main_keyboard(counts))
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
    """مشاهده مشخصات یک خودرو و لیست خدمات آن"""
    await state.clear()
    car_id = int(callback.data.split(":")[1])
    car = await database.get_car_by_id(car_id)
    if not car:
        await callback.answer("خودرو یافت نشد!", show_alert=True)
        return

    services = await database.get_all_services_by_car(car_id)
    status_str = "🟢 فعال (قابل مشاهده برای مشتری)" if car["is_active"] else "🔴 غیرفعال (مخفی از دید مشتری)"

    if services:
        services_preview = "\n".join([f"    • {('🟢' if s['is_active'] else '🔴')} {s['name']}" for s in services])
    else:
        services_preview = "    (هنوز خدمتی برای این خودرو تعریف نشده است)"

    text = (
        f"🚗 **مشخصات خودرو:** {car['name']}\n"
        "━━━━━━━━━━━━━━━━━━\n"
        f"وضعیت کنونی: {status_str}\n"
        f"تعداد خدمات تعریف شده: **{len(services)} خدمت**\n\n"
        f"🛠 **فهرست خدمات کنونی:**\n"
        f"{services_preview}\n"
        "━━━━━━━━━━━━━━━━━━\n"
        "برای ویرایش عنوان، حذف یا تغییر خدمات، دکمه «✏️ ویرایش و مدیریت خدمات این خودرو» را لمس کنید:"
    )
    await callback.message.edit_text(text, reply_markup=get_admin_single_car_keyboard(car, services_count=len(services)))
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
    if services:
        services_preview = "\n".join([f"    • {('🟢' if s['is_active'] else '🔴')} {s['name']}" for s in services])
    else:
        services_preview = "    (هنوز خدمتی برای این خودرو تعریف نشده است)"

    text = (
        f"🚗 **مشخصات خودرو:** {car['name']}\n"
        "━━━━━━━━━━━━━━━━━━\n"
        f"وضعیت کنونی: {status_str}\n"
        f"تعداد خدمات تعریف شده: **{len(services)} خدمت**\n\n"
        f"🛠 **فهرست خدمات کنونی:**\n"
        f"{services_preview}\n"
        "━━━━━━━━━━━━━━━━━━\n"
        "وضعیت خودرو با موفقیت به‌روزرسانی شد."
    )
    await callback.message.edit_text(text, reply_markup=get_admin_single_car_keyboard(car, services_count=len(services)))
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
    raw_name = message.text or ""
    name = sanitize_input(raw_name, max_length=50)
    if len(name) < 2:
        await message.answer("⚠️ لطفاً نام معتبری (حداقل ۲ حرف) برای خودرو وارد کنید:")
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


@admin_router.message(AdminState.adding_car_name)
async def admin_invalid_add_car(message: Message):
    await message.answer("⚠️ لطفاً نام خودرو را فقط به صورت پیام متنی ارسال فرمایید (یا /admin برای انصراف):")


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
    raw_name = message.text or ""
    new_name = sanitize_input(raw_name, max_length=50)
    data = await state.get_data()
    car_id = data.get("editing_car_id")
    await state.clear()

    if not car_id:
        await message.answer("خطا در پردازش اطلاعات.", reply_markup=get_admin_main_keyboard())
        return

    if len(new_name) < 2:
        await message.answer("⚠️ نام وارد شده بسیار کوتاه است. عملیات لغو شد.", reply_markup=get_admin_main_keyboard())
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


@admin_router.message(AdminState.editing_car_name)
async def admin_invalid_edit_car(message: Message):
    await message.answer("⚠️ لطفاً نام جدید خودرو را صرفاً به صورت پیام متنی ارسال کنید:")



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
        f"🛠 **ویرایش و مدیریت خدمات اختصاصی خودرو: {car['name']}**\n"
        "━━━━━━━━━━━━━━━━━━\n"
        f"تعداد خدمات تعریف شده: **{len(services)} خدمت**\n\n"
        "💡 جهت ویرایش عنوان، تغییر وضعیت فعال/غیرفعال یا حذف هر خدمت، گزینه‌های زیر را انتخاب فرمایید:"
    )
    await callback.message.edit_text(
        text,
        reply_markup=get_admin_services_keyboard(car_id, car["name"], services)
    )
    await callback.answer()


@admin_router.callback_query(F.data.startswith("admin_view_service:"))
async def admin_view_service(callback: CallbackQuery, state: FSMContext):
    """مشاهده مشخصات و تنظیمات یک خدمت"""
    await state.clear()
    service_id = int(callback.data.split(":")[1])
    service = await database.get_service_by_id(service_id)
    if not service:
        await callback.answer("خدمت یافت نشد!", show_alert=True)
        return

    status_str = "🟢 فعال (قابل انتخاب برای مشتری)" if service["is_active"] else "🔴 غیرفعال (مخفی از دید مشتری)"
    text = (
        f"🛠 **مشخصات و ویرایش خدمت:**\n\n"
        f"عنوان خدمت: **{service['name']}**\n"
        f"وضعیت کنونی: {status_str}\n\n"
        "عملیات مورد نظر برای این خدمت را انتخاب کنید:"
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
        f"🛠 **مشخصات و ویرایش خدمت:**\n\n"
        f"عنوان: **{service['name']}**\n"
        f"وضعیت: {status_str}\n\n"
        "وضعیت خدمت با موفقیت به‌روزرسانی شد."
    )
    await callback.message.edit_text(
        text,
        reply_markup=get_admin_single_service_keyboard(service)
    )
    await callback.answer("وضعیت خدمت تغییر یافت.")


# --- حذف خدمت اختصاصی ---

@admin_router.callback_query(F.data.startswith("admin_confirm_del_service:"))
async def admin_confirm_del_service(callback: CallbackQuery):
    """دریافت تأییدیه قبل از حذف قطعی خدمت"""
    service_id = int(callback.data.split(":")[1])
    service = await database.get_service_by_id(service_id)
    if not service:
        await callback.answer("خدمت یافت نشد!", show_alert=True)
        return

    text = (
        "⚠️ **تأییدیه حذف قطعی خدمت**\n"
        "━━━━━━━━━━━━━━━━━━\n"
        f"آیا از حذف کامل خدمت زیر اطمینان دارید؟\n\n"
        f"🛠 عنوان: **{service['name']}**\n\n"
        "❌ پس از حذف، این خدمت دیگر در لیست انتخاب مشتریان نمایش داده نخواهد شد."
    )
    await callback.message.edit_text(
        text,
        reply_markup=get_admin_confirm_delete_service_keyboard(service_id, service["car_id"])
    )
    await callback.answer()


@admin_router.callback_query(F.data.startswith("admin_do_delete_service:"))
async def admin_do_delete_service(callback: CallbackQuery):
    """اجرای حذف قطعی خدمت و بازگشت به لیست خدمات"""
    parts = callback.data.split(":")
    service_id = int(parts[1])
    car_id = int(parts[2])

    await database.delete_service(service_id)
    car = await database.get_car_by_id(car_id)
    services = await database.get_all_services_by_car(car_id)

    car_name = car["name"] if car else "خودرو"
    text = (
        "🗑 **خدمت با موفقیت حذف گردید.**\n"
        "━━━━━━━━━━━━━━━━━━\n"
        f"🛠 **فهرست خدمات اختصاصی خودرو: {car_name}**\n\n"
        "می‌توانید سایر خدمات را ویرایش کنید یا خدمت جدیدی اضافه فرمایید:"
    )
    await callback.message.edit_text(
        text,
        reply_markup=get_admin_services_keyboard(car_id, car_name, services)
    )
    await callback.answer("خدمت حذف شد ✅")


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
    raw_name = message.text or ""
    name = sanitize_input(raw_name, max_length=90)
    data = await state.get_data()
    car_id = data.get("target_car_id")
    await state.clear()

    if not car_id or len(name) < 2:
        await message.answer("⚠️ عنوان خدمت نامعتبر یا بسیار کوتاه است. عملیات لغو شد.", reply_markup=get_admin_main_keyboard())
        return

    await database.add_service(car_id, name)
    car = await database.get_car_by_id(car_id)
    car_name = car["name"] if car else "خودرو"

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=f"🛠 ویرایش و مشاهده خدمات «{car_name}»", callback_data=f"admin_car_services:{car_id}")],
        [InlineKeyboardButton(text="🔙 بازگشت به منوی مدیریت", callback_data="admin_main_menu")]
    ])

    await message.answer(
        f"✅ خدمت «{name}» با موفقیت به خودروی «{car_name}» اضافه شد.",
        reply_markup=keyboard
    )


@admin_router.message(AdminState.adding_service_name)
async def admin_invalid_add_service(message: Message):
    await message.answer("⚠️ لطفاً عنوان خدمت را صرفاً به صورت پیام متنی ارسال فرمایید:")


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
    raw_name = message.text or ""
    new_name = sanitize_input(raw_name, max_length=90)
    data = await state.get_data()
    service_id = data.get("editing_service_id")
    await state.clear()

    if not service_id or len(new_name) < 2:
        await message.answer("⚠️ عنوان واردشده نامعتبر یا بسیار کوتاه است. عملیات لغو شد.", reply_markup=get_admin_main_keyboard())
        return

    service = await database.get_service_by_id(service_id)
    car_id = service["car_id"] if service else None
    car = await database.get_car_by_id(car_id) if car_id else None
    car_name = car["name"] if car else "خودرو"

    await database.update_service_name(service_id, new_name)

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=f"🛠 بازگشت به خدمات خودرو «{car_name}»", callback_data=f"admin_car_services:{car_id}")],
        [InlineKeyboardButton(text="🔙 بازگشت به منوی مدیریت", callback_data="admin_main_menu")]
    ]) if car_id else get_admin_main_keyboard()

    await message.answer(
        f"✅ عنوان خدمت با موفقیت به «{new_name}» تغییر یافت.",
        reply_markup=keyboard
    )


@admin_router.message(AdminState.editing_service_name)
async def admin_invalid_edit_service(message: Message):
    await message.answer("⚠️ لطفاً عنوان جدید خدمت را صرفاً به صورت متنی ارسال کنید:")



# ---------------- سیستم مدیریت پیگیری سفارش‌ها (CRM کوچک) ----------------

@admin_router.callback_query(F.data.startswith("admin_mark_contacted:"))
async def admin_mark_order_contacted(callback: CallbackQuery):
    """
    هندلر کلیک روی دکمه «ثبت به عنوان تماس‌گرفته‌شده» در پیام اعلان سفارش
    """
    order_id = int(callback.data.split(":")[1])
    await database.update_order_status(order_id, "contacted")

    current_text = callback.message.text or ""
    if "⏳ منتظر پیگیری (تماس گرفته نشده)" in current_text:
        new_text = current_text.replace(
            "⏳ منتظر پیگیری (تماس گرفته نشده)",
            "✅ تماس گرفته شد (پیگیری شده)"
        )
    elif "📌 **وضعیت پیگیری:**" in current_text:
        new_text = current_text + "\n\n*(وضعیت به «تماس‌گرفته‌شده» تغییر یافت ✅)*"
    else:
        new_text = current_text + "\n\n📌 **وضعیت پیگیری:** ✅ تماس گرفته شد (پیگیری شده)"

    if "👇 پس از تماس تلفنی با مشتری، دکمه زیر را لمس کنید:" in new_text:
        new_text = new_text.replace(
            "👇 پس از تماس تلفنی با مشتری، دکمه زیر را لمس کنید:",
            "🎉 این سفارش با موفقیت پیگیری و تماس حاصل شد."
        )

    await callback.message.edit_text(
        new_text,
        reply_markup=get_admin_order_notification_keyboard(order_id, status="contacted")
    )
    await callback.answer("✅ وضعیت سفارش با موفقیت به «تماس‌گرفته‌شده» تغییر یافت.", show_alert=False)


@admin_router.callback_query(F.data.startswith("admin_mark_pending:"))
async def admin_mark_order_pending(callback: CallbackQuery):
    """
    امکان بازگردانی وضعیت سفارش به 'در انتظار تماس' در صورت کلیک اشتباه
    """
    order_id = int(callback.data.split(":")[1])
    await database.update_order_status(order_id, "pending")

    current_text = callback.message.text or ""
    if "✅ تماس گرفته شد (پیگیری شده)" in current_text:
        new_text = current_text.replace(
            "✅ تماس گرفته شد (پیگیری شده)",
            "⏳ منتظر پیگیری (تماس گرفته نشده)"
        )
    else:
        new_text = current_text + "\n\n📌 **وضعیت پیگیری:** ⏳ منتظر پیگیری (تماس گرفته نشده)"

    await callback.message.edit_text(
        new_text,
        reply_markup=get_admin_order_notification_keyboard(order_id, status="pending")
    )
    await callback.answer("↩️ وضعیت سفارش به «منتظر تماس» بازگردانده شد.", show_alert=False)


@admin_router.callback_query(F.data == "admin_orders_list")
async def admin_orders_menu(callback: CallbackQuery):
    """
    منوی مدیریت و فیلتربندی سفارش‌ها بر اساس وضعیت پیگیری CRM
    """
    counts = await database.get_orders_counts()
    text = (
        "📦 **مدیریت سفارش‌ها و پیگیری مشتریان (CRM)**\n"
        "━━━━━━━━━━━━━━━━━━\n"
        "در این بخش می‌توانید وضعیت تماس و هماهنگی با مشتریان را پیگیری و مدیریت کنید:\n\n"
        f"⏳ **سفارش‌های جدید و در انتظار تماس:** {counts['pending']} مورد\n"
        f"✅ **سفارش‌های تماس‌گرفته‌شده:** {counts['contacted']} مورد\n"
        f"📊 **مجموع کل سفارش‌ها:** {counts['total']} مورد\n\n"
        "جهت مشاهده سفارش‌ها، لطفاً یکی از دسته‌بندی‌های زیر را انتخاب کنید:"
    )
    await callback.message.edit_text(text, reply_markup=get_admin_orders_menu_keyboard(counts))
    await callback.answer()


@admin_router.callback_query(F.data.startswith("admin_orders_filter:"))
async def admin_orders_filter_view(callback: CallbackQuery):
    """
    نمایش لیست فیلترشده سفارش‌ها همراه با جزئیات کامل، تاریخ شمسی و دکمه‌های اقدام سریع
    """
    filter_type = callback.data.split(":")[1]
    orders = await database.get_orders_by_status(filter_type, limit=20)

    titles = {
        "pending": "⏳ سفارش‌های جدید و در انتظار تماس",
        "contacted": "✅ سفارش‌های تماس‌گرفته‌شده",
        "all": "📋 تمام سفارش‌های ثبت‌شده"
    }
    title = titles.get(filter_type, "سفارش‌ها")

    if not orders:
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="📂 دسته‌بندی سفارش‌ها (CRM)", callback_data="admin_orders_list")],
            [InlineKeyboardButton(text="🔙 بازگشت به منوی مدیریت", callback_data="admin_main_menu")]
        ])
        await callback.message.edit_text(
            f"**{title}**\n\n"
            "⚠️ در حال حاضر هیچ سفارشی در این وضعیت ثبت نشده است.",
            reply_markup=keyboard
        )
        await callback.answer()
        return

    text_parts = [f"**{title} ({len(orders)} مورد اخیر):**\n━━━━━━━━━━━━━━━━━━"]
    for idx, order in enumerate(orders, start=1):
        services_text = "\n".join([f"    • {s}" for s in order["services"]])
        shamsi_order_date = to_shamsi_string(order.get("created_at"))
        o_status = order.get("status", "pending")
        status_label = "✅ تماس گرفته شد" if o_status == "contacted" else "⏳ در انتظار تماس"

        part = (
            f"**{idx}. سفارش #{order['id']}** | کد پیگیری: `{order['tracking_code']}`\n"
            f"👤 مشتری: **{order['customer_name']}**\n"
            f"📞 تلفن تماس: `{order['customer_phone']}`\n"
            f"🚗 خودرو: **{order['car_name']}**\n"
            f"🛠 خدمات انتخابی:\n{services_text}\n"
            f"📅 تاریخ ثبت (شمسی): {shamsi_order_date}\n"
            f"📌 وضعیت پیگیری: **{status_label}**\n"
            "──────────────────"
        )
        text_parts.append(part)

    full_text = "\n".join(text_parts)
    if len(full_text) > 4000:
        full_text = full_text[:3950] + "\n\n... (سفارش‌های بیشتر در دیتابیس محفوظ هستند)"

    await callback.message.edit_text(
        full_text,
        reply_markup=get_admin_orders_list_keyboard(orders, current_filter=filter_type)
    )
    await callback.answer()


@admin_router.callback_query(F.data.startswith("admin_toggle_order_status:"))
async def admin_toggle_order_status(callback: CallbackQuery):
    """
    تغییر سریع وضعیت سفارش از درون لیست فیلترشده و رفرش آنی صفحه
    """
    parts = callback.data.split(":")
    order_id = int(parts[1])
    new_status = parts[2]
    current_filter = parts[3] if len(parts) > 3 else "all"

    await database.update_order_status(order_id, new_status)
    status_label = "تماس‌گرفته‌شده" if new_status == "contacted" else "در انتظار تماس"
    await callback.answer(f"سفارش #{order_id} به وضعیت «{status_label}» تغییر یافت ✅")

    # بازخوانی لیست با همان فیلتر فعلی
    callback.data = f"admin_orders_filter:{current_filter}"
    await admin_orders_filter_view(callback)

