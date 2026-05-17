"use client";
import List from "@/app/coponent/grid/Grid";
import React, { useState, Suspense } from "react";
import CardUser from "./cardUser";
import Image from "next/image";

export default function Page() {
  const [dataFilter, setDataFilter] = useState([]);

  let searchBoxList: any = [
    { fieldName: "user.username", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
    { fieldName: "user.fullName", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
    { fieldName: "user.fullName", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
  ];

  const FilterComponent = () => <h1>ggggggggg</h1>;

  const desktopColumns = [
    { label: "نام", field: "name" },
    { label: "نام خانوادگی", field: "last_name" },
    { label: "کد ملی", field: "national_code" },
    { label: "نام آتلیه", field: "atelier.name" },
    { 
      label: "تصویر", 
      field: (item: any) => item?.personality_image ? (
        <Image
          src={`http://webinoplus.ir${item.personality_image}`}
          width={50}
          height={50}
          alt="تصویر"
          style={{ borderRadius: "10px" }}
        />
      ) : '-'
    },
    { label: "تاریخ", field: (item: any) => item?.created_at ? item.created_at.split(" ")[0] : '-' },
    { label: "زمان", field: (item: any) => item?.created_at ? item.created_at.split(" ")[1] : '-' },
  ];

  return (
    <Suspense fallback={<div>در حال بارگذاری...</div>}>
      <div style={{ width: "100%", direction: "rtl" }} className="flex-col items-center justify-center">
        <List
          disableFilter={true}
          searchBoxList={searchBoxList}
          filterBoxList={dataFilter}
          CartComponent={(props: any) => <CardUser props={props} />}
          url={"/api/admin/cameraman"}
          filterComponent={<FilterComponent />}
          desktopColumns={desktopColumns}
        />
      </div>
    </Suspense>
  );
}
