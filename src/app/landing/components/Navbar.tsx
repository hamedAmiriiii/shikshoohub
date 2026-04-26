// Navbar.tsx
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { FaBars, FaTimes } from 'react-icons/fa';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-lg w-full">
      <div className="max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-indigo-600">
              مدیریت صنف عکاسی
            </Link>
          </div>
          
          {/* منوی دسکتاپ */}
          <div className=" py-4 hidden md:flex items-center space-x-8 space-x-reverse">
            <Link href="https://kermanat.liara.run/main/login" className="text-gray-700 hover:text-indigo-600 text-lg">
              
            </Link>
            
            <Link href="#gallery" className=" my-4 text-gray-700 hover:text-indigo-600 text-lg">
              گالری
            </Link>
            
            <Link href="#pricing" className="text-gray-700 hover:text-indigo-600 text-lg">
              تعرفه‌ها
            </Link>
            <Link 
              href="https://kermanat.liara.run/main/login" 
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition duration-300 text-lg"
            >
              ورود کاربران
            </Link>
          </div>
          
          {/* دکمه منوی موبایل */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-indigo-600 focus:outline-none"
            >
              {isOpen ? (
                <FaTimes className="h-6 w-6" />
              ) : (
                <FaBars className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* منوی موبایل */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
           
            <Link 
              href="https://kermanat.liara.run/main/login"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              ورود کاربران
            </Link>
            <Link 
              href="#gallery" 
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              گالری
            </Link>
            <Link 
              href="#pricing" 
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              تعرفه‌ها
            </Link>
            <Link 
              href="#contact" 
              className="block px-3 py-2 text-base font-medium text-indigo-600 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              درخواست دمو
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;