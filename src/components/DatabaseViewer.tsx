import React, { useState } from 'react';
import { useBot } from '../context/BotContext';
import { Database, RotateCcw, ShieldCheck, Car as CarIcon, Wrench, ShoppingBag } from 'lucide-react';

export const DatabaseViewer: React.FC = () => {
  const { cars, services, orders, resetDatabase, toggleCarActive, toggleServiceActive } = useBot();
  const [activeTab, setActiveTab] = useState<'orders' | 'cars' | 'services'>('orders');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* هدر بخش دیتابیس */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <span>ناظر زنده پایگاه داده SQLite (محیط شبیه‌ساز)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            مشاهده سطرها و ستون‌های جداول `cars`, `services`, `orders` در زمان واقعی همگام با تعاملات ربات.
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('آیا از بازنشانی دیتابیس به مقادیر اولیه اطمینان دارید؟')) {
              resetDatabase();
            }
          }}
          className="flex items-center gap-2 py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-xl text-xs font-medium border border-rose-900/40 transition-all active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
          <span>بازنشانی دیتابیس به داده‌های اولیه</span>
        </button>
      </div>

      {/* کارت توضیح اسنپ‌شات دائمی */}
      <div className="bg-cyan-950/30 border border-cyan-800/40 rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-cyan-200/90 leading-relaxed">
          <strong className="text-cyan-300 font-bold">معماری حفظ سوابق سفارشات (Snapshots):</strong>
          {' '}در جدول سفارش‌ها، ستون‌های <code className="bg-cyan-900/40 px-1.5 py-0.5 rounded text-cyan-200">car_name</code> و <code className="bg-cyan-900/40 px-1.5 py-0.5 rounded text-cyan-200">services_snapshot</code> به صورت اسنپ‌شات متنی/JSON مستقل ذخیره می‌شوند. بنابراین حتی اگر بعداً نام خودرو تغییر کند یا خودرو و خدمتی غیرفعال شود، مشخصات سفارش‌های قبلی هرگز تغییر نخواهد کرد.
        </div>
      </div>

      {/* انتخاب تب جدول */}
      <div className="flex border-b border-slate-800 gap-2 pb-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'orders'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/50'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>جدول سفارشات (orders) — {orders.length} سطر</span>
        </button>

        <button
          onClick={() => setActiveTab('cars')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'cars'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/50'
          }`}
        >
          <CarIcon className="w-4 h-4" />
          <span>جدول خودروها (cars) — {cars.length} سطر</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'services'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/50'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>جدول خدمات (services) — {services.length} سطر</span>
        </button>
      </div>

      {/* نمایش جدول سفارشات */}
      {activeTab === 'orders' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">شناسه (id)</th>
                  <th className="py-3 px-4 font-semibold">کد پیگیری (tracking_code)</th>
                  <th className="py-3 px-4 font-semibold">نام مشتری (customer_name)</th>
                  <th className="py-3 px-4 font-semibold">شماره تماس (customer_phone)</th>
                  <th className="py-3 px-4 font-semibold">خودرو اسنپ‌شات (car_name)</th>
                  <th className="py-3 px-4 font-semibold">خدمات درخواستی (services_snapshot)</th>
                  <th className="py-3 px-4 font-semibold">وضعیت</th>
                  <th className="py-3 px-4 font-semibold">تاریخ و زمان ثبت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      هنوز هیچ سفارشی ثبت نشده است. از طریق شبیه‌ساز تلگرام با دستور /start یک سفارش ثبت نمایید.
                    </td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-400">#{order.id}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                        {order.trackingCode}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {order.customerName}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300 dir-ltr text-right">
                        {order.customerPhone}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-300 font-medium">
                        {order.carName}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          {order.servicesSnapshot.map((srv, idx) => (
                            <span
                              key={idx}
                              className="inline-block bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[11px]"
                            >
                              • {srv}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/50 text-[10px]">
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {order.createdAt}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* نمایش جدول خودروها */}
      {activeTab === 'cars' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">شناسه (id)</th>
                  <th className="py-3 px-4 font-semibold">نام خودرو (name)</th>
                  <th className="py-3 px-4 font-semibold">تعداد خدمات اختصاصی</th>
                  <th className="py-3 px-4 font-semibold">وضعیت (is_active)</th>
                  <th className="py-3 px-4 font-semibold">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {cars.map(car => {
                  const srvCount = services.filter(s => s.carId === car.id).length;
                  return (
                    <tr key={car.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-400">{car.id}</td>
                      <td className="py-3.5 px-4 font-bold text-white text-sm">{car.name}</td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {srvCount > 0 ? (
                          <span className="text-cyan-400 font-semibold">{srvCount} خدمت</span>
                        ) : (
                          <span className="text-amber-400/80">بدون خدمت (مدیر بعداً اضافه می‌کند)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-medium border ${
                            car.isActive
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                              : 'bg-rose-950/80 text-rose-400 border-rose-800/60'
                          }`}
                        >
                          {car.isActive ? '🟢 فعال (قابل مشاهده مشتری)' : '🔴 غیرفعال (مخفی)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => toggleCarActive(car.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-all"
                        >
                          {car.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* نمایش جدول خدمات */}
      {activeTab === 'services' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">شناسه (id)</th>
                  <th className="py-3 px-4 font-semibold">خودروی مربوطه (car_id)</th>
                  <th className="py-3 px-4 font-semibold">عنوان خدمت (name)</th>
                  <th className="py-3 px-4 font-semibold">وضعیت (is_active)</th>
                  <th className="py-3 px-4 font-semibold">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {services.map(srv => {
                  const car = cars.find(c => c.id === srv.carId);
                  return (
                    <tr key={srv.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-400">{srv.id}</td>
                      <td className="py-3.5 px-4 font-semibold text-cyan-300">
                        {car ? car.name : `شناسه خودرو: ${srv.carId}`}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white">{srv.name}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-medium border ${
                            srv.isActive
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                              : 'bg-rose-950/80 text-rose-400 border-rose-800/60'
                          }`}
                        >
                          {srv.isActive ? '🟢 فعال' : '🔴 غیرفعال'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => toggleServiceActive(srv.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-all"
                        >
                          {srv.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
