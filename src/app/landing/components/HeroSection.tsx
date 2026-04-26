// HeroSection.tsx
import React from 'react';

const HeroSection = () => {
  return (
    <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-right">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              سیستم جامع مدیریت صنف عکاسی و فیلمبرداری
            </h1>
            <p className="text-xl mb-8 text-indigo-100">
              مدیریت حرفه‌ای عکاسان، فیلمبرداران، تالارها و مراسمات در یک پلتفرم یکپارچه
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-end space-y-4 sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
              {/* <button className="bg-white text-indigo-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold text-lg transition duration-300">
                دریافت دمو رایگان
              </button>
              <button className="border-2 border-white text-white hover:bg-white hover:bg-opacity-10 px-8 py-3 rounded-lg font-semibold text-lg transition duration-300">
                تماس با ما
              </button> */}
            </div>
          </div>
          <div className="relative h-80 md:h-96">
            <div className="absolute inset-0 bg-white rtl bg-opacity-20 backdrop-blur-sm rounded-2xl overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center rtl p-8">
                <div className="grid grid-cols-2 rtl gap-4 w-full">
                  <div className="bg-white bg-opacity-20 p-4 rounded-lg backdrop-blur-sm">
                    <h3 className="font-bold mb-2">مدیریت عکاسان و فیلمبرداران</h3>
                    <p className="text-sm">ثبت و مدیریت پروفایل حرفه‌ای</p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-4 rounded-lg backdrop-blur-sm">
                    <h3 className="font-bold mb-2">برنامه‌ریزی مراسمات</h3>
                    <p className="text-sm">مدیریت تقویم و رزرو تالارها</p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-4 rounded-lg backdrop-blur-sm">
                    <h3 className="font-bold mb-2">مدیریت درخواست‌ها</h3>
                    <p className="text-sm">ثبت و پیگیری درخواست‌های مرخصی و خدمات</p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-4 rounded-lg backdrop-blur-sm">
                    <h3 className="font-bold mb-2">آرشیو هوشمند</h3>
                    <p className="text-sm">دسترسی سریع به آرشیو مراسمات</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;