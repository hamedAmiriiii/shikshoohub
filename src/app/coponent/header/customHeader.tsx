// components/header/customHeader.tsx
"use client";
import React from "react";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import Grid from "@mui/material/Grid";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { IconButton } from "@mui/material";
import { IoIosArrowForward } from "react-icons/io";

export default function CustomHeader(params: any) {
  const router = useRouter();
  const handleBack = () => {
    router.back();
  };
  const BackUrl = () => {
    router.replace(params.BackUrl)
  };
  return (
    <Grid
      container
      className="custom-header"
      sx={{
        direction:"rtl",
        borderBottom: 1,
        borderColor: "#DDE1E6",
        backgroundColor: "#F7F7FF",
        alignItems: "end",
        height: "80px",
      }}
    >
      <Grid
        item
        xs={1}
        sx={{ height: "40px", display: "flex", justifyContent: "center", alignItems: "end" }}
      >
        {/* <NavigateNextIcon
          onClick={params.handleBack ? params.handleBack : params.BackUrl ?BackUrl : handleBack}
          className="bg-white rounded-lg text-2xl"
        /> */}
        <IconButton onClick={() => { params.handleBack ? params.handleBack() : params.BackUrl ? BackUrl() : handleBack() }}>
          <Image
            src="/pic/VectorArow.svg"

            width={10}
            height={10}
            alt="Add"
            style={{
              cursor: "pointer", marginRight: "20px "
            }}
          />
          {/* <IoIosArrowForward
          size="1.5rem"
          onClick={params.handleBack ? params.handleBack : params.BackUrl ?BackUrl : handleBack}
                
                /> */}
        </IconButton>
      </Grid>

      <Grid item xs={9} sx={{ height: "40px", alignItems: "center", display: "flex", justifyContent: "start", marginLeft: "10px" }}>
        <span style={{ fontSize: "16px", fontWeight: "700", color: "black", marginTop: "6px" }}>
          {params.title}
        </span>
      </Grid>
      {params.newItem && (
        <Grid
          item
          xs={1}
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <Image
            src="/icons/add.svg"
            onClick={() => {
              router.push(params.newItem);
            }}
            width={30}
            height={30}
            alt="Add"
            style={{
              cursor: "pointer", marginLeft: "10px"
            }}
          />
        </Grid>
      )}
      {params.handleNew && (
        <Grid
          item
          xs={1}
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <Image
            src="/icons/add.svg"
            onClick={() => {
              params.handleNew()
            }}
            width={30}
            height={30}
            alt="Add"
            style={{
              cursor: "pointer", marginLeft: "10px"
            }}
          />
        </Grid>
      )}
      <Grid item xs={12} sx={{ display: "flex", alignItems: "center" }}>
        {params.tab}
      </Grid>
    </Grid>
  );
}
