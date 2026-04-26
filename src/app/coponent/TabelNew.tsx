"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, Typography, CircularProgress } from '@mui/material';

// import './CardList.css'; // اضافه کردن استایل کارت و لیست
import { apiRequestError } from '../lib/apiRequestError';
import tokenCode from './tokenCode';

export default function CardList(props) {
  const [data, setData] = useState([]); // لیست داده‌ها
  const [page, setPage] = useState(1); // شماره صفحه فعلی
  const [loading, setLoading] = useState(false); // وضعیت بارگذاری
  const [hasMore, setHasMore] = useState(true); // بررسی اینکه آیا داده بیشتری وجود دارد یا خیر

  // تابع دریافت داده‌ها از API
  const fetchData = useCallback(async () => {
    if (loading || !hasMore) return;
      setLoading(true);
      let tokenn = tokenCode()
let url = `/api/admin/atelier?page=${page}`
      apiRequestError("Get", {}, data, url, true, false,tokenn).then((res) => {
        if (res.hasError) {
       console.log("errrrrrrrrrrrrrrrrrrrrr");
       
            return
          }
       console.log("errrrrrrrrrrrrrrrrrrrrr" , res.data);
          
        const newData = res.data;
        setData((prev) => [...prev, ...newData]);
        setHasMore(newData.length > 0); // اگر داده‌ای وجود ندارد، hasMore را false کنید
        setPage((prevPage) => prevPage + 1);
        setLoading(false);
      }
    );
  }, [page, loading, hasMore, props]);

  // وقتی صفحه لود شد اولین بار داده‌ها را بیاور
  useEffect(() => {
    fetchData();
  }, []);

  // هندلر برای اسکرول بی‌نهایت
  const handleScroll = useCallback(() => {
    const bottom = Math.ceil(window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight;
    if (bottom) fetchData();
  }, [fetchData]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="card-list-container">
      {data.map((item, index) => (
        <Card key={index} className="card-item">
          <CardContent>
            <Typography variant="h6">{item.id || `Card ${index + 1}`}</Typography>
            <Typography variant="body2">{item.description || 'No description available'}</Typography>
          </CardContent>
        </Card>
      ))}

      {loading && (
        <div className="loading-spinner">
          <CircularProgress />
        </div>
      )}

      {!hasMore && (
        <Typography variant="body2" className="no-more-data">
          No more data to display.
        </Typography>
      )}
    </div>
  );
}
