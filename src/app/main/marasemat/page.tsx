"use client";
import List from "@/app/coponent/grid/Grid";
import React, { useState, Suspense } from "react";
import CardUser from "./cardUser";


export default function Page() {
  const [dataFilter, setDataFilter] = useState([]);

  let searchBoxList: any = [
    { fieldName: "user.username", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
    { fieldName: "user.fullName", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
    { fieldName: "user.fullName", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
  ];

  const FilterComponent = () => <h1>ggggggggg</h1>;

  const desktopColumns = [
    { label: "نام آتلیه", field: "atelier.name" },
    { label: "تاریخ مراسم", field: "date" },
    { label: "داماد", field: "groom_full_name" },
    { label: "تلفن داماد", field: "groom_phone" },
    { label: "باغ", field: "garden.name" },
    { label: "تالار", field: "talar.name" },
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
          url={"/api/cameraman/ceremony"}
          filterComponent={<FilterComponent />}
          desktopColumns={desktopColumns}
        />
      </div>
    </Suspense>
  );
}
