"use client";
import {
  Box,
  Grid,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import LabelCustom from "@/app/coponent/labelCustom";

const formatNumber = (num: number | string) => {
  const numValue = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
  if (isNaN(numValue)) return '';
  return new Intl.NumberFormat('fa-IR').format(numValue);
};

export default function ReturnedProductCard(props: any) {
  const [load, setLoad] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const data = props?.props?.data;

  useEffect(() => {
    const datetime = data?.created_at || data?.createdAt || "";
    if (datetime) {
      const [datePart, timePart] = datetime?.split(" ") || [];
      setDate(datePart || "");
      setTime(timePart || "");
    }
    setLoad(true);
  }, []);

  return load ? (
    <Box style={{ backgroundColor: "#2b3143", borderRadius: "15px", border: "1px solid rgb(55, 84, 165)" }} m={1} p={2}>
      <Grid
        xs={12}
        style={{
          backgroundColor: "#1f9ad1",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
        className={`p-1 rounded-xl flex items-center`}
      >
        <span className="rounded-xl aligan-center">
          {date || "تاریخ نامشخص"}
        </span>
        <span className="rounded-xl aligan-center">
          {time || "زمان نامشخص"}
        </span>
      </Grid>

      <Grid container className="mt-2">
        <Grid xs={12}>
          {/* نمایش بارکد */}
          {data?.barcode && (
            <LabelCustom title={"بارکد"} name="" text={data.barcode} />
          )}

          {/* نمایش نام محصول */}
          {data?.product?.name && (
            <LabelCustom title={"نام کالا"} name="" text={data.product.name} />
          )}

          {/* نمایش قیمت */}
          {data?.product?.sale_price !== undefined && (
            <Box>
              {data.product.has_discount ? (
                <Box>
                  <LabelCustom
                    title={"قیمت اصلی"}
                    name=""
                    text={formatNumber(data.product.original_sale_price) + " تومان"}
                  />
                  <LabelCustom
                    title={"قیمت با تخفیف"}
                    name=""
                    text={formatNumber(data.product.sale_price) + " تومان"}
                  />
                  <LabelCustom
                    title={"درصد تخفیف"}
                    name=""
                    text={formatNumber(data.product.discount_percent) + "%"}
                  />
                </Box>
              ) : (
                <LabelCustom
                  title={"قیمت فروش"}
                  name=""
                  text={formatNumber(data.product.sale_price) + " تومان"}
                />
              )}
            </Box>
          )}

          {/* نمایش قیمت خرید */}
          {data?.product?.purchase_price !== undefined && (
            <LabelCustom
              title={"قیمت خرید"}
              name=""
              text={formatNumber(data.product.purchase_price) + " تومان"}
            />
          )}

          {/* نمایش موجودی */}
          {data?.product?.quantity !== undefined && (
            <LabelCustom title={"موجودی"} name="" text={formatNumber(data.product.quantity)} />
          )}
        </Grid>
      </Grid>
    </Box>
  ) : (
    <></>
  );
}

