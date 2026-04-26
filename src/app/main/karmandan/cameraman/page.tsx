

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

  return (
    <Suspense fallback={<div>در حال بارگذاری...</div>}>
      <div style={{ width: "100%", direction: "rtl" }} className="flex-col items-center justify-center">
        <List
          searchBoxList={searchBoxList}
          filterBoxList={dataFilter}
          CartComponent={(props: any) => <CardUser props={props} />}
          url={"/api/cameraman/leave"}
          disableFilter={true}
          filterComponent={<FilterComponent />}
        />
      </div>
    </Suspense>
  );
}

