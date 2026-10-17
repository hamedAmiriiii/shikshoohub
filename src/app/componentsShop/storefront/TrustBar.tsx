"use client";

import { Box, Typography } from "@mui/material";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import PaymentOutlinedIcon from "@mui/icons-material/PaymentOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import AssignmentReturnOutlinedIcon from "@mui/icons-material/AssignmentReturnOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import type { StorefrontTrustItem } from "@/app/lib/onlineStorefront";

const ICONS: Record<string, React.ReactNode> = {
  shipping: <LocalShippingOutlinedIcon />,
  payment: <PaymentOutlinedIcon />,
  verified: <VerifiedOutlinedIcon />,
  support: <SupportAgentOutlinedIcon />,
  return: <AssignmentReturnOutlinedIcon />,
  original: <WorkspacePremiumOutlinedIcon />,
};

type Props = {
  items: StorefrontTrustItem[];
  primaryColor?: string;
};

export default function TrustBar({ items, primaryColor = "#ef4056" }: Props) {
  if (!items?.length) return null;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, 1fr)",
          sm: `repeat(${Math.min(items.length, 4)}, 1fr)`,
        },
        gap: { xs: 1.5, md: 2 },
        py: 1,
      }}
    >
      {items.map((item, i) => (
        <Box
          key={`${item.title}-${i}`}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            p: { xs: 1, md: 1.5 },
            bgcolor: "#fff",
            borderRadius: "10px",
            border: "1px solid #f0f0f1",
          }}
        >
          <Box sx={{ color: primaryColor, display: "flex", "& svg": { fontSize: 28 } }}>
            {ICONS[item.icon || "shipping"] || ICONS.shipping}
          </Box>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#3f4064" }}>{item.title}</Typography>
            {item.subtitle ? (
              <Typography sx={{ fontSize: 11, color: "#81858b" }}>{item.subtitle}</Typography>
            ) : null}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
