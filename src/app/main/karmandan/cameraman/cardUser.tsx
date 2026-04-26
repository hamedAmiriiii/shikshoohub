
"use client";
import {
  Avatar,
  Box,
  Button,
  Card,
  Grid,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import LabelCustom from "@/app/coponent/labelCustom";
import { apiRequestError } from "@/app/lib/apiRequestError";
import { GridContainerCard } from "@/app/coponent/CommonComponent";
import { Margin } from "@mui/icons-material";
import BottomSheet from "@/app/coponent/BottomSheet";
// import UserTable from "./showCameraMan";

export default function CardUser(props: any) {

  const [toggleModal, setToggleModal] = useState(false);
  const [load, setLoad] = useState(false);
  const [status, setStatus] = useState();
  const [accesptModal, setAccesptModal] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  
  
  useEffect(() => {
    const datetime = props.props.data?.created_at;
    const [date, time] = datetime.split(" ");
    setDate(date)
    setTime(time)

    setLoad(true)
  }, [])


  return load ? (
    <Box style={{ backgroundColor: "#2b3143", borderRadius: "15px"  , border:"1px solid #505669" }} m={1} p={2}
    >
 <Box sx={{ display: "flex", justifyContent: "space-between" }} mb={2} >
        <span>{time}</span>
        <span>{date}</span>
      </Box>

      <Grid container className="">

        <Grid xs={8} sx={{ paddingBottom: 0 }}>
          <div className="flex rtl font-sans pb-3">
            <span>وضعیت :</span>
            <span style={{ color: props.props.data?.status == "در انتظار بررسی" ? "#ff9100" : props.props.data?.status == "تایید شده" ? "#52a304" : "#d32f2f" }}
              className={`font-bold ${props.props.data?.status != "در انتظار بررسی" ? "text-secondary" : "text-positive"} `}
            >
              {props.props.data?.status}
            </span>
          </div>
          <LabelCustom title={"تاریخ شروع مرخصی"} name="" text={props.props.data?.date_from} />
          <LabelCustom title={"تاریخ پایان مرخصی"} name="" text={props.props.data?.date_to} />
          {/* <LabelCustom title={"تاریخ درخواست"} name="" text={props.props.data?.created_at} /> */}
          <Grid style={{ justifyContent: "space-between", display: "flex" }} >
          </Grid>
        </Grid>

      


      </Grid>




    </Box>
  ) : (<></>)
}

