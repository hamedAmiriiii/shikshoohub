"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import JsBarcode from "jsbarcode";

const formatNumber = (num: number | string) => {
  const numValue = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
  if (isNaN(numValue)) return '';
  return new Intl.NumberFormat('fa-IR').format(numValue);
};

const formatNumberEnglish = (num: number | string) => {
  const numValue = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
  if (isNaN(numValue)) return '';
  return new Intl.NumberFormat('en-US').format(numValue);
};

function PrintLabelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = typeof window !== 'undefined' ? localStorage.getItem('productListPage') : null;
  const [quantity, setQuantity] = useState(1);
  
  const [productData, setProductData] = useState({
    name: "محصول نمونه",
    barcode: "123456789012",
    sale_price: "250,000"
  });
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // تنظیمات کاستوم پرینت
  const [printSettings, setPrintSettings] = useState({
    columns: 2, // تعداد ستون‌ها: 2, 3, 4
    pageWidth: 86, // عرض صفحه به mm
    pageHeight: 30, // ارتفاع صفحه به mm
    marginTop: 0, // فاصله از بالا به mm
    marginBottom: 0, // فاصله از پایین به mm
    marginLeft: 0, // فاصله از چپ به mm
    marginRight: 0, // فاصله از راست به mm
    fontSize: 16, // اندازه فونت قیمت
    productNameFontSize: 9, // اندازه فونت نام محصول
    barcodeHeight: 32, // ارتفاع بارکد
    barcodeWidthMm: 40 // عرض کل بارکد به میلی‌متر
  });

  // تنظیمات پیش‌فرض
  const defaultSettings = {
    columns: 2,
    pageWidth: 86,
    pageHeight: 30,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    fontSize: 16,
    productNameFontSize: 9,
    barcodeHeight: 32,
    barcodeWidthMm: 40
  };

  const saveSettings = useCallback((newSettings: typeof printSettings) => {
    setPrintSettings(newSettings);
    if (typeof window !== 'undefined') {
      localStorage.setItem('printSettings', JSON.stringify(newSettings));
    }
  }, []);

  // بارگذاری تنظیمات از localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('printSettings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          // Merge با تنظیمات پیش‌فرض برای سازگاری با نسخه‌های قدیمی
          const mergedSettings = { ...defaultSettings, ...parsed };
          setPrintSettings(mergedSettings);
        } catch (error) {
          console.error('خطا در بارگذاری تنظیمات پرینت:', error);
        }
      }
    }
  }, []);

  // ریست تنظیمات به حالت پیش‌فرض
  const resetSettings = useCallback(() => {
    setPrintSettings(defaultSettings);
    if (typeof window !== 'undefined') {
      localStorage.setItem('printSettings', JSON.stringify(defaultSettings));
    }
  }, []);

  // دریافت داده از searchParams یا API
  useEffect(() => {
    const id = searchParams.get("id");
    const name = searchParams.get("name");
    const barcode = searchParams.get("barcode");
    const price = searchParams.get("price");
    const quantityParam = searchParams.get("quantity");

    if (name && barcode && price) {
      setProductData({
        name: decodeURIComponent(name),
        barcode: decodeURIComponent(barcode),
        sale_price: decodeURIComponent(price)
      });
      // Set quantity from params if available
      if (quantityParam) {
        const qty = parseInt(quantityParam) || 1;
        setQuantity(qty);
      }
      setLoading(false);
    } else if (id) {
      fetchProduct(id);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const fetchProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/product/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProductData({
          name: data.name || "نام محصول",
          barcode: data.barcode || "000000000000",
          sale_price: data.sale_price || "0"
        });
      }
    } catch (error) {
      console.error("خطا در دریافت محصول:", error);
    } finally {
      setLoading(false);
    }
  };

  // تولید بارکد برای هر SVG
  const barcodeRef = useCallback((node: SVGSVGElement | null) => {
    if (node && productData.barcode) {
      try {
        JsBarcode(node, productData.barcode, {
          format: "CODE128",
          lineColor: "#000",
          width: 2,
          height: printSettings.barcodeHeight,
          displayValue: true,
          fontSize: 11,
          margin: 0
        });
      } catch (error) {
        console.error("خطا در ساخت بارکد:", error);
      }
    }
  }, [productData.barcode, printSettings.barcodeHeight, printSettings.barcodeWidthMm]);

  // محاسبه تعداد ردیف‌ها بر اساس تعداد ستون‌ها
  const rows = Math.ceil(quantity / printSettings.columns);
  const labels = Array.from({ length: quantity }, (_, i) => i);
  const barcodeContainerWidth = Math.min(printSettings.barcodeWidthMm, printSettings.pageWidth / printSettings.columns - 2);

  if (loading) {
    return (
      <div className="loading">
        در حال بارگذاری...
        <style jsx>{`
          .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-family: Tahoma, Arial, sans-serif;
            font-size: 18px;
            color: #333;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="container">
      {/* تنظیمات کاستوم پرینت */}
      {showSettings && (
        <div className="settings-panel">
          <h3>تنظیمات پرینت</h3>
          <div className="settings-grid">
            <div className="setting-group">
              <label>تعداد ستون‌ها:</label>
              <select 
                value={printSettings.columns} 
                onChange={(e) => saveSettings({...printSettings, columns: parseInt(e.target.value)})}
              >
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </div>
          
          <div className="setting-group">
            <label>عرض صفحه (mm):</label>
            <input 
              type="number" 
              min="50" 
              max="200"
              value={printSettings.pageWidth} 
              onChange={(e) => saveSettings({...printSettings, pageWidth: parseInt(e.target.value) || 86})}
            />
          </div>
          
          <div className="setting-group">
            <label>ارتفاع صفحه (mm):</label>
            <input 
              type="number" 
              min="20" 
              max="100"
              value={printSettings.pageHeight} 
              onChange={(e) => saveSettings({...printSettings, pageHeight: parseInt(e.target.value) || 30})}
            />
          </div>
          
          <div className="setting-group">
            <label>فاصله بالا (mm):</label>
            <input 
              type="number" 
              min="0" 
              max="20"
              value={printSettings.marginTop} 
              onChange={(e) => saveSettings({...printSettings, marginTop: parseInt(e.target.value) || 0})}
            />
          </div>
          
          <div className="setting-group">
            <label>فاصله پایین (mm):</label>
            <input 
              type="number" 
              min="0" 
              max="20"
              value={printSettings.marginBottom} 
              onChange={(e) => saveSettings({...printSettings, marginBottom: parseInt(e.target.value) || 0})}
            />
          </div>
          
          <div className="setting-group">
            <label>فاصله چپ (mm):</label>
            <input 
              type="number" 
              min="0" 
              max="20"
              value={printSettings.marginLeft} 
              onChange={(e) => saveSettings({...printSettings, marginLeft: parseInt(e.target.value) || 0})}
            />
          </div>
          
          <div className="setting-group">
            <label>اندازه فونت قیمت:</label>
            <input 
              type="number" 
              min="8" 
              max="24"
              value={printSettings.fontSize} 
              onChange={(e) => saveSettings({...printSettings, fontSize: parseInt(e.target.value) || 16})}
            />
          </div>
          
          <div className="setting-group">
            <label>اندازه فونت نام محصول:</label>
            <input 
              type="number" 
              min="6" 
              max="16"
              value={printSettings.productNameFontSize} 
              onChange={(e) => saveSettings({...printSettings, productNameFontSize: parseInt(e.target.value) || 9})}
            />
          </div>
          
          <div className="setting-group">
            <label>ارتفاع بارکد:</label>
            <input 
              type="number" 
              min="20" 
              max="60"
              value={printSettings.barcodeHeight} 
              onChange={(e) => saveSettings({...printSettings, barcodeHeight: parseInt(e.target.value) || 32})}
            />
          </div>
          <div className="setting-group">
            <label>عرض کل بارکد (mm):</label>
            <input 
              type="number" 
              min="10" 
              max="70"
              value={printSettings.barcodeWidthMm} 
              onChange={(e) => saveSettings({...printSettings, barcodeWidthMm: parseInt(e.target.value) || 40})}
            />
          </div>
        </div>
        <div className="settings-actions">
          <button onClick={resetSettings} className="reset-btn">
            ریست به حالت پیش‌فرض
          </button>
        </div>
      </div>
      )}

      {/* کنترل‌های چاپ */}
      <div className="controls">
        <button onClick={() => {
          // Keep the product ID in localStorage for scroll back
          const pageParam = currentPage ? `?page=${currentPage}` : '';
          router.push(`/shikshoo/admin/product${pageParam}`);
        }} className="back-btn">
          ← برگشت
        </button>
        <button
          type="button"
          onClick={() => setShowSettings((prev) => !prev)}
          className="toggle-settings-btn"
        >
          {showSettings ? 'پنهان کردن تنظیمات' : 'تنظیمات چاپ'}
        </button>
        <div className="quantity-box">
          <label style={{ color: "#000" }}>تعداد لیبل:</label>
          <input 
            type="number" 
            min="1" 
            max="100"
            value={quantity} 
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>
        <button onClick={() => window.print()} className="print-btn">
          🖨️ چاپ {quantity} لیبل
        </button>
      </div>

      {/* پیش‌نمایش محصول */}
      {/* <div className="product-info">
        <strong>{productData.name}</strong>
        <span>بارکد: {productData.barcode}</span>
        <span>قیمت: {formatNumber(productData.sale_price)} تومان</span>
      </div> */}

      {/* لیبل‌ها - بر اساس تعداد ستون‌ها */}
      <div className="labels-container">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="label-row">
            {Array.from({ length: printSettings.columns }).map((_, colIndex) => {
              const labelIndex = rowIndex * printSettings.columns + colIndex;
              if (labelIndex >= quantity) return null;
              
              return (
                <div key={colIndex} className={`label label-col-${colIndex}`}>
                  <svg ref={barcodeRef} className="barcode"></svg>
                  <div className="product-name">{productData.name}</div>
                  <div className="price">  {formatNumberEnglish(productData.sale_price)}  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* استایل‌های دینامیک برای تنظیمات پرینت */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .container {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
            font-family: Tahoma, Arial, sans-serif;
            direction: rtl;
          }

          .settings-panel {
            background: #f9f9f9;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            width: 100%;
            max-width: 800px;
          }

          .settings-panel h3 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 18px;
          }

          .settings-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
          }

          .setting-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }

          .setting-group label {
            font-size: 14px;
            color: #555;
            font-weight: 500;
          }

          .setting-group input, .setting-group select {
            padding: 8px 12px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 14px;
            font-family: Tahoma, Arial, sans-serif;
          }

          .settings-actions {
            margin-top: 15px;
            text-align: center;
          }

          .reset-btn {
            background-color: #ff6b6b;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            font-family: Tahoma, Arial, sans-serif;
          }

          .reset-btn:hover {
            background-color: #ff5252;
          }

          .controls {
            display: flex;
            gap: 15px;
            align-items: center;
            margin-bottom: 20px;
            flex-wrap: wrap;
            justify-content: center;
          }

          .quantity-box {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .quantity-box label {
            font-size: 14px;
            color: #333;
          }

          .quantity-box input {
            width: 60px;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 6px;
            font-size: 16px;
            text-align: center;
          }

          .print-btn {
            background-color: #78b568;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            font-family: Tahoma, Arial, sans-serif;
          }

          .print-btn:hover {
            background-color: #5a9a4a;
          }

          .back-btn {
            background-color: #ff9100;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            font-family: Tahoma, Arial, sans-serif;
          }

          .back-btn:hover {
            background-color: #e67e00;
          }

          .product-info {
            background: #f5f5f5;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            flex-direction: column;
            gap: 5px;
            text-align: center;
          }

          .labels-container {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }

          .label-row {
            display: flex;
            gap: 0;
          }

          .label {
            border: 1px dashed #ccc;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 1mm;
            text-align: center;
            background: white;
          }

          .product-name {
            margin-top: 2px;
            font-size: ${printSettings.productNameFontSize}px;
            color: #000;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }

          .price {
           font-weight: bold;
            margin-top: 1px;
            font-size: ${printSettings.fontSize}px;
            color: #333;
          }

          .label {
            width: ${printSettings.pageWidth / printSettings.columns}mm;
            height: ${printSettings.pageHeight}mm;
          }
          .barcode {
            width: ${barcodeContainerWidth}mm;
            max-width: ${barcodeContainerWidth}mm;
            margin-top: 4mm;
          }
          @page {
            size: ${printSettings.pageWidth}mm ${printSettings.pageHeight}mm;
          }
          @media print {
            html {
              width: ${printSettings.pageWidth}mm;
            }
            body {
              width: ${printSettings.pageWidth}mm;
              margin: ${printSettings.marginTop}mm ${printSettings.marginRight}mm ${printSettings.marginBottom}mm ${printSettings.marginLeft}mm !important;
              direction: rtl !important;
            }
            .container {
              width: ${printSettings.pageWidth}mm;
              max-width: ${printSettings.pageWidth}mm;
            }
            .labels-container {
              width: ${printSettings.pageWidth}mm;
              max-width: ${printSettings.pageWidth}mm;
            }
            .label-row {
              width: ${printSettings.pageWidth}mm;
              height: ${printSettings.pageHeight}mm;
            }
            .label {
              width: ${printSettings.pageWidth / printSettings.columns}mm;
              height: ${printSettings.pageHeight}mm;
            }
            .barcode {
              max-width: ${printSettings.pageWidth / printSettings.columns - 2}mm;
            }
          }
        `
      }} />

      <style jsx global>{`
        @media print {
          html, body {
            padding: 0 !important;
            background: white !important;
            background-color: white !important;
            display: block !important;
            flex-direction: unset !important;
            justify-content: unset !important;
            align-items: unset !important;
            font-family: Tahoma, Arial, sans-serif !important;
            color: #000 !important;
            overflow: visible !important;
          }
          
          /* غیرفعال کردن همه استایل‌های global در حالت print */
          body * {
            font-family: Tahoma, Arial, sans-serif !important;
          }
          
          /* حذف همه padding و margin از عناصر */
          * {
            box-sizing: border-box !important;
          }
        }
      `}</style>

      <style jsx>{`
        .container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          font-family: Tahoma, Arial, sans-serif;
          direction: rtl;
        }

        .settings-panel {
          background: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          width: 100%;
          max-width: 800px;
        }

        .settings-panel h3 {
          margin: 0 0 15px 0;
          color: #333;
          font-size: 18px;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .setting-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .setting-group label {
          font-size: 14px;
          color: #555;
          font-weight: 500;
        }

        .setting-group input, .setting-group select {
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
          font-family: Tahoma, Arial, sans-serif;
        }

        .setting-group input:focus, .setting-group select:focus {
          outline: none;
          border-color: #78b568;
        }

        .controls {
          display: flex;
          gap: 15px;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .quantity-box {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .quantity-box label {
          font-size: 14px;
          color: #333;
        }

        .quantity-box input {
          width: 60px;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 16px;
          text-align: center;
        }

        .print-btn {
          background-color: #78b568;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          font-family: Tahoma, Arial, sans-serif;
        }

        .print-btn:hover {
          background-color: #5a9a4a;
        }

        .back-btn {
          background-color: #ff9100;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          font-family: Tahoma, Arial, sans-serif;
        }

        .back-btn:hover {
          background-color: #e67e00;
        }

        .toggle-settings-btn {
          background-color: #4a90e2;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          font-family: Tahoma, Arial, sans-serif;
        }

        .toggle-settings-btn:hover {
          background-color: #3a78c2;
        }

        .product-info {
          background: #f5f5f5;
          padding: 15px 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          text-align: center;
        }

        .labels-container {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .label-row {
          display: flex;
          gap: 0;
        }

        .label {
          width: ${printSettings.pageWidth / printSettings.columns}mm;
          height: ${printSettings.pageHeight}mm;
          border: 1px dashed #ccc;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 1mm;
          text-align: center;
          background: white;
        }

        .barcode {
          width: ${barcodeContainerWidth}mm;
          max-width: ${barcodeContainerWidth}mm;
          margin-top: 4mm;
        }

        .product-name {
          margin-top: 2px;
          font-size: ${printSettings.productNameFontSize}px;
          color: #000;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .price {
          font-weight: bold;
          margin-top: 1px;
          font-size: ${printSettings.fontSize}px;
          color: #333;
        }

        @page {
          size: ${printSettings.pageWidth}mm ${printSettings.pageHeight}mm;
          margin: ${printSettings.marginTop}mm ${printSettings.marginRight}mm ${printSettings.marginBottom}mm ${printSettings.marginLeft}mm !important;
          padding: 0 !important;
        }

        @media print {
          /* Reset همه استایل‌ها */
          * {
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            background: transparent !important;
            background-color: transparent !important;
          }

          /* Reset html و body */
          html, body {
            width: ${printSettings.pageWidth}mm !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            background-color: white !important;
            display: block !important;
            overflow: visible !important;
            position: relative !important;
            left: 0 !important;
            right: 0 !important;
          }

          /* حذف همه wrapper ها و layout ها */
          body > *:not(.container) {
            display: none !important;
          }

          .container {
            padding: 0 !important;
            margin: 0 !important;
            width: ${printSettings.pageWidth}mm !important;
            max-width: ${printSettings.pageWidth}mm !important;
            background: white !important;
            display: block !important;
            flex-direction: unset !important;
            align-items: unset !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
          }

          .controls, .product-info, .settings-panel {
            display: none !important;
          }

          .labels-container {
            gap: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: ${printSettings.pageWidth}mm !important;
            max-width: ${printSettings.pageWidth}mm !important;
            display: block !important;
          }

          .label-row {
            width: ${printSettings.pageWidth}mm !important;
            height: ${printSettings.pageHeight}mm !important;
            page-break-after: always !important;
            display: flex !important;
            gap: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            flex-direction: row !important;
            justify-content: flex-start !important;
            align-items: flex-start !important;
          }

          .label-row:last-child {
            page-break-after: avoid !important;
          }

          .label {
            width: ${printSettings.pageWidth / printSettings.columns}mm !important;
            height: ${printSettings.pageHeight}mm !important;
            border: none !important;
            padding: 1mm !important;
            margin: 0 !important;
            background: white !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
          }

          .barcode {
            width: ${barcodeContainerWidth}mm !important;
            max-width: ${barcodeContainerWidth}mm !important;
            margin-top: 4mm !important;
            margin-bottom: 0 !important;
            display: block !important;
          }

          .product-name {
            font-size: ${printSettings.productNameFontSize}px !important;
            margin-top: 2px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-width: 100% !important;
            color: #000 !important;
            font-weight: normal !important;
          }

          .price {
            font-weight: bold !important;
            font-size: ${printSettings.fontSize}px !important;
            margin-top: 2px !important;
            color: #333 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function PrintLabel() {
  return (
    <Suspense fallback={
      <div className="loading">
        در حال بارگذاری...
        <style jsx>{`
          .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-family: Tahoma, Arial, sans-serif;
            font-size: 18px;
            color: #333;
          }
        `}</style>
      </div>
    }>
      <PrintLabelContent />
    </Suspense>
  );
}
