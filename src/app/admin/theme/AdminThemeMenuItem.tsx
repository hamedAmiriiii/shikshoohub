"use client";

import { Box, Divider, Switch, Typography } from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { useAdminTheme } from "./useAdminTheme";

/** آخرین آیتم منوی همبرگر — سوئیچ تم روشن/تیره */
export default function AdminThemeMenuItem() {
  const { mode, setMode } = useAdminTheme();
  const isLight = mode === "light";

  return (
    <>
      <Divider sx={{ backgroundColor: "var(--admin-divider)", margin: "8px 0" }} />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mx: 1,
          mb: 0.5,
          px: 1.5,
          py: 1.25,
          borderRadius: "8px",
          "&:hover": {
            backgroundColor: "var(--admin-menu-hover)",
          },
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          {isLight ? (
            <LightModeIcon sx={{ color: "var(--admin-accent)", fontSize: 22, flexShrink: 0 }} />
          ) : (
            <DarkModeIcon sx={{ color: "var(--admin-accent)", fontSize: 22, flexShrink: 0 }} />
          )}
          <Typography
            sx={{
              color: "var(--admin-text)",
              fontSize: "15px",
              fontWeight: 600,
            }}
          >
            {isLight ? "حالت روشن" : "حالت تیره"}
          </Typography>
        </Box>
        <Switch
          size="small"
          checked={isLight}
          onChange={(_, checked) => setMode(checked ? "light" : "dark")}
          inputProps={{ "aria-label": "تغییر تم روشن و تیره" }}
          sx={{
            flexShrink: 0,
            "& .MuiSwitch-switchBase.Mui-checked": {
              color: "var(--admin-accent)",
            },
            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
              backgroundColor: "var(--admin-accent)",
            },
          }}
        />
      </Box>
    </>
  );
}
