"use client";
import List from "@/app/coponent/grid/Grid";
import React, { useState, Suspense, useEffect } from "react";

import { Box, Grid,  Typography } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import { useRouter } from "next/navigation";
import Purchas from "./purchas/purchas";
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Switch, { SwitchProps } from '@mui/material/Switch';

const AntSwitch = styled(Switch)(({ theme }) => ({
  width: 28,
  height: 16,
  padding: 0,
  display: 'flex',
  '&:active': {
    '& .MuiSwitch-thumb': {
      width: 15,
    },
    '& .MuiSwitch-switchBase.Mui-checked': {
      transform: 'translateX(9px)',
    },
  },
  '& .MuiSwitch-switchBase': {
    padding: 2,
    '&.Mui-checked': {
      transform: 'translateX(12px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: '#1890ff',
        ...theme.applyStyles('dark', {
          backgroundColor: '#177ddc',
        }),
      },
    },
  },
  '& .MuiSwitch-thumb': {
    boxShadow: '0 2px 4px 0 rgb(0 35 11 / 20%)',
    width: 12,
    height: 12,
    borderRadius: 6,
    transition: theme.transitions.create(['width'], {
      duration: 200,
    }),
  },
  '& .MuiSwitch-track': {
    borderRadius: 16 / 2,
    opacity: 1,
    backgroundColor: 'rgba(0,0,0,.25)',
    boxSizing: 'border-box',
    ...theme.applyStyles('dark', {
      backgroundColor: 'rgba(255,255,255,.35)',
    }),
  },
}));



export default function ListPurches() {
    const [dataFilter, setDataFilter] = useState([]);
    const [url, setUrl] = useState(true);
    const [loading, setLoading] = useState(true);
    
    let searchBoxList: any = [
      { fieldName: "user.username", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
      { fieldName: "user.fullName", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
      { fieldName: "user.fullName", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
    ];
    useEffect(() => {
     
        setLoading(true)
     
    }, [url]);
    const FilterComponent = () => <h1>ggggggggg</h1>;
  
    return (
      <Suspense fallback={<div>در حال بارگذاری...</div>}>
        <Box>
  
  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Typography>ماهانه</Typography>
        <AntSwitch onChange={()=>{  
        setLoading(false)
        setUrl(!url)
        }} defaultChecked inputProps={{ 'aria-label': 'ant design' }} />
        <Typography>روزانه</Typography>
      </Stack>
  
        </Box>
  
  
        <div style={{ width: "100%", direction: "rtl" }} className="flex-col items-center justify-center">
        {loading &&   <List
            disableFilter={true}
            searchBoxList={searchBoxList}
            filterBoxList={dataFilter}
            CartComponent={(props: any) => <Purchas props={props} />}
            url={url ? "/api/purchased-products?filter=today" : "/api/purchased-products?filter=month"}
            filterComponent={<FilterComponent />}
          />}
        </div>
      </Suspense>
    );
  }
