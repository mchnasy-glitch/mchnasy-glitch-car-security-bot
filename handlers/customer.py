"""
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
from aiogram.filters import CommandStart, Command
from aiogram.fsm.context import FSMContext

import database
from config import ADMIN_ID
from states import CustomerOrderState
from shamsi import get_current_shamsi_datetime
from keyboards import (

    get_phone_request_keyboard,
    get_cars_inline_keyboard,
    get_services_inline_keyboard,
    get_summary_confirmation_keyboard,
    remove_keyboard
)

logger = logging.getLogger(__name__)
customer_router = Router(name="customer_router")


def sanitize_text(text: str, max_length: int = 60) -> str:
    """
    پاک‌سازی و بهینه‌سازی امنیتی ورودی‌های متنی کاربر:
    - فیلتر کردن کاراکترهای مخرّب مارک‌داون جهت جلوگیری از خطای پارس در تلگرام و بله
    - حذف کاراکترهای کنترلی نامرئی
    - محدودسازی طول رشته جهت جلوگیری از سوءاستفاده‌های بافر و DoS
    """
    if not text:
        return ""
    # حذف کاراکترهای غیرقابل چاپ
    cleaned = "".join(ch for ch in text if ch.isprintable())
    # خنثی‌سازی نمادهای ساختاری مارک‌داون
    for char in ["*", "_", "`", "[", "]", "(", ")", "~", ">", "#", "+", "=", "|", "{", "}"]:
        cleaned = cleaned.replace(char, "")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned[:max_length]



def normalize_persian_numbers(text: str) -> str:
    """تبدیل ارقام فارسی و عربی به انگلیسی جهت اعتبارسنجی شماره تلفن"""
    persian_digits = "۰۱۲۳۴۵۶۷۸۹"
    arabic_digits = "٠١٢٣٤٥٦٧٨٩"
    english_digits = "0123456789"
    
    translation_table = str.maketrans(persian_digits + arabic_digits, english_digits * 2)
    return text.translate(translation_table)


def validate_iranian_phone(phone_raw: str) -> str | None:
    """اعتبارسنجی و تبدیل شماره تلفن ایران به فرمت استاندارد 09xxxxxxxxx"""
    cleaned = normalize_persian_numbers(phone_raw).strip()
    cleaned = re.sub(r"[\s\-\(\)]", "", cleaned)

    patterns = [
        r"^(?:\+98|0098|0)?(9\d{9})$"
    ]
    for pattern in patterns:
        match = re.match(pattern, cleaned)
        if match:
            return f"0{match.group(1)}"
    return None


def generate_tracking_code() -> str:
    """تولید کد پیگیری خوانا و یکتا"""
    now = datetime.datetime.now()
    random_part = random.randint(1000, 9999)
    return f"AT-{now.strftime('%y%m')}-{random_part}"


# ---------------- شروع سفارش با /start ----------------

@customer_router.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext):
    """آغاز فرآیند ثبت سفارش"""
    await state.clear()
    welcome_text = (
        "سلام! به سامانه ثبت سفارش خدمات ضدسرقت خودرو خوش آمدید 🛡🚗\n\n"
        "جهت ثبت سفارش و هماهنگی نصب، لطفاً ابتدا **نام و نام خانوادگی** خود را ارسال کنید:"
    )
    await message.answer(welcome_text, reply_markup=remove_keyboard())
    await state.set_state(CustomerOrderState.waiting_for_name)


@customer_router.message(F.text == "❌ انصراف از ثبت سفارش")
@customer_router.callback_query(F.data == "customer_cancel")
async def handle_cancel(event: Message | CallbackQuery, state: FSMContext):
    """لغو فرآیند ثبت سفارش در هر مرحله"""
    await state.clear()
    text = "❌ فرآیند ثبت سفارش لغو شد.\nبرای شروع مجدد، دستور /start را ارسال کنید."
    if isinstance(event, CallbackQuery):
        await event.message.edit_text(text)
        await event.answer("عملیات لغو شد")
    else:
        await event.answer(text, reply_markup=remove_keyboard())


# ---------------- دریافت و اعتبارسنجی نام ----------------

@customer_router.message(CustomerOrderState.waiting_for_name, F.text)
async def process_customer_name(message: Message, state: FSMContext):
    raw_text = message.text or ""
    # اعمال پاک‌سازی امنیتی و حذف کاراکترهای مخرّب
    name = sanitize_text(raw_text, max_length=50)

    if len(name) < 3 or raw_text.startswith("/"):
        await message.answer("⚠️ لطفاً نام و نام خانوادگی معتبر (بین ۳ تا ۵۰ حرف و بدون دستورات) وارد فرمایید:")
        return

    await state.update_data(customer_name=name)
    await state.set_state(CustomerOrderState.waiting_for_phone)

    prompt_phone = (
        f"بسیار عالی، جناب **{name}** گرامی.\n\n"
        "اکنون لطفاً شماره تماس همراه خود را ارسال کنید.\n"
        "می‌توانید دکمه «📱 ارسال شماره من» در پایین صفحه را لمس کنید یا شماره خود را به صورت دستی (مثلاً 09123456789) تایپ کنید:"
    )
    await message.answer(prompt_phone, reply_markup=get_phone_request_keyboard())


@customer_router.message(CustomerOrderState.waiting_for_name)
async def process_invalid_name_content(message: Message):
    """مدیریت ارسال استیکر، وویس، تصویر یا سایر پیام‌های غیرمتنی به جای نام"""
    await message.answer("⚠️ لطفاً نام و نام خانوادگی خود را فقط به صورت متن تایپ و ارسال کنید:")


# ---------------- دریافت و اعتبارسنجی شماره تلفن ----------------

@customer_router.message(CustomerOrderState.waiting_for_phone, F.contact)
async def process_phone_contact(message: Message, state: FSMContext):
    """دریافت شماره از طریق دکمه تماس با اعتبارسنجی مالکیت اکانت"""
    contact = message.contact

    # شرط امنیتی اجباری: بررسی اینکه شماره متعلق به همین کاربر باشد
    if contact.user_id != message.from_user.id:
        await message.answer(
            "⛔️ خطا: شماره ارسال‌شده متعلق به این حساب کاربری نیست!\n"
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
    """دریافت شماره تلفن به صورت ورودی متنی دستی همراه با کنترل طول و اسپم"""
    raw_text = (message.text or "").strip()
    if raw_text == "❌ انصراف از ثبت سفارش":
        await handle_cancel(message, state)
        return

    # جلوگیری از ورودی‌های بسیار طولانی یا حملات سرریز بافر
    if len(raw_text) > 30:
        await message.answer("⚠️ طول شماره تماس واردشده نامعتبر است. لطفاً شماره موبایل ۱۱ رقمی وارد کنید:")
        return

    normalized = validate_iranian_phone(raw_text)
    if not normalized:
        await message.answer(
            "⚠️ شماره وارد شده نامعتبر است.\n"
            "لطفاً شماره تلفن همراه ایران را با ۱۱ رقم و با پیش‌شماره 09 وارد فرمایید (مثال: 09121234567)\n"
            "یا از دکمه «📱 ارسال شماره من» استفاده کنید:",
            reply_markup=get_phone_request_keyboard()
        )
        return

    await _proceed_to_car_selection(message, state, normalized)


@customer_router.message(CustomerOrderState.waiting_for_phone)
async def process_invalid_phone_content(message: Message):
    """مدیریت ارسال فایل، استیکر یا محتوای غیرمجاز به جای شماره تلفن"""
    await message.answer(
        "⚠️ لطفاً شماره تلفن همراه خود را با دکمه «📱 ارسال شماره من» به اشتراک بگذارید یا ۱۱ رقم را به صورت پیام متنی ارسال کنید:",
        reply_markup=get_phone_request_keyboard()
    )



async def _proceed_to_car_selection(message: Message, state: FSMContext, phone: str):
    """ذخیره شماره و نمایش فهرست خودروهای فعال"""
    await state.update_data(customer_phone=phone)

    cars = await database.get_active_cars()
    if not cars:
        await message.answer(
            "⚠️ در حال حاضر هیچ خودرویی در سامانه فعال نیست.\n"
            "لطفاً دقایقی دیگر مجدداً بررسی فرمایید.",
            reply_markup=remove_keyboard()
        )
        await state.clear()
        return

    await message.answer(
        "✅ شماره تماس شما با موفقیت ثبت شد.\n\n"
        "🚗 اکنون لطفاً مدل خودروی خود را از فهرست زیر انتخاب فرمایید:",
        reply_markup=remove_keyboard()
    )

    await message.answer(
        "فهرست خودروهای تحت پوشش:",
        reply_markup=get_cars_inline_keyboard(cars)
    )
    await state.set_state(CustomerOrderState.selecting_car)


# ---------------- بازگشت به لیست خودروها ----------------

@customer_router.callback_query(CustomerOrderState.selecting_services, F.data == "back_to_cars")
@customer_router.callback_query(CustomerOrderState.confirming_order, F.data == "back_to_cars")
async def back_to_cars_list(callback: CallbackQuery, state: FSMContext):
    cars = await database.get_active_cars()
    if not cars:
        await callback.message.edit_text("در حال حاضر هیچ خودرویی فعال نیست.")
        await callback.answer()
        return

    await state.update_data(selected_service_ids=[])
    await state.set_state(CustomerOrderState.selecting_car)
    await callback.message.edit_text(
        "🚗 لطفاً مدل خودروی خود را انتخاب کنید:",
        reply_markup=get_cars_inline_keyboard(cars)
    )
    await callback.answer()


# ---------------- انتخاب خودرو و نمایش خدمات آن ----------------

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
            f"🚗 خودرو انتخاب شده: **{car['name']}**\n\n"
            "⚠️ در حال حاضر هیچ خدمت فعال اختصاصی برای این خودرو در سیستم ثبت نشده است.\n"
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
        f"🚗 خودرو انتخابی: **{car['name']}**\n\n"
        "🛠 لطفاً یک یا چند خدمت ضدسرقت مورد نظر خود را با لمس گزینه‌های زیر انتخاب کنید:\n"
        "(با هر بار لمس، وضعیت گزینه بین ☑ و ◻ تغییر می‌کند)\n\n"
        "پس از اتمام انتخاب، دکمه «تأیید و مشاهده خلاصه» را لمس فرمایید:"
    )
    await callback.message.edit_text(
        msg_text,
        reply_markup=get_services_inline_keyboard(services, selected_ids=set())
    )
    await callback.answer()


# ---------------- تغییر وضعیت انتخاب خدمات (چندگانه) ----------------

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


# ---------------- مشاهده پیش‌فاکتور و خلاصه سفارش ----------------

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

    services_formatted = "\n".join([f"  • {name}" for name in selected_names])

    summary_text = (
        "📋 **پیش‌فاکتور و خلاصه مشخصات سفارش شما:**\n"
        "━━━━━━━━━━━━━━━━━━\n"
        f"👤 **نام مشتری:** {customer_name}\n"
        f"📞 **شماره تماس:** `{customer_phone}`\n"
        f"🚗 **خودرو انتخابی:** {car_name}\n\n"
        f"🛠 **خدمات ضدسرقت انتخابی ({len(selected_names)} مورد):**\n"
        f"{services_formatted}\n"
        "━━━━━━━━━━━━━━━━━━\n"
        "لطفاً در صورت صحت اطلاعات بالا، جهت قطعی شدن ثبت سفارش دکمه «تأیید نهایی» را لمس کنید:"
    )

    await callback.message.edit_text(
        summary_text,
        reply_markup=get_summary_confirmation_keyboard()
    )
    await callback.answer()


@customer_router.callback_query(CustomerOrderState.confirming_order, F.data == "back_to_services")
async def back_to_services(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    car_id = data.get("car_id")
    car_name = data.get("car_name")
    selected_ids = set(data.get("selected_service_ids", []))

    services = await database.get_active_services_by_car(car_id)
    await state.set_state(CustomerOrderState.selecting_services)

    msg_text = (
        f"🚗 خودرو: **{car_name}**\n\n"
        "🛠 خدمات مورد نظر را انتخاب یا ویرایش کنید:"
    )
    await callback.message.edit_text(
        msg_text,
        reply_markup=get_services_inline_keyboard(services, selected_ids)
    )
    await callback.answer()


# ---------------- تأیید نهایی، جلوگیری از تکرار و ارسال به ادمین ----------------

@customer_router.callback_query(CustomerOrderState.confirming_order, F.data == "confirm_final_order")
async def finalize_order(callback: CallbackQuery, state: FSMContext, bot: Bot):
    current_state = await state.get_state()
    # جلوگیری قاطع از ثبت تکراری ناشی از تاچ‌های مکرر یا سریع دکمه
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
        await callback.answer("خطا در انتخاب خدمات. لطفاً دوباره تلاش کنید.", show_alert=True)
        await state.clear()
        return

    tracking_code = generate_tracking_code()
    user_id = callback.from_user.id
    user_username = f"@{callback.from_user.username}" if callback.from_user.username else "ندارد"

    # ذخیره سفارش در پایگاه داده SQLite با اسنپ‌شات قطعی
    order_id = await database.save_order(
        tracking_code=tracking_code,
        user_id=user_id,
        customer_name=customer_name,
        customer_phone=customer_phone,
        car_id=car_id,
        car_name=car_name,
        services_list=selected_services
    )

    services_list_text = "\n".join([f"  🔹 {s}" for s in selected_services])

    # زمان ثبت به صورت شمسی و دقیق بر اساس ساعت رسمی کشور
    shamsi_str = get_current_shamsi_datetime()

    # پیام نهایی برای مشتری
    customer_success_text = (
        "🎉 **سفارش شما با موفقیت ثبت شد!**\n"
        "━━━━━━━━━━━━━━━━━━\n"
        f"🔖 **کد پیگیری شما:** `{tracking_code}`\n"
        f"👤 نام: {customer_name}\n"
        f"🚗 خودرو: {car_name}\n"
        f"📅 تاریخ ثبت: **{shamsi_str}**\n\n"
        f"🛠 **خدمات درخواستی:**\n"
        f"{services_list_text}\n"
        "━━━━━━━━━━━━━━━━━━\n"
        "📞 کارشناس فنی ما به زودی با شماره تماس شما هماهنگی‌های لازم جهت زمان‌بندی و نصب را به عمل خواهد آورد.\n\n"
        "با سپاس از حسن انتخاب و اعتماد شما 🛡\n"
        "برای ثبت سفارش جدید می‌توانید از /start استفاده کنید."
    )

    await callback.message.edit_text(customer_success_text)
    await callback.answer("سفارش شما ثبت شد ✅")
    await state.clear()

    # ارسال اعلان اختصاصی به ادمین (ADMIN_ID) همراه با تاریخ شمسی
    admin_notification = (
        "🔔 **سفارش جدید خدمات ضدسرقت خودرو!**\n"
        "━━━━━━━━━━━━━━━━━━\n"
        f"🔖 **کد پیگیری:** `{tracking_code}` (شماره ثبت: #{order_id})\n"
        f"👤 **نام مشتری:** {customer_name}\n"
        f"📞 **شماره تماس:** `{customer_phone}`\n"
        f"🆔 **شناسه کاربری:** `{user_id}` ({user_username})\n"
        f"🚗 **خودرو:** {car_name}\n\n"
        f"🛠 **خدمات انتخاب‌شده ({len(selected_services)} مورد):**\n"
        f"{services_list_text}\n"
        "━━━━━━━━━━━━━━━━━━\n"
        f"📅 تاریخ و زمان ثبت (شمسی): **{shamsi_str}**\n"
        "💡 جهت مشاهده تمام سفارشات دستور /admin را ارسال کنید."
    )


    try:
        await bot.send_message(
            chat_id=ADMIN_ID,
            text=admin_notification
        )
    except Exception as e:
        logger.error(f"خطا در ارسال اعلان به چت خصوصی ادمین ({ADMIN_ID}): {e}")


# ---------------- محافظت در برابر پیام‌های نامربوط و دسترسی‌های غیرمجاز ----------------

@customer_router.message(CustomerOrderState.selecting_car)
async def ignore_text_during_car_selection(message: Message):
    """هدایت کاربر در صورت تایپ تصادفی متن هنگام انتخاب مدل خودرو"""
    await message.answer("👆 لطفاً مدل خودروی خود را با لمس دکمه‌های شیشه‌ای بالا انتخاب فرمایید:")


@customer_router.message(CustomerOrderState.selecting_services)
async def ignore_text_during_service_selection(message: Message):
    """هدایت کاربر در صورت تایپ تصادفی متن هنگام انتخاب چک‌باکس خدمات"""
    await message.answer("👆 لطفاً خدمات مورد نظر را با لمس گزینه‌های شیشه‌ای بالا انتخاب فرمایید:")


@customer_router.message(Command("admin"))
async def cmd_admin_unauthorized(message: Message):
    """پاسخ امن به تلاش کاربران عادی برای دسترسی به پنل مدیریت"""
    user_info = f"ID: {message.from_user.id} (@{message.from_user.username or 'بدون نام‌کاربری'})"
    logger.warning(f"🚨 تلاش غیرمجاز برای ورود به پنل مدیریت (/admin) توسط: {user_info}")
    await message.answer("⛔️ دسترسی غیرمجاز: این بخش منحصراً متعلق به مدیر سامانه است.")


@customer_router.callback_query(F.data.startswith("admin_"))
async def unauthorized_admin_callback(callback: CallbackQuery):
    """جلوگیری قطعی از اجرای دکمه‌های ادمین توسط کاربران غیرمجاز"""
    logger.warning(f"🚨 تلاش غیرمجاز برای ارسال کال‌بک ادمین ({callback.data}) توسط کاربر: {callback.from_user.id}")
    await callback.answer("⛔️ شما مجاز به انجام این عملیات نیستید!", show_alert=True)

