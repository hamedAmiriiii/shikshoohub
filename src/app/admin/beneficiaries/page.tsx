"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  FormControlLabel,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  fetchBeneficiaries,
  formatBeneficiaryAmount,
  formatBeneficiaryLabel,
  type Beneficiary,
} from "@/app/lib/beneficiaries";
import { adminPageSx } from "@/app/admin/theme/adminTheme";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    color: "var(--admin-text)",
    backgroundColor: "var(--admin-surface-alt)",
    fontSize: 13,
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)", fontSize: 13 },
} as const;

const cellSx = {
  color: "var(--admin-text)",
  fontSize: 12,
  py: 0.9,
  px: 1.25,
  textAlign: "center",
  whiteSpace: "nowrap",
} as const;

export default function BeneficiariesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [onlyWithDocs, setOnlyWithDocs] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchBeneficiaries(query, onlyWithDocs);
      setRows(list);
    } catch {
      toast.error("خطا در دریافت ذینفعان");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [query, onlyWithDocs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 280);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <Box sx={{ ...adminPageSx, pt: { xs: 1.25, md: 2 }, pb: { xs: "100px", md: 4 } }}>
      <Container maxWidth="xl" sx={{ px: { xs: 1.25, md: 2 } }}>
        <Box sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 0.75 }}>
          <GroupsIcon sx={{ fontSize: 20, color: "var(--admin-accent)" }} />
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: "var(--admin-text)" }}>
            ذینفعان خرید
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", mb: 1.5 }}>
          <TextField
            size="small"
            label="جستجو نام یا موبایل"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ ...fieldSx, minWidth: { xs: "100%", sm: 260 } }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={onlyWithDocs}
                onChange={(e) => setOnlyWithDocs(e.target.checked)}
                sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "var(--admin-accent)" } }}
              />
            }
            label={
              <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
                فقط کسانی که فاکتور یا هزینه دارند
              </Typography>
            }
          />
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} sx={{ color: "var(--admin-accent)" }} />
          </Box>
        ) : rows.length === 0 ? (
          <Card
            sx={{
              backgroundColor: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
              borderRadius: "10px",
            }}
          >
            <CardContent>
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13, textAlign: "center" }}>
                ذینفعی یافت نشد
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <TableContainer
            component={Paper}
            sx={{
              backgroundColor: "var(--admin-surface)",
              borderRadius: "10px",
              border: "1px solid var(--admin-border)",
              boxShadow: "none",
              overflowX: "auto",
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...cellSx, fontWeight: 600, backgroundColor: "var(--admin-surface-alt)" }}>
                    ردیف
                  </TableCell>
                  <TableCell sx={{ ...cellSx, fontWeight: 600, backgroundColor: "var(--admin-surface-alt)" }}>
                    ذینفع
                  </TableCell>
                  <TableCell sx={{ ...cellSx, fontWeight: 600, backgroundColor: "var(--admin-surface-alt)" }}>
                    کل خرید
                  </TableCell>
                  <TableCell sx={{ ...cellSx, fontWeight: 600, backgroundColor: "var(--admin-surface-alt)" }}>
                    پرداخت‌شده
                  </TableCell>
                  <TableCell sx={{ ...cellSx, fontWeight: 600, backgroundColor: "var(--admin-surface-alt)" }}>
                    بدهی
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    hover
                    onClick={() => router.push(`/admin/beneficiaries/${row.id}`)}
                    sx={{
                      cursor: "pointer",
                      backgroundColor: "var(--admin-surface)",
                      "&:nth-of-type(even)": { backgroundColor: "var(--admin-surface-alt)" },
                      "&:hover": { backgroundColor: "var(--admin-menu-hover)" },
                    }}
                  >
                    <TableCell sx={cellSx}>{index + 1}</TableCell>
                    <TableCell sx={cellSx}>{formatBeneficiaryLabel(row)}</TableCell>
                    <TableCell sx={cellSx}>{formatBeneficiaryAmount(row.purchased_total)} تومان</TableCell>
                    <TableCell sx={cellSx}>{formatBeneficiaryAmount(row.paid_total)} تومان</TableCell>
                    <TableCell sx={{ ...cellSx, color: "var(--admin-accent)", fontWeight: 700 }}>
                      {formatBeneficiaryAmount(row.unpaid_total)} تومان
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <ToastContainer autoClose={3000} position="bottom-right" />
      </Container>
    </Box>
  );
}
