"use client";
import * as React from "react";
import { Card, CardContent, Typography, Box, Avatar, Button } from "@mui/material";
import { ArrowForwardIos } from "@mui/icons-material";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { translate } from "./Translate/translate";

interface TopCardProps {
    url: string;
    icon: string;
    title: string;
    reward: string;
    cexp?: string;
    rank?: string;
}

const TopCard: React.FC<TopCardProps> = ({ url, icon, title, reward, cexp, rank }) => {
    return (
        <Card
            onClick={() => window.open(
                `https://testweb3.liara.run/show?url=${url}&id=${reward}&title=${title}`,
                '_blank')}
            sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px",
                marginBottom: "10px",
                borderRadius: "12px",
                boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
                backgroundColor: cexp ? "#262626" : "#333",
                border: cexp ? "2px solid #ff9100" : "none",
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center" }}>
                {/* Icon */}
                {icon ? <Avatar
                    src={"p"}
                    alt={title}
                    sx={{
                        width: "48px",
                        height: "48px",
                        backgroundColor: "#fff",
                        marginRight: "12px",
                    }}
                /> :
                    <YouTubeIcon style={{ fontSize: 50, color: "#dd2c00" }} />}
                {/* Text Content */}
                <Box>
                    <Typography
                        variant="subtitle1"
                        sx={{ color: "#fff", fontWeight: "bold" }}
                    >
                        {title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#aaa" }}>
                        {reward}
                    </Typography>
                </Box>
            </Box>

            {/* CEXP and Arrow */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* Arrow Icon */}
                <Typography variant="body2" sx={{ color: "#aaa" }}>
                    {rank}
                </Typography>
            </Box>
        </Card>
    );
};

export default function UserScoreCard(props: any) {
    const tasks = [
        {
            url: "",
            icon: "p",
            title: " Leila Farahani",
            reward: "+500,000",
            rank: "1,210",
            cexp: "+500,000",
        },
    ];

    return (
        <Box sx={{ padding: "16px", backgroundColor: "#1c1c1c", minHeight: "15vh" }}>
            <Typography variant="h6" sx={{ color: "#fff", marginBottom: "16px" }}>
            {translate("Your Score")}    
            </Typography>

            {/* Render Task Cards */}
            {tasks.map((task, index) => (
                <TopCard
                    url={task.url}
                    key={index}
                    icon={task.icon}
                    title={task.title}
                    reward={task.reward}
                    cexp={task.cexp}
                    rank={task.rank}
                />
            ))}
        </Box>
    );
}
