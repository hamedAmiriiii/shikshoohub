"use client";
import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { tableCellClasses } from '@mui/material/TableCell';
import { apiRequestError } from '@/app/lib/apiRequestError/client';
import tokenCode from '@/app/coponent/tokenCode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FactoryIcon from '@mui/icons-material/Factory';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useRouter } from 'next/navigation';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontWeight: "600",
    fontSize: "16px",
    padding: "16px 24px",
  },
  [`&.${tableCellClasses.body}`]: {
    color: "var(--admin-text)",
    fontSize: 16,
    padding: "16px 24px",
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: "var(--admin-surface)",
  '&:nth-of-type(even)': {
    backgroundColor: "var(--admin-surface-alt)",
  },
  '&:hover': {
    backgroundColor: "var(--admin-menu-hover)",
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

interface Manufacturer {
  id: number;
  name: string;
  products_count?: number;
  total_sold_quantity?: number;
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('fa-IR').format(num);
};

export default function ManufacturersPage() {
  const router = useRouter();
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null);
  const [deletingManufacturerId, setDeletingManufacturerId] = useState<number | null>(null);
  
  // Form states
  const [name, setName] = useState("");

  useEffect(() => {
    fetchManufacturers();
  }, []);

  const fetchManufacturers = async () => {
    try {
      setLoading(true);
      const token = tokenCode();
      const res = await apiRequestError("Get", {}, {}, "/api/manufacturers", true, true, token);
      
      if (res.hasError) {
        console.error("Error fetching manufacturers:", res.errorText);
        toast.error("خطا در دریافت تولیدکنندگان");
        setManufacturers([]);
      } else {
        const data = Array.isArray(res) ? res : (Array.isArray(res.data) ? res.data : []);
        setManufacturers(data);
      }
    } catch (error) {
      console.error("Error fetching manufacturers:", error);
      toast.error("خطا در دریافت تولیدکنندگان");
      setManufacturers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManufacturer = async () => {
    if (!name.trim()) {
      toast.error("لطفاً نام تولیدکننده را وارد کنید");
      return;
    }

    try {
      const data = {
        name: name.trim()
      };

      const token = tokenCode();
      const res = await apiRequestError("Post", {}, data, "/api/manufacturers", true, true, token);
      
      if (res.hasError) {
        toast.error(res.errorText || "خطا در ثبت تولیدکننده");
      } else {
        toast.success("تولیدکننده با موفقیت ثبت شد");
        setOpenCreateDialog(false);
        resetForm();
        fetchManufacturers();
      }
    } catch (error) {
      console.error("Error creating manufacturer:", error);
      toast.error("خطا در ثبت تولیدکننده");
    }
  };

  const handleEditManufacturer = async () => {
    if (!editingManufacturer || !name.trim()) {
      toast.error("لطفاً نام تولیدکننده را وارد کنید");
      return;
    }

    try {
      const data = {
        name: name.trim()
      };

      const token = tokenCode();
      const res = await apiRequestError("Put", {}, data, `/api/manufacturers/${editingManufacturer.id}`, true, true, token);
      
      if (res.hasError) {
        toast.error(res.errorText || "خطا در ویرایش تولیدکننده");
      } else {
        toast.success("تولیدکننده با موفقیت ویرایش شد");
        setOpenEditDialog(false);
        setEditingManufacturer(null);
        resetForm();
        fetchManufacturers();
      }
    } catch (error) {
      console.error("Error editing manufacturer:", error);
      toast.error("خطا در ویرایش تولیدکننده");
    }
  };

  const handleDeleteManufacturer = async () => {
    if (!deletingManufacturerId) return;

    try {
      const token = tokenCode();
      const res = await apiRequestError("Delete", {}, {}, `/api/manufacturers/${deletingManufacturerId}`, true, true, token);
      
      if (res.hasError) {
        toast.error(res.errorText || "خطا در حذف تولیدکننده");
      } else {
        toast.success("تولیدکننده با موفقیت حذف شد");
        setOpenDeleteDialog(false);
        setDeletingManufacturerId(null);
        fetchManufacturers();
      }
    } catch (error) {
      console.error("Error deleting manufacturer:", error);
      toast.error("خطا در حذف تولیدکننده");
    }
  };

  const resetForm = () => {
    setName("");
  };

  const openEditDialogHandler = (manufacturer: Manufacturer) => {
    setEditingManufacturer(manufacturer);
    setName(manufacturer.name);
    setOpenEditDialog(true);
  };

  const openDeleteDialogHandler = (manufacturerId: number) => {
    setDeletingManufacturerId(manufacturerId);
    setOpenDeleteDialog(true);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: "var(--admin-bg-gradient)",
      paddingTop: { xs: '12px', md: '24px' },
      paddingBottom: { xs: '100px', md: '40px' },
      direction: 'rtl'
    }}>
      <Container maxWidth={false} sx={{ paddingX: { xs: '16px', md: '24px' } }}>
        {/* Header */}
        <Box sx={{ 
          marginBottom: { xs: '16px', md: '24px' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FactoryIcon sx={{ 
              fontSize: { xs: '28px', md: '36px' }, 
              color: 'var(--admin-accent)' 
            }} />
            <Typography sx={{ 
              fontSize: { xs: '20px', md: '28px' }, 
              fontWeight: '700', 
              color: 'var(--admin-text)' 
            }}>
              تولیدکنندگان
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                resetForm();
                setOpenCreateDialog(true);
              }}
              sx={{
                backgroundColor: 'var(--admin-accent)',
                color: 'var(--admin-text)',
                '&:hover': {
                  backgroundColor: 'var(--admin-accent-hover)',
                },
                borderRadius: '12px',
                padding: { xs: '8px 16px', md: '10px 24px' }
              }}
            >
              ثبت تولیدکننده
            </Button>
            <Button
              variant="contained"
              startIcon={<AssessmentIcon />}
              onClick={() => router.push('/admin/manufacturers/report')}
              sx={{
                backgroundColor: '#2196f3',
                color: 'var(--admin-text)',
                '&:hover': {
                  backgroundColor: '#1976d2',
                },
                borderRadius: '12px',
                padding: { xs: '8px 16px', md: '10px 24px' }
              }}
            >
              گزارش فروش
            </Button>
          </Box>
        </Box>

        {/* Manufacturers Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <CircularProgress sx={{ color: 'var(--admin-accent)' }} />
          </Box>
        ) : manufacturers.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            padding: { xs: '40px 20px', md: '60px 40px' },
            backgroundColor: 'var(--admin-surface)',
            borderRadius: '16px',
            border: '1px solid rgba(55, 84, 165, 0.3)'
          }}>
            <FactoryIcon sx={{ 
              fontSize: { xs: '48px', md: '64px' }, 
              color: 'var(--admin-text-secondary)', 
              marginBottom: '16px' 
            }} />
            <Typography sx={{ 
              color: 'var(--admin-text-muted)', 
              fontSize: { xs: '16px', md: '20px' } 
            }}>
              تولیدکننده‌ای یافت نشد
            </Typography>
          </Box>
        ) : (
          <TableContainer 
            component={Paper} 
            sx={{ 
              backgroundColor: 'var(--admin-surface)',
              borderRadius: '16px',
              border: '1px solid rgba(55, 84, 165, 0.3)',
              overflowX: 'auto'
            }}
          >
            <Table aria-label="manufacturers table">
              <TableHead>
                <TableRow>
                  <StyledTableCell align="right">نام تولیدکننده</StyledTableCell>
                  <StyledTableCell align="right">تعداد محصولات</StyledTableCell>
                  <StyledTableCell align="right">تعداد کالای فروش</StyledTableCell>
                  <StyledTableCell align="right">عملیات</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {manufacturers.map((manufacturer) => (
                  <StyledTableRow key={manufacturer.id}>
                    <StyledTableCell align="right">
                      <Typography sx={{ color: 'var(--admin-text)', fontWeight: '600' }}>
                        {manufacturer.name}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <Typography sx={{ color: 'var(--admin-accent)', fontWeight: '600' }}>
                        {formatNumber(manufacturer.products_count || 0)}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <Typography sx={{ color: '#ff9100', fontWeight: '600' }}>
                        {formatNumber(manufacturer.total_sold_quantity || 0)}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <Box sx={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <IconButton
                          onClick={() => openEditDialogHandler(manufacturer)}
                          sx={{
                            color: 'var(--admin-accent)',
                            '&:hover': {
                              backgroundColor: 'var(--admin-menu-hover)',
                            }
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => openDeleteDialogHandler(manufacturer.id)}
                          sx={{
                            color: '#ff4444',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 68, 68, 0.1)',
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </StyledTableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Create Manufacturer Dialog */}
        <Dialog
          open={openCreateDialog}
          onClose={() => {
            setOpenCreateDialog(false);
            resetForm();
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: 'var(--admin-surface)',
              borderRadius: '16px',
              border: '1px solid rgba(55, 84, 165, 0.3)'
            }
          }}
        >
          <DialogTitle sx={{ color: 'var(--admin-text)', fontWeight: '700' }}>
            ثبت تولیدکننده جدید
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
              <TextField
                label="نام تولیدکننده"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'var(--admin-text)',
                    '& fieldset': {
                      borderColor: '#505669',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--admin-accent)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--admin-accent)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'var(--admin-text-muted)',
                  },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px' }}>
            <Button
              onClick={() => {
                setOpenCreateDialog(false);
                resetForm();
              }}
              sx={{ color: 'var(--admin-text-muted)' }}
            >
              انصراف
            </Button>
            <Button
              onClick={handleCreateManufacturer}
              variant="contained"
              sx={{
                backgroundColor: 'var(--admin-accent)',
                '&:hover': {
                  backgroundColor: 'var(--admin-accent-hover)',
                },
              }}
            >
              ثبت
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Manufacturer Dialog */}
        <Dialog
          open={openEditDialog}
          onClose={() => {
            setOpenEditDialog(false);
            setEditingManufacturer(null);
            resetForm();
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: 'var(--admin-surface)',
              borderRadius: '16px',
              border: '1px solid rgba(55, 84, 165, 0.3)'
            }
          }}
        >
          <DialogTitle sx={{ color: 'var(--admin-text)', fontWeight: '700' }}>
            ویرایش تولیدکننده
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
              <TextField
                label="نام تولیدکننده"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'var(--admin-text)',
                    '& fieldset': {
                      borderColor: '#505669',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--admin-accent)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--admin-accent)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'var(--admin-text-muted)',
                  },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px' }}>
            <Button
              onClick={() => {
                setOpenEditDialog(false);
                setEditingManufacturer(null);
                resetForm();
              }}
              sx={{ color: 'var(--admin-text-muted)' }}
            >
              انصراف
            </Button>
            <Button
              onClick={handleEditManufacturer}
              variant="contained"
              sx={{
                backgroundColor: 'var(--admin-accent)',
                '&:hover': {
                  backgroundColor: 'var(--admin-accent-hover)',
                },
              }}
            >
              ذخیره
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => {
            setOpenDeleteDialog(false);
            setDeletingManufacturerId(null);
          }}
          PaperProps={{
            sx: {
              backgroundColor: 'var(--admin-surface)',
              borderRadius: '16px',
              border: '1px solid rgba(55, 84, 165, 0.3)'
            }
          }}
        >
          <DialogTitle sx={{ color: 'var(--admin-text)', fontWeight: '700' }}>
            حذف تولیدکننده
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: 'var(--admin-text-muted)' }}>
              آیا از حذف این تولیدکننده اطمینان دارید؟
            </Typography>
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px' }}>
            <Button
              onClick={() => {
                setOpenDeleteDialog(false);
                setDeletingManufacturerId(null);
              }}
              sx={{ color: 'var(--admin-text-muted)' }}
            >
              انصراف
            </Button>
            <Button
              onClick={handleDeleteManufacturer}
              variant="contained"
              sx={{
                backgroundColor: '#ff4444',
                '&:hover': {
                  backgroundColor: '#cc0000',
                },
              }}
            >
              حذف
            </Button>
          </DialogActions>
        </Dialog>

        <ToastContainer autoClose={3000} position="bottom-right" />
      </Container>
    </Box>
  );
}

