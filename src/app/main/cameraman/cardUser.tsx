
"use client";
import {
  Avatar,
  Box,
  Button,
  Card,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import LabelCustom from "@/app/coponent/labelCustom";
import { apiRequestError } from "@/app/lib/apiRequestError";
import { GridContainerCard } from "@/app/coponent/CommonComponent";
import { Margin } from "@mui/icons-material";
import ClearIcon from '@mui/icons-material/Clear';
import DoneIcon from '@mui/icons-material/Done';
import tokenCode from "@/app/coponent/tokenCode";
import ModalLabel from "@/app/coponent/ModalLabel";
import SnackbarComponent from "@/app/coponent/SnackbarComponent";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


export default function CardUser(props: any) {

  const [openSnackbar, setOpenSnackbar] = useState("");
  const [load, setLoad] = useState(false);
  const [status, setStatus] = useState();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [dataRoles, setDataRoles] = useState([]);
  const [deleteItem, setDeleteItem] = useState([]);
  const [accesptModal, setAccesptModal] = useState(false);
  useEffect(() => {
    const datetime = props.props?.data?.created_at;
    const [date, time] = datetime.split(" ");
    setDate(date)
    setTime(time)
    setDataRoles(props.props.data?.roles)
    props?.props?.data?.roles?.map((e) => {
      e.name == "فیلم بردار" && setStatus(e.pivot)
    })

    setLoad(true)
  }, [])

  const ChengeItem1 = (ee, role) => {
    let token = tokenCode();
    
    let loadData = {
      "status": ee,
      "role": role
    };
  
    apiRequestError("Post", {}, loadData, `/api/admin/cameraman/confirm/${props.props.data?.id}`, true, true, token).then((res) => {
      if (res.hasError) {
        setOpenSnackbar(JSON.parse(res.errorText).message[0].title);
        return;
      }
  
      
      const updatedRoles = dataRoles.map((e) => {
        if (e.pivot.role_id == role) {
          return {
            ...e,
            pivot: {
              ...e.pivot,
              status: ee == 2 ? "تایید شده" : "رد شده"
            }
          };
        }
        return e;
      });
  
      setDataRoles(updatedRoles);  //  استیت آپدیت 
      
      setAccesptModal(false);
      toast.success("ویرایش انجام شد");
    });
  };
  

  const ChengeItem = (ee, role) => {
    setDeleteItem([ee, role])
    setAccesptModal(true)
  }
  console.log("dataRoles",dataRoles);

  return load ? (
    <Box style={{ backgroundColor: "#2b3143", borderRadius: "15px", border: "1px solid #505669" }} m={1} p={2}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between" }} mb={2} >
        <span>{time}</span>
        <span>{date}</span>
      </Box>

      <Grid container className="">

        <Grid xs={8} sx={{ paddingBottom: 0 }}>

          <LabelCustom title={"نام"} name="" text={props.props.data?.name} />
          <LabelCustom title={"نام خانوادگی"} name="" text={props.props.data?.last_name} />
          <LabelCustom title={"کد ملی"} name="" text={props.props.data?.national_code} />
          <LabelCustom title={"نام آتلیه"} name="" text={props.props.data?.atelier?.name} />
          {/* <LabelCustom title={"تاریخ درخواست"} name="" text={props.props.data?.created_at} /> */}
          <Grid style={{ justifyContent: "space-between", display: "flex" }} >
          </Grid>
        </Grid>

        <Box xs={2} sx={{ paddingBottom: 0 }}>
          {props?.props?.data?.personality_image && <Image
            src={`https://webinoplus.ir${props?.props?.data?.personality_image}`}
            width={80}
            height={80}
            alt={`تصویر `}
            style={{
              height: "90px",
              borderRadius: "10px"
            }}
          />}

        </Box>


      </Grid>

      <Box> {dataRoles?.map((item) => {
        return (
          <Grid m={1} p={1} sx={{ display: "flex", justifyContent: "space-between", height: "65px", backgroundColor: "#51515d", borderRadius: "10px" }}>
            <Grid xs={8} sx={{ justifyContent: "space-between" }}>
              <Typography sx={{ fontWeight: "600" }} color="#fff" >{`${item.name} `}  </Typography>
              <Typography sx={{ fontWeight: "400" }} color={item.pivot.status == 'در انتظار بررسی' ? "#fff" : item.pivot.status == 'تایید شده' ? "#42BE65" : "#e37238"}  > وضعیت : {`${item.pivot.status} `}  </Typography>

            </Grid>


            <Grid xs={4} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}

            >
              <IconButton onClick={() => ChengeItem(3, item.id)} > <ClearIcon sx={{ width: "30px", height: "30px", color: "#fff", backgroundColor: "#e37238", borderRadius: "100px" }} /> </IconButton>
              <IconButton onClick={() => ChengeItem(2, item.id)}> <DoneIcon sx={{ width: "30px", height: "30px", color: "#fff", backgroundColor: "#42BE65", borderRadius: "100px" }} /></IconButton>

            </Grid>
          </Grid>
        )
      })

      }

      </Box>



      <ModalLabel
        title={<div></div>}
        width="375px"
        open={accesptModal}
        onClose={() => setAccesptModal(false)}
      >
        <Box>
          <Box display="flex" justifyContent="center" alignItems="center">
            <Typography fontSize="1rem" fontWeight="bold">
              آیا از تغییر وضعیت اطمینان دارید؟
            </Typography>
          </Box>
          <Box
            mt="2rem"
            display="flex"
            alignItems="center"
            gap="2rem"
            justifyContent="center"
          >
            <Button
              onClick={() => ChengeItem1(deleteItem[0], deleteItem[1])}
              variant="contained"
              fullWidth
              style={{ height: "50px", borderRadius: '10px', backgroundColor: "#1758BA" }}
            >
              تایید
            </Button>
            <Button
              onClick={() => setAccesptModal(false)}
              variant="contained"
              color="error"
              fullWidth
              style={{ height: "50px", borderRadius: '10px' }}
            >
              لغو
            </Button>
          </Box>
        </Box>
      </ModalLabel>

      <ToastContainer autoClose={3000} style={{ marginBottom: '56px', borderRadius: "15px" }} position={"bottom-right"} />

    </Box>
  ) : (<></>)
}

