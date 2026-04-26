// FeaturesSection.tsx
import React from 'react';
import { FaCalendarAlt, FaUserTie, FaBuilding, FaChartLine, FaUsers, FaArchive } from 'react-icons/fa';

const features = [
  {
    icon: <FaCalendarAlt className="w-8 h-8 text-indigo-600" />,
    title: 'مدیریت مراسمات',
    description: 'برنامه‌ریزی و مدیریت کامل تقویم مراسمات و رزرو تالارها'
  },
  {
    icon: <FaUserTie className="w-8 h-8 text-indigo-600" />,
    title: 'مدیریت پرسنل',
    description: 'ثبت و مدیریت اطلاعات عکاسان، فیلمبرداران و کارمندان'
  },
  {
    icon: <FaBuilding className="w-8 h-8 text-indigo-600" />,
    title: 'واحدهای صنفی',
    description: 'مدیریت اطلاعات تالارها، باغ‌ها و مراکز برگزاری مراسم'
  },
  {
    icon: <FaChartLine className="w-8 h-8 text-indigo-600" />,
    title: 'گزارش‌گیری حرفه‌ای',
    description: 'تهیه گزارشات تحلیلی از عملکرد واحدها و پرسنل'
  },
  {
    icon: <FaUsers className="w-8 h-8 text-indigo-600" />,
    title: 'مدیریت درخواست‌ها',
    description: 'ثبت و پیگیری درخواست‌های مرخصی و خدمات پرسنل'
  },
  {
    icon: <FaArchive className="w-8 h-8 text-indigo-600" />,
    title: 'آرشیو هوشمند',
    description: 'دسترسی سریع به آرشیو مراسمات و پروژه‌های انجام شده'
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            مدیریت یکپارچه صنف عکاسی
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            تمامی نیازهای مدیریتی صنف عکاسی و فیلمبرداری در یک پلتفرم
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-gray-50 p-8 rounded-xl hover:shadow-lg transition duration-300 border border-gray-100">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-6 mx-auto">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-center mb-3 text-gray-800">{feature.title}</h3>
              <p className="text-gray-600 text-center">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;