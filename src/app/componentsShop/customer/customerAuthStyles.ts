export const customerAuthGradient =
  "linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)";

export const customerInputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "14px",
    backgroundColor: "#2b3143",
    color: "#fff",
    "& fieldset": { borderColor: "#505669" },
    "&:hover fieldset": { borderColor: "#78b568" },
    "&.Mui-focused fieldset": { borderColor: "#78b568" },
  },
  "& .MuiInputBase-input": {
    padding: "14px 16px",
    fontSize: "15px",
    color: "#fff",
    "&:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 100px #2b3143 inset !important",
      WebkitTextFillColor: "#fff !important",
      caretColor: "#fff",
      transition: "background-color 5000s ease-in-out 0s",
    },
    "&:-webkit-autofill:hover": {
      WebkitBoxShadow: "0 0 0 100px #2b3143 inset !important",
      WebkitTextFillColor: "#fff !important",
    },
    "&:-webkit-autofill:focus": {
      WebkitBoxShadow: "0 0 0 100px #2b3143 inset !important",
      WebkitTextFillColor: "#fff !important",
    },
    "&:-webkit-autofill:active": {
      WebkitBoxShadow: "0 0 0 100px #2b3143 inset !important",
      WebkitTextFillColor: "#fff !important",
    },
  },
  "& .MuiInputBase-input::placeholder": {
    color: "rgba(255,255,255,0.5)",
    opacity: 1,
  },
} as const;

export const customerPaperSx = {
  padding: { xs: "24px", md: "28px" },
  borderRadius: "22px",
  backgroundColor: "#1a1d2e",
  border: "1px solid #505669",
  boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
} as const;
