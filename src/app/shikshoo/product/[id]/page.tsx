"use client";
import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  Paper,
  Divider,
  Chip,
  Breadcrumbs,
  Link,
  CircularProgress,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { apiRequestError } from '@/app/lib/apiRequestError';
import Image from 'next/image';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShareIcon from '@mui/icons-material/Share';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { addToCart, isProductInCart, getCartItemQuantity, updateCartItemQuantity, removeFromCart } from '../../lib/cart';
import { findColorByName, isLightColor } from '../../lib/colors';

interface ProductImage {
  id: number;
  product_id: number;
  image_path: string;
  image_url: string;
  order: number;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
  parent_id: number | null;
}

interface Product {
  id: number;
  name: string;
  description?: string;
  sale_price: string;
  original_sale_price?: string;
  purchase_price?: string;
  discount_percent?: number;
  discount_amount?: number;
  has_discount?: boolean;
  image?: string;
  images?: ProductImage[];
  categories?: Category[];
  stock?: number;
  sku?: string;
  brand?: string;
  sizes?: string[];
  colors?: string[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showDescription, setShowDescription] = useState(false);
  const [showReturnGuide, setShowReturnGuide] = useState(false);
  const [cartUpdateTrigger, setCartUpdateTrigger] = useState(0);
  
  // Touch handling for swipe
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await apiRequestError("Get", {}, {}, `/api/product/${productId}`, false, false, "");
      
      if (!res.hasError && res) {
        setProduct(res);
        // Set default size if available
        if (res.sizes && res.sizes.length > 0) {
          setSelectedSize(res.sizes[0]);
        }
        // Set default color if available
        if (res.colors && res.colors.length > 0) {
          setSelectedColor(res.colors[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProductImages = (): string[] => {
    if (product?.images && product.images.length > 0) {
      return product.images.map(img => {
        if (img.image_url.startsWith('http')) {
          return img.image_url;
        } else if (img.image_url.startsWith('/storage/')) {
          return `http://webinoplus.ir${img.image_url}`;
        }
        return img.image_url;
      });
    }
    if (product?.image) {
      if (product.image.startsWith('http')) {
        return [product.image];
      } else if (product.image.startsWith('/storage/')) {
        return [`http://webinoplus.ir${product.image}`];
      }
      return [product.image];
    }
    return ['/pic/noImageShop.jpg'];
  };

  const formatPrice = (price: string | number): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('fa-IR').format(numPrice);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const images = getProductImages();
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0 && currentImageIndex < images.length - 1) {
        // Swipe left - next image
        setCurrentImageIndex(prev => prev + 1);
      } else if (diff < 0 && currentImageIndex > 0) {
        // Swipe right - previous image
        setCurrentImageIndex(prev => prev - 1);
      }
    }
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };

  const handleNextImage = () => {
    const images = getProductImages();
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    addToCart({
      id: product.id,
      name: product.name,
      sale_price: product.sale_price,
      original_sale_price: product.original_sale_price,
      discount_percent: product.discount_percent,
      image: product.image,
      images: product.images,
      size: selectedSize || null,
      color: selectedColor || null,
    });
    window.dispatchEvent(new Event('cartUpdated'));
    setCartUpdateTrigger(prev => prev + 1);
  };

  const handleIncreaseQuantity = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      sale_price: product.sale_price,
      original_sale_price: product.original_sale_price,
      discount_percent: product.discount_percent,
      image: product.image,
      images: product.images,
      size: selectedSize || null,
      color: selectedColor || null,
    });
    window.dispatchEvent(new Event('cartUpdated'));
    setCartUpdateTrigger(prev => prev + 1);
  };

  const handleDecreaseQuantity = () => {
    if (!product) return;
    const qty = getCartItemQuantity(product.id);
    if (qty > 1) {
      updateCartItemQuantity(product.id, qty - 1);
    } else {
      removeFromCart(product.id);
    }
    window.dispatchEvent(new Event('cartUpdated'));
    setCartUpdateTrigger(prev => prev + 1);
  };

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.name,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled share
      }
    }
  };


  if (loading) {
    return (
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
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          zIndex: 1000,
        }}
      >
        <CircularProgress size={48} sx={{ color: '#a855f7' }} />
        <Typography sx={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>
          در حال بارگذاری...
        </Typography>
      </Box>
    );
  }

  if (!product) {
    return (
      <Container maxWidth="lg" sx={{ padding: '24px', textAlign: 'center' }}>
        <Typography variant="h5" sx={{ color: '#666' }}>
          محصول یافت نشد
        </Typography>
        <Button
          variant="contained"
          onClick={() => router.push('/shikshoo')}
          sx={{
            marginTop: '16px',
            backgroundColor: '#a855f7',
            '&:hover': { backgroundColor: '#9333ea' },
          }}
        >
          بازگشت به فروشگاه
        </Button>
      </Container>
    );
  }

  const images = getProductImages();
  const inCart = isProductInCart(product.id);
  const cartQuantity = getCartItemQuantity(product.id);
  const hasDiscount = product.has_discount || (product.original_sale_price && parseFloat(product.original_sale_price) > parseFloat(product.sale_price));
  const discountPercent = product.discount_percent || (product.original_sale_price ? Math.round(((parseFloat(product.original_sale_price) - parseFloat(product.sale_price)) / parseFloat(product.original_sale_price)) * 100) : 0);

  return (
    <Box sx={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingBottom: { xs: '100px', md: '40px' } }}>
      {/* Mobile Header */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: '#fff',
          borderBottom: '1px solid #eee',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <IconButton onClick={() => router.back()}>
          <ArrowBackIcon sx={{ transform: 'rotate(180deg)' }} />
        </IconButton>
        <Typography sx={{ fontWeight: '600', fontSize: '16px', color: '#333' }}>
          جزئیات محصول
        </Typography>
        <Box sx={{ display: 'flex', gap: '4px' }}>
          <IconButton onClick={() => setIsFavorite(!isFavorite)}>
            {isFavorite ? (
              <FavoriteIcon sx={{ color: '#ef4444' }} />
            ) : (
              <FavoriteBorderIcon />
            )}
          </IconButton>
          <IconButton onClick={handleShare}>
            <ShareIcon />
          </IconButton>
        </Box>
      </Box>

      <Container maxWidth="lg" sx={{ padding: { xs: 0, md: '24px' } }}>
        {/* Desktop Breadcrumb */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, marginBottom: '24px' }}>
          <Paper
            sx={{
              padding: '16px 24px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f3e8ff 0%, #fce7f3 100%)',
              boxShadow: 'none',
            }}
          >
            <Breadcrumbs separator={<NavigateNextIcon fontSize="small" sx={{ color: '#a855f7' }} />}>
              <Link
                component="button"
                onClick={() => router.push('/shikshoo')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#7c3aed',
                  textDecoration: 'none',
                  fontSize: '14px',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                <HomeIcon sx={{ fontSize: '18px' }} />
                فروشگاه
              </Link>
              {product.categories && product.categories.length > 0 && (
                <Link
                  component="button"
                  onClick={() => router.push(`/shikshoo/category/${product.categories![0].id}`)}
                  sx={{
                    color: '#7c3aed',
                    textDecoration: 'none',
                    fontSize: '14px',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {product.categories[0].name}
                </Link>
              )}
              <Typography sx={{ color: '#a855f7', fontWeight: '600', fontSize: '14px' }}>
                {product.name.length > 40 ? product.name.substring(0, 40) + '...' : product.name}
              </Typography>
            </Breadcrumbs>
          </Paper>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 0, md: '32px' },
          }}
        >
          {/* Image Section */}
          <Box
            sx={{
              flex: { md: '0 0 50%' },
              maxWidth: { md: '50%' },
            }}
          >
            <Paper
              sx={{
                borderRadius: { xs: 0, md: '20px' },
                overflow: 'hidden',
                backgroundColor: '#fff',
                boxShadow: { xs: 'none', md: '0 4px 20px rgba(0,0,0,0.08)' },
              }}
            >
              {/* Main Image Slider */}
              <Box
                ref={sliderRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                sx={{
                  position: 'relative',
                  width: '100%',
                  paddingTop: { xs: '100%', md: '90%' },
                  backgroundColor: '#fafafa',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${images.length * 100}%`,
                    height: '100%',
                    display: 'flex',
                    transition: 'transform 0.3s ease',
                    transform: `translateX(${-currentImageIndex * (100 / images.length)}%)`,
                  }}
                >
                  {images.map((img, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: 'relative',
                        width: `${100 / images.length}%`,
                        height: '100%',
                        flexShrink: 0,
                      }}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} - ${index + 1}`}
                        fill
                        style={{ objectFit: 'contain', padding: '16px' }}
                        priority={index === 0}
                      />
                    </Box>
                  ))}
                </Box>

                {/* Discount Badge */}
                {hasDiscount && discountPercent > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '14px',
                      zIndex: 2,
                    }}
                  >
                    {discountPercent}%
                  </Box>
                )}

                {/* Navigation Arrows - Desktop and Mobile */}
                {images.length > 1 && (
                  <>
                    <IconButton
                      onClick={handleNextImage}
                      disabled={currentImageIndex >= images.length - 1}
                      sx={{
                        display: 'flex',
                        position: 'absolute',
                        left: { xs: '8px', md: '16px' },
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        width: { xs: '36px', md: '40px' },
                        height: { xs: '36px', md: '40px' },
                        '&:hover': { backgroundColor: '#fff' },
                        '&:disabled': { opacity: 0.3 },
                        zIndex: 3,
                      }}
                    >
                      <ChevronLeftIcon sx={{ fontSize: { xs: '20px', md: '24px' } }} />
                    </IconButton>
                    <IconButton
                      onClick={handlePrevImage}
                      disabled={currentImageIndex <= 0}
                      sx={{
                        display: 'flex',
                        position: 'absolute',
                        right: { xs: '8px', md: '16px' },
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        width: { xs: '36px', md: '40px' },
                        height: { xs: '36px', md: '40px' },
                        '&:hover': { backgroundColor: '#fff' },
                        '&:disabled': { opacity: 0.3 },
                        zIndex: 3,
                      }}
                    >
                      <ChevronRightIcon sx={{ fontSize: { xs: '20px', md: '24px' } }} />
                    </IconButton>
                  </>
                )}
              </Box>

              {/* Dots Indicator */}
              {images.length > 1 && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: { xs: '6px', md: '8px' },
                    padding: { xs: '12px', md: '16px' },
                  }}
                >
                  {images.map((_, index) => (
                    <Box
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      sx={{
                        width: index === currentImageIndex ? { xs: '20px', md: '24px' } : { xs: '6px', md: '8px' },
                        height: { xs: '6px', md: '8px' },
                        borderRadius: '4px',
                        backgroundColor: index === currentImageIndex ? '#a855f7' : '#ddd',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </Box>
              )}

              {/* Thumbnails - Desktop and Mobile */}
              {images.length > 1 && (
                <Box
                  sx={{
                    display: 'flex',
                    gap: { xs: '8px', md: '12px' },
                    padding: { xs: '0 12px 12px', md: '0 16px 16px' },
                    overflowX: 'auto',
                    '&::-webkit-scrollbar': { height: '4px' },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#ddd', borderRadius: '2px' },
                  }}
                >
                  {images.map((img, index) => (
                    <Box
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      sx={{
                        flexShrink: 0,
                        width: { xs: '60px', md: '70px' },
                        height: { xs: '60px', md: '70px' },
                        borderRadius: { xs: '10px', md: '12px' },
                        overflow: 'hidden',
                        border: index === currentImageIndex ? '2px solid #a855f7' : '2px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': { borderColor: '#c084fc' },
                      }}
                    >
                      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                        <Image
                          src={img}
                          alt={`Thumbnail ${index + 1}`}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </Box>

          {/* Product Info Section */}
          <Box sx={{ flex: { md: 1 } }}>
            <Paper
              sx={{
                borderRadius: { xs: '24px 24px 0 0', md: '20px' },
                marginTop: { xs: '-24px', md: 0 },
                padding: { xs: '24px 20px', md: '28px' },
                backgroundColor: '#fff',
                boxShadow: { xs: '0 -4px 20px rgba(0,0,0,0.08)', md: '0 4px 20px rgba(0,0,0,0.08)' },
                position: 'relative',
                zIndex: 10,
              }}
            >
              {/* Category Path - Mobile */}
              {product.categories && product.categories.length > 0 && (
                <Typography
                  sx={{
                    display: { xs: 'block', md: 'none' },
                    fontSize: '12px',
                    color: '#a855f7',
                    marginBottom: '8px',
                  }}
                >
                  {product.categories.map(cat => cat.name).join(' > ')}
                </Typography>
              )}

              {/* Product Name */}
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '18px', md: '24px' },
                  fontWeight: '700',
                  color: '#1f2937',
                  lineHeight: 1.5,
                  marginBottom: '20px',
                }}
              >
                {product.name}
              </Typography>

              {/* Size Selector */}
              {product.sizes && product.sizes.length > 0 && (
                <Box sx={{ marginBottom: '24px' }}>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    سایز:
                    {selectedSize && (
                      <Chip
                        label={selectedSize}
                        size="small"
                        sx={{
                          backgroundColor: '#f3e8ff',
                          color: '#7c3aed',
                          fontWeight: '600',
                        }}
                      />
                    )}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {product.sizes.map((size) => (
                      <Button
                        key={size}
                        variant={selectedSize === size ? 'contained' : 'outlined'}
                        onClick={() => setSelectedSize(size)}
                        sx={{
                          minWidth: '56px',
                          height: '44px',
                          borderRadius: '12px',
                          fontWeight: '600',
                          fontSize: '15px',
                          backgroundColor: selectedSize === size ? '#1f2937' : 'transparent',
                          color: selectedSize === size ? '#fff' : '#374151',
                          borderColor: selectedSize === size ? '#1f2937' : '#e5e7eb',
                          '&:hover': {
                            backgroundColor: selectedSize === size ? '#374151' : '#f9fafb',
                            borderColor: '#9ca3af',
                          },
                        }}
                      >
                        {size}
                      </Button>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Color Selector */}
              {product.colors && product.colors.length > 0 && (
                <Box sx={{ marginBottom: '24px' }}>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    رنگ:
                    {selectedColor && (
                      <Chip
                        label={selectedColor}
                        size="small"
                        sx={{
                          backgroundColor: '#f3e8ff',
                          color: '#7c3aed',
                          fontWeight: '600',
                        }}
                      />
                    )}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {product.colors.map((color) => {
                      const colorInfo = findColorByName(color);
                      const isSelected = selectedColor === color;
                      const bgColor = colorInfo ? colorInfo.hex : (isSelected ? '#ff9100' : 'transparent');
                      
                      // تعیین رنگ متن بر اساس روشنایی رنگ بکگراند
                      let textColor = '#374151'; // پیش‌فرض برای رنگ‌های غیرانتخاب شده
                      if (isSelected) {
                        if (colorInfo) {
                          // اگر رنگ در لیست رنگ‌های اصلی است
                          textColor = isLightColor(colorInfo.hex) ? '#000000' : '#ffffff';
                        } else {
                          // اگر رنگ در لیست نیست، از نارنجی استفاده می‌کنیم
                          textColor = '#ffffff';
                        }
                      } else if (colorInfo) {
                        // برای رنگ‌های غیرانتخاب شده که بکگراند دارند
                        textColor = isLightColor(colorInfo.hex) ? '#000000' : '#ffffff';
                      }
                      
                      return (
                        <Button
                          key={color}
                          variant={isSelected ? 'contained' : 'outlined'}
                          onClick={() => setSelectedColor(color)}
                          sx={{
                            minWidth: '80px',
                            height: '44px',
                            borderRadius: '12px',
                            fontWeight: '600',
                            fontSize: '15px',
                            backgroundColor: isSelected ? (colorInfo ? colorInfo.hex : '#ff9100') : (colorInfo ? colorInfo.hex : 'transparent'),
                            color: textColor,
                            border: isSelected 
                              ? `3px solid ${colorInfo ? (isLightColor(colorInfo.hex) ? '#fbbbbb' : '#fbbbbb') : '#fbbbbb'}` 
                              : `1px solid ${colorInfo ? colorInfo.hex : '#e5e7eb'}`,
           
                            opacity: isSelected ? 1 : (colorInfo ? 0.7 : 1),
                            position: 'relative',
                            '&:hover': {
                              backgroundColor: isSelected 
                                ? (colorInfo ? colorInfo.hex : '#e68000') 
                                : (colorInfo ? colorInfo.hex : '#f9fafb'),
                              border: isSelected 
                                ? `3px solid ${colorInfo ? (isLightColor(colorInfo.hex) ? '#000000' : '#ffffff') : '#ffffff'}` 
                                : `1px solid ${colorInfo ? colorInfo.hex : '#9ca3af'}`,
                              opacity: 1,
                            },
                          }}
                        >
                          {color}
                        </Button>
                      );
                    })}
                  </Box>
                </Box>
              )}

              {/* Shipping Info */}
              <Paper
                sx={{
                  padding: '16px',
                  borderRadius: '16px',
                  backgroundColor: '#f9fafb',
                  marginBottom: '24px',
                  border: '1px solid #e5e7eb',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '16px',
                  }}
                >
                  نوع ارسال
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Box
                      sx={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: '#dbeafe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <LocalShippingIcon sx={{ color: '#3b82f6', fontSize: '20px' }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                        به‌صرفه
                      </Typography>
                      <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>
                        ارسال از 5 تا 7 روز کاری
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Box
                      sx={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: '#dcfce7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <LocalShippingIcon sx={{ color: '#22c55e', fontSize: '20px' }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                        عادی
                      </Typography>
                      <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>
                        ارسال از 3 تا 5 روز کاری
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>

              {/* Guarantee Section */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '24px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                }}
              >
                <VerifiedUserIcon sx={{ color: '#22c55e', fontSize: '20px' }} />
                <Typography sx={{ fontSize: '13px', color: '#166534', fontWeight: '500' }}>
                  گارانتی سلامت فیزیکی کالا
                </Typography>
              </Box>

              {/* Return Policy */}
              <Box
                onClick={() => setShowReturnGuide(true)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '24px',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    backgroundColor: '#f9fafb',
                  },
                }}
              >
                <AssignmentReturnIcon sx={{ color: '#6b7280', fontSize: '20px' }} />
                <Typography sx={{ fontSize: '13px', color: '#6b7280' }}>
                  راهنمای مرجوع کردن کالا
                </Typography>
              </Box>

              {/* Description */}
              {product.description && (
                <Box sx={{ marginBottom: '24px' }}>
                  <Box
                    onClick={() => setShowDescription(!showDescription)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      padding: '12px 0',
                      borderTop: '1px solid #e5e7eb',
                    }}
                  >
                    <Typography sx={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                      توضیحات محصول
                    </Typography>
                    {showDescription ? (
                      <ExpandLessIcon sx={{ color: '#6b7280' }} />
                    ) : (
                      <ExpandMoreIcon sx={{ color: '#6b7280' }} />
                    )}
                  </Box>
                  <Collapse in={showDescription}>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: '#6b7280',
                        lineHeight: 1.8,
                        paddingTop: '8px',
                      }}
                    >
                      {product.description}
                    </Typography>
                  </Collapse>
                </Box>
              )}

              {/* Desktop Price & Add to Cart */}
              <Box
                sx={{
                  display: { xs: 'none', md: 'block' },
                  marginTop: '24px',
                  padding: '20px',
                  borderRadius: '16px',
                  backgroundColor: '#fafafa',
                  border: '1px solid #e5e7eb',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <Box>
                    {hasDiscount && product.original_sale_price && (
                      <Typography
                        sx={{
                          fontSize: '14px',
                          color: '#9ca3af',
                          textDecoration: 'line-through',
                          marginBottom: '4px',
                        }}
                      >
                        {formatPrice(product.original_sale_price)} تومان
                      </Typography>
                    )}
                    <Typography
                      sx={{
                        fontSize: '28px',
                        fontWeight: '700',
                        color: '#1f2937',
                      }}
                    >
                      {formatPrice(product.sale_price)}
                      <Typography component="span" sx={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginRight: '4px' }}>
                        تومان
                      </Typography>
                    </Typography>
                  </Box>
                  {hasDiscount && discountPercent > 0 && (
                    <Chip
                      label={`${discountPercent}% تخفیف`}
                      sx={{
                        backgroundColor: '#fef2f2',
                        color: '#ef4444',
                        fontWeight: '700',
                        fontSize: '14px',
                        height: '36px',
                      }}
                    />
                  )}
                </Box>

                {inCart ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px',
                      borderRadius: '16px',
                      border: '2px solid #a855f7',
                      backgroundColor: '#faf5ff',
                    }}
                  >
                    <IconButton
                      onClick={handleDecreaseQuantity}
                      sx={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        width: '48px',
                        height: '48px',
                        '&:hover': { backgroundColor: '#f9fafb' },
                      }}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <Typography sx={{ fontSize: '20px', fontWeight: '700', color: '#7c3aed' }}>
                      {cartQuantity}
                    </Typography>
                    <IconButton
                      onClick={handleIncreaseQuantity}
                      sx={{
                        backgroundColor: '#a855f7',
                        color: '#fff',
                        width: '48px',
                        height: '48px',
                        '&:hover': { backgroundColor: '#9333ea' },
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>
                ) : (
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleAddToCart}
                    startIcon={<ShoppingBagIcon />}
                    sx={{
                      height: '56px',
                      borderRadius: '16px',
                      fontSize: '16px',
                      fontWeight: '700',
                      backgroundColor: '#ec4899',
                      background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
                      boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #db2777 0%, #9333ea 100%)',
                      },
                    }}
                  >
                    افزودن به سبد خرید
                  </Button>
                )}
              </Box>

              {/* Desktop Actions */}
              <Box
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  justifyContent: 'center',
                  gap: '16px',
                  marginTop: '20px',
                }}
              >
                <Button
                  variant="text"
                  onClick={() => setIsFavorite(!isFavorite)}
                  startIcon={isFavorite ? <FavoriteIcon sx={{ color: '#ef4444' }} /> : <FavoriteBorderIcon />}
                  sx={{ color: '#6b7280', '&:hover': { backgroundColor: '#f3f4f6' } }}
                >
                  مورد علاقه
                </Button>
                <Button
                  variant="text"
                  onClick={handleShare}
                  startIcon={<ShareIcon />}
                  sx={{ color: '#6b7280', '&:hover': { backgroundColor: '#f3f4f6' } }}
                >
                  اشتراک گذاری
                </Button>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Container>

      {/* Mobile Bottom Bar */}
      <Paper
        sx={{
          display: { xs: 'block', md: 'none' },
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 16px',
          backgroundColor: '#fff',
          borderTop: '1px solid #e5e7eb',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
          zIndex: 1000,
        }}
      >
        {/* Installment Banner */}
        {/* <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px',
            marginBottom: '12px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          }}
        >
          <Typography sx={{ color: '#fff', fontSize: '13px', fontWeight: '600' }}>
            این کالا را در ۴ قسط بخرید
          </Typography>
          <Box
            sx={{
              backgroundColor: '#fff',
              color: '#1d4ed8',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '700',
            }}
          >
            Pay!
          </Box>
        </Box> */}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Price Section */}
          <Box>
            {hasDiscount && discountPercent > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <Chip
                  label={`${discountPercent}%`}
                  size="small"
                  sx={{
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: '12px',
                    height: '22px',
                  }}
                />
                {product.original_sale_price && (
                  <Typography
                    sx={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      textDecoration: 'line-through',
                    }}
                  >
                    {formatPrice(product.original_sale_price)}
                  </Typography>
                )}
              </Box>
            )}
            <Typography sx={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
              {formatPrice(product.sale_price)}
              <Typography component="span" sx={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', marginRight: '4px' }}>
                تومان
              </Typography>
            </Typography>
          </Box>

          {/* Add to Cart Button */}
          {inCart ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '6px',
                borderRadius: '14px',
                border: '2px solid #a855f7',
                backgroundColor: '#faf5ff',
              }}
            >
              <IconButton
                onClick={handleDecreaseQuantity}
                size="small"
                sx={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  width: '36px',
                  height: '36px',
                }}
              >
                <RemoveIcon sx={{ fontSize: '20px' }} />
              </IconButton>
              <Typography sx={{ fontSize: '18px', fontWeight: '700', color: '#7c3aed', minWidth: '28px', textAlign: 'center' }}>
                {cartQuantity}
              </Typography>
              <IconButton
                onClick={handleIncreaseQuantity}
                size="small"
                sx={{
                  backgroundColor: '#a855f7',
                  color: '#fff',
                  width: '36px',
                  height: '36px',
                  '&:hover': { backgroundColor: '#9333ea' },
                }}
              >
                <AddIcon sx={{ fontSize: '20px' }} />
              </IconButton>
            </Box>
          ) : (
            <Button
              variant="contained"
              onClick={handleAddToCart}
              sx={{
                height: '48px',
                padding: '0 32px',
                borderRadius: '14px',
                fontSize: '15px',
                fontWeight: '700',
                backgroundColor: '#ec4899',
                background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
                boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #db2777 0%, #9333ea 100%)',
                },
              }}
            >
              افزودن به سبد خرید
            </Button>
          )}
        </Box>
      </Paper>

      {/* Return Guide Dialog */}
      <Dialog
        open={showReturnGuide}
        onClose={() => setShowReturnGuide(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: '24px 24px 0 0', md: '20px' },
            margin: { xs: 0, md: '32px' },
            maxHeight: { xs: '90vh', md: '80vh' },
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: { xs: '20px', md: '24px' },
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Box
              sx={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AssignmentReturnIcon sx={{ color: '#ef4444', fontSize: '24px' }} />
            </Box>
            <Typography sx={{ fontSize: { xs: '18px', md: '20px' }, fontWeight: '700', color: '#1f2937' }}>
              راهنمای مرجوع کردن کالا
            </Typography>
          </Box>
          <IconButton
            onClick={() => setShowReturnGuide(false)}
            sx={{ color: '#6b7280' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ padding: { xs: '20px', md: '24px' }, direction: 'rtl' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* تعویض کالا */}
            <Paper
              sx={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: '#fef3c7',
                border: '1px solid #fcd34d',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'start', gap: '12px', marginBottom: '8px' }}>
                <Box
                  sx={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Typography sx={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>
                    ۱
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '16px', fontWeight: '700', color: '#92400e', marginBottom: '8px' }}>
                    تعویض کالا
                  </Typography>
                  <Typography sx={{ fontSize: '14px', color: '#78350f', lineHeight: 1.8 }}>
                    در صورت درخواست تعویض کالا، هزینه ارسال با مشتری است.
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* مشکل فیزیکی */}
            <Paper
              sx={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: '#dcfce7',
                border: '1px solid #86efac',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'start', gap: '12px', marginBottom: '8px' }}>
                <Box
                  sx={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#22c55e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Typography sx={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>
                    ۲
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '16px', fontWeight: '700', color: '#166534', marginBottom: '8px' }}>
                    مشکل فیزیکی کالا
                  </Typography>
                  <Typography sx={{ fontSize: '14px', color: '#14532d', lineHeight: 1.8 }}>
                    در صورت وجود مشکل فیزیکی در کالا (خرابی، نقص)، هزینه ارسال با شیکشو است.
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* اطلاعات بیشتر */}
            <Box sx={{ marginTop: '8px' }}>
              <Typography sx={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.8 }}>
                برای درخواست مرجوعی، لطفاً با پشتیبانی تماس بگیرید .
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ padding: { xs: '16px 20px', md: '16px 24px' }, borderTop: '1px solid #e5e7eb' }}>
          <Button
            onClick={() => setShowReturnGuide(false)}
            variant="contained"
            fullWidth
            sx={{
              backgroundColor: '#a855f7',
              color: '#fff',
              borderRadius: '12px',
              padding: '10px',
              fontSize: '15px',
              fontWeight: '600',
              '&:hover': {
                backgroundColor: '#9333ea',
              },
            }}
          >
            متوجه شدم
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

