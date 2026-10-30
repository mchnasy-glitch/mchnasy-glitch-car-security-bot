"""
وضعیت‌های ماشین حالت (FSM) برای مدیریت جریان مشتری و مدیر در aiogram 3
"""
from aiogram.fsm.state import State, StatesGroup


class CustomerOrderState(StatesGroup):
    waiting_for_name = State()       # دریافت نام و نام خانوادگی
    waiting_for_phone = State()      # دریافت شماره تماس (دکمه یا دستی)
    selecting_car = State()          # انتخاب مدل خودرو
    selecting_services = State()     # انتخاب چندگانه خدمات
    confirming_order = State()       # مشاهده خلاصه و تأیید نهایی
    submitting_order = State()       # حالت قفل برای جلوگیری از ثبت تکراری


class AdminState(StatesGroup):
    managing_cars = State()          # مدیریت خودروها
    adding_car_name = State()        # ورود نام خودرو جدید
    editing_car_name = State()       # ورود نام جدید برای ویرایش خودرو
    managing_services = State()      # مدیریت خدمات یک خودرو
    adding_service_name = State()    # ورود نام خدمت جدید
    editing_service_name = State()   # ورود نام جدید برای ویرایش خدمت
