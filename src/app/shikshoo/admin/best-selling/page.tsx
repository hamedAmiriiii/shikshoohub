"use client";
import { useState, useEffect } from 'react';
import { Box, Container, Grid, Card, CardContent, CardMedia, Typography, CircularProgress, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import { tableCellClasses } from '@mui/material/TableCell';
import { apiRequestError } from '@/app/lib/apiRequestError';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

interface BestSellingProduct {
  id: number;
  name: string;
  image?: string;
  sale_price: number;
  purchase_price: number;
  total_sold: number; // تعداد فروش
  quantity?: number;
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('fa-IR').format(num);
};

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "#1a1d2e",
    color: "#fff",
    fontWeight: "600",
    fontSize: "16px",
    padding: "16px 24px",
  },
  [`&.${tableCellClasses.body}`]: {
    color: "#fff",
    fontSize: 16,
    padding: "16px 24px",
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: "#2b3143",
  '&:nth-of-type(even)': {
    backgroundColor: "#1a1d2e",
  },
  '&:hover': {
    backgroundColor: "rgba(120, 181, 104, 0.1)",
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

export default function BestSellingPage() {
  const [products, setProducts] = useState<BestSellingProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBestSelling = async () => {
      try {
        setLoading(true);
        const res = await apiRequestError("Get", {}, {}, `/api/product/best-selling?limit=50`, true, true, "");
        console.log("ddddddddddddd" , res);
        
        if (res.hasError) {
          console.error("Error fetching best selling products:", res.errorText);
          setProducts([]);
        } else {
          // اگر res یک آرایه است، مستقیماً استفاده کن
          // اگر res.data یک آرایه است، از آن استفاده کن
          const data = Array.isArray(res) ? res : (Array.isArray(res.data) ? res.data : []);
          setProducts(data);
        }
      } catch (error) {
        console.error("Error fetching best selling products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSelling();
  }, []);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        direction: 'rtl'
      }}>
        <CircularProgress sx={{ color: '#78b568' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: "linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)",
      paddingTop: { xs: '12px', md: '24px' },
      paddingBottom: { xs: '100px', md: '40px' },
      direction: 'rtl'
    }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ 
          marginBottom: { xs: '16px', md: '24px' },
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <TrendingUpIcon sx={{ 
            fontSize: { xs: '28px', md: '36px' }, 
            color: '#78b568' 
          }} />
          <Typography sx={{ 
            fontSize: { xs: '20px', md: '28px' }, 
            fontWeight: '700', 
            color: '#fff' 
          }}>
            محصولات پرفروش
          </Typography>
        </Box>

        {products.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            padding: { xs: '40px 20px', md: '60px 40px' },
            backgroundColor: '#2b3143',
            borderRadius: '16px',
            border: '1px solid rgba(55, 84, 165, 0.3)'
          }}>
            <ShoppingCartIcon sx={{ 
              fontSize: { xs: '48px', md: '64px' }, 
              color: 'rgba(255,255,255,0.3)', 
              marginBottom: '16px' 
            }} />
            <Typography sx={{ 
              color: 'rgba(255,255,255,0.6)', 
              fontSize: { xs: '16px', md: '20px' } 
            }}>
              محصولی یافت نشد
            </Typography>
          </Box>
        ) : (
          <>
            {/* Desktop Table View */}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <TableContainer 
                component={Paper} 
                sx={{ 
                  backgroundColor: '#2b3143',
                  borderRadius: '16px',
                  border: '1px solid rgba(55, 84, 165, 0.3)',
                  overflowX: 'auto'
                }}
              >
                <Table aria-label="best selling products table">
                  <TableHead>
                    <TableRow>
                      <StyledTableCell align="right" sx={{ width: '60px' }}>رتبه</StyledTableCell>
                      <StyledTableCell align="right">تصویر</StyledTableCell>
                      <StyledTableCell align="right">نام محصول</StyledTableCell>
                      <StyledTableCell align="right">تعداد فروش</StyledTableCell>
                      <StyledTableCell align="right">قیمت</StyledTableCell>
                      <StyledTableCell align="right">موجودی</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map((product, index) => (
                      <StyledTableRow key={product.id}>
                        <StyledTableCell align="right">
                          <Chip 
                            label={`#${index + 1}`}
                            sx={{
                              backgroundColor: index < 3 ? '#78b568' : 'rgba(120, 181, 104, 0.3)',
                              color: '#fff',
                              fontWeight: '700',
                              fontSize: '14px'
                            }}
                          />
                        </StyledTableCell>
                        <StyledTableCell align="right">
                          <Avatar
                            src={product.image || '/placeholder-product.png'}
                            alt={product.name}
                            sx={{
                              width: 60,
                              height: 60,
                              borderRadius: '8px',
                              backgroundColor: '#1a1d2e'
                            }}
                            variant="rounded"
                          />
                        </StyledTableCell>
                        <StyledTableCell align="right">
                          <Typography sx={{ 
                            color: '#fff', 
                            fontSize: '16px',
                            fontWeight: '600'
                          }}>
                            {product.name}
                          </Typography>
                        </StyledTableCell>
                        <StyledTableCell align="right">
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            justifyContent: 'flex-end'
                          }}>
                            <ShoppingCartIcon sx={{ 
                              fontSize: '20px', 
                              color: '#78b568' 
                            }} />
                            <Typography sx={{ 
                              color: '#78b568', 
                              fontSize: '16px',
                              fontWeight: '700'
                            }}>
                              {formatNumber(product.total_sold || 0)}
                            </Typography>
                          </Box>
                        </StyledTableCell>
                        <StyledTableCell align="right">
                          <Typography sx={{ 
                            color: '#78b568', 
                            fontSize: '16px',
                            fontWeight: '700'
                          }}>
                            {formatNumber(product.sale_price)} تومان
                          </Typography>
                        </StyledTableCell>
                        <StyledTableCell align="right">
                          <Typography sx={{ 
                            color: product.quantity !== undefined && product.quantity > 0 ? '#78b568' : '#ff4444', 
                            fontSize: '16px',
                            fontWeight: '600'
                          }}>
                            {product.quantity !== undefined ? formatNumber(product.quantity) : '-'}
                          </Typography>
                        </StyledTableCell>
                      </StyledTableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Mobile Card View */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              <Grid container spacing={2}>
                {products.map((product, index) => (
                  <Grid item xs={12} sm={6} key={product.id}>
                    <Card sx={{ 
                      backgroundColor: '#2b3143',
                      borderRadius: '16px',
                      border: '1px solid rgba(55, 84, 165, 0.3)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(120, 181, 104, 0.2)',
                        borderColor: 'rgba(120, 181, 104, 0.5)'
                      }
                    }}>
                      {/* Rank Badge */}
                      <Box sx={{ 
                        position: 'absolute', 
                        top: '8px', 
                        left: '8px', 
                        zIndex: 1 
                      }}>
                        <Chip 
                          label={`#${index + 1}`}
                          sx={{
                            backgroundColor: index < 3 ? '#78b568' : 'rgba(120, 181, 104, 0.3)',
                            color: '#fff',
                            fontWeight: '700',
                            fontSize: '12px'
                          }}
                        />
                      </Box>

                      {/* Product Image */}
                      <CardMedia
                        component="img"
                        height="200"
                        image={product.image || '/placeholder-product.png'}
                        alt={product.name}
                        sx={{
                          objectFit: 'cover',
                          backgroundColor: '#1a1d2e'
                        }}
                      />

                      <CardContent sx={{ 
                        flexGrow: 1, 
                        display: 'flex', 
                        flexDirection: 'column',
                        padding: '12px'
                      }}>
                        {/* Product Name */}
                        <Typography 
                          sx={{ 
                            color: '#fff', 
                            fontSize: '14px',
                            fontWeight: '600',
                            marginBottom: '12px',
                            minHeight: '40px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {product.name}
                        </Typography>

                        {/* Sales Count */}
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          marginBottom: '12px',
                          padding: '8px 12px',
                          backgroundColor: 'rgba(120, 181, 104, 0.1)',
                          borderRadius: '8px'
                        }}>
                          <ShoppingCartIcon sx={{ 
                            fontSize: '18px', 
                            color: '#78b568' 
                          }} />
                          <Typography sx={{ 
                            color: '#78b568', 
                            fontSize: '14px',
                            fontWeight: '700'
                          }}>
                            تعداد فروش: {formatNumber(product.total_sold || 0)}
                          </Typography>
                        </Box>

                        {/* Price */}
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginTop: 'auto'
                        }}>
                          <Typography sx={{ 
                            color: 'rgba(255,255,255,0.7)', 
                            fontSize: '12px'
                          }}>
                            قیمت:
                          </Typography>
                          <Typography sx={{ 
                            color: '#78b568', 
                            fontSize: '16px',
                            fontWeight: '700'
                          }}>
                            {formatNumber(product.sale_price)} تومان
                          </Typography>
                        </Box>

                        {/* Stock Quantity */}
                        {product.quantity !== undefined && (
                          <Box sx={{ 
                            marginTop: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <Typography sx={{ 
                              color: 'rgba(255,255,255,0.7)', 
                              fontSize: '12px'
                            }}>
                              موجودی:
                            </Typography>
                            <Typography sx={{ 
                              color: product.quantity > 0 ? '#78b568' : '#ff4444', 
                              fontSize: '14px',
                              fontWeight: '600'
                            }}>
                              {formatNumber(product.quantity)}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
}

