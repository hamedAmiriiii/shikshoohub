"use client"
import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  CircularProgress,
} from "@mui/material";
import { apiRequestError } from "@/app/lib/apiRequestError";
import { log } from "console";
import tokenCode from "@/app/coponent/tokenCode";

const UserTable = ({ id }) => {

    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState(null);


    const renderRow = (userArray, responsibility) => {
        console.log("dddddddddddddddddddddddddddd ",userArray );
        
        if (userArray.length > 0) {
            return (
                <TableRow>
                    <TableCell>{responsibility}</TableCell>
                    <TableCell>{userArray[0].national_code}</TableCell>
                    <TableCell>{userArray[0].last_name}</TableCell>
                    <TableCell>{userArray[0].name}</TableCell>
                </TableRow>
            );
        }
        return null;
    };

    
    useEffect(() => {
       let token =  tokenCode()
        apiRequestError("Get", {}, {},`/api/admin/ceremony/${id}`, true, true, token).then((res) => {
            if (res.hasError) {
                const parsedResponse = JSON.parse(res.errorText);
                const readableMessage = parsedResponse.message;
                return
            }
           console.log("dddddddddddddddddddddddddd555555" ,res );
           
            setUsers(res)
            setLoading(true)
                      
                       
        })
    
    }, [])
    

    console.log("ffffffffffffffffffffff",users);
    
    if (!loading) {
        return (
          <Box display="flex" justifyContent="center" alignItems="center" height="40vh">
            <CircularProgress />
          </Box>
        );
    } 
    
    if (!users) {
        return (
          <Box display="flex" justifyContent="center" alignItems="center" height="40vh">
            <p>اطلاعاتی برای نمایش وجود ندارد</p>
          </Box>
        );
    }
    


    if (loading && users) {
        return (
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>مسئولیت</TableCell>
                            <TableCell>کد ملی</TableCell>
                            <TableCell>نام خانوادگی</TableCell>
                            <TableCell>نام</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users?.man_cameraman.length > 0  && renderRow(users.man_cameraman, "فیلم بردار مرد")}
                        {users?.woman_cameraman.length > 0  && renderRow(users.woman_cameraman, "فیلم بردار زن")}
                        {users?.man_photographer.length > 0  && renderRow(users.man_photographer, "عکاس مرد")}
                        {users?.woman_photographer.length > 0  && renderRow(users.woman_photographer, "عکاس زن")}
                        {users?.man_air_cameraman.length > 0  && renderRow(users.man_air_cameraman, "هلی شات-مرد")}
                        {users?.woman_air_cameraman.length > 0  && renderRow(users.woman_air_cameraman, "هلی شات-زن")}
                    </TableBody>
                </Table>
            </TableContainer>
        )
    }else{return(<></>)}
    
};

export default UserTable;
