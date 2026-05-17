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
          height: 32,
          displayValue: true,
          fontSize: 11,
          margin: 0
        });
      } catch (error) {
        console.error("خطا در ساخت بارکد:", error);
      }
    }
  }, [productData.barcode]);

  // محاسبه تعداد ردیف‌ها (هر ردیف ۲ لیبل)
  const rows = Math.ceil(quantity / 2);
  const labels = Array.from({ length: quantity }, (_, i) => i);

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
      {/* کنترل‌های چاپ */}
      <div className="controls">
        <button onClick={() => {
          // Keep the product ID in localStorage for scroll back
          const pageParam = currentPage ? `?page=${currentPage}` : '';
          router.push(`/admin/product${pageParam}`);
        }} className="back-btn">
          ← برگشت
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

      {/* لیبل‌ها - هر ردیف ۲ تا */}
      <div className="labels-container">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="label-row">
            {/* لیبل راست */}
            <div className="label label-right ">
              <svg ref={barcodeRef} className="barcode"></svg>
              <div className="product-name">{productData.name}</div>
              <div className="price">  {formatNumberEnglish(productData.sale_price)}  </div>
            </div>
            
            {/* لیبل چپ - فقط اگر تعداد کافی باشد */}
            {rowIndex * 2 + 1 < quantity && (
              <div className="label label-left">
                <svg ref={barcodeRef} className="barcode"></svg>
                <div className="product-name">{productData.name}</div>
                <div className="price">   {formatNumberEnglish(productData.sale_price)}  </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx global>{`
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 86mm !important;
            height: 30mm !important;
            background: white !important;
            background-color: white !important;
            display: block !important;
            flex-direction: unset !important;
            justify-content: unset !important;
            align-items: unset !important;
            font-family: Tahoma, Arial, sans-serif !important;
            color: #000 !important;
            direction: rtl !important;
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
          width: 38mm;
          height: 30mm;
          border: 1px dashed #ccc;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 1mm;
          text-align: center;
          background: white;
        }

        .label-right {
          padding-left: 0mm;
        }

        .label-left {
          padding-left: 5mm;
        }

        .barcode {
          max-width: 40mm;
          margin-top: 4mm;
        }

        .product-name {
          margin-top: 2px;
          font-size: 9px;
          color: #000;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .price {
         font-weight: bold;
          margin-top: 1px;
          font-size: 16px;
          color: #333;
        }

        @page {
          size: 86mm 30mm;
          margin: 0 !important;
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
            width: 86mm !important;
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
            width: 86mm !important;
            max-width: 86mm !important;
            background: white !important;
            display: block !important;
            flex-direction: unset !important;
            align-items: unset !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
          }

          .controls, .product-info {
            display: none !important;
          }

          .labels-container {
            gap: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 86mm !important;
            max-width: 86mm !important;
            display: block !important;
          }

          .label-row {
            width: 86mm !important;
            height: 30mm !important;
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
            width: 38mm !important;
            height: 30mm !important;
            border: none !important;
            padding: 1mm !important;
            margin: 0 !important;
            background: white !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
          }

          .label-right {
            background-color: white !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
          }

          .label-left {
            background-color: white !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
          }

          .barcode {
            max-width: 45mm !important;
            margin-top: 4mm !important;
            margin-bottom: 0 !important;
            display: block !important;
          }

          .product-name {
            font-size: 10px !important;
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
            font-size: 13px !important;
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
