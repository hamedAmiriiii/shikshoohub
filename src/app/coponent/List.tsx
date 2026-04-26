"use client"
import React, { useEffect, useState } from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Divider from "@mui/material/Divider";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { Box, Button, Grid, Typography } from "@mui/material";

import { translate } from "./Translate/translate";
import { useRouter } from "next/navigation";
export default function Listt(props) {
    const router = useRouter();
    const [toggleModal, setToggleModal] = useState(false);


  if (props.data?.length > 0)
    return (
      <>
        <List
          sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}
        >
          {props.data.map((item,index) => {
            return (
              // <div onClick={()=>router.push(
              //   `/tasks/show?url=${item.url}&id=${item.price}&title=${item.title}`
              // )   }>
              <div onClick={() => window.open(
                `https://testweb3.liara.run/show?url=${item.url}&id=${item.price}&title=${item.title}`,
                '_blank')}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    {item.img ? (
                      <Avatar
                        alt="Remy Sharp"
                        src="/static/images/avatar/1.jpg"
                      />
                    ) : (
                      <YouTubeIcon style={{ fontSize: 50, color: "#dd2c00" }} />
                    )}
                  </ListItemAvatar>
                  <ListItemText
                    primary={item.title}
                    secondary={
                      <React.Fragment>
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{ color: "text.primary", display: "inline" }}
                        >
                          <MonetizationOnIcon
                            style={{ fontSize: 20, color: "#ffbc43e3" }}
                          />
                          +{item.price}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>
               {props.data.length != index+1 && <Divider variant="inset" component="li" />}
              </div>
            );
          })}
        </List>
      </>
    );
}
