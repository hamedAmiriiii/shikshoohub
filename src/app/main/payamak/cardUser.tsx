
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

export default function CardUser(props: any) {
  console.log("dataaaaaaaaaaaaaaaaaa", props);

  const [openSnackbar, setOpenSnackbar] = useState("");
  const [load, setLoad] = useState(true);
  const [status, setStatus] = useState();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  
  
  useEffect(() => {
    const datetime = props.props.data?.created_at;
    const [date, time] = datetime.split(" ");
    setDate(date)
    setTime(time)

   
  }, [])

  const deleteItem = () => {

  }

  return load ? (
    <Box style={{ backgroundColor: "#2b3143", borderRadius: "15px"  , border:"1px solid #505669" }} m={1} p={2}
    >
 <Box sx={{ display: "flex", justifyContent: "space-between" }} mb={2} >
        <span>{time}</span>
        <span>{date}</span>
      </Box>

      <Grid container className="">

        <Grid xs={12} sx={{ paddingBottom: 0 }}>
        <LabelCustom title={"ارسال به"} name="" text={props.props.data?.receivers} />
          
            <span>متن پیام :</span>
          <Grid style={{ justifyContent: "space-between", display: "flex" }} >
          <div className="flex rtl font-sans ">
            <span >
              {props.props.data?.text}
            </span>
          </div>
          </Grid>
        </Grid>

        


      </Grid>

     
    </Box>
  ) : (<></>)
}

