// لیست رنگ‌های اصلی و مهم با کد رنگ
export interface ColorOption {
  name: string;
  hex: string;
  persianName: string;
}

export const mainColors: ColorOption[] = [
  { name: 'قرمز', persianName: 'قرمز', hex: '#EF4444' },
  { name: 'آبی', persianName: 'آبی', hex: '#3B82F6' },
  { name: 'سبز', persianName: 'سبز', hex: '#10B981' },
  { name: 'زرد', persianName: 'زرد', hex: '#F59E0B' },
  { name: 'نارنجی', persianName: 'نارنجی', hex: '#F97316' },
  { name: 'بنفش', persianName: 'بنفش', hex: '#A855F7' },
  { name: 'صورتی', persianName: 'صورتی', hex: '#EC4899' },
  { name: 'مشکی', persianName: 'مشکی', hex: '#000000' },
  { name: 'سفید', persianName: 'سفید', hex: '#FFFFFF' },
  { name: 'خاکستری', persianName: 'خاکستری', hex: '#6B7280' },
  { name: 'قهوه‌ای', persianName: 'قهوه‌ای', hex: '#92400E' },
  { name: 'آبی روشن', persianName: 'آبی روشن', hex: '#60A5FA' },
  { name: 'سبز روشن', persianName: 'سبز روشن', hex: '#34D399' },
  { name: 'زرد روشن', persianName: 'زرد روشن', hex: '#FCD34D' },
  { name: 'قرمز تیره', persianName: 'قرمز تیره', hex: '#DC2626' },
  { name: 'آبی تیره', persianName: 'آبی تیره', hex: '#1E40AF' },
  { name: 'سبز تیره', persianName: 'سبز تیره', hex: '#059669' },
  { name: 'بژ', persianName: 'بژ', hex: '#F5F5DC' },
  { name: 'کرم', persianName: 'کرم', hex: '#FFFDD0' },
  { name: 'نقره‌ای', persianName: 'نقره‌ای', hex: '#C0C0C0' },
];

// تابع برای پیدا کردن رنگ بر اساس نام
export const findColorByName = (colorName: string): ColorOption | undefined => {
  return mainColors.find(
    color => 
      color.name.toLowerCase() === colorName.toLowerCase() ||
      color.persianName === colorName
  );
};

// تابع برای جستجوی رنگ‌ها
export const searchColors = (query: string): ColorOption[] => {
  if (!query.trim()) return mainColors;
  const lowerQuery = query.toLowerCase();
  return mainColors.filter(
    color =>
      color.name.toLowerCase().includes(lowerQuery) ||
      color.persianName.includes(query)
  );
};

// تابع برای تشخیص اینکه آیا رنگ روشن است (نیاز به متن تیره دارد)
export const isLightColor = (hex: string): boolean => {
  // حذف # از ابتدای hex
  const color = hex.replace('#', '');
  
  // تبدیل به RGB
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  
  // محاسبه روشنایی (brightness) با استفاده از فرمول استاندارد
  // Luminance formula: 0.299*R + 0.587*G + 0.114*B
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // اگر روشنایی بیشتر از 128 باشد، رنگ روشن است
  return brightness > 128;
};

