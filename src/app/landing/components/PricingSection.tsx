import Image from 'next/image';
import React from 'react';
import { FaCheck, FaStar } from 'react-icons/fa';

const plans = [
  {
    name: 'پایه',
    link: 'https://zarinp.al/756386',
    price: '16.000.000',
    price2: '  8.000.000',
    period: 'سالانه',
    description: 'مناسب شهر های کوچک',
    features: [
      ' حداکثر 15 آتلیه',
      ' حداکثر 20 فیلمبردار و عکاس',
      'پشتیبانی ندارد',
      ' پشتیبانی کاربران ندارد',
    ],
    popular: false,
  },
  {
    name: 'حرفه‌ای',
    link: 'https://zarinp.al/756264',
    price: '22.000.000',
    price2: '  12.000.000',
    period: 'سالانه',
    description: 'مناسب شهر های متوسط و بزرگ',
    features: [
      ' حداکثر 50 آتلیه',
      ' حداکثر 70 فیلمبردار و عکاس',
      'پشتیبانی دارد',
      'آموزش ادمین دارد',
      ' پشتیبانی کاربران ندارد',
    ],
    popular: true,
  },
  {
    name: 'نامحدود',
        link: 'https://zarinp.al/756387',
    price: '63.000.000',
    price2: '31.500.000  ',
    period: 'سالانه',
   description: 'مناسب استان',
    features: [
      ' ثبت اتلیه نامحدود',
      ' ثبت فیلمبردار و عکاس نامحدود',
      'پشتیبانی دارد',
      'آموزش ادمین دارد',
      'پشتیبانی کاربران دارد',
    ],
    popular: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">تعرفه‌های اشتراک</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            پلن مناسب خود را انتخاب کنید و از خدمات ما بهره‌مند شوید
          </p>
        </div>

        <div className="grid text-right grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`relative text-right rounded-2xl overflow-hidden border-2 ${
                plan.popular 
                  ? 'border-indigo-500 transform scale-105 shadow-xl' 
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                  پرفروش
                </div>
              )}
              
              <div className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                </div>
                
                <div className="text-center mb-2">
                  <span className="text-1xl font- text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 mr-2">: قیمت </span>
                   </div>

                <div className="text-center flex content-center mb-2">
 <Image
                    src={"/pic/50.png"}
                    alt={"image"}
                    width={40}
                    height={40}
                    className="transition  "
                  />
                  <span className="text-3xl font-bold text-gray-900">{plan.price2}</span>
                  <span className="text-gray-600 mr-2"></span>
                   </div>
                <div className="text-center mb-8">
                 
                  <span className="block text-gray-500 text-sm mt-1">{plan.period}</span>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex  items-center">
                      <FaCheck className="text-green-500 ml-2" />
                      <span className="text-gray-700 text-center">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button 
                  className={`w-full py-3 rounded-lg font-semibold transition duration-300 ${
                    plan.popular
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
               <a href={plan.link}>خرید اشتراک</a>  
                </button>
              </div>
            </div>
          ))}
        </div>
        
       
      </div>
    </section>
  );
};

export default PricingSection;
