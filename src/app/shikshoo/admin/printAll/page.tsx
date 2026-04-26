"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import JsBarcode from "jsbarcode";
import { apiRequestError } from "@/app/lib/apiRequestError";

const formatNumber = (num: number | string) => {
  const numValue = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
  if (isNaN(numValue)) return '';
  return new Intl.NumberFormat('fa-IR').format(numValue);
};

export default function PrintAllLabels() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});

  // Fetch all products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await apiRequestError("Get", {}, {}, `/api/product`, true, true, "");
        if (res.hasError) {
          console.error("خطا در دریافت محصولات");
          return;
        }
        const productsData = res.data || [];
        setProducts(productsData);
        
        // Initialize quantities with product quantity or 1
        const initialQuantities: { [key: number]: number } = {};
        productsData.forEach((product: any) => {
          initialQuantities[product.id] = product.quantity || 1;
        });
        setQuantities(initialQuantities);
        setLoading(false);
      } catch (error) {
        console.error("خطا در دریافت محصولات:", error);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Update quantity for a product
  const updateQuantity = (productId: number, newQuantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, newQuantity)
    }));
  };

  // Generate barcode for each product
  const generateBarcode = useCallback((node: SVGSVGElement | null, barcode: string) => {
    if (node && barcode) {
      try {
        // Clear previous content
        node.innerHTML = '';
        JsBarcode(node, barcode, {
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
  }, []);

  // Calculate total labels
  const totalLabels = products.reduce((sum, product) => {
    return sum + (quantities[product.id] || product.quantity || 1);
  }, 0);

  // Generate all labels
  const allLabels: any[] = [];
  products.forEach((product) => {
    const qty = quantities[product.id] || product.quantity || 1;
    for (let i = 0; i < qty; i++) {
      allLabels.push(product);
    }
  });

  // Calculate rows (2 labels per row)
  const rows = Math.ceil(allLabels.length / 2);

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
          const currentPage = typeof window !== 'undefined' ? localStorage.getItem('productListPage') : null;
          const pageParam = currentPage ? `?page=${currentPage}` : '';
          router.push(`/shikshoo/admin/product${pageParam}`);
        }} className="back-btn">
          ← برگشت
        </button>
        <div className="info-box">
          <span>تعداد کل لیبل‌ها: {totalLabels}</span>
        </div>
        <button onClick={() => window.print()} className="print-btn">
          🖨️ چاپ همه لیبل‌ها
        </button>
      </div>

      {/* لیست محصولات با تعداد */}
      <div className="products-list">
        <h3>محصولات:</h3>
        {products.map((product) => (
          <div key={product.id} className="product-item">
            <span className="product-name">{product.name}</span>
            <div className="quantity-control">
              <button 
                onClick={() => updateQuantity(product.id, (quantities[product.id] || product.quantity || 1) - 1)}
                className="qty-btn"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={quantities[product.id] || product.quantity || 1}
                onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 1)}
                className="qty-input"
              />
              <button 
                onClick={() => updateQuantity(product.id, (quantities[product.id] || product.quantity || 1) + 1)}
                className="qty-btn"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* لیبل‌ها - هر ردیف ۲ تا */}
      <div className="labels-container">
        {Array.from({ length: rows }).map((_, rowIndex) => {
          const leftLabel = allLabels[rowIndex * 2];
          const rightLabel = allLabels[rowIndex * 2 + 1];
          
          return (
            <div key={rowIndex} className="label-row">
              {/* لیبل راست */}
              {leftLabel && (
                <div className="label label-right">
                  <svg 
                    key={`barcode-left-${rowIndex}`}
                    ref={(node) => generateBarcode(node, leftLabel.barcode || "")} 
                    className="barcode"
                  ></svg>
                  <div className="product-name">{leftLabel.name}</div>
                  <div className="price"> T {formatNumber(leftLabel.sale_price || 0)}  </div>
                </div>
              )}
              
              {/* لیبل چپ */}
              {rightLabel && (
                <div className="label label-left">
                  <svg 
                    key={`barcode-right-${rowIndex}`}
                    ref={(node) => generateBarcode(node, rightLabel.barcode || "")} 
                    className="barcode"
                  ></svg>
                  <div className="product-name">{rightLabel.name}</div>
                  <div className="price">  T {formatNumber(rightLabel.sale_price || 0)}  </div>
                </div>
              )}
            </div>
          );
        })}
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

        .info-box {
          padding: 8px 16px;
          background: #f5f5f5;
          border-radius: 8px;
          font-size: 14px;
          color: #333;
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

        .products-list {
          background: #f5f5f5;
          padding: 15px 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          width: 100%;
          max-width: 600px;
        }

        .products-list h3 {
          margin: 0 0 15px 0;
          color: #333;
          font-size: 18px;
        }

        .product-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          margin-bottom: 8px;
          background: white;
          border-radius: 6px;
        }

        .product-item .product-name {
          flex: 1;
          color: #333;
          font-size: 14px;
        }

        .quantity-control {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .qty-btn {
          background-color: #78b568;
          color: white;
          border: none;
          width: 30px;
          height: 30px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qty-btn:hover {
          background-color: #5a9a4a;
        }

        .qty-input {
          width: 60px;
          padding: 6px;
          border: 1px solid #ccc;
          border-radius: 4px;
          text-align: center;
          font-size: 14px;
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
          padding-left: 10mm;
        }

        .label-left {
          // padding-left: 5mm;
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
            font-family: Tahoma, Arial, sans-serif !important;
            color: #000 !important;
            direction: rtl !important;
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
          }

          .controls, .products-list {
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
            padding-left: 10mm !important;
            padding-right: 0 !important;
          }

          .label-left {
            background-color: white !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
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
            font-size: 12px !important;
            margin-top: 1px !important;
            color: #333 !important;
          }
        }
      `}</style>
    </div>
  );
}

