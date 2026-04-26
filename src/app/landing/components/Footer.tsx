import React from 'react';
import Link from 'next/link';
import { FaInstagram, FaTelegram, FaTwitter, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const links = [
    { title: 'صفحه اصلی', href: '#' },
    { title: 'درباره ما', href: '#about' },
    { title: 'خدمات', href: '#features' },
    { title: 'تعرفه‌ها', href: '#pricing' },
  ];

  const services = [
    'پنل ادمین',
    'پنل آتلیه دار',
    'پنل عکاس',
    'پنل فیلم بردار',
    'پنل مربوط به اماکن',
  ];

  const socialLinks = [
    { icon: <FaInstagram />, href: '#', label: 'اینستاگرام' },
    { icon: <FaTelegram />, href: '#', label: 'تلگرام' },
    { icon: <FaTwitter />, href: '#', label: 'توییتر' },
    { icon: <FaLinkedin />, href: '#', label: 'لینکدین' },
  ];

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-6">درباره وبینو پلاس</h3>
            <p className="text-gray-400 mb-6">
              ما با تیمی حرفه‌ای و تجهیزات پیشرفته، بهترین لحظات شما را به تصویر می‌کشیم و خاطراتتان را ماندگار می‌کنیم.
            </p>
            <div className="flex space-x-4 space-x-reverse">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white text-xl transition duration-300"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-6">لینک‌های سریع</h3>
            <ul className="space-y-3">
              {links.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="text-gray-400 hover:text-white transition duration-300">
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xl font-bold mb-6">خدمات ما</h3>
            <ul className="space-y-3">
              {services.map((service, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full ml-2"></span>
                  <span className="text-gray-400">{service}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-bold mb-6">تماس با ما</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="ml-3">
                  <p className="text-gray-400">آدرس:</p>
                  <p className="text-white">کرمان ، بلوار جمهوری ، پلاک 301</p>
                </div>
              </li>
              <li className="flex items-center">
                <div className="ml-3">
                  <p className="text-gray-400">تلفن:</p>
                  <a href="tel:+989123456789" className="text-white hover:text-indigo-400 transition duration-300">
                    09399166196
                  </a>
                </div>
              </li>
              <li className="flex items-center">
                <div className="ml-3">
                  <p className="text-gray-400">ایمیل:</p>
                  <a href="mailto:info@senfakasi.ir" className="text-white hover:text-indigo-400 transition duration-300">
                    info@webinoplus.ir
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-gray-400">
            © {currentYear} وبینو پلاس ، تمامی حقوق محفوظ است          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
