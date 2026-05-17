"use client";
import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Button,
  Menu,
  MenuItem,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Breadcrumbs,
  Link,
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { apiRequestError } from '@/app/lib/apiRequestError';
import Image from 'next/image';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import MenuIcon from '@mui/icons-material/Menu';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Badge from '@mui/material/Badge';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { addToCart, getCartItemCount, isProductInCart, getCartItemQuantity, updateCartItemQuantity, removeFromCart } from '../../lib/cart';
import { useShopContext } from '../../context/ShopContext';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

interface ProductImage {
  id: number;
  product_id: number;
  image_path: string;
  image_url: string;
  order: number;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: number;
  name: string;
  sale_price: string;
  original_sale_price?: string;
  discount_percent?: number;
  discount_amount?: number;
  has_discount?: boolean;
  image?: string;
  images?: ProductImage[];
  categories?: any[];
}

interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  description?: string;
  order?: number;
  is_active?: boolean;
  children?: Category[];
}

export default function CategoryProductsPage() {
  const params = useParams();
  const router = useRouter();
  const { searchQuery } = useShopContext();
  const categoryId = params?.id as string;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('');
  const [categoryInfo, setCategoryInfo] = useState<Category | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [cartUpdateTrigger, setCartUpdateTrigger] = useState(0);

  useEffect(() => {
    if (categoryId) {
      fetchCategoryInfo();
    }
  }, [categoryId]);

  useEffect(() => {
    if (categoryId) {
      fetchCategoryProducts();
    }
  }, [categoryId, searchQuery]);

  const fetchCategoryInfo = async () => {
    try {
      const res = await apiRequestError("Get", {}, {}, `/api/category/${categoryId}`, false, false, "");
      
      if (!res.hasError && res) {
        setCategoryInfo(res);
        setCategoryName(res.name || '');
        
        // اگر parent_id وجود داشت، اطلاعات parent را هم بگیر
        if (res.parent_id) {
          const parentRes = await apiRequestError("Get", {}, {}, `/api/category/${res.parent_id}`, false, false, "");
          if (!parentRes.hasError && parentRes) {
            setParentCategory(parentRes);
          }
        } else {
          setParentCategory(null);
        }
      }
    } catch (error) {
      console.error("Error fetching category info:", error);
    }
  };

  const fetchCategoryProducts = async (page: number = 1) => {
    try {
      setLoading(true);
      let url = `/api/category/${categoryId}/products?per_page=${perPage}&page=${page}`;
      
      if (searchQuery.trim()) {
        const searchFilterModel = JSON.stringify({ name: searchQuery.trim() });
        url += `&searchFilterModel=${encodeURIComponent(searchFilterModel)}`;
      }

      const res = await apiRequestError("Get", {}, {}, url, false, false, "");

      if (!res.hasError) {
        if (res.data && Array.isArray(res.data)) {
          setProducts(res.data);
          setTotal(res.total || 0);
          setCurrentPage(res.current_page || 1);
          setPerPage(res.per_page || 20);
        } else if (Array.isArray(res)) {
          setProducts(res);
        }
        // اگر category_name در response محصولات وجود داشت و هنوز نام دسته‌بندی را نداریم، از آن استفاده کن
        if (res.category_name && !categoryName) {
          setCategoryName(res.category_name);
        }
      }
    } catch (error) {
      console.error("Error fetching category products:", error);
    } finally {
      setLoading(false);
    }
  };


  const getProductImage = (product: Product): string => {
    if (product.images && product.images.length > 0) {
      const firstImage = product.images[0];
      if (firstImage.image_url) {
        if (firstImage.image_url.startsWith('http')) {
          return firstImage.image_url;
        } else if (firstImage.image_url.startsWith('/storage/')) {
          return `https://api.webinoplus.ir${firstImage.image_url}`;
        }
        return firstImage.image_url;
      }
    }
    if (product.image) {
      if (product.image.startsWith('http')) {
        return product.image;
      } else if (product.image.startsWith('/storage/')) {
        return `https://api.webinoplus.ir${product.image}`;
      }
      return product.image;
    }
    return '/pic/noImageShop.jpg';
  };

  const formatPrice = (price: string | number): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('fa-IR').format(numPrice) + ' تومان';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ padding: { xs: '16px', md: '24px' } }}>
        {/* Loading Overlay */}
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              padding: '32px',
              borderRadius: '20px',
              backgroundColor: '#fff',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}
          >
            <CircularProgress 
              size={48}
              sx={{ 
                color: '#667eea',
              }} 
            />
            <Typography sx={{ color: '#666', fontSize: '15px', fontWeight: '500' }}>
              در حال بارگذاری محصولات...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ padding: { xs: '16px', md: '24px' } }}>
        {/* Category Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '24px',
            padding: { xs: '12px 16px', md: '16px 24px' },
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.25)',
          }}
        >
          {/* Breadcrumb */}
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.5)' }} />}
          >
            <Link
              component="button"
              variant="body2"
              onClick={() => router.push('')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: 'rgba(255,255,255,0.9)',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: '500',
                '&:hover': { color: '#fff' },
              }}
            >
              <HomeIcon sx={{ fontSize: '16px' }} />
              خانه
            </Link>
            {parentCategory && (
              <Link
                component="button"
                variant="body2"
                onClick={() => router.push(`/category/${parentCategory.id}`)}
                sx={{
                  color: 'rgba(255,255,255,0.9)',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: '500',
                  '&:hover': { color: '#fff' },
                }}
              >
                {parentCategory.name}
              </Link>
            )}
            <Typography sx={{ color: '#fff', fontWeight: '600', fontSize: '13px' }}>
              {categoryName}
            </Typography>
          </Breadcrumbs>

          {/* Product Count */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '20px',
              padding: '6px 14px',
            }}
          >
            <Typography sx={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>
              {products.length}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}>
              محصول
            </Typography>
          </Box>
        </Box>

        {products.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '40px',
            }}
          >
            <Typography sx={{ color: '#999', fontSize: '18px' }}>
              {searchQuery ? 'محصولی با این نام یافت نشد' : 'محصولی در این دسته‌بندی یافت نشد'}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {products.map((product) => (
              <Grid item xs={6} sm={4} md={3} key={product.id}>
                <Card
                  onClick={() => router.push(`/product/${product.id}`)}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      paddingTop: '100%',
                      backgroundColor: '#f5f5f5',
                    }}
                  >
                    <Image
                      src={getProductImage(product)}
                      alt={product.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 600px) 50vw, (max-width: 960px) 33vw, 25vw"
                    />
                    {product.has_discount && product.discount_percent && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          backgroundColor: '#f44336',
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                      >
                        {product.discount_percent.toFixed(0)}% تخفیف
                      </Box>
                    )}
                  </Box>
                  <CardContent sx={{ flexGrow: 1, padding: '16px' }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: '#333',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginBottom: '8px',
                        minHeight: '40px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {product.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#78b568',
                        fontSize: '16px',
                        fontWeight: 'bold',
                      }}
                    >
                      {formatPrice(product.sale_price)}
                    </Typography>
                  </CardContent>
                  <Box sx={{ padding: '0 16px 16px 16px' }}>
                    {isProductInCart(product.id) ? (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: { xs: '8px', sm: '12px' },
                          border: '1px solid #78b568',
                          borderRadius: '15px',
                          padding: { xs: '4px 8px', sm: '6px 12px' },
                          backgroundColor: '#f0f7ee',
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            const qty = getCartItemQuantity(product.id);
                            if (qty > 1) {
                              updateCartItemQuantity(product.id, qty - 1);
                            } else {
                              removeFromCart(product.id);
                            }
                            window.dispatchEvent(new Event('cartUpdated'));
                            setCartUpdateTrigger(prev => prev + 1);
                          }}
                          sx={{
                            backgroundColor: '#fff',
                            border: '1px solid #e0e0e0',
                            borderRadius: '10px',
                            padding: { xs: '4px', sm: '6px' },
                            '&:hover': {
                              backgroundColor: '#f5f5f5',
                            },
                          }}
                        >
                          <RemoveIcon sx={{ fontSize: { xs: '16px', sm: '18px' } }} />
                        </IconButton>
                        <Typography
                          sx={{
                            minWidth: { xs: '24px', sm: '30px' },
                            textAlign: 'center',
                            fontSize: { xs: '14px', sm: '16px' },
                            fontWeight: '600',
                            color: '#333',
                          }}
                        >
                          {getCartItemQuantity(product.id)}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart({
                              id: product.id,
                              name: product.name,
                              sale_price: product.sale_price,
                              original_sale_price: product.original_sale_price,
                              discount_percent: product.discount_percent,
                              image: product.image,
                              images: product.images,
                            });
                            window.dispatchEvent(new Event('cartUpdated'));
                            setCartUpdateTrigger(prev => prev + 1);
                          }}
                          sx={{
                            backgroundColor: '#78b568',
                            color: '#fff',
                            borderRadius: '10px',
                            padding: { xs: '4px', sm: '6px' },
                            '&:hover': {
                              backgroundColor: '#5a9a4a',
                            },
                          }}
                        >
                          <AddIcon sx={{ fontSize: { xs: '16px', sm: '18px' } }} />
                        </IconButton>
                      </Box>
                    ) : (
                      <Button
                        variant="contained"
                        startIcon={<AddShoppingCartIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart({
                            id: product.id,
                            name: product.name,
                            sale_price: product.sale_price,
                            original_sale_price: product.original_sale_price,
                            discount_percent: product.discount_percent,
                            image: product.image,
                            images: product.images,
                          });
                          window.dispatchEvent(new Event('cartUpdated'));
                          setCartUpdateTrigger(prev => prev + 1);
                        }}
                        sx={{
                          backgroundColor: '#78b568',
                          color: '#fff',
                          borderRadius: '15px',
                          '&:hover': {
                            backgroundColor: '#5a9a4a',
                          },
                          fontSize: '14px',
                          padding: '8px 16px',
                        }}
                        fullWidth
                      >
                        افزودن به سبد
                      </Button>
                    )}
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
    </Container>
  );
}
