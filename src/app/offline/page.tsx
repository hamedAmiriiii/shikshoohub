"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const router = useRouter();

  useEffect(() => {
    const checkOnline = () => {
      if (navigator.onLine) {
        router.push('/');
      }
    };

    window.addEventListener('online', checkOnline);
    checkOnline();

    return () => {
      window.removeEventListener('online', checkOnline);
    };
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      direction: 'rtl'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <div style={{
          width: '120px',
          height: '120px',
          margin: '0 auto 30px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '60px',
          color: 'white'
        }}>
          📡
        </div>
        <h1 style={{
          color: '#333',
          fontSize: '28px',
          marginBottom: '15px',
          fontWeight: '700'
        }}>
          بدون اتصال به اینترنت
        </h1>
        <p style={{
          color: '#666',
          fontSize: '16px',
          lineHeight: '1.6',
          marginBottom: '30px'
        }}>
          متأسفانه در حال حاضر به اینترنت متصل نیستید. لطفاً اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            padding: '15px 40px',
            borderRadius: '30px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            marginTop: '20px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 10px 20px rgba(102, 126, 234, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          تلاش مجدد
        </button>
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#f0f0f0',
          borderRadius: '10px',
          fontSize: '14px',
          color: navigator.onLine ? '#4caf50' : '#666',
          fontWeight: navigator.onLine ? '600' : 'normal'
        }}>
          {navigator.onLine ? '✓ آنلاین هستید' : '✗ هنوز آفلاین هستید'}
        </div>
      </div>
    </div>
  );
}

