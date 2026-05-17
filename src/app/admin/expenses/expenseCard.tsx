"use client";
import {
  Box,
  Grid,
  Typography,
  IconButton,
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import React, { useEffect, useState } from "react";
import LabelCustom from "@/app/coponent/labelCustom";

const formatNumber = (num: number | string) => {
  const numValue = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
  if (isNaN(numValue)) return '';
  return new Intl.NumberFormat('fa-IR').format(numValue);
};

export default function ExpenseCard(props: any) {
  const [load, setLoad] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [userlogin, setUserlogin] = useState("");
  const [userCart, setUserCart] = useState(props?.props?.data?.user_name);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user')|| '{}');
    const fullName = `${userData.name || ''} ${userData.last_name || ''}`.trim();
    const userName = userData.name || '';
    setUserlogin(fullName);
    
    const cartUserName = props?.props?.data?.user_name || '';
    // بررسی اینکه آیا user_name با name + last_name یا فقط name یکی است
    const isMatch = cartUserName === fullName || cartUserName === userName;
    setCanEdit(isMatch);
    
    console.log("userlogin", fullName, "userCart", cartUserName, "canEdit", isMatch);
    const datetime = props?.props?.data?.created_at;
    const [datePart, timePart] = datetime?.split(" ") || [];
    setDate(datePart || "");
    setTime(timePart || "");
    setLoad(true);
  }, [props?.props?.data?.user_name]);

  // Get onEdit from props.props or props directly
  const onEdit = props?.props?.onEdit || props?.onEdit;

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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <span className="rounded-xl aligan-center">
            {date}
          </span>
          {props?.props?.data?.type && (
            <Box
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
                padding: "2px 8px",
                fontSize: "12px",
                fontWeight: "600",
                color: "#fff",
                whiteSpace: "nowrap"
              }}
            >
              {props.props.data.type}
            </Box>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
          <span className="rounded-xl aligan-center">
            {time}
          </span>
          {onEdit && canEdit && (
            <IconButton
              onClick={() => {
                if (onEdit && props?.props?.data) {
                  onEdit(props.props.data);
                }
              }}
              sx={{
                color: "#fff",
                padding: "6px",
                minWidth: "36px",
                minHeight: "36px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.3)"
                }
              }}
              size="small"
            >
              <EditIcon sx={{ fontSize: "20px" }} />
            </IconButton>
          )}
        </Box>
      </Grid>
      <Grid container className="mt-2">
        <Grid xs={10}>
          <LabelCustom title={"عنوان"} name="" text={props.props.data?.title || "-"} />
          <LabelCustom title={"مبلغ"} name="" text={formatNumber(props.props.data?.amount || 0) + " تومان"} />
          
            <LabelCustom title={"ثبت کننده"} name="" text={props.props.data?.user_name } />
          
        </Grid>
      </Grid>
    </Box>
  ) : (<></>);
}

