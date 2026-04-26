"use client"
import React, { useState } from 'react';
import Image from 'next/image';

// Sample images - replace with your actual images
const galleryImages = [
  { id: 1, src: '/gallery/1.jpg', alt: 'Gallery 1' },
  { id: 2, src: '/gallery/2.jpg', alt: 'Gallery 2' },
  { id: 3, src: '/gallery/3.jpg', alt: 'Gallery 3' },
  { id: 4, src: '/gallery/4.jpg', alt: 'Gallery 4' },
  { id: 5, src: '/gallery/5.jpg', alt: 'Gallery 5' },
  { id: 6, src: '/gallery/6.jpg', alt: 'Gallery 6' },
  { id: 7, src: '/gallery/7.jpg', alt: 'Gallery 7' },
  { id: 8, src: '/gallery/8.jpg', alt: 'Gallery 8' },
  { id: 9, src: '/gallery/9.jpg', alt: 'Gallery 9' },
];

const GallerySection = () => {
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  
  const selectedImage = galleryImages.find(img => img.id === selectedImageId);
  const selectedIndex = selectedImage ? galleryImages.findIndex(img => img.id === selectedImage.id) : -1;
  
  const handlePrevious = () => {
    if (selectedIndex > 0) {
      setSelectedImageId(galleryImages[selectedIndex - 1].id);
    }
  };
  
  const handleNext = () => {
    if (selectedIndex < galleryImages.length - 1) {
      setSelectedImageId(galleryImages[selectedIndex + 1].id);
    }
  };
  
  return (
    <section id="gallery" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">گالری تصاویر</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            نمونه‌ای از کارهای ما را در گالری زیر مشاهده کنید
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryImages.map((image) => (
            <div key={image.id} className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition duration-300">
              <div className="aspect-w-16 aspect-h-9 w-full">
                <div className="relative  w-full h-64" style={{ aspectRatio: '660/1260' }}>
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">تصویر {image.id}</span>
                  </div>
                  Uncomment when you have actual images
                  <Image
                    // height={140}
                    // width={60}
                    src={image.src}
                    alt={image.alt}
                    layout="fill"
                    objectFit="cover"
                    className="transition duration-300 group-hover:scale-110"
                  />
                 
                </div>
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                <button onClick={() => setSelectedImageId(image.id)} className="bg-white text-indigo-600 px-6 py-2 rounded-full font-medium hover:bg-gray-100">
                  مشاهده جزئیات
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <button className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white px-8 py-3 rounded-lg font-semibold text-lg transition duration-300">
            مشاهده گالری کامل
          </button>
        </div>
      </div>
      
      {/* Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Close button */}
            <button
              onClick={() => setSelectedImageId(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            {/* Image container */}
            <div className="relative flex-1 flex items-center justify-center bg-black rounded-lg overflow-hidden">
              <Image
                src={selectedImage.src}
                alt={selectedImage.alt}
                height={530}
                    width={250}
                // fill
                // objectFit="contain"
                className=""
              />
            </div>
            
            {/* Navigation arrows */}
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={handlePrevious}
                disabled={selectedIndex === 0}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white p-3 rounded-full transition"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              
              <span className="text-white text-lg font-medium">
                {selectedIndex + 1} / {galleryImages.length}
              </span>
              
              <button
                onClick={handleNext}
                disabled={selectedIndex === galleryImages.length - 1}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white p-3 rounded-full transition"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default GallerySection;
