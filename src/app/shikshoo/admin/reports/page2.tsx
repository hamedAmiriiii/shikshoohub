"use client";
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Grid,
  Modal,
  CardMedia,
  Stack,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import SwitchCustom from "@/components/SwitchCustom";
import LabelCustom from "@/components/labelCustom";
import { useRouter } from "next/navigation";
import LineDotted from "@/components/lineDotted";
import { ApiRequest } from "@/services/apiRequest";
import SnackbarComponent from "@/components/SnackbarComponent";
import { apiRequestError } from "@/services/apiRequestError";
import { getUserInfo } from "@/services/authBP/UserInfo";

export default function cardMoarefbelghove(props: any) {
  const [openSnackbar, setOpenSnackbar] = useState("");
  const [toggleModal, setToggleModal] = useState(false);
  const [checkedStatus, setCheckedStatus] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [invalid2, setInvalid2] = useState(false);
  const [data, setData] = useState(false);
  const [typeModel, setTypeModel] = useState(false);
  const [aclList, setAclList] = useState<[]>([]);
  const [open, setOpen] = useState(false);
  const [businessInvalid, setBusinessInvalid] = useState(false);
  const _handleGetuserInfo = async () => {
    const { aclList } = await getUserInfo();
    setAclList(aclList);
  };

  useEffect(() => {
    console.log("cccccccccccccc", props.data);

    setInvalid(props.data?.invalid);
    setData(props.data);
    setTypeModel(props.data.typeModel);
    setBusinessInvalid(props.data?.invalid || false);
  }, [props.data]);

  useEffect(() => {
    _handleGetuserInfo();
  }, []);

  const checkUserAcl = (aclItem: string) => {
    return aclList.find((acl) => acl?.data?.langId === aclItem);
  };

  const handleChange = () => {
    apiRequestError(
      "Put",
      {},
      { invalid: invalid ? false : true },
      `/entrepreneur/introduced/${props.data?.id}/invalid`,
      true,
      false
    ).then((res) => {
      if (res.hasError) {
        setCheckedStatus(false);
        setOpenSnackbar(JSON.parse(res.errorText).message[0].title);
        return;
      }

      setOpenSnackbar(" تغییرات انجام شد");
      setToggleModal(false);
      setCheckedStatus(true);
      setInvalid(!invalid);
    });
  };

  const updateName = (id: any, invalid: any, index: number) => {
    setTypeModel((prevData) =>
      prevData.map((item: any, index1: number) =>
        index === index1 ? { ...item, invalid: !invalid } : item
      )
    );
  };

  const handleChange2 = (id: any, invalid: any, index: number) => {
    apiRequestError(
      "Put",
      {},
      { invalid: invalid ? false : true },
      `/entrepreneur/introduced/${data?.id}/invalid/${id}`,
      true,
      false
    ).then((res) => {
      if (res.hasError) {
        setOpenSnackbar(JSON.parse(res.errorText).message[0].title);
        return;
      }

      setOpenSnackbar(" تغییرات انجام شد");
      updateName(id, invalid, index);
      setInvalid2(!invalid2);
    });
  };

  const handleBusinessInvalidChange = () => {
    apiRequestError(
      "Put",
      {},
      { invalid: businessInvalid ? false : true },
      `/mbazar/admin/business/invalid/${props.data?.id}`,
      true,
      true
    ).then((res) => {
      if (res.hasError) {
        setOpenSnackbar(JSON.parse(res.errorText).message[0].title);
        return;
      }

      setOpenSnackbar(" تغییرات انجام شد");
      setBusinessInvalid(!businessInvalid);
    });
  };

  const router = useRouter();
  return (
    <>
      {props?.data && (
        <Card
          style={{
            boxShadow: "unset",
            border: "1px solid #DDE1E6",
            borderRadius: "1.5rem",
            width: "100%",
          }}
        >
          <Box className=" flex " sx={{ paddingBottom: 0 }}>
            <Box className="w-10/12 mt-4 mr-4 flex justify-start items-start">
             
              <Grid xs={12} sx={{ paddingBottom: 0 }}>
              {/*<LabelCustom
                title={"کد ملی"}
                name=""
                text={props.data?.nationalCode}
              />*/}
               <Grid
                xs={12}
                style={{
                  backgroundColor: props.data?.status=="منقضی شده"?"rgb(255 241 241)":"#F1FFF5",
                  display: "flex",
                }}
                className={` m-1 p-1 rounded-xl flex  items-start `}
              >
                <span className="text-sm  rounded-xl aligan-start">
                  {"وضعیت:"}
                  {props.data?.status}
                </span>
              </Grid>
              { props.data.isRenewal &&  <span style={{fontSize:"14px" , marginBottom:"10px" , borderRadius:"25px" , padding:"1px 8px" , background:"#dde7fe"}}> تمدید شده </span> }
              <LabelCustom
                title={"نام و نام خانوادگی"}
                name=""
                text={props.data?.fullName}
              />
              <LabelCustom
                title={"نام کاربری"}
                name=""
                text={props.data?.username}
              />
              <LabelCustom
                title={"مرجع صدور مجوز / پروانه کسب"}
                name=""
                text={props.data?.issuingAuthority}
              />
              <LabelCustom
                title={"تاریخ اعتبارجواز کسب و کار"}
                name=""
                text={props.data?.validityDate}
              />
              <LabelCustom
                title={"شناسه مجوز"}
                name=""
                text={props.data?.businessLicenseId}
              />
              <LabelCustom
                title={"رسته/نوع فعالیت"}
                name=""
                text={props.data?.businessCategory}
              />
                <LabelCustom
                title={"نوع احراز"}
                name=""
                text={props.data?.createTypeLangKey}
              />
                <LabelCustom
                title={"نام ام تی آر"}
                name=""
                text={props.data?.mtrFullName}
              />
                <LabelCustom
                title={"نام کاربری ام تی آر"}
                name=""
                text={props.data?.mtrMobileNumber}
              />
                <LabelCustom
                title={"کد ملی ام تی آر"}
                name=""
                text={props.data?.mtrNationalCode}
              />
             
            </Grid>
            </Box>
            <Box className="w-2/12 mt-4 ml-2  flex justify-start items-start">
             { props?.data?.licenseImage ?<CardMedia
                      width={props.width ?? 80}
                      height={props.height ?? 80}
                        component="img"
                        image={`${process.env.NEXT_PUBLIC_BASE_URL}/filemanager/download/${props.data.licenseImage}`}
                        alt="عکس"
                        onClick={() => setOpen(true)}
                      />
                    
       :
              <div className="flex flex-col gap-2">
                <div style={{backgroundColor:"#e5e7eb"}} className="flex items-center justify-center bg-#1758BA-800 rounded-lg min-w-[73px] min-h-[73px]">
                  <span className="text-xs">عکس </span>
                </div>
              </div>}
            </Box>
          </Box>
          <Grid container className="mb-2 mr-4">
            <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 2, padding: "10px" }}>
              <Typography fontSize="14px">غیرفعال کردن:</Typography>
              <FormControlLabel
                control={
                  <SwitchCustom
                    checked={!businessInvalid}
                    onChange={handleBusinessInvalidChange}
                  />
                }
                label=""
              />
            </Grid>
          </Grid>


          <Modal open={open} onClose={() => setOpen(false)}>
        <Box
          sx={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            outline: "none",
            maxWidth: "90vw",
            maxHeight: "90vh",
          }}
        >
          <CardMedia
                        component="img"
                        image={`${process.env.NEXT_PUBLIC_BASE_URL}/filemanager/download/${props.data.licenseImage}`}
                        alt="عکس بزرگ"
            width={800}
            height={800}
            style={{
              width: "100%",
              height: "auto",
              borderRadius: "8px",
            }}
                      />
       
        </Box>
      </Modal>



          <SnackbarComponent
            open={openSnackbar ? true : false}
            autoHideDuration={6000}
            onClose={() => setOpenSnackbar("")}
            message={openSnackbar}
          />
        </Card>
      )}
    </>
  );
}
