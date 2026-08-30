"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Box, IconButton, TextField, Typography, keyframes } from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SendIcon from "@mui/icons-material/Send";
import {
  CHATBOT_GREETING,
  CHATBOT_SUGGESTIONS,
  type ChatAudience,
} from "@/app/lib/chatbot/knowledge";
import { answerChat } from "@/app/lib/chatbot/match";

type Message = {
  role: "bot" | "user";
  text: string;
  shown?: string;
  path?: string;
};

type WebinoChatbotProps = {
  audience: ChatAudience;
};

const THINK_MS = 1000;
const TYPE_MS = 85;

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
`;

const bounce = keyframes`
  0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
  40% { transform: translateY(-3px); opacity: 1; }
`;

function appendWords(shown: string, full: string, count: number): string {
  if (shown.length >= full.length) return full;
  const remaining = full.slice(shown.length);
  if (remaining.startsWith("\n")) {
    return shown + (remaining.match(/^\n+/)?.[0] || "\n");
  }
  const parts = remaining.match(/(\s*\S+)/g);
  if (!parts || parts.length === 0) return full;
  return shown + parts.slice(0, count).join("");
}

function ThinkingDots() {
  return (
    <Box sx={{ display: "inline-flex", gap: "4px", mr: 0.75, verticalAlign: "middle" }}>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            bgcolor: "currentColor",
            animation: `${bounce} 0.9s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </Box>
  );
}

export default function WebinoChatbot({ audience }: WebinoChatbotProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [
    { role: "bot", text: CHATBOT_GREETING[audience], shown: CHATBOT_GREETING[audience] },
  ]);

  const suggestions = useMemo(() => CHATBOT_SUGGESTIONS[audience], [audience]);
  const isAdmin = audience === "admin";
  const listRef = useRef<HTMLDivElement | null>(null);
  const askedConceptsRef = useRef<string[]>([]);
  const busyRef = useRef(false);
  const thinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const last = messages[messages.length - 1];
  const typing =
    !!last && last.role === "bot" && last.shown !== undefined && last.shown !== last.text;

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, thinking]);

  useEffect(() => {
    if (!typing || !last) return;
    const id = setTimeout(() => {
      setMessages((prev) => {
        const copy = [...prev];
        const i = copy.length - 1;
        const msg = copy[i];
        if (!msg || msg.role !== "bot" || msg.shown === undefined) return prev;
        const next = appendWords(msg.shown, msg.text, Math.random() < 0.5 ? 4 : 5);
        copy[i] = { ...msg, shown: next };
        return copy;
      });
    }, TYPE_MS);
    return () => clearTimeout(id);
  }, [messages, typing, last]);

  useEffect(() => {
    if (last?.role === "bot" && last.shown === last.text && busyRef.current && !thinking) {
      busyRef.current = false;
      setBusy(false);
    }
  }, [last, thinking]);

  useEffect(() => {
    return () => {
      if (thinkTimerRef.current) clearTimeout(thinkTimerRef.current);
    };
  }, []);

  const ask = (raw: string) => {
    const text = raw.trim();
    if (!text || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setThinking(true);

    const reply = answerChat(text, audience, askedConceptsRef.current);
    askedConceptsRef.current = [...askedConceptsRef.current, reply.conceptId];

    if (thinkTimerRef.current) clearTimeout(thinkTimerRef.current);
    thinkTimerRef.current = setTimeout(() => {
      setThinking(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: reply.text,
          shown: "",
          path: isAdmin ? reply.path : undefined,
        },
      ]);
    }, THINK_MS);
  };

  const bubbleSx = (role: "bot" | "user") => ({
    alignSelf: role === "user" ? "flex-start" : "flex-end",
    maxWidth: "92%",
    px: 1.2,
    py: 0.9,
    borderRadius: role === "user" ? "14px 14px 14px 4px" : "14px 14px 4px 14px",
    bgcolor:
      role === "user"
        ? isAdmin
          ? "var(--admin-accent)"
          : "#7c3aed"
        : isAdmin
          ? "var(--admin-surface-alt)"
          : "rgba(255,255,255,0.06)",
    color: role === "user" ? "#fff" : isAdmin ? "var(--admin-text)" : "#e2e8f0",
    whiteSpace: "pre-wrap",
    fontSize: 12.5,
    lineHeight: 1.85,
  });

  return (
    <Box
      sx={{
        position: "fixed",
        zIndex: 1400,
        left: { xs: 12, md: 20 },
        bottom: { xs: 188, md: 124 },
        direction: "rtl",
      }}
    >
      {open ? (
        <Box
          sx={{
            width: { xs: "min(360px, calc(100vw - 24px))", md: 380 },
            height: { xs: 440, md: 500 },
            display: "flex",
            flexDirection: "column",
            borderRadius: "18px",
            overflow: "hidden",
            border: isAdmin ? "1px solid var(--admin-border)" : "1px solid rgba(255,255,255,0.12)",
            bgcolor: isAdmin ? "var(--admin-surface)" : "#101623",
            boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
          }}
        >
          <Box
            sx={{
              px: 1.5,
              py: 1.1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: isAdmin ? "var(--admin-surface-alt)" : "rgba(139,92,246,0.18)",
              borderBottom: isAdmin ? "1px solid var(--admin-border)" : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: 14, color: isAdmin ? "var(--admin-text)" : "#fff" }}>
              دستیار وبینو
            </Typography>
            <IconButton size="small" onClick={() => setOpen(false)} aria-label="بستن چت">
              <CloseRoundedIcon sx={{ fontSize: 18, color: isAdmin ? "var(--admin-text-muted)" : "#cbd5e1" }} />
            </IconButton>
          </Box>

          <Box
            ref={listRef}
            sx={{ flex: 1, overflowY: "auto", px: 1.25, py: 1.25, display: "flex", flexDirection: "column", gap: 1 }}
          >
            {messages.map((msg, index) => {
              const display = msg.role === "bot" ? (msg.shown ?? msg.text) : msg.text;
              const done = msg.role !== "bot" || display === msg.text;
              return (
                <Box key={`${msg.role}-${index}`} sx={bubbleSx(msg.role)}>
                  {display}
                  {msg.role === "bot" && !done ? (
                    <Box
                      component="span"
                      sx={{
                        display: "inline-block",
                        width: 7,
                        height: 12,
                        ml: 0.3,
                        bgcolor: "currentColor",
                        verticalAlign: "text-bottom",
                        animation: `${blink} 0.8s step-end infinite`,
                      }}
                    />
                  ) : null}
                  {msg.role === "bot" && done && msg.path ? (
                    <Box
                      component={Link}
                      href={msg.path}
                      sx={{
                        display: "block",
                        mt: 0.9,
                        fontSize: 12,
                        fontWeight: 700,
                        color: isAdmin ? "var(--admin-accent)" : "#c4b5fd",
                        textDecoration: "none",
                      }}
                    >
                      رفتن به این صفحه
                    </Box>
                  ) : null}
                </Box>
              );
            })}
            {thinking ? (
              <Box sx={{ ...bubbleSx("bot"), display: "flex", alignItems: "center", color: isAdmin ? "var(--admin-text-muted)" : "#94a3b8" }}>
                <ThinkingDots />
                در حال فکر کردن
              </Box>
            ) : null}
          </Box>

          <Box sx={{ px: 1.25, pb: 1, display: "flex", gap: 0.6, flexWrap: "wrap" }}>
            {suggestions.map((item) => (
              <Box
                key={item}
                component="button"
                type="button"
                disabled={busy}
                onClick={() => ask(item)}
                sx={{
                  border: isAdmin ? "1px solid var(--admin-border)" : "1px solid rgba(255,255,255,0.12)",
                  bgcolor: "transparent",
                  color: isAdmin ? "var(--admin-text-secondary)" : "#94a3b8",
                  borderRadius: "999px",
                  px: 1,
                  py: 0.4,
                  fontSize: 11,
                  cursor: busy ? "default" : "pointer",
                  opacity: busy ? 0.5 : 1,
                }}
              >
                {item}
              </Box>
            ))}
          </Box>

          <Box sx={{ display: "flex", gap: 0.75, p: 1.1, pt: 0 }}>
            <TextField
              size="small"
              fullWidth
              value={input}
              disabled={busy}
              placeholder={busy ? "صبر کن..." : "سؤال خود را بنویس..."}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  ask(input);
                }
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: isAdmin ? "var(--admin-surface-alt)" : "rgba(255,255,255,0.06)",
                  color: isAdmin ? "var(--admin-text)" : "#fff",
                  fontSize: 13,
                  "& fieldset": { borderColor: isAdmin ? "var(--admin-border)" : "rgba(255,255,255,0.12)" },
                },
              }}
            />
            <IconButton
              onClick={() => ask(input)}
              disabled={busy}
              aria-label="ارسال"
              sx={{ bgcolor: isAdmin ? "var(--admin-accent)" : "#7c3aed", color: "#fff", "&:hover": { opacity: 0.9 } }}
            >
              <SendIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>
      ) : (
        <IconButton
          onClick={() => setOpen(true)}
          aria-label="چت با دستیار وبینو"
          sx={{
            width: 52,
            height: 52,
            bgcolor: isAdmin ? "var(--admin-accent)" : "#7c3aed",
            color: "#fff",
            boxShadow: "0 8px 24px rgba(124,58,237,0.4)",
            "&:hover": { bgcolor: isAdmin ? "var(--admin-accent-hover)" : "#6d28d9" },
          }}
        >
          <ChatBubbleOutlineIcon />
        </IconButton>
      )}
    </Box>
  );
}
