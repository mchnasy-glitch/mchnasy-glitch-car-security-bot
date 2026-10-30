import React, { useState, useRef, useEffect } from 'react';
import { useBot } from '../context/BotContext';
import { ChatMessage, InlineButton, CustomerStep, AdminStep } from '../types';
import {
  Send,
  Shield,
  Smartphone,
  User,
  Crown,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Phone,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';

export const TelegramSimulator: React.FC = () => {
  const {
    cars,
    services,
    orders,
    currentUserRole,
    setCurrentUserRole,
    phoneShareSimulationMode,
    setPhoneShareSimulationMode,
    addCar,
    updateCarName,
    toggleCarActive,
    addService,
    updateServiceName,
    toggleServiceActive,
    saveOrder
  } = useBot();

  // وضعیت‌های چت و FSM شبیه‌ساز
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [customerStep, setCustomerStep] = useState<CustomerStep>('idle');
  const [adminStep, setAdminStep] = useState<AdminStep>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // داده‌های موقت ماشین حالت FSM مشتری
  const [customerFSM, setCustomerFSM] = useState<{
    name: string;
    phone: string;
    carId?: number;
    carName?: string;
    selectedServiceIds: number[];
  }>({
    name: '',
    phone: '',
    selectedServiceIds: []
  });

  // داده‌های موقت FSM مدیر
  const [adminFSM, setAdminFSM] = useState<{
    targetCarId?: number;
    targetServiceId?: number;
  }>({});

  const chatEndRef = useRef<HTMLDivElement>(null);

  // اسکرول خودکار به آخرین پیام
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSubmitting]);

  // زمان کنونی به وقت تهران / فرمت ساعت
  const getCurrentTime = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  // ارسال پیام از طرف ربات
  const addBotMessage = (
    text: string,
    inlineKeyboard?: InlineButton[][],
    replyKeyboard?: { buttons: string[]; isContact?: boolean }
  ) => {
    const newMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'bot',
      text,
      time: getCurrentTime(),
      inlineKeyboard,
      replyKeyboard
    };
    setMessages(prev => [...prev, newMsg]);
  };

  // ارسال پیام از طرف کاربر
  const addUserMessage = (
    text: string,
    contactCard?: { name: string; phone: string; isOwnAccount: boolean }
  ) => {
    const newMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text,
      time: getCurrentTime(),
      contactCard
    };
    setMessages(prev => [...prev, newMsg]);
  };

  // شروع یا ریست سناریوی کاربر
  const handleStartCommand = () => {
    addUserMessage('/start');
    setCustomerStep('waiting_for_name');
    setCustomerFSM({ name: '', phone: '', selectedServiceIds: [] });

    setTimeout(() => {
      addBotMessage(
        'سلام! به سامانه ثبت سفارش خدمات ضدسرقت خودرو خوش آمدید 🛡🚗\n\nجهت ثبت سفارش و هماهنگی نصب، لطفاً ابتدا نام و نام خانوادگی خود را ارسال کنید:'
      );
    }, 300);
  };

  // ورود به دستور /admin
  const handleAdminCommand = () => {
    addUserMessage('/admin');

    setTimeout(() => {
      if (currentUserRole !== 'admin') {
        addBotMessage(
          '⛔️ دسترسی غیرمجاز!\nشناسه کاربری شما در لیست ADMIN_ID متغیرهای محیطی ربات تعریف نشده است.\n\n(نکته شبیه‌ساز: با تغییر نقش در بالای صفحه به «مدیر کل»، می‌توانید به پنل دسترسی پیدا کنید)'
        );
        return;
      }

      setAdminStep('main');
      addBotMessage(
        '👑 به پنل مدیریت سامانه خدمات ضدسرقت خوش آمدید\n━━━━━━━━━━━━━━━━━━\nاز طریق گزینه‌های زیر می‌توانید خودروها، خدمات و سفارش‌های ثبت‌شده را به راحتی مدیریت کنید:',
        [
          [{ text: '🚗 مدیریت خودروها و خدمات', callbackData: 'admin_cars_list' }],
          [{ text: '📦 مشاهده سفارش‌های ثبت‌شده', callbackData: 'admin_orders_list' }],
          [{ text: '🔄 تازه‌سازی اطلاعات', callbackData: 'admin_refresh' }]
        ]
      );
    }, 300);
  };

  // ریست کامل شبیه‌ساز چت
  const handleResetChat = () => {
    setMessages([]);
    setCustomerStep('idle');
    setAdminStep('idle');
    setCustomerFSM({ name: '', phone: '', selectedServiceIds: [] });
    setAdminFSM({});
    setTimeout(() => {
      addBotMessage(
        '👋 سلام! برای تست سفارش‌گذاری خدمات ضدسرقت دکمه /start را ارسال کنید یا دستور /admin را برای بررسی پنل مدیریت تست فرمایید.',
        [
          [{ text: '🚀 شروع ثبت سفارش (/start)', callbackData: 'cmd_start' }],
          [{ text: '👑 ورود به پنل مدیر (/admin)', callbackData: 'cmd_admin' }]
        ]
      );
    }, 200);
  };

  useEffect(() => {
    handleResetChat();
  }, []);

  // اعتبارسنجی شماره تلفن ایران
  const normalizeAndValidatePhone = (phoneRaw: string): string | null => {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
    const englishDigits = '0123456789';

    let cleaned = phoneRaw;
    for (let i = 0; i < 10; i++) {
      cleaned = cleaned.replaceAll(persianDigits[i], englishDigits[i]);
      cleaned = cleaned.replaceAll(arabicDigits[i], englishDigits[i]);
    }
    cleaned = cleaned.replace(/[\s\-()]/g, '');

    const match = cleaned.match(/^(?:\+98|0098|0)?(9\d{9})$/);
    if (match) {
      return `0${match[1]}`;
    }
    return null;
  };

  // ارسال پیام متنی توسط کاربر
  const handleSendTextMessage = (overrideText?: string) => {
    const text = (overrideText ?? inputText).trim();
    if (!text) return;
    setInputText('');

    if (text === '/start') {
      handleStartCommand();
      return;
    }
    if (text === '/admin') {
      handleAdminCommand();
      return;
    }

    if (text === '❌ انصراف از ثبت سفارش' || text === '❌ انصراف') {
      addUserMessage(text);
      setCustomerStep('idle');
      setAdminStep('idle');
      setCustomerFSM({ name: '', phone: '', selectedServiceIds: [] });
      setTimeout(() => {
        addBotMessage('❌ فرآیند لغو شد.\nبرای شروع مجدد، دستور /start را ارسال کنید.');
      }, 300);
      return;
    }

    addUserMessage(text);

    // مدیریت مرحله FSM نام مشتری
    if (customerStep === 'waiting_for_name') {
      if (text.length < 3 || text.startsWith('/')) {
        setTimeout(() => {
          addBotMessage('⚠️ لطفاً نام و نام خانوادگی معتبر (حداقل ۳ حرف) را وارد کنید:');
        }, 300);
        return;
      }

      setCustomerFSM(prev => ({ ...prev, name: text }));
      setCustomerStep('waiting_for_phone');

      setTimeout(() => {
        addBotMessage(
          `بسیار عالی، جناب **${text}** گرامی.\n\nاکنون لطفاً شماره تماس همراه خود را ارسال کنید.\nمی‌توانید دکمه «📱 ارسال شماره من» در پایین صفحه را لمس کنید یا شماره خود را به صورت دستی (مثلاً 09123456789) تایپ کنید:`,
          undefined,
          {
            buttons: ['📱 ارسال شماره من', '❌ انصراف از ثبت سفارش'],
            isContact: true
          }
        );
      }, 300);
      return;
    }

    // مدیریت مرحله FSM شماره تلفن مشتری (دستی)
    if (customerStep === 'waiting_for_phone') {
      const validPhone = normalizeAndValidatePhone(text);
      if (!validPhone) {
        setTimeout(() => {
          addBotMessage(
            '⚠️ شماره وارد شده نامعتبر است.\nلطفاً شماره تلفن همراه ایران را با ۱۱ رقم و با پیش‌شماره 09 وارد فرمایید (مثال: 09121234567)\nیا از دکمه «📱 ارسال شماره من» استفاده کنید:',
            undefined,
            {
              buttons: ['📱 ارسال شماره من', '❌ انصراف از ثبت سفارش'],
              isContact: true
            }
          );
        }, 300);
        return;
      }

      proceedAfterPhoneValidated(validPhone);
      return;
    }

    // مدیریت مراحل ادمین در ورودی متنی
    if (adminStep === 'adding_car') {
      const res = addCar(text);
      setAdminStep('main');
      setTimeout(() => {
        if (!res.success) {
          addBotMessage(
            `❌ ${res.error}`,
            [[{ text: '🔙 بازگشت به منوی اصلی مدیریت', callbackData: 'admin_main_menu' }]]
          );
        } else {
          addBotMessage(
            `✅ خودرو «${text}» با موفقیت اضافه شد.\nمی‌توانید اکنون خدمات ضدسرقت اختصاصی آن را تعریف نمایید.`,
            [[{ text: '🔙 بازگشت به منوی اصلی مدیریت', callbackData: 'admin_main_menu' }]]
          );
        }
      }, 300);
      return;
    }

    if (adminStep === 'editing_car' && adminFSM.targetCarId) {
      const res = updateCarName(adminFSM.targetCarId, text);
      setAdminStep('main');
      setTimeout(() => {
        if (!res.success) {
          addBotMessage(`❌ ${res.error}`, [[{ text: '🔙 بازگشت به منوی مدیریت', callbackData: 'admin_main_menu' }]]);
        } else {
          addBotMessage(`✅ نام خودرو با موفقیت به «${text}» تغییر یافت.`, [[{ text: '🔙 بازگشت به منوی مدیریت', callbackData: 'admin_main_menu' }]]);
        }
      }, 300);
      return;
    }

    if (adminStep === 'adding_service' && adminFSM.targetCarId) {
      const res = addService(adminFSM.targetCarId, text);
      const targetCar = cars.find(c => c.id === adminFSM.targetCarId);
      setAdminStep('main');
      setTimeout(() => {
        if (!res.success) {
          addBotMessage(`❌ ${res.error}`, [[{ text: '🔙 بازگشت به منوی مدیریت', callbackData: 'admin_main_menu' }]]);
        } else {
          addBotMessage(
            `✅ خدمت «${text}» با موفقیت به خودروی «${targetCar?.name || 'خودرو'}» اضافه شد.`,
            [[{ text: '🔙 بازگشت به منوی مدیریت', callbackData: 'admin_main_menu' }]]
          );
        }
      }, 300);
      return;
    }

    if (adminStep === 'editing_service' && adminFSM.targetServiceId) {
      const res = updateServiceName(adminFSM.targetServiceId, text);
      setAdminStep('main');
      setTimeout(() => {
        if (!res.success) {
          addBotMessage(`❌ ${res.error}`, [[{ text: '🔙 بازگشت به منوی مدیریت', callbackData: 'admin_main_menu' }]]);
        } else {
          addBotMessage(`✅ عنوان خدمت با موفقیت به «${text}» تغییر یافت.`, [[{ text: '🔙 بازگشت به منوی مدیریت', callbackData: 'admin_main_menu' }]]);
        }
      }, 300);
      return;
    }

    // پیام عمومی
    setTimeout(() => {
      addBotMessage(
        'دستور ناشناخته است. برای شروع سفارش /start و برای مدیریت /admin را ارسال فرمایید.',
        [
          [{ text: '🚀 شروع ثبت سفارش (/start)', callbackData: 'cmd_start' }],
          [{ text: '👑 ورود به پنل مدیر (/admin)', callbackData: 'cmd_admin' }]
        ]
      );
    }, 300);
  };

  // شبیه‌سازی لمس دکمه «📱 ارسال شماره من»
  const handleSendContactButton = () => {
    const isOwn = phoneShareSimulationMode === 'own_account';
    const simulatedPhone = isOwn ? '09123456789' : '09998887766';

    addUserMessage('📱 ارسال شماره من', {
      name: customerFSM.name || 'کاربر',
      phone: simulatedPhone,
      isOwnAccount: isOwn
    });

    setTimeout(() => {
      // شرط امنیتی حیاتی: شماره ارسالی با دکمه تماس فقط وقتی پذیرفته شود که متعلق به خود کاربر باشد
      if (!isOwn) {
        addBotMessage(
          '⛔️ خطا: شماره ارسال‌شده متعلق به این حساب کاربری نیست!\nبرای امنیت سامانه، لطفاً فقط شماره متعلق به خودتان را به اشتراک بگذارید یا شماره را به صورت دستی تایپ فرمایید:',
          undefined,
          {
            buttons: ['📱 ارسال شماره من', '❌ انصراف از ثبت سفارش'],
            isContact: true
          }
        );
        return;
      }

      proceedAfterPhoneValidated(simulatedPhone);
    }, 400);
  };

  // ادامه پس از تأیید شماره تماس
  const proceedAfterPhoneValidated = (phone: string) => {
    setCustomerFSM(prev => ({ ...prev, phone }));
    const activeCars = cars.filter(c => c.isActive);

    if (activeCars.length === 0) {
      setTimeout(() => {
        addBotMessage('⚠️ در حال حاضر هیچ خودرویی در سامانه فعال نیست.\nلطفاً دقایقی دیگر مجدداً بررسی فرمایید.');
        setCustomerStep('idle');
      }, 300);
      return;
    }

    setCustomerStep('selecting_car');

    // تولید دکمه‌های دو تایی برای خودروها
    const carButtons: InlineButton[][] = [];
    let row: InlineButton[] = [];
    activeCars.forEach(car => {
      row.push({
        text: `🚗 ${car.name}`,
        callbackData: `select_car:${car.id}`
      });
      if (row.length === 2) {
        carButtons.push(row);
        row = [];
      }
    });
    if (row.length > 0) carButtons.push(row);
    carButtons.push([{ text: '❌ انصراف و لغو', callbackData: 'customer_cancel' }]);

    setTimeout(() => {
      addBotMessage(
        '✅ شماره تماس شما با موفقیت ثبت شد.\n\n🚗 اکنون لطفاً مدل خودروی خود را از فهرست زیر انتخاب فرمایید:',
        carButtons
      );
    }, 300);
  };

  // رندر دکمه‌های چندگانه خدمات (تیک‌خورده ☑ و خالی ◻)
  const buildServicesKeyboard = (carId: number, selectedIds: number[]): InlineButton[][] => {
    const activeServices = services.filter(s => s.carId === carId && s.isActive);
    const buttons: InlineButton[][] = [];

    activeServices.forEach(s => {
      const isSelected = selectedIds.includes(s.id);
      const icon = isSelected ? '☑' : '◻';
      buttons.push([
        {
          text: `${icon} ${s.name}`,
          callbackData: `toggle_srv:${s.id}`
        }
      ]);
    });

    const count = selectedIds.length;
    if (count > 0) {
      buttons.push([
        {
          text: `✅ تأیید و مشاهده خلاصه (${count} مورد انتخابی)`,
          callbackData: 'proceed_to_summary'
        }
      ]);
    } else {
      buttons.push([
        {
          text: '⚠️ حداقل یک خدمت را انتخاب کنید',
          callbackData: 'alert_empty_services'
        }
      ]);
    }

    buttons.push([
      { text: '🔙 تغییر خودرو', callbackData: 'back_to_cars' },
      { text: '❌ انصراف', callbackData: 'customer_cancel' }
    ]);

    return buttons;
  };

  // مدیریت کلیک روی کلیدهای شیشه‌ای (Callback Query)
  const handleCallbackClick = (callbackData: string) => {
    // دستورات شروع
    if (callbackData === 'cmd_start') {
      handleStartCommand();
      return;
    }
    if (callbackData === 'cmd_admin') {
      handleAdminCommand();
      return;
    }

    // انصراف
    if (callbackData === 'customer_cancel') {
      setCustomerStep('idle');
      setCustomerFSM({ name: '', phone: '', selectedServiceIds: [] });
      addBotMessage('❌ فرآیند ثبت سفارش لغو شد.\nبرای شروع مجدد، دستور /start را ارسال کنید.');
      return;
    }

    // بازگشت به لیست خودروها
    if (callbackData === 'back_to_cars') {
      setCustomerStep('selecting_car');
      setCustomerFSM(prev => ({ ...prev, selectedServiceIds: [] }));
      const activeCars = cars.filter(c => c.isActive);
      const carButtons: InlineButton[][] = [];
      let row: InlineButton[] = [];
      activeCars.forEach(car => {
        row.push({ text: `🚗 ${car.name}`, callbackData: `select_car:${car.id}` });
        if (row.length === 2) {
          carButtons.push(row);
          row = [];
        }
      });
      if (row.length > 0) carButtons.push(row);
      carButtons.push([{ text: '❌ انصراف و لغو', callbackData: 'customer_cancel' }]);

      addBotMessage('🚗 لطفاً مدل خودروی خود را انتخاب کنید:', carButtons);
      return;
    }

    // بازگشت به ویرایش خدمات
    if (callbackData === 'back_to_services' && customerFSM.carId) {
      setCustomerStep('selecting_services');
      const kb = buildServicesKeyboard(customerFSM.carId, customerFSM.selectedServiceIds);
      addBotMessage(
        `🚗 خودرو: **${customerFSM.carName}**\n\n🛠 خدمات مورد نظر را انتخاب یا ویرایش کنید:`,
        kb
      );
      return;
    }

    // انتخاب خودرو
    if (callbackData.startsWith('select_car:')) {
      const carId = parseInt(callbackData.split(':')[1]);
      const car = cars.find(c => c.id === carId);
      if (!car || !car.isActive) {
        addBotMessage('این خودرو در حال حاضر فعال نیست.');
        return;
      }

      const activeServices = services.filter(s => s.carId === carId && s.isActive);
      setCustomerFSM(prev => ({
        ...prev,
        carId: car.id,
        carName: car.name,
        selectedServiceIds: []
      }));

      // اگر برای خودرو هیچ خدمتی ثبت نشده بود (مثل رانا، دنا، پژو ۴۰۵ در شروع)
      if (activeServices.length === 0) {
        const activeCars = cars.filter(c => c.isActive);
        const carButtons: InlineButton[][] = [];
        let row: InlineButton[] = [];
        activeCars.forEach(c => {
          row.push({ text: `🚗 ${c.name}`, callbackData: `select_car:${c.id}` });
          if (row.length === 2) {
            carButtons.push(row);
            row = [];
          }
        });
        if (row.length > 0) carButtons.push(row);
        carButtons.push([{ text: '❌ انصراف', callbackData: 'customer_cancel' }]);

        addBotMessage(
          `🚗 خودرو انتخاب شده: **${car.name}**\n\n⚠️ در حال حاضر هیچ خدمت فعال اختصاصی برای این خودرو در سیستم ثبت نشده است.\nمدیریت به زودی خدمات تکمیلی این خودرو را در سامانه قرار خواهد داد.\n\nلطفاً خودروی دیگری را انتخاب فرمایید:`,
          carButtons
        );
        return;
      }

      setCustomerStep('selecting_services');
      const kb = buildServicesKeyboard(carId, []);
      addBotMessage(
        `🚗 خودرو انتخابی: **${car.name}**\n\n🛠 لطفاً یک یا چند خدمت ضدسرقت مورد نظر خود را با لمس گزینه‌های زیر انتخاب کنید:\n(با هر بار لمس، وضعیت گزینه بین ☑ و ◻ تغییر می‌کند)\n\nپس از اتمام انتخاب، دکمه «تأیید و مشاهده خلاصه» را لمس فرمایید:`,
        kb
      );
      return;
    }

    // تاگل کردن یک خدمت
    if (callbackData.startsWith('toggle_srv:')) {
      const srvId = parseInt(callbackData.split(':')[1]);
      if (!customerFSM.carId) return;

      const current = [...customerFSM.selectedServiceIds];
      const next = current.includes(srvId)
        ? current.filter(id => id !== srvId)
        : [...current, srvId];

      setCustomerFSM(prev => ({ ...prev, selectedServiceIds: next }));

      // به‌روزرسانی کیبورد آخرین پیام
      const updatedKb = buildServicesKeyboard(customerFSM.carId, next);
      setMessages(prev => {
        if (prev.length === 0) return prev;
        const last = { ...prev[prev.length - 1], inlineKeyboard: updatedKb };
        return [...prev.slice(0, -1), last];
      });
      return;
    }

    // هشدار عدم انتخاب خدمت
    if (callbackData === 'alert_empty_services') {
      alert('⚠️ لطفاً حداقل یک خدمت را از لیست انتخاب کنید تا بتوانید ادامه دهید.');
      return;
    }

    // رفتن به خلاصه سفارش
    if (callbackData === 'proceed_to_summary') {
      if (!customerFSM.selectedServiceIds || customerFSM.selectedServiceIds.length === 0) {
        alert('⚠️ لطفاً حداقل یک خدمت را انتخاب کنید.');
        return;
      }

      setCustomerStep('confirming_order');
      const selectedNames = services
        .filter(s => customerFSM.selectedServiceIds.includes(s.id))
        .map(s => s.name);

      const servicesBullets = selectedNames.map(n => `  • ${n}`).join('\n');
      const summaryText =
        `📋 **پیش‌فاکتور و خلاصه مشخصات سفارش شما:**\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `👤 **نام مشتری:** ${customerFSM.name}\n` +
        `📞 **شماره تماس:** \`${customerFSM.phone}\`\n` +
        `🚗 **خودرو انتخابی:** ${customerFSM.carName}\n\n` +
        `🛠 **خدمات ضدسرقت انتخابی (${selectedNames.length} مورد):**\n` +
        `${servicesBullets}\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `لطفاً در صورت صحت اطلاعات بالا، جهت قطعی شدن ثبت سفارش دکمه «تأیید نهایی» را لمس کنید:`;

      addBotMessage(summaryText, [
        [{ text: '✅ تأیید نهایی و ثبت قطعی سفارش', callbackData: 'confirm_final_order' }],
        [
          { text: '🔙 ویرایش خدمات', callbackData: 'back_to_services' },
          { text: '❌ لغو کامل', callbackData: 'customer_cancel' }
        ]
      ]);
      return;
    }

    // تأیید نهایی سفارش همراه با قفل Idempotency و دوری از ثبت تکراری
    if (callbackData === 'confirm_final_order') {
      if (isSubmitting || customerStep !== 'confirming_order') {
        alert('این سفارش در حال پردازش است یا قبلاً نهایی شده است.');
        return;
      }

      setIsSubmitting(true);
      setCustomerStep('order_submitted');

      const selectedNames = services
        .filter(s => customerFSM.selectedServiceIds.includes(s.id))
        .map(s => s.name);

      const { trackingCode, orderId } = saveOrder({
        userId: 1049281,
        customerName: customerFSM.name,
        customerPhone: customerFSM.phone,
        carId: customerFSM.carId || 0,
        carName: customerFSM.carName || 'نامشخص',
        servicesSnapshot: selectedNames
      });

      const servicesBullets = selectedNames.map(n => `  🔹 ${n}`).join('\n');
      const customerSuccessText =
        `🎉 **سفارش شما با موفقیت ثبت شد!**\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `🔖 **کد پیگیری شما:** \`${trackingCode}\`\n` +
        `👤 نام: ${customerFSM.name}\n` +
        `🚗 خودرو: ${customerFSM.carName}\n\n` +
        `🛠 **خدمات درخواستی:**\n` +
        `${servicesBullets}\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `📞 کارشناس فنی ما به زودی با شماره تماس شما هماهنگی‌های لازم جهت زمان‌بندی و نصب را به عمل خواهد آورد.\n\n` +
        `با سپاس از حسن انتخاب و اعتماد شما 🛡\n` +
        `برای ثبت سفارش جدید می‌توانید از /start استفاده کنید.`;

      setTimeout(() => {
        setIsSubmitting(false);
        addBotMessage(customerSuccessText);

        // ارسال پیام سیستم به چت ادمین
        const nowStr = new Date().toLocaleString('fa-IR');
        const adminNotification =
          `🔔 **سفارش جدید خدمات ضدسرقت خودرو! (ارسال شده به ADMIN_ID)**\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `🔖 **کد پیگیری:** \`${trackingCode}\` (ثبت: #${orderId})\n` +
          `👤 **نام مشتری:** ${customerFSM.name}\n` +
          `📞 **شماره تماس:** \`${customerFSM.phone}\`\n` +
          `🆔 **شناسه تلگرام:** \`1049281\` (@customer_telegram)\n` +
          `🚗 **خودرو (اسنپ‌شات دائمی):** ${customerFSM.carName}\n\n` +
          `🛠 **خدمات انتخاب‌شده (${selectedNames.length} مورد):**\n` +
          `${servicesBullets}\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `⏰ زمان ثبت: ${nowStr}\n` +
          `💡 جهت مشاهده لیست تمام سفارشات دستور /admin را ارسال کنید.`;

        // پیام سیستمی به شبیه‌ساز
        setMessages(prev => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            sender: 'admin-system',
            text: adminNotification,
            time: getCurrentTime()
          }
        ]);
      }, 500);
      return;
    }

    // ---------------- عملیات‌های پنل ادمین ----------------

    if (callbackData === 'admin_main_menu') {
      setAdminStep('main');
      addBotMessage(
        '👑 پنل مدیریت خدمات ضدسرقت خودرو\n━━━━━━━━━━━━━━━━━━\nلطفاً بخش مورد نظر خود را انتخاب نمایید:',
        [
          [{ text: '🚗 مدیریت خودروها و خدمات', callbackData: 'admin_cars_list' }],
          [{ text: '📦 مشاهده سفارش‌های ثبت‌شده', callbackData: 'admin_orders_list' }],
          [{ text: '🔄 تازه‌سازی اطلاعات', callbackData: 'admin_refresh' }]
        ]
      );
      return;
    }

    if (callbackData === 'admin_refresh') {
      alert('اطلاعات با موفقیت به‌روزرسانی شد 🔄');
      return;
    }

    if (callbackData === 'admin_cars_list') {
      setAdminStep('cars_list');
      const carBtns: InlineButton[][] = cars.map(c => [
        {
          text: `${c.name} (${c.isActive ? '🟢 فعال' : '🔴 غیرفعال'})`,
          callbackData: `admin_view_car:${c.id}`
        }
      ]);
      carBtns.push([{ text: '➕ افزودن خودرو جدید', callbackData: 'admin_add_car' }]);
      carBtns.push([{ text: '🔙 بازگشت به منوی مدیریت', callbackData: 'admin_main_menu' }]);

      addBotMessage(
        '🚗 **مدیریت خودروها**\n\nجهت مشاهده جزئیات، ویرایش نام، تغییر وضعیت یا مدیریت خدمات، خودروی مورد نظر را لمس فرمایید:',
        carBtns
      );
      return;
    }

    if (callbackData.startsWith('admin_view_car:')) {
      const carId = parseInt(callbackData.split(':')[1]);
      const car = cars.find(c => c.id === carId);
      if (!car) return;

      const carSrvs = services.filter(s => s.carId === carId);
      const statusStr = car.isActive
        ? '🟢 فعال (قابل مشاهده برای مشتری)'
        : '🔴 غیرفعال (مخفی از دید مشتری)';

      addBotMessage(
        `🚗 **مشخصات خودرو:** ${car.name}\n━━━━━━━━━━━━━━━━━━\nوضعیت کنونی: ${statusStr}\nتعداد خدمات تعریف شده: ${carSrvs.length} خدمت\n\nعملیات مورد نظر را انتخاب کنید:`,
        [
          [{ text: '🛠 مدیریت خدمات این خودرو', callbackData: `admin_car_services:${car.id}` }],
          [{ text: '✏️ ویرایش نام خودرو', callbackData: `admin_edit_car_name:${car.id}` }],
          [
            {
              text: car.isActive ? '🔴 غیرفعال‌سازی این خودرو' : '🟢 فعال‌سازی این خودرو',
              callbackData: `admin_toggle_car:${car.id}`
            }
          ],
          [{ text: '🔙 بازگشت به لیست خودروها', callbackData: 'admin_cars_list' }]
        ]
      );
      return;
    }

    if (callbackData.startsWith('admin_toggle_car:')) {
      const carId = parseInt(callbackData.split(':')[1]);
      toggleCarActive(carId);
      setTimeout(() => {
        handleCallbackClick(`admin_view_car:${carId}`);
      }, 100);
      return;
    }

    if (callbackData === 'admin_add_car') {
      setAdminStep('adding_car');
      addBotMessage(
        '➕ **افزودن خودرو جدید**\n\nلطفاً نام دقیق خودرو را تایپ کرده و ارسال کنید (مثلاً: تارا یا شاهین):\n\n(برای لغو /admin را ارسال کنید)'
      );
      return;
    }

    if (callbackData.startsWith('admin_edit_car_name:')) {
      const carId = parseInt(callbackData.split(':')[1]);
      const car = cars.find(c => c.id === carId);
      if (!car) return;

      setAdminStep('editing_car');
      setAdminFSM({ targetCarId: carId });
      addBotMessage(
        `✏️ **ویرایش نام خودرو**\n\nنام فعلی: **${car.name}**\n\nلطفاً نام جدید خودرو را به صورت متنی تایپ و ارسال نمایید:`
      );
      return;
    }

    if (callbackData.startsWith('admin_car_services:')) {
      const carId = parseInt(callbackData.split(':')[1]);
      const car = cars.find(c => c.id === carId);
      if (!car) return;

      const carSrvs = services.filter(s => s.carId === carId);
      const srvBtns: InlineButton[][] = carSrvs.map(s => [
        {
          text: `${s.isActive ? '🟢' : '🔴'} ${s.name}`,
          callbackData: `admin_view_service:${s.id}`
        }
      ]);
      srvBtns.push([{ text: '➕ افزودن خدمت جدید به این خودرو', callbackData: `admin_add_service:${car.id}` }]);
      srvBtns.push([{ text: '🔙 بازگشت به مشخصات خودرو', callbackData: `admin_view_car:${car.id}` }]);

      addBotMessage(
        `🛠 **مدیریت خدمات اختصاصی خودرو: ${car.name}**\n━━━━━━━━━━━━━━━━━━\nفهرست خدمات تعریف شده (برای ویرایش یا تغییر وضعیت لمس کنید):`,
        srvBtns
      );
      return;
    }

    if (callbackData.startsWith('admin_add_service:')) {
      const carId = parseInt(callbackData.split(':')[1]);
      const car = cars.find(c => c.id === carId);
      if (!car) return;

      setAdminStep('adding_service');
      setAdminFSM({ targetCarId: carId });
      addBotMessage(
        `➕ **افزودن خدمت به خودرو «${car.name}»**\n\nلطفاً عنوان کامل خدمت ضدسرقت را ارسال فرمایید (مثال: نصب قفل پدال اختصاصی):\n\n(برای لغو /admin را ارسال کنید)`
      );
      return;
    }

    if (callbackData.startsWith('admin_view_service:')) {
      const srvId = parseInt(callbackData.split(':')[1]);
      const service = services.find(s => s.id === srvId);
      if (!service) return;

      const statusStr = service.isActive
        ? '🟢 فعال (قابل انتخاب برای مشتری)'
        : '🔴 غیرفعال (مخفی از دید مشتری)';

      addBotMessage(
        `🛠 **مشخصات خدمت:**\n\nعنوان: **${service.name}**\nوضعیت: ${statusStr}\n\nعملیات مورد نظر را انتخاب کنید:`,
        [
          [{ text: '✏️ ویرایش عنوان خدمت', callbackData: `admin_edit_service_name:${service.id}` }],
          [
            {
              text: service.isActive ? '🔴 غیرفعال‌سازی خدمت' : '🟢 فعال‌سازی خدمت',
              callbackData: `admin_toggle_service:${service.id}`
            }
          ],
          [{ text: '🔙 بازگشت به خدمات خودرو', callbackData: `admin_car_services:${service.carId}` }]
        ]
      );
      return;
    }

    if (callbackData.startsWith('admin_toggle_service:')) {
      const srvId = parseInt(callbackData.split(':')[1]);
      toggleServiceActive(srvId);
      setTimeout(() => {
        handleCallbackClick(`admin_view_service:${srvId}`);
      }, 100);
      return;
    }

    if (callbackData.startsWith('admin_edit_service_name:')) {
      const srvId = parseInt(callbackData.split(':')[1]);
      const service = services.find(s => s.id === srvId);
      if (!service) return;

      setAdminStep('editing_service');
      setAdminFSM({ targetServiceId: srvId });
      addBotMessage(
        `✏️ **ویرایش عنوان خدمت**\n\nعنوان فعلی: **${service.name}**\n\nلطفاً عنوان جدید را ارسال کنید:`
      );
      return;
    }

    if (callbackData === 'admin_orders_list') {
      if (orders.length === 0) {
        addBotMessage(
          '📦 **سفارش‌های ثبت‌شده:**\n\nهنوز هیچ سفارشی در سامانه ثبت نشده است.\nاز بخش مشتری با /start سفارشی ثبت کنید تا در اینجا نمایش داده شود.',
          [[{ text: '🔙 بازگشت به منوی مدیریت', callbackData: 'admin_main_menu' }]]
        );
        return;
      }

      const textParts = ['📦 **آخرین سفارش‌های ثبت‌شده مشتریان:**\n━━━━━━━━━━━━━━━━━━'];
      orders.forEach((o, i) => {
        const srvText = o.servicesSnapshot.map(s => `    • ${s}`).join('\n');
        textParts.push(
          `**${i + 1}. سفارش #${o.id}** | کد پیگیری: \`${o.trackingCode}\`\n` +
            `👤 مشتری: ${o.customerName}\n` +
            `📞 تلفن: \`${o.customerPhone}\`\n` +
            `🚗 خودرو (ثبت تاریخی): ${o.carName}\n` +
            `🛠 خدمات ثبت شده:\n${srvText}\n` +
            `📅 تاریخ ثبت: ${o.createdAt}\n` +
            `──────────────────`
        );
      });

      addBotMessage(textParts.join('\n'), [
        [{ text: '🔙 بازگشت به منوی مدیریت', callbackData: 'admin_main_menu' }]
      ]);
      return;
    }
  };

  // آخرین پیام ربات با replyKeyboard
  const activeReplyKeyboard =
    messages.length > 0 && messages[messages.length - 1].sender === 'bot'
      ? messages[messages.length - 1].replyKeyboard
      : undefined;

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start max-w-7xl mx-auto">
      {/* ستون کنترلی شبیه‌ساز (Simulator Control Deck) */}
      <div className="w-full lg:w-80 shrink-0 space-y-4">
        {/* کارت تنظیمات هویت کاربر */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3 text-cyan-400 font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>تنظیمات نقش در شبیه‌ساز</span>
          </div>

          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            جهت تست جریان مشتری یا پنل ادمین، نقش شبیه‌سازی را انتخاب کنید:
          </p>

          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setCurrentUserRole('customer')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                currentUserRole === 'customer'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>مشتری عادی</span>
            </button>
            <button
              onClick={() => setCurrentUserRole('admin')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                currentUserRole === 'admin'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>مدیر کل (ADMIN_ID)</span>
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                تست امنیتی دکمه ارسال شماره:
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="flex items-center gap-2 text-slate-300 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-cyan-500/50">
                <input
                  type="radio"
                  name="phoneMode"
                  checked={phoneShareSimulationMode === 'own_account'}
                  onChange={() => setPhoneShareSimulationMode('own_account')}
                  className="accent-cyan-500"
                />
                <span className="text-[11px]">شماره متعلق به خود کاربر (پذیرش مجاز)</span>
              </label>

              <label className="flex items-center gap-2 text-slate-300 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-rose-500/50">
                <input
                  type="radio"
                  name="phoneMode"
                  checked={phoneShareSimulationMode === 'alien_account'}
                  onChange={() => setPhoneShareSimulationMode('alien_account')}
                  className="accent-rose-500"
                />
                <span className="text-[11px] text-rose-300">شماره حساب دیگر (تست Reject امنیتی)</span>
              </label>
            </div>
          </div>
        </div>

        {/* دکمه‌های سریع برای آزمایش */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            عملیات سریع شبیه‌ساز:
          </h3>
          <div className="space-y-2">
            <button
              onClick={handleStartCommand}
              className="w-full text-right py-2 px-3 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-xs text-slate-200 border border-slate-700/60 transition-all flex items-center justify-between"
            >
              <span>🚀 اجرای دستور <code className="text-cyan-400">/start</code></span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>
            <button
              onClick={handleAdminCommand}
              className="w-full text-right py-2 px-3 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-xs text-slate-200 border border-slate-700/60 transition-all flex items-center justify-between"
            >
              <span>👑 اجرای دستور <code className="text-amber-400">/admin</code></span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>
            <button
              onClick={handleResetChat}
              className="w-full text-right py-2 px-3 rounded-xl bg-rose-950/30 hover:bg-rose-950/50 text-xs text-rose-300 border border-rose-900/40 transition-all flex items-center justify-between"
            >
              <span>🔄 پاکسازی صفحه چت</span>
              <RotateCcw className="w-3 h-3 text-rose-400" />
            </button>
          </div>
        </div>

        {/* وضعیت دیتابیس در یک نگاه */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl text-xs space-y-2">
          <div className="text-slate-400 font-semibold mb-2">آمار زنده SQLite:</div>
          <div className="flex justify-between text-slate-300">
            <span>تعداد خودروها:</span>
            <span className="font-mono text-cyan-400">{cars.length}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>تعداد کل خدمات:</span>
            <span className="font-mono text-cyan-400">{services.length}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>سفارش‌های ثبت شده:</span>
            <span className="font-mono text-emerald-400">{orders.length}</span>
          </div>
        </div>
      </div>

      {/* شبیه‌ساز گوشی تلفن همراه (Mobile Frame) */}
      <div className="flex-1 w-full flex justify-center">
        <div className="w-full max-w-md bg-slate-950 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 relative ring-1 ring-slate-700/40">
          {/* ناچ بالای گوشی */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 w-36 h-4 bg-slate-900 rounded-full z-20 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-slate-950 mr-3 border border-slate-800" />
            <div className="w-12 h-1 bg-slate-800 rounded-full" />
          </div>

          {/* محفظه نمایشگر گوشی */}
          <div className="bg-[#0f172a] rounded-[36px] overflow-hidden flex flex-col h-[700px] border border-slate-800 relative text-slate-100">
            {/* نوار وضعیت بالای تلگرام (Status Bar) */}
            <div className="pt-3 pb-1 px-6 flex justify-between items-center text-[11px] text-slate-400 bg-[#0f172a] z-10 select-none">
              <span className="font-semibold tracking-tight">09:41</span>
              <div className="flex items-center gap-1.5 text-xs">
                <span>5G</span>
                <span>100%</span>
              </div>
            </div>

            {/* هدر پیام‌رسان بله (Bale Messenger App Header) */}
            <div className="bg-slate-900/95 backdrop-blur px-4 py-3 flex items-center justify-between border-b border-slate-800/80 shadow-sm z-10">
              <div className="flex items-center gap-3">
                {/* آیکون بازوی بله */}
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
                  <Shield className="w-5 h-5 text-white" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-100">خدمات ضدسرقت خودرو</span>
                    <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-1.5 py-0.5 rounded-full font-mono border border-emerald-700/60">
                      بازوی بله
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <span>سرور رسمی tapi.bale.ai • بدون فیلترشکن</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-1 rounded-lg">
                  {currentUserRole === 'admin' ? '👑 ادمین بله' : '👤 کاربر بله'}
                </span>
              </div>
            </div>

            {/* محیط پیام‌ها (Bale Messages Container) */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-3.5 relative bg-[#09151c]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 80%)'
              }}
            >
              {/* پیام سیستمی خوش‌آمد */}
              <div className="text-center my-2">
                <span className="inline-block bg-slate-800/80 text-emerald-300 text-[10px] px-3 py-1 rounded-full shadow-sm border border-emerald-800/40">
                  اتصال زنده پروتکل بازوهای بله • aiogram 3 • SQLite
                </span>
              </div>

              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user'
                      ? 'items-start'
                      : msg.sender === 'admin-system'
                      ? 'items-center'
                      : 'items-end'
                  }`}
                >
                  {/* پیام اطلاع‌رسانی به ادمین */}
                  {msg.sender === 'admin-system' ? (
                    <div className="w-full bg-amber-950/40 border border-amber-500/40 rounded-2xl p-3 my-2 text-xs text-amber-200">
                      <div className="flex items-center gap-2 font-bold mb-1.5 text-amber-300">
                        <Crown className="w-4 h-4 text-amber-400" />
                        <span>اعلان مستقیم به چت خصوصی مدیر (ADMIN_ID)</span>
                      </div>
                      <div className="whitespace-pre-wrap leading-relaxed text-[11px] font-mono">
                        {msg.text}
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 shadow-md relative group ${
                        msg.sender === 'user'
                          ? 'bg-cyan-700 text-white rounded-br-none'
                          : 'bg-slate-800/95 text-slate-100 rounded-bl-none border border-slate-700/60'
                      }`}
                    >
                      {/* اگر کارت تماس بود */}
                      {msg.contactCard && (
                        <div className="mb-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                            <Phone className="w-4 h-4" />
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-white">{msg.contactCard.name}</div>
                            <div className="text-[11px] font-mono text-cyan-300 dir-ltr">{msg.contactCard.phone}</div>
                          </div>
                        </div>
                      )}

                      {/* متن پیام */}
                      <div className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                        {msg.text}
                      </div>

                      {/* زمان پیام */}
                      <div className="text-[9px] text-slate-400 text-left mt-1 select-none flex items-center justify-end gap-1">
                        <span>{msg.time}</span>
                        {msg.sender === 'user' && <CheckCircle2 className="w-2.5 h-2.5 text-cyan-300" />}
                      </div>

                      {/* دکمه‌های اینلاین شیشه‌ای متصل به پیام */}
                      {msg.inlineKeyboard && msg.inlineKeyboard.length > 0 && (
                        <div className="mt-3 space-y-1.5 pt-2 border-t border-slate-700/60">
                          {msg.inlineKeyboard.map((row, rIdx) => (
                            <div key={rIdx} className="flex gap-1.5">
                              {row.map((btn, bIdx) => (
                                <button
                                  key={bIdx}
                                  onClick={() => handleCallbackClick(btn.callbackData)}
                                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-medium text-center transition-all active:scale-[0.98] ${
                                    btn.text.includes('☑')
                                      ? 'bg-cyan-600/90 hover:bg-cyan-500 text-white shadow-sm border border-cyan-400/40'
                                      : btn.text.includes('تأیید نهایی')
                                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md'
                                      : btn.text.includes('❌') || btn.text.includes('🔴')
                                      ? 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-200 border border-rose-800/40'
                                      : 'bg-slate-700/80 hover:bg-slate-700 text-slate-100 border border-slate-600/40'
                                  }`}
                                >
                                  {btn.text}
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {isSubmitting && (
                <div className="flex justify-end">
                  <div className="bg-slate-800/95 text-slate-300 text-xs px-3 py-2 rounded-2xl flex items-center gap-2 border border-slate-700 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>در حال ثبت قطعی سفارش و جلوگیری از تاچ مکرر...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* بخش کیبورد پاسخ متنی (Reply Keyboard) در صورت وجود */}
            {activeReplyKeyboard && (
              <div className="p-2.5 bg-slate-900 border-t border-slate-800/80 space-y-1.5 z-10">
                <div className="text-[10px] text-slate-400 text-center mb-1">
                  کیبورد انتخابی بات تلگرام:
                </div>
                {activeReplyKeyboard.isContact && (
                  <button
                    onClick={handleSendContactButton}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>📱 ارسال شماره من (اشتراک مخاطب تلگرام)</span>
                  </button>
                )}
                {activeReplyKeyboard.buttons
                  .filter(b => b !== '📱 ارسال شماره من')
                  .map((b, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendTextMessage(b)}
                      className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-all active:scale-[0.98]"
                    >
                      {b}
                    </button>
                  ))}
              </div>
            )}

            {/* اینپوت بار پایین تلگرام (Telegram Input Bar) */}
            <div className="p-3 bg-slate-900 border-t border-slate-800/80 flex items-center gap-2 z-10">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSendTextMessage();
                }}
                placeholder={
                  customerStep === 'waiting_for_name'
                    ? 'نام و نام خانوادگی خود را بنویسید...'
                    : customerStep === 'waiting_for_phone'
                    ? 'شماره موبایل را تایپ کنید (مثلاً 09121234567)...'
                    : 'پیام خود را بنویسید (یا /start و /admin)...'
                }
                className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handleSendTextMessage()}
                disabled={!inputText.trim()}
                className="w-9 h-9 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white flex items-center justify-center transition-all shrink-0"
              >
                <Send className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
