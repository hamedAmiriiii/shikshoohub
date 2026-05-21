"use client";

import {
  Box,
  FormControlLabel,
  Switch,
  Typography,
} from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { useAdminTheme } from "./useAdminTheme";

export default function AdminThemeToggle() {
  const { mode, setMode } = useAdminTheme();
  const isLight = mode === "light";

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px",
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Typography
          sx={{
            color: "var(--admin-text)",
            fontSize: "18px",
            fontWeight: 600,
            marginBottom: "8px",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          {isLight ? (
            <LightModeIcon sx={{ color: "var(--admin-accent)", fontSize: 22 }} />
          ) : (
            <DarkModeIcon sx={{ color: "var(--admin-accent)", fontSize: 22 }} />
          )}
          حالت روشن
        </Typography>
        <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "14px" }}>
          {isLight
            ? "رنگ‌های روشن لندینگ وبینو"
            : "حالت تیره فعلی (پیش‌فرض)"}
        </Typography>
      </Box>
      <FormControlLabel
        control={
          <Switch
            checked={isLight}
            onChange={(_, checked) => setMode(checked ? "light" : "dark")}
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": {
                color: "var(--admin-accent)",
              },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: "var(--admin-accent)",
              },
            }}
          />
        }
        label=""
        sx={{ margin: 0 }}
      />
    </Box>
  );
}
