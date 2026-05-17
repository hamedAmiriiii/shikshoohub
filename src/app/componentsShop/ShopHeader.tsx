"use client";
import { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  Menu,
  MenuItem,
  Avatar,
  Paper,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  InputBase,
} from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import MenuIcon from '@mui/icons-material/Menu';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CloseIcon from '@mui/icons-material/Close';
import CategoryIcon from '@mui/icons-material/Category';
import { getCartItemCount } from '../liberari/cart';

interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  description?: string;
  order?: number;
  is_active?: boolean;
  children?: Category[];
}

interface ShopHeaderProps {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}

export default function ShopHeader({ searchQuery = '', onSearchChange }: ShopHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Hide search on cart and orders pages
  const hideSearch = pathname?.includes('/cart') || pathname?.includes('/orders');
  const [customer, setCustomer] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll for header shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Debounce search - 600ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearchChange && localSearchQuery !== searchQuery) {
        onSearchChange(localSearchQuery);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [localSearchQuery]);

  // Sync local state with prop
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const updateCartCount = () => {
      setCartItemCount(getCartItemCount());
    };
    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    window.addEventListener('cartUpdated', updateCartCount);
    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  useEffect(() => {
    const loadCustomer = () => {
      const token = localStorage.getItem('customer_token');
      const data = localStorage.getItem('customer_data');
      if (token && data) {
        try {
          setCustomer(JSON.parse(data));
        } catch (e) {
          console.error('Error parsing customer data:', e);
        }
      } else {
        setCustomer(null);
      }
    };
    loadCustomer();
    window.addEventListener('storage', loadCustomer);
    window.addEventListener('focus', loadCustomer);
    window.addEventListener('customerLogin', loadCustomer);
    return () => {
      window.removeEventListener('storage', loadCustomer);
      window.removeEventListener('focus', loadCustomer);
      window.removeEventListener('customerLogin', loadCustomer);
    };
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const { apiRequestError } = await import('@/app/lib/apiRequestError');
        const res = await apiRequestError("Get", {}, {}, "/api/category?tree=true", false, false, "");
        
        if (!res.hasError) {
          if (Array.isArray(res)) {
            setCategories(res);
          } else if (res.data && Array.isArray(res.data)) {
            setCategories(res.data);
          }
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryNavigation = (categoryId: number) => {
    router.push(`/category/${categoryId}`);
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    setAnchorEl(null);
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_data');
    setCustomer(null);
    router.push('');
  };

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: isScrolled ? '0 4px 20px rgba(102, 126, 234, 0.3)' : 'none',
          transition: 'box-shadow 0.3s ease',
          zIndex: 1300,
        }}
      >
        <Toolbar sx={{ 
          justifyContent: 'space-between', 
          padding: { xs: '12px 16px', md: '14px 32px' },
          minHeight: { xs: '64px', md: '72px' },
        }}>
          {/* Left Side - Menu & Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: '12px', md: '16px' } }}>
            <IconButton
              edge="start"
              onClick={() => setDrawerOpen(true)}
              sx={{ 
                display: { xs: 'flex', md: 'none' },
                color: '#fff',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '8px',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                },
              }}
            >
              <MenuIcon />
            </IconButton>
            
            <Box
              onClick={() => router.push('')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                marginRight: { xs: '8px', md: '0' },
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.02)',
                },
              }}
            >
              <Box
                sx={{
                  width: { xs: '36px', md: '44px' },
                  height: { xs: '36px', md: '44px' },
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <StorefrontIcon sx={{ color: '#fff', fontSize: { xs: '20px', md: '24px' } }} />
              </Box>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography
                  sx={{
                    fontWeight: '800',
                    fontSize: { sm: '20px', md: '24px' },
                    color: '#fff',
                    letterSpacing: '-0.5px',
                    lineHeight: 1,
                  }}
                >
                  شیک شو
                </Typography>
                <Typography
                  sx={{
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.7)',
                    letterSpacing: '1px',
                  }}
                >
                  SHIK SHOP
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Center - Search (Desktop Only) */}
          {onSearchChange && !hideSearch && (
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                flex: 1,
                maxWidth: '500px',
                margin: '0 32px',
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '6px 16px',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  transition: 'all 0.3s ease',
                  '&:focus-within': {
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    border: '1px solid rgba(255,255,255,0.4)',
                  },
                }}
              >
                <SearchIcon sx={{ color: 'rgba(255,255,255,0.7)', marginLeft: '8px', fontSize: '22px' }} />
                <InputBase
                  placeholder="جستجوی محصول..."
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  sx={{
                    flex: 1,
                    '& .MuiInputBase-input': {
                      color: '#fff',
                      fontSize: '14px',
                      direction: 'rtl',
                      '&::placeholder': {
                        color: 'rgba(255,255,255,0.6)',
                        opacity: 1,
                      },
                    },
                  }}
                />
                {localSearchQuery && (
                  <IconButton
                    size="small"
                    onClick={() => setLocalSearchQuery('')}
                    sx={{ color: 'rgba(255,255,255,0.7)', padding: '4px' }}
                  >
                    <CloseIcon sx={{ fontSize: '18px' }} />
                  </IconButton>
                )}
              </Paper>
            </Box>
          )}

          {/* Right Side - Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: '6px', md: '12px' } }}>
            {customer ? (
              <>
                <Button
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#fff',
                    textTransform: 'none',
                    padding: { xs: '6px 10px', md: '8px 14px' },
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.2)',
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: { xs: 28, md: 32 },
                      height: { xs: 28, md: 32 },
                      bgcolor: '#fff',
                      color: '#667eea',
                      fontSize: { xs: '13px', md: '15px' },
                      fontWeight: '600',
                    }}
                  >
                    {(customer.name || customer.phone || 'U').charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography
                    sx={{
                      fontSize: { xs: '12px', md: '14px' },
                      color: '#fff',
                      fontWeight: 500,
                      display: { xs: 'none', sm: 'block' },
                      maxWidth: '100px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {customer.name || customer.phone}
                  </Typography>
                  <ExpandMoreIcon sx={{ fontSize: '18px', display: { xs: 'none', sm: 'block' } }} />
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  open={menuOpen}
                  onClose={() => setAnchorEl(null)}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                  PaperProps={{
                    sx: {
                      mt: 1.5,
                      minWidth: 200,
                      borderRadius: '16px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                      border: '1px solid rgba(0,0,0,0.05)',
                      overflow: 'hidden',
                    },
                  }}
                >
                  <Box sx={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
                    <Typography sx={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                      {customer.name || 'کاربر'}
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#888' }}>
                      {customer.phone}
                    </Typography>
                  </Box>
                  <MenuItem
                    onClick={() => {
                      setAnchorEl(null);
                      router.push('/orders');
                    }}
                    sx={{
                      gap: '12px',
                      padding: '14px 16px',
                      '&:hover': {
                        backgroundColor: 'rgba(102, 126, 234, 0.08)',
                      },
                    }}
                  >
                    <Box sx={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(102, 126, 234, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <ShoppingBagIcon sx={{ fontSize: '18px', color: '#667eea' }} />
                    </Box>
                    <Typography sx={{ fontSize: '14px', fontWeight: '500' }}>سفارشات من</Typography>
                  </MenuItem>
                  <MenuItem
                    onClick={handleLogout}
                    sx={{
                      gap: '12px',
                      padding: '14px 16px',
                      '&:hover': {
                        backgroundColor: 'rgba(244, 67, 54, 0.08)',
                      },
                    }}
                  >
                    <Box sx={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(244, 67, 54, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <LogoutIcon sx={{ fontSize: '18px', color: '#f44336' }} />
                    </Box>
                    <Typography sx={{ fontSize: '14px', fontWeight: '500', color: '#f44336' }}>خروج از حساب</Typography>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button
                  variant="text"
                  onClick={() => router.push('/login')}
                  startIcon={<PersonOutlineIcon sx={{ fontSize: '18px' }} />}
                  sx={{
                    fontSize: { xs: '12px', md: '14px' },
                    padding: { xs: '6px 10px', md: '8px 16px' },
                    color: '#fff',
                    borderRadius: '12px',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>ورود</Box>
                </Button>
                <Button
                  variant="contained"
                  onClick={() => router.push('/register')}
                  sx={{
                    fontSize: { xs: '12px', md: '14px' },
                    padding: { xs: '8px 14px', md: '10px 20px' },
                    backgroundColor: '#fff',
                    color: '#667eea',
                    fontWeight: '600',
                    borderRadius: '12px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                    '&:hover': {
                      backgroundColor: '#f8f8f8',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  ثبت نام
                </Button>
              </>
            )}
            
            {/* Cart Button */}
            <IconButton
              onClick={() => router.push('/cart')}
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderRadius: '12px',
                padding: { xs: '8px', md: '10px' },
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  transform: 'scale(1.05)',
                },
              }}
            >
              <Badge 
                badgeContent={cartItemCount} 
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: '#ff4757',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '11px',
                    minWidth: '18px',
                    height: '18px',
                    borderRadius: '9px',
                  },
                }}
              >
                <ShoppingCartIcon sx={{ color: '#fff', fontSize: { xs: '22px', md: '24px' } }} />
              </Badge>
            </IconButton>
          </Box>
        </Toolbar>

        {/* Mobile Search Bar */}
        {onSearchChange && !hideSearch && (
          <Box sx={{ 
            display: { xs: 'block', md: 'none' },
            padding: '0 16px 12px',
          }}>
            <Paper
              elevation={0}
              sx={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 14px',
                backgroundColor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <SearchIcon sx={{ color: 'rgba(255,255,255,0.7)', marginLeft: '8px', fontSize: '20px' }} />
              <InputBase
                placeholder="جستجوی محصول..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                sx={{
                  flex: 1,
                  '& .MuiInputBase-input': {
                    color: '#fff',
                    fontSize: '14px',
                    direction: 'rtl',
                    '&::placeholder': {
                      color: 'rgba(255,255,255,0.6)',
                      opacity: 1,
                    },
                  },
                }}
              />
              {localSearchQuery && (
                <IconButton
                  size="small"
                  onClick={() => setLocalSearchQuery('')}
                  sx={{ color: 'rgba(255,255,255,0.7)', padding: '4px' }}
                >
                  <CloseIcon sx={{ fontSize: '16px' }} />
                </IconButton>
              )}
            </Paper>
          </Box>
        )}
      </AppBar>

      {/* Categories Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{
          sx: { zIndex: 2000 },
          keepMounted: true,
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '300px', sm: '340px' },
            zIndex: 2001,
            borderRadius: '24px 0 0 24px',
            boxShadow: '-8px 0 32px rgba(0,0,0,0.1)',
          },
        }}
      >
        {/* Drawer Header */}
        <Box 
          sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '24px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            
            <Typography sx={{ fontWeight: '700', fontSize: '18px', color: '#fff' }}>
              دسته‌بندی‌ها
            </Typography>
          </Box>
          <IconButton
            onClick={() => setDrawerOpen(false)}
            sx={{
              color: '#fff',
              backgroundColor: 'rgba(255,255,255,0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.2)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Drawer Content */}
        <Box sx={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
          {categoriesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <CircularProgress sx={{ color: '#667eea' }} />
            </Box>
          ) : categories.length === 0 ? (
            <Box sx={{ textAlign: 'center', padding: '40px 20px' }}>
              <CategoryIcon sx={{ fontSize: '48px', color: '#ddd', marginBottom: '12px' }} />
              <Typography sx={{ color: '#999', fontSize: '14px' }}>
                دسته‌بندی‌ای یافت نشد
              </Typography>
            </Box>
          ) : (
            <List sx={{ padding: 0 }}>
              {categories.filter(cat => cat.is_active !== false).map((category) => (
                <Accordion
                  key={category.id}
                  sx={{
                    boxShadow: 'none',
                    margin: '0 0 8px 0',
                    backgroundColor: '#f8f9ff',
                    borderRadius: '12px !important',
                    overflow: 'hidden',
                    '&:before': {
                      display: 'none',
                    },
                    '&.Mui-expanded': {
                      margin: '0 0 8px 0',
                      backgroundColor: '#f0f2ff',
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={
                      category.children && category.children.length > 0 ? (
                        <ExpandMoreIcon sx={{ color: '#667eea' }} />
                      ) : null
                    }
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest('.MuiAccordionSummary-expandIconWrapper')) {
                        return;
                      }
                      e.preventDefault();
                      e.stopPropagation();
                      handleCategoryNavigation(category.id);
                    }}
                    sx={{
                      padding: '4px 16px',
                      minHeight: '52px',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(102, 126, 234, 0.08)',
                      },
                      '&.Mui-expanded': {
                        minHeight: '52px',
                      },
                      '& .MuiAccordionSummary-content': {
                        margin: '12px 0',
                      },
                    }}
                  >
                    <Typography sx={{ fontWeight: '600', fontSize: '14px', color: '#333' }}>
                      {category.name}
                    </Typography>
                  </AccordionSummary>
                  {category.children && category.children.length > 0 && (
                    <AccordionDetails sx={{ padding: '0 12px 12px 12px' }}>
                      <List sx={{ padding: 0 }}>
                        {category.children.map((subCategory: any) => (
                          <ListItem key={subCategory.id} disablePadding sx={{ marginBottom: '4px' }}>
                            <ListItemButton
                              onClick={() => handleCategoryNavigation(subCategory.id)}
                              sx={{
                                borderRadius: '10px',
                                padding: '10px 14px',
                                backgroundColor: '#fff',
                                '&:hover': {
                                  backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                },
                              }}
                            >
                              <ListItemText
                                primary={subCategory.name}
                                primaryTypographyProps={{ 
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  color: '#555',
                                }}
                              />
                            </ListItemButton>
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  )}
                </Accordion>
              ))}
            </List>
          )}
        </Box>

        {/* Drawer Footer */}
        <Box 
          sx={{ 
            padding: '16px 20px',
            borderTop: '1px solid #f0f0f0',
            backgroundColor: '#fafafa',
          }}
        >
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              setDrawerOpen(false);
              router.push('');
            }}
            startIcon={<StorefrontIcon />}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              padding: '12px',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: '0 4px 14px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
              },
            }}
          >
            صفحه اصلی فروشگاه
          </Button>
        </Box>
      </Drawer>
    </>
  );
}
