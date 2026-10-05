"use client";

import { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import { useRepairAuth } from "./RepairAuth";

const MIN_VISIBLE_MS = 900;
const FADE_MS = 400;

export default function RepairSplash() {
  const { ready } = useRepairAuth();
  const [hiding, setHiding] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const hide = setTimeout(() => setHiding(true), MIN_VISIBLE_MS);
    const remove = setTimeout(() => setGone(true), MIN_VISIBLE_MS + FADE_MS);
    return () => {
      clearTimeout(hide);
      clearTimeout(remove);
    };
  }, [ready]);

  if (gone) return null;

  return (
    <Box
      aria-hidden
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: (theme) => theme.zIndex.modal + 1,
        bgcolor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        opacity: hiding ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
        pointerEvents: hiding ? "none" : "auto",
      }}
    >
      <Box
        component="img"
        src="/pic/omidtamirat.png"
        alt="امید تعمیر"
        sx={{ width: { xs: 200, sm: 240 }, maxWidth: "60vw", height: "auto" }}
      />
      <CircularProgress size={26} />
    </Box>
  );
}
