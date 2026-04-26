"use client";
import List from "@/app/coponent/grid/Grid";
import React, { useState, Suspense } from "react";
import CardUser from "./cardUser";
import { Box, Grid } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';

export default function Page() {
  const [dataFilter, setDataFilter] = useState([]);

  let searchBoxList: any = [
    { fieldName: "user.username", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
    { fieldName: "user.fullName", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
    { fieldName: "user.fullName", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
  ];

  const FilterComponent = () => <h1>ggggggggg</h1>;

  const desktopColumns = [
    { label: "نام", field: (item: any) => `${item?.user?.name || ''} ${item?.user?.last_name || ''}`.trim() || '-' },
    { label: "تلفن تماس", field: "user.phone" },
    { label: "تاریخ مرخصی", field: (item: any) => `${item?.date_from || '-'} || ${item?.date_to || '-'}` },
    { label: "وضعیت", field: "status" },
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
          url={"/api/admin/leave"}
          filterComponent={<FilterComponent />}
          desktopColumns={desktopColumns}
        />
      </div>
    </Suspense>
  );
}
