"use client";
import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { apiRequestError } from '@/app/lib/apiRequestError';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import tokenCode from '@/app/coponent/tokenCode';

interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  description?: string;
  order?: number;
  is_active?: boolean;
  children?: Category[];
  level?: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    parent_id: null as number | null,
    description: '',
    order: 1,
    is_active: true,
  });
  const [parentCategories, setParentCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = tokenCode();
      const res = await apiRequestError("Get", {}, {}, `/api/category?tree=true`, true, true, token);
      
      if (!res.hasError && Array.isArray(res)) {
        // اگر API ساختار درختی برمی‌گرداند، مستقیماً استفاده کن
        setCategories(res);
        // برای dropdown والد، لیست مسطح نیاز داریم
        const flatList = flattenTree(res);
        setParentCategories(flatList);
      } else if (!res.hasError && res.data && Array.isArray(res.data)) {
        setCategories(res.data);
        const flatList = flattenTree(res.data);
        setParentCategories(flatList);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('خطا در دریافت دسته‌بندی‌ها');
    } finally {
      setLoading(false);
    }
  };

  const flattenTree = (tree: Category[]): Category[] => {
    let result: Category[] = [];
    tree.forEach(cat => {
      result.push({ ...cat, children: undefined });
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenTree(cat.children));
      }
    });
    return result;
  };


  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        parent_id: category.parent_id,
        description: category.description || '',
        order: category.order || 1,
        is_active: category.is_active !== undefined ? category.is_active : true,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        parent_id: null,
        description: '',
        order: 1,
        is_active: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      parent_id: null,
      description: '',
      order: 1,
      is_active: true,
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('نام دسته‌بندی الزامی است');
      return;
    }

    try {
      const token = tokenCode();
      const url = editingCategory 
        ? `/api/category/${editingCategory.id}`
        : `/api/category`;
      const method = editingCategory ? "Put" : "Post";

      const res = await apiRequestError(
        method,
        {},
        {
          name: formData.name,
          parent_id: formData.parent_id || null,
          description: formData.description || '',
          order: formData.order || 1,
          is_active: formData.is_active,
        },
        url,
        true,
        true,
        token
      );

      if (!res.hasError) {
        toast.success(editingCategory ? 'دسته‌بندی با موفقیت ویرایش شد' : 'دسته‌بندی با موفقیت ایجاد شد');
        handleCloseDialog();
        fetchCategories();
      } else {
        toast.error(res.errorText || 'خطا در ذخیره دسته‌بندی');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('خطا در ذخیره دسته‌بندی');
    }
  };

  const handleDelete = async (categoryId: number) => {
    if (!confirm('آیا از حذف این دسته‌بندی اطمینان دارید؟')) {
      return;
    }

    try {
      const token = tokenCode();
      const res = await apiRequestError(
        "Delete",
        {},
        {},
        `/api/category/${categoryId}`,
        true,
        true,
        token
      );

      if (!res.hasError) {
        toast.success('دسته‌بندی با موفقیت حذف شد');
        fetchCategories();
      } else {
        toast.error(res.errorText || 'خطا در حذف دسته‌بندی');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('خطا در حذف دسته‌بندی');
    }
  };

  const renderCategoryTree = (category: Category, level: number = 0): React.ReactNode => {
    const indent = level * 24;
    
    return (
      <Box key={category.id} sx={{ marginBottom: '8px' }}>
        <Card
          sx={{
            marginLeft: `${indent}px`,
            backgroundColor: level === 0 ? '#2b3143' : level === 1 ? '#353b4f' : '#3f4559',
            border: '1px solid rgba(120, 181, 104, 0.2)',
            borderRadius: '12px',
          }}
        >
          <CardContent sx={{ padding: '12px 16px !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                {category.children && category.children.length > 0 && (
                  <Chip
                    label={category.children.length}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(120, 181, 104, 0.2)',
                      color: '#78b568',
                      fontSize: '11px',
                    }}
                  />
                )}
                <Typography
                  sx={{
                    color: '#fff',
                    fontWeight: level === 0 ? '600' : '500',
                    fontSize: level === 0 ? '16px' : '14px',
                  }}
                >
                  {category.name}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: '8px' }}>
                <IconButton
                  onClick={() => handleOpenDialog(category)}
                  size="small"
                  sx={{
                    color: '#78b568',
                    backgroundColor: 'rgba(120, 181, 104, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(120, 181, 104, 0.2)',
                    },
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => handleDelete(category.id)}
                  size="small"
                  sx={{
                    color: '#ff4444',
                    backgroundColor: 'rgba(255, 68, 68, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 68, 68, 0.2)',
                    },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>
        {category.children && category.children.length > 0 && (
          <Box sx={{ marginTop: '8px' }}>
            {category.children.map(child => renderCategoryTree(child, level + 1))}
          </Box>
        )}
      </Box>
    );
  };

  const getFlattenedCategories = (cats: Category[]): Category[] => {
    let result: Category[] = [];
    cats.forEach(cat => {
      result.push(cat);
      if (cat.children && cat.children.length > 0) {
        result = result.concat(getFlattenedCategories(cat.children));
      }
    });
    return result;
  };

  const getAvailableParents = (currentId?: number): Category[] => {
    const allCategories = getFlattenedCategories(categories);
    // فیلتر کردن خود دسته‌بندی و فرزندانش از لیست والدها
    if (currentId) {
      const currentCategory = allCategories.find(c => c.id === currentId);
      const excludeIds = new Set<number>([currentId]);
      
      const getChildrenIds = (cat: Category) => {
        if (cat.children) {
          cat.children.forEach(child => {
            excludeIds.add(child.id);
            getChildrenIds(child);
          });
        }
      };
      
      if (currentCategory) {
        getChildrenIds(currentCategory);
      }
      
      return allCategories.filter(cat => !excludeIds.has(cat.id));
    }
    return allCategories;
  };

  return (
    <Box sx={{ minHeight: '100vh', padding: '16px', paddingBottom: '100px', direction: 'rtl', background: 'linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold' }}>
            مدیریت دسته‌بندی‌ها
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              backgroundColor: '#78b568',
              '&:hover': {
                backgroundColor: '#6aa558',
              },
            }}
          >
            افزودن دسته‌بندی
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <CircularProgress sx={{ color: '#78b568' }} />
          </Box>
        ) : categories.length === 0 ? (
          <Card sx={{ backgroundColor: '#2b3143', padding: '40px', textAlign: 'center' }}>
            <Typography sx={{ color: '#fff' }}>هیچ دسته‌بندی‌ای وجود ندارد</Typography>
          </Card>
        ) : (
          <Box>
            {categories.map(category => renderCategoryTree(category))}
          </Box>
        )}

        {/* Dialog for Create/Edit */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: '#2b3143',
              borderRadius: '16px',
            },
          }}
        >
          <DialogTitle sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {editingCategory ? 'ویرایش دسته‌بندی' : 'ایجاد دسته‌بندی جدید'}
          </DialogTitle>
          <DialogContent sx={{ paddingTop: '24px' }}>
            <TextField
              fullWidth
              label="نام دسته‌بندی"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={{
                marginBottom: '16px',
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: 'rgba(255,255,255,0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#78b568',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255,255,255,0.7)',
                  '&.Mui-focused': {
                    color: '#78b568',
                  },
                },
              }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="توضیحات (اختیاری)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              sx={{
                marginBottom: '16px',
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: 'rgba(255,255,255,0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#78b568',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255,255,255,0.7)',
                  '&.Mui-focused': {
                    color: '#78b568',
                  },
                },
              }}
            />
            <TextField
              fullWidth
              select
              label="دسته‌بندی والد (اختیاری)"
              value={formData.parent_id || ''}
              onChange={(e) => setFormData({ ...formData, parent_id: e.target.value ? Number(e.target.value) : null })}
              SelectProps={{
                native: true,
              }}
              sx={{
                marginBottom: '16px',
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: 'rgba(255,255,255,0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#78b568',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255,255,255,0.7)',
                  '&.Mui-focused': {
                    color: '#78b568',
                  },
                },
              }}
            >
              <option value="">بدون والد (دسته‌بندی اصلی)</option>
              {getAvailableParents(editingCategory?.id).map(cat => (
                <option key={cat.id} value={cat.id} style={{ backgroundColor: '#2b3143', color: '#fff' }}>
                  {cat.name}
                </option>
              ))}
            </TextField>
            <TextField
              fullWidth
              type="number"
              label="ترتیب نمایش"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) || 1 })}
              inputProps={{ min: 1 }}
              sx={{
                marginBottom: '16px',
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: 'rgba(255,255,255,0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#78b568',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255,255,255,0.7)',
                  '&.Mui-focused': {
                    color: '#78b568',
                  },
                },
              }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#78b568',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#78b568',
                    },
                  }}
                />
              }
              label="فعال"
              sx={{
                color: '#fff',
                marginTop: '8px',
              }}
            />
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Button onClick={handleCloseDialog} sx={{ color: '#fff' }}>
              انصراف
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              sx={{
                backgroundColor: '#78b568',
                '&:hover': {
                  backgroundColor: '#6aa558',
                },
              }}
            >
              {editingCategory ? 'ویرایش' : 'ایجاد'}
            </Button>
          </DialogActions>
        </Dialog>

        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={true}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </Container>
    </Box>
  );
}

