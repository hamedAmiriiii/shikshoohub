"use client";

import React, { useState } from "react";
import Image from "next/image";

const galleryImages = [
  { id: 1, src: "/gallery/dashboard.jpg", title: "داشبورد مدیریت" },
  { id: 2, src: "/gallery/products.jpg", title: "مدیریت محصولات" },
  { id: 3, src: "/gallery/sales.jpg", title: "صفحه فروش" },
  { id: 4, src: "/gallery/customers.jpg", title: "مدیریت مشتریان" },
  { id: 5, src: "/gallery/reports.jpg", title: "گزارشات مالی" },
  { id: 6, src: "/gallery/warehouse.jpg", title: "انبارداری" },
];

const GallerySection = () => {
  const [selected, setSelected] = useState<number | null>(null);

  const active = galleryImages.find((img) => img.id === selected);

  return (
    <section
      id="gallery"
      className="py-24 bg-zinc-950 text-white relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#10b98122,_transparent_40%)]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            نمایی از پنل نرم‌افزار
          </h2>
          <p className="text-zinc-400 text-lg">
            محیط ساده، سریع و حرفه‌ای برای مدیریت فروشگاه
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {galleryImages.map((image) => (
            <div
              key={image.id}
              onClick={() => setSelected(image.id)}
              className="group cursor-pointer bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:scale-[1.02] transition"
            >
              <div className="relative h-72">
                <Image
                  src={image.src}
                  alt={image.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="p-5">
                <h3 className="text-lg font-semibold">{image.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {active && (
        <div
          onClick={() => setSelected(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-6"
        >
          <div
            className="relative max-w-6xl w-full bg-zinc-900 rounded-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-[80vh]">
              <Image
                src={active.src}
                alt={active.title}
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default GallerySection;