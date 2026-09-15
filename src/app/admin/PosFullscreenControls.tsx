"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, IconButton } from "@mui/material";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";

const FS_CLASS = "admin-pos-fullscreen";

function setFsClass(on: boolean) {
  document.documentElement.classList.toggle(FS_CLASS, on);
}

export function usePosFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExitHint, setShowExitHint] = useState(false);

  useEffect(() => {
    const sync = () => {
      const nativeFs = Boolean(document.fullscreenElement);
      if (nativeFs) {
        setFsClass(true);
        setIsFullscreen(true);
        return;
      }
      setFsClass(false);
      setIsFullscreen(false);
      setShowExitHint(false);
    };
    document.addEventListener("fullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      setFsClass(false);
    };
  }, []);

  const enterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setFsClass(true);
      setIsFullscreen(true);
    } catch {
      setFsClass(true);
      setIsFullscreen(true);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      /* ignore */
    }
    setFsClass(false);
    setIsFullscreen(false);
    setShowExitHint(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) void exitFullscreen();
    else void enterFullscreen();
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  return {
    isFullscreen,
    showExitHint,
    setShowExitHint,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}

type ToggleProps = {
  isFullscreen: boolean;
  onToggle: () => void;
  dense?: boolean;
};

export function PosFullscreenToggleButton({ isFullscreen, onToggle, dense }: ToggleProps) {
  return (
    <IconButton
      type="button"
      onClick={onToggle}
      aria-label={isFullscreen ? "خروج از تمام‌صفحه" : "تمام‌صفحه"}
      size="small"
      sx={{
        border: "1px solid var(--admin-border)",
        borderRadius: "10px",
        color: "var(--admin-text)",
        bgcolor: "var(--admin-surface-alt)",
        width: dense ? 28 : 36,
        height: dense ? 28 : 36,
        "&:hover": {
          bgcolor: "var(--admin-menu-hover)",
          borderColor: "var(--admin-accent)",
          color: "var(--admin-accent)",
        },
      }}
    >
      {isFullscreen ? (
        <FullscreenExitIcon sx={{ fontSize: dense ? 16 : 20 }} />
      ) : (
        <FullscreenIcon sx={{ fontSize: dense ? 16 : 20 }} />
      )}
    </IconButton>
  );
}

type ExitHintProps = {
  visible: boolean;
  showExitHint: boolean;
  setShowExitHint: (v: boolean) => void;
  onExit: () => void;
};

export function PosFullscreenExitHint({
  visible,
  showExitHint,
  setShowExitHint,
  onExit,
}: ExitHintProps) {
  if (!visible) return null;

  return (
    <>
      <Box
        onMouseEnter={() => setShowExitHint(true)}
        onMouseLeave={() => setShowExitHint(false)}
        sx={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 140,
          height: 56,
          zIndex: 20000,
        }}
      />
      <IconButton
        type="button"
        onClick={onExit}
        onMouseEnter={() => setShowExitHint(true)}
        onMouseLeave={() => setShowExitHint(false)}
        aria-label="خروج از تمام‌صفحه"
        sx={{
          position: "fixed",
          top: 10,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 20001,
          opacity: showExitHint ? 0.5 : 0,
          pointerEvents: showExitHint ? "auto" : "none",
          transition: "opacity 0.2s ease",
          bgcolor: "rgba(0,0,0,0.55)",
          color: "#fff",
          width: 44,
          height: 44,
          "&:hover": {
            opacity: 0.75,
            bgcolor: "rgba(0,0,0,0.7)",
          },
        }}
      >
        <FullscreenExitIcon />
      </IconButton>
    </>
  );
}
