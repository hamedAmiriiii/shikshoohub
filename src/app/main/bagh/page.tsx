"use client";
import List from "@/app/coponent/grid/Grid";
import React, { useState, Suspense } from "react";
import CardUser from "./cardUser";
import { Box, Grid } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import { useRouter } from "next/navigation";


export default function Page() {
  const router = useRouter();

  const [dataFilter, setDataFilter] = useState([]);

  let searchBoxList: any = [
    { fieldName: "user.username", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
    { fieldName: "user.fullName", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
    { fieldName: "user.fullName", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
  ];

  const FilterComponent = () => <h1>ggggggggg</h1>;

  return (
    <Suspense fallback={<div>در حال بارگذاری...</div>}>

<Box
        onClick={() => router.push("/main/bagh/create")}
        style={{
        backgroundColor: "#78b568", borderRadius: "15px", border: "1px solid #505669", Height: "130px"
      }} m={1} p={1} mt={3}>

        <Box style={{
          display: "flex",
          justifyContent: "space-between",
        }} >
          <Grid xs={4} container style={{ display: "flex", alignItems: "center", justifyContent: "start", }}>
            <span style={{ color: "#6BA6FF", borderRadius: "50px", }} >  <AddIcon fontSize="large"  sx={{ width: "50px" ,color:"#fff"}} />    </span>
          </Grid>

          <Grid xs={8} container style={{ display: "flex", alignItems: "center", justifyContent: "end" }}>

            <div style={{ marginRight: "6px",color:"#fff" }} >
              <span> ثبت باغ جدید  </span>
            </div>
          </Grid>
        </Box>

      </Box>



      <div style={{ width: "100%", direction: "rtl" }} className="flex-col items-center justify-center">
        <List
          disableFilter={true}
          searchBoxList={searchBoxList}
          filterBoxList={dataFilter}
          CartComponent={(props: any) => <CardUser props={props} />}
          url={"/api/admin/garden"}
          filterComponent={<FilterComponent />}
        />
      </div>
    </Suspense>
  );
}
