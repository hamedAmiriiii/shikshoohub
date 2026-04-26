"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  Button,
  Paper,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import MenuIcon from '@mui/icons-material/Menu';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VerifiedIcon from '@mui/icons-material/Verified';
import PaymentIcon from '@mui/icons-material/Payment';
import CategoryIcon from '@mui/icons-material/Category';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import Badge from '@mui/material/Badge';
import { apiRequestError } from '@/app/lib/apiRequestError';
import { addToCart, isProductInCart, getCartItemQuantity, updateCartItemQuantity, removeFromCart, type CartItem } from './lib/cart';
import Image from 'next/image';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useRouter } from 'next/navigation';
import { useShopContext } from './context/ShopContext';

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
  sale_price: number;
  purchase_price?: number;
  original_sale_price?: string;
  discount_percent?: number;
  has_discount?: boolean;
  image?: string;
  images?: ProductImage[];
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

const features = [
  {
    id: 1,
    title: 'ارسال فوری',
    subtitle: 'روش‌های ارسال متنوع',
    icon: <LocalShippingIcon sx={{ fontSize: '40px' }} />,
    color: '#2196F3',
  },
  {
    id: 2,
    title: 'ضمانت اصل بودن',
    subtitle: 'خریدی مطمئن داشته باشید',
    icon: <VerifiedIcon sx={{ fontSize: '40px' }} />,
    color: '#4CAF50',
  },
  {
    id: 3,
    title: 'پرداخت ایمن',
    subtitle: 'با درگاه‌های معتبر',
    icon: <PaymentIcon sx={{ fontSize: '40px' }} />,
    color: '#FF9800',
  },
  {
    id: 4,
    title: 'تنوع محصولات',
    subtitle: 'هر آن‌چه نیاز دارید',
    icon: <CategoryIcon sx={{ fontSize: '40px' }} />,
    color: '#9C27B0',
  },
];

const faqs = [
  {
    id: 1,
    question: 'پیگیری سفارش',
    answer: 'سفارشات با توجه به حجم سفارشات 5 تا 7 روز کاری بعد از ثبت ارسال می‌شود. یک هفته بعد از ارسال زمان تحویل دارد. کدهای رهگیری به ترتیب داخل کانال تلگرام قرار می‌گیرد.',
  },
  {
    id: 2,
    question: 'آیا برای خرید لازم است از قبل در وبسایت ثبت‌نام کرده باشم؟',
    answer: 'خیر، شما با انتخاب و اضافه کردن محصولات به سبد خریدتان می‌توانید اطلاعات فردی و ارسالتان را کامل کنید و پرداخت را انجام دهید.',
  },
  {
    id: 3,
    question: 'چطور هزینه سفارش را پرداخت کنم؟',
    answer: 'تمامی کاربران می‌توانند از طریق درگاه بانکی با تمام کارت‌های عضو شتاب هزینه سفارش را به صورت اینترنتی پرداخت نمایند.',
  },
];


const categoryBanners = [
  {
    id: 1,
    title: 'BOYS',
    titleFa: 'پسرانه',
    image: '/pic/boys-1.png',
    backgroundColor: '#87CEEB',
    route: '/shikshoo/category/1',
  },
  {
    id: 2,
    title: 'GIRLS',
    titleFa: 'دخترانه',
    image: '/pic/Girls-1.png',
    backgroundColor: '#FFB6C1',
    route: '/shikshoo/category/2',
  },
];

const categoryCards = [
  {
    id: 1,
    title: '',
    subtitle: '',
    image: '/pic/girls-set.png',
    backgroundColor: '#FFB6C1',
    route: '/shikshoo/category/2',
  },
  {
    id: 2,
    title: '',
    subtitle: '',
    image: '/pic/boys-set.png',
    backgroundColor: '#FFA07A',
    route: '/shikshoo/category/1',
  },
  {
    id: 3,
    title: '',
    subtitle: '',
    image: '/pic/khanegi-g-1.png',
    backgroundColor: '#DDA0DD',
    route: '/shikshoo/category/2',
  },
  {
    id: 4,
    title: '',
    subtitle: '',
    image: '/pic/khanegi-b-1.png',
    backgroundColor: '#98FB98',
    route: '/shikshoo/category/1',
  },
];

export default function ShopHomePage() {
  const router = useRouter();
  const { searchQuery } = useShopContext();
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [bestSellingProducts, setBestSellingProducts] = useState<Product[]>([]);
  const [bestSellingLoading, setBestSellingLoading] = useState(true);
  const [bestSellingScrollPosition, setBestSellingScrollPosition] = useState(0);
  const bestSellingScrollRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [cartUpdateTrigger, setCartUpdateTrigger] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const fetchProducts = useCallback(async (page: number = 1, isInitial: boolean = false, search: string = '') => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      let url = `/api/product?page=${page}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      const res = await apiRequestError("Get", {}, {}, url, true, true, "");
      
      if (!res.hasError && res.data && Array.isArray(res.data)) {
        if (isInitial) {
          setLatestProducts(res.data);
          if (!search) {
            setBestSellingProducts(res.data.slice(0, 8));
          }
        } else {
          setLatestProducts(prev => [...prev, ...res.data]);
        }
        
        // بررسی pagination
        if (res.last_page) {
          setTotalPages(res.last_page);
          setHasMore(page < res.last_page);
        } else {
          setHasMore(res.data.length > 0);
        }
        
        // ذخیره تعداد کل محصولات
        if (res.total !== undefined) {
          setTotalProducts(res.total);
        } else if (isInitial) {
          setTotalProducts(res.data.length);
        }
        
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Fetch products when search changes
  useEffect(() => {
    fetchProducts(1, true, searchQuery);
  }, [fetchProducts, searchQuery]);

  // Fetch best selling products
  useEffect(() => {
    const fetchBestSelling = async () => {
      try {
        setBestSellingLoading(true);
        const res = await apiRequestError("Get", {}, {}, "/api/product/best-selling?limit=10", true, true, "");
        
        console.log('Best Selling API Response:', res);
        console.log('Best Selling API URL:', '/api/product/best-selling?limit=10');
        console.log('Response hasError:', res.hasError);
        console.log('Response data:', res.data);
        console.log('Response is array:', Array.isArray(res));
        console.log('Response.data is array:', Array.isArray(res.data));
        
        if (!res.hasError && res.data && Array.isArray(res.data)) {
          console.log('Setting best selling products from res.data:', res.data);
          setBestSellingProducts(res.data);
        } else if (!res.hasError && Array.isArray(res)) {
          console.log('Setting best selling products from res:', res);
          setBestSellingProducts(res);
        } else {
          console.log('No valid data found in response');
        }
      } catch (error) {
        console.error('Error fetching best selling products:', error);
      } finally {
        setBestSellingLoading(false);
      }
    };
    fetchBestSelling();
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiRequestError("Get", {}, {}, "/api/category?tree=true", false, false, "");
        let categoriesData: Category[] = [];
        
        if (!res.hasError) {
          if (Array.isArray(res)) {
            categoriesData = res;
          } else if (res.data && Array.isArray(res.data)) {
            categoriesData = res.data;
          }
        }
        
        // فقط دسته‌بندی‌های سطح اول (parent_id = null)
        const rootCategories = categoriesData.filter((cat: Category) => cat.parent_id === null);
        setCategories(rootCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Infinite scroll handler
  const loadingMoreRef = useRef(loadingMore);
  const hasMoreRef = useRef(hasMore);
  const currentPageRef = useRef(currentPage);
  const fetchProductsRef = useRef(fetchProducts);
  const searchQueryRef = useRef(searchQuery);

  useEffect(() => {
    loadingMoreRef.current = loadingMore;
    hasMoreRef.current = hasMore;
    currentPageRef.current = currentPage;
    fetchProductsRef.current = fetchProducts;
    searchQueryRef.current = searchQuery;
  }, [loadingMore, hasMore, currentPage, fetchProducts, searchQuery]);

  useEffect(() => {
    const handleScroll = () => {
      if (loadingMoreRef.current || !hasMoreRef.current) return;
      
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // اگر به 200px مانده به پایین صفحه رسیدیم
      if (scrollTop + windowHeight >= documentHeight - 200) {
        fetchProductsRef.current(currentPageRef.current + 1, false, searchQueryRef.current);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(num);
  };

  const calculateDiscount = (originalPrice: number, salePrice: number) => {
    if (originalPrice <= salePrice) return 0;
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  };

  const handleCategoryClick = (route: string) => {
    router.push(route);
  };

  const getProductImage = (product: Product): string => {
    // اولویت با images array
    if (product.images && product.images.length > 0) {
      const firstImage = product.images[0];
      // اگر image_url با /storage شروع می‌شود، باید با base URL ترکیب شود
      if (firstImage.image_url && firstImage.image_url.startsWith('/storage/')) {
        return `https://webinoplus.ir${firstImage.image_url}`;
      }
      // اگر image_url کامل است و با https شروع می‌شود، مستقیماً استفاده کن
      if (firstImage.image_url && firstImage.image_url.startsWith('http')) {
        return firstImage.image_url;
      }
      return firstImage.image_url || '';
    }
    // اگر images وجود نداشت، از image قدیمی استفاده کن
    return product.image || '/pic/noImageShop.jpg';
  };

  const handleAddToCart = (product: Product) => (e: React.MouseEvent) => {
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
  };

  const ProductCard = ({ product }: { product: Product }) => {
    const originalPrice = product.purchase_price || product.sale_price * 1.5;
    const discount = product.discount_percent || calculateDiscount(originalPrice, product.sale_price);
    const hasDiscount = discount > 0;
    const productImage = getProductImage(product);
    const inCart = isProductInCart(product.id);
    const cartQuantity = getCartItemQuantity(product.id);

    const handleIncrease = (e: React.MouseEvent) => {
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
    };

    const handleDecrease = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (cartQuantity > 1) {
        updateCartItemQuantity(product.id, cartQuantity - 1);
      } else {
        removeFromCart(product.id);
      }
      window.dispatchEvent(new Event('cartUpdated'));
      setCartUpdateTrigger(prev => prev + 1);
    };

    return (
      <Card
        onClick={() => router.push(`/shikshoo/product/${product.id}`)}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: 'pointer',
          backgroundColor: '#fff',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          },
          '&:active': {
            transform: { xs: 'scale(0.98)', sm: 'translateY(-4px)' },
          },
        }}
      >
        <Box sx={{ position: 'relative', paddingTop: '100%', backgroundColor: '#f5f5f5' }}>
          {hasDiscount && (
            <Chip
              label={`${discount}٪`}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: '#E53935',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: { xs: '10px', sm: '12px' },
                height: { xs: '20px', sm: '24px' },
                zIndex: 1,
                '& .MuiChip-label': {
                  padding: { xs: '0 6px', sm: '0 8px' },
                },
              }}
            />
          )}
          <CardMedia
            component="img"
            image={productImage}
            alt={product.name}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              padding: '8px',
            }}
          />
        </Box>
        <CardContent sx={{ flexGrow: 1, padding: '12px' }}>
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: '13px', sm: '14px' },
              fontWeight: '500',
              marginBottom: '8px',
              minHeight: { xs: '36px', sm: '40px' },
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.4,
            }}
          >
            {product.name}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {hasDiscount && (
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: '11px', sm: '12px' },
                  color: '#999',
                  textDecoration: 'line-through',
                }}
              >
                {formatNumber(originalPrice)} تومان
              </Typography>
            )}
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '15px', sm: '16px' },
                fontWeight: 'bold',
                color: '#1976d2',
              }}
            >
              {formatNumber(product.sale_price)} تومان
            </Typography>
          </Box>
          {inCart ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: { xs: '8px', sm: '12px' },
                marginTop: '12px',
                border: '1px solid #78b568',
                borderRadius: '15px',
                padding: { xs: '4px 8px', sm: '6px 12px' },
                backgroundColor: '#f0f7ee',
              }}
            >
              <IconButton
                size="small"
                onClick={handleDecrease}
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
                {cartQuantity}
              </Typography>
              <IconButton
                size="small"
                onClick={handleIncrease}
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
              endIcon={<AddShoppingCartIcon />}
              onClick={handleIncrease}
              sx={{
                marginTop: '12px',
                backgroundColor: '#78b568',
                color: '#fff',
                borderRadius: '15px',
                '&:hover': {
                  backgroundColor: '#5a9a4a',
                },
                fontSize: { xs: '12px', sm: '14px' },
                padding: { xs: '6px 12px', sm: '8px 16px' },
              }}
              fullWidth
            >
              افزودن به سبد
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  const handleCategoryChipClick = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    if (categoryId === null) {
      // همه - نمایش همه محصولات
      fetchProducts(1, true, '');
    } else {
      // رفتن به صفحه دسته‌بندی
      router.push(`/shikshoo/category/${categoryId}`);
    }
  };

  return (
    <>
      <Box sx={{ minHeight: '100vh', backgroundColor: '#fff' }}>
        <Container maxWidth="lg" sx={{ padding: { xs: '16px', md: '24px' } }}>
          {/* Show loading state only on initial load */}
          {loading && latestProducts.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh',
                gap: '16px',
              }}
            >
              <CircularProgress size={60} sx={{ color: '#667eea' }} />
              <Typography sx={{ color: '#666', fontSize: '16px' }}>
                در حال بارگذاری...
              </Typography>
            </Box>
          ) : (
            <>
              {/* Category Chips - Horizontal Scroll - DISABLED FOR NOW */}
        {/* {categories.length > 0 && !searchQuery && (
          <Box
            sx={{
              display: 'flex',
              gap: '10px',
              overflowX: 'auto',
              paddingBottom: '12px',
              marginBottom: '16px',
              '&::-webkit-scrollbar': {
                height: '4px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#f0f0f0',
                borderRadius: '10px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#ccc',
                borderRadius: '10px',
              },
            }}
          >
            <Chip
              label="همه"
              icon={<CategoryIcon sx={{ fontSize: '18px' }} />}
              onClick={() => handleCategoryChipClick(null)}
              sx={{
                flexShrink: 0,
                padding: '8px 4px',
                height: '40px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: selectedCategory === null ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#fff',
                background: selectedCategory === null ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#fff',
                color: selectedCategory === null ? '#fff' : '#333',
                border: selectedCategory === null ? 'none' : '1px solid #e0e0e0',
                boxShadow: selectedCategory === null ? '0 4px 12px rgba(102, 126, 234, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
                '&:hover': {
                  backgroundColor: selectedCategory === null ? '#5a6fd6' : '#f5f5f5',
                },
                '& .MuiChip-icon': {
                  color: selectedCategory === null ? '#fff' : '#667eea',
                },
              }}
            />
            {categories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                onClick={() => handleCategoryChipClick(category.id)}
                sx={{
                  flexShrink: 0,
                  padding: '8px 12px',
                  height: '40px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: selectedCategory === category.id ? '#f8e1e7' : '#fff',
                  color: selectedCategory === category.id ? '#e91e63' : '#666',
                  border: selectedCategory === category.id ? '1px solid #e91e63' : '1px solid #e0e0e0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#f8e1e7',
                    borderColor: '#e91e63',
                    color: '#e91e63',
                    transform: 'translateY(-2px)',
                  },
                }}
              />
            ))}
          </Box>
        )} */}

       

        {/* Category Banners - Hide when searching */}
        {!searchQuery && (
          <>
            {/* Category Banners - Boys and Girls */}
            <Grid
              container
              spacing={{ xs: 2, md: 3 }}
              sx={{ marginBottom: { xs: '24px', md: '32px' }, marginTop: { xs: '16px', md: '24px' } }}
            >
              {categoryBanners.map((banner) => (
                <Grid item xs={12} md={6} key={banner.id}>
                  <Card
                    onClick={() => handleCategoryClick(banner.route)}
                    sx={{ 
                      position: 'relative',
                      borderRadius: '24px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      backgroundColor: banner.backgroundColor,
                      height: { xs: '200px', sm: '250px', md: '300px' },
                      transition: 'transform 0.3s, box-shadow 0.3s',
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
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Image
                        src={banner.image}
                        alt={banner.titleFa}
                        fill
                        style={{
                          objectFit: 'contain',
                          padding: '16px',
                        }}
                        priority
                      />
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Category Cards - 4 in a row on desktop */}
            <Grid container spacing={{ xs: 2, md: 2 }} sx={{ marginBottom: { xs: '24px', md: '32px' } }}>
              {categoryCards.map((card) => (
                <Grid item xs={6} md={3} key={card.id}>
                  <Card
                    onClick={() => handleCategoryClick(card.route)}
                    sx={{
                      position: 'relative',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      backgroundColor: card.backgroundColor,
                      height: { xs: '120px', sm: '140px', md: '160px' },
                      transition: 'transform 0.3s, box-shadow 0.3s',
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
                        height: '100%',
                      }}
                    >
                      <Image
                        src={card.image}
                        alt={`${card.title} ${card.subtitle}`}
                        fill
                        style={{
                          objectFit: 'cover',
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: { xs: '6px', md: '8px' },
                          right: { xs: '8px', md: '10px' },
                          zIndex: 2,
                          textAlign: 'right',
                        }}
                  >
                    <Typography
                      sx={{
                        fontSize: { xs: '13px', sm: '14px', md: '16px' },
                        fontWeight: 'bold',
                        color: '#fff',
                        textShadow: '0 2px 6px rgba(0,0,0,0.6)',
                        lineHeight: 1.2,
                        marginBottom: '2px',
                      }}
                    >
                      {card.title}
                      </Typography>
                    <Typography
                      sx={{
                        fontSize: { xs: '11px', sm: '12px', md: '14px' },
                        fontWeight: '600',
                        color: '#fff',
                        textShadow: '0 2px 6px rgba(0,0,0,0.6)',
                      }}
                    >
                      {card.subtitle}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}


 {/* Best Selling Products Section - Hide when searching */}
 {!searchQuery && bestSellingProducts.length > 0 && (
          <Box sx={{ marginBottom: { xs: '32px', md: '48px' }, marginTop: { xs: '16px', md: '24px' } }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                marginBottom: '20px',
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: '20px', md: '24px' },
                  fontWeight: '700',
                  color: '#a855f7',
                }}
              >
                محبوب ترین ها
              </Typography>
            </Box>

            <Box sx={{ position: 'relative' }}>
              {/* Navigation Arrows */}
              {bestSellingProducts.length > 4 && (
                <>
                  <IconButton
                    onClick={() => {
                      if (bestSellingScrollRef.current) {
                        const scrollAmount = bestSellingScrollRef.current.clientWidth * 0.8;
                        bestSellingScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                      }
                    }}
                    sx={{
                      position: 'absolute',
                      left: { xs: '-12px', md: '-20px' },
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 2,
                      backgroundColor: '#fff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      width: { xs: '32px', md: '40px' },
                      height: { xs: '32px', md: '40px' },
                      '&:hover': { backgroundColor: '#f5f5f5' },
                    }}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      if (bestSellingScrollRef.current) {
                        const scrollAmount = bestSellingScrollRef.current.clientWidth * 0.8;
                        bestSellingScrollRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                      }
                    }}
                    sx={{
                      position: 'absolute',
                      right: { xs: '-12px', md: '-20px' },
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 2,
                      backgroundColor: '#fff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      width: { xs: '32px', md: '40px' },
                      height: { xs: '32px', md: '40px' },
                      '&:hover': { backgroundColor: '#f5f5f5' },
                    }}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                </>
              )}

              {/* Products Scroll Container */}
              <Box
                ref={bestSellingScrollRef}
                sx={{
                  display: 'flex',
                  gap: '16px',
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  padding: '8px 0',
                  scrollBehavior: 'smooth',
                  direction: 'rtl',
                  '&::-webkit-scrollbar': {
                    height: '4px',
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: '#f0f0f0',
                    borderRadius: '10px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#ccc',
                    borderRadius: '10px',
                  },
                }}
              >
                {/* View All Card - First Item (Right Side) */}
                <Card
                  onClick={() => router.push('/shikshoo')}
                  sx={{
                    minWidth: { xs: '180px', sm: '220px', md: '260px' },
                    maxWidth: { xs: '180px', sm: '220px', md: '260px' },
                    height: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                    backgroundColor: '#fff',
                    flexShrink: 0,
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  <Box sx={{ position: 'relative',height: '100%', paddingTop: '100%', backgroundColor: '#f5f5f5' }}>
                    <Image
                      src="/pic/fav.webp"
                      alt="محبوب ترین ها"
                      fill
                      style={{ objectFit: 'cover',height: '100%' }}
                    />
                  </Box>
                  {/* <CardContent sx={{ flexGrow: 1, padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      endIcon={<ArrowForwardIcon sx={{ fontSize: '16px' }} />}
                      fullWidth
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push('/shikshoo');
                      }}
                      sx={{
                        backgroundColor: '#2196F3',
                        color: '#fff',
                        borderRadius: '8px',
                        fontSize: '12px',
                        padding: '6px 12px',
                        '&:hover': {
                          backgroundColor: '#1976d2',
                        },
                      }}
                    >
                      مشاهده همه
                    </Button>
                  </CardContent> */}
                </Card>

                {bestSellingProducts.map((product) => {
                  const inCart = isProductInCart(product.id);
                  const cartQuantity = getCartItemQuantity(product.id);
                  
                  // محاسبه قیمت و تخفیف مثل ProductCard
                  const originalPrice = product.purchase_price || product.sale_price * 1.5;
                  const discount = product.discount_percent || calculateDiscount(originalPrice, product.sale_price);
                  const hasDiscount = discount > 0;

                  const handleIncrease = (e: React.MouseEvent) => {
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
                  };

                  const handleDecrease = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (cartQuantity > 1) {
                      updateCartItemQuantity(product.id, cartQuantity - 1);
                    } else {
                      removeFromCart(product.id);
                    }
                    window.dispatchEvent(new Event('cartUpdated'));
                    setCartUpdateTrigger(prev => prev + 1);
                  };

                  return (
                    <Card
                      key={product.id}
                      onClick={() => router.push(`/shikshoo/product/${product.id}`)}
                      sx={{
                        minWidth: { xs: '180px', sm: '220px', md: '260px' },
                        maxWidth: { xs: '180px', sm: '220px', md: '260px' },
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        cursor: 'pointer',
                        backgroundColor: '#fff',
                        flexShrink: 0,
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                        },
                      }}
                    >
                      <Box sx={{ position: 'relative', paddingTop: '100%', backgroundColor: '#f5f5f5' }}>
                        {hasDiscount && (
                          <Chip
                            label={`${discount}٪`}
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              backgroundColor: '#E53935',
                              color: '#fff',
                              fontWeight: 'bold',
                              fontSize: '12px',
                              height: '24px',
                              zIndex: 1,
                              '& .MuiChip-label': {
                                padding: '0 8px',
                              },
                            }}
                          />
                        )}
                        <CardMedia
                          component="img"
                          image={getProductImage(product)}
                          alt={product.name}
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            padding: '8px',
                          }}
                        />
                      </Box>
                      <CardContent sx={{ flexGrow: 1, padding: '12px', display: 'flex', flexDirection: 'column' }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '13px',
                            fontWeight: '500',
                            marginBottom: '8px',
                            minHeight: '36px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.4,
                          }}
                        >
                          {product.name}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {hasDiscount && (
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: '11px',
                                color: '#999',
                                textDecoration: 'line-through',
                              }}
                            >
                              {formatNumber(originalPrice)} تومان
                            </Typography>
                          )}
                          <Typography
                            variant="h6"
                            sx={{
                              fontSize: '15px',
                              fontWeight: 'bold',
                              color: '#1976d2',
                            }}
                          >
                            {formatNumber(product.sale_price)} تومان
                          </Typography>
                        </Box>
                        {inCart ? (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: { xs: '8px', sm: '12px' },
                              marginTop: '12px',
                              border: '1px solid #78b568',
                              borderRadius: '15px',
                              padding: { xs: '4px 8px', sm: '6px 12px' },
                              backgroundColor: '#f0f7ee',
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={handleDecrease}
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
                              {cartQuantity}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={handleIncrease}
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
                            fullWidth
                            endIcon={<AddShoppingCartIcon />}
                            onClick={handleIncrease}
                            sx={{
                              marginLeft: '15px',
                              marginTop: '12px',
                              backgroundColor: '#2196F3',
                              color: '#fff',
                              borderRadius: '8px',
                              fontSize: '12px',
                              padding: '6px 12px',
                              '&:hover': {
                                backgroundColor: '#1976d2',
                              },
                            }}
                          >
                            افزودن به سبد
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </Box>
          </Box>
        )}



        
        {/* Search Results Header */}
        {searchQuery && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '24px',
              marginTop: '16px',
              padding: { xs: '16px', md: '20px 24px' },
              background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)',
              borderRadius: '16px',
              border: '1px solid #e8ecff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Box
                sx={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SearchIcon sx={{ color: '#fff', fontSize: '20px' }} />
              </Box>
              <Typography
                sx={{
                  fontWeight: '600',
                  fontSize: { xs: '15px', md: '17px' },
                  color: '#333',
                }}
              >
                نتایج جستجو
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#fff',
                borderRadius: '24px',
                padding: '8px 16px',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.15)',
              }}
            >
              <Typography sx={{ fontWeight: '700', fontSize: '16px', color: '#667eea' }}>
                {formatNumber(totalProducts)}
              </Typography>
              <Typography sx={{ color: '#666', fontSize: '14px' }}>
                محصول
              </Typography>
            </Box>
          </Box>
        )}

        {/* Latest Products */}
        <Box sx={{ marginBottom: '48px' }}>
          {!searchQuery && (
            <Typography
              variant="h5"
              sx={{
                fontWeight: 'bold',
                marginBottom: '24px',
                color: '#a855f7',
                fontSize: { xs: '20px', md: '24px' },
              }}
            >
              جدیدترین محصولات
            </Typography>
          )}
          {loading ? (
            <Box sx={{ textAlign: 'center', padding: '40px' }}>
              <CircularProgress />
              <Typography sx={{ marginTop: '16px' }}>در حال بارگذاری...</Typography>
            </Box>
          ) : (
            <>
              <Grid container spacing={{ xs: 2, md: 3 }}>
                {latestProducts.map((product) => (
                  <Grid item xs={6} sm={4} md={3} key={product.id}>
                    <ProductCard product={product} />
                  </Grid>
                ))}
              </Grid>
              {loadingMore && (
                <Box sx={{ textAlign: 'center', padding: '40px' }}>
                  <CircularProgress size={40} />
                  <Typography sx={{ marginTop: '16px', fontSize: '14px' }}>
                    در حال بارگذاری محصولات بیشتر...
                  </Typography>
                </Box>
              )}
              {!hasMore && latestProducts.length > 0 && (
                <Box sx={{ textAlign: 'center', padding: '20px' }}>
                  <Typography sx={{ color: '#999', fontSize: '14px' }}>
                    تمام محصولات نمایش داده شد
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>
            </>
          )}
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          backgroundColor: '#1a1d2e',
          color: '#fff',
          padding: { xs: '24px 16px', md: '40px 24px' },
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              marginBottom: '16px',
              fontSize: { xs: '18px', md: '24px' },
            }}
          >
            شیک شو
          </Typography>
          <Typography
            variant="body2"
            sx={{ 
              color: 'rgba(255,255,255,0.7)',
              fontSize: { xs: '12px', md: '14px' },
            }}
          >
            © ۱۴۰۴ - کلیه حقوق این فروشگاه محفوظ است
          </Typography>
        </Container>
      </Box>
    </>
  );
}
