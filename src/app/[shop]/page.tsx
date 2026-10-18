"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Box, Container, Typography, Grid, CircularProgress } from "@mui/material";
import { apiRequestError } from "@/app/lib/apiRequestError";
import { useShopContext, useShopStorefront } from "@/app/context/ShopContext";
import tokenCode from "@/app/coponent/tokenCode";
import type { StorefrontBlockId } from "@/app/lib/onlineStorefront";
import HeroSlider from "@/app/componentsShop/storefront/HeroSlider";
import CategoryRow from "@/app/componentsShop/storefront/CategoryRow";
import TrustBar from "@/app/componentsShop/storefront/TrustBar";
import ProductRail from "@/app/componentsShop/storefront/ProductRail";
import ProductCard, { type ShopProduct } from "@/app/componentsShop/storefront/ProductCard";
import HomePageSkeleton from "@/app/componentsShop/storefront/HomeSkeletons";

function parseProductList(res: Record<string, unknown>): ShopProduct[] {
  if (!res.hasError && Array.isArray(res.data)) return res.data as ShopProduct[];
  return [];
}

export default function ShopHomePage() {
  const { searchQuery, storefront, visibleCategories, categoriesLoading, primaryColor } =
    useShopContext();
  const { shopPath, shopApi, getCustomerToken } = useShopStorefront();

  const [latestProducts, setLatestProducts] = useState<ShopProduct[]>([]);
  const [bestSellingProducts, setBestSellingProducts] = useState<ShopProduct[]>([]);
  const [bestSellingLoading, setBestSellingLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingMoreRef = useRef(loadingMore);
  const hasMoreRef = useRef(hasMore);
  const currentPageRef = useRef(currentPage);
  const searchQueryRef = useRef(searchQuery);

  const authToken = useCallback(() => getCustomerToken() || tokenCode() || "", [getCustomerToken]);

  const fetchLatest = useCallback(
    async (page: number, isInitial: boolean, search: string) => {
      try {
        if (isInitial) setLoading(true);
        else setLoadingMore(true);

        let url = shopApi(`/api/product?page=${page}`);
        if (search) url += `&search=${encodeURIComponent(search)}`;

        const token = authToken();
        const res = (await apiRequestError("Get", {}, {}, url, !!token, true, token)) as Record<
          string,
          unknown
        >;
        const batch = parseProductList(res);

        if (batch.length || !res.hasError) {
          setLatestProducts((prev) => (isInitial ? batch : [...prev, ...batch]));
          const lastPage = typeof res.last_page === "number" ? res.last_page : null;
          if (lastPage != null) {
            setHasMore(page < lastPage);
          } else {
            setHasMore(batch.length > 0);
          }
          setCurrentPage(page);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [shopApi, authToken],
  );

  useEffect(() => {
    let cancelled = false;
    setHasMore(true);
    setCurrentPage(1);

    (async () => {
      const token = authToken();
      const searching = Boolean(searchQuery.trim());
      setLoading(true);
      if (!searching) setBestSellingLoading(true);

      try {
        let latestUrl = shopApi(`/api/product?page=1`);
        if (searchQuery) latestUrl += `&search=${encodeURIComponent(searchQuery)}`;

        const latestPromise = apiRequestError("Get", {}, {}, latestUrl, !!token, true, token);
        const bestPromise = searching
          ? Promise.resolve(null)
          : apiRequestError(
              "Get",
              {},
              {},
              shopApi("/api/product/best-selling?limit=12"),
              !!token,
              true,
              token,
            );

        const [latestRes, bestRes] = await Promise.all([latestPromise, bestPromise]);
        if (cancelled) return;

        const latestPayload = latestRes as Record<string, unknown>;
        const batch = parseProductList(latestPayload);
        if (batch.length || !latestPayload.hasError) {
          setLatestProducts(batch);
          const lastPage =
            typeof latestPayload.last_page === "number" ? latestPayload.last_page : null;
          setHasMore(lastPage != null ? 1 < lastPage : batch.length > 0);
          setCurrentPage(1);
        }

        if (bestRes && !searching) {
          const bestPayload = bestRes as Record<string, unknown>;
          const fromData = parseProductList(bestPayload);
          if (fromData.length) {
            setBestSellingProducts(fromData);
          } else if (!bestPayload.hasError && Array.isArray(bestRes)) {
            setBestSellingProducts(bestRes as ShopProduct[]);
          }
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) {
          setLoading(false);
          setBestSellingLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shopApi, authToken, searchQuery]);

  const fetchLatestRef = useRef(fetchLatest);
  fetchLatestRef.current = fetchLatest;

  useEffect(() => {
    loadingMoreRef.current = loadingMore;
    hasMoreRef.current = hasMore;
    currentPageRef.current = currentPage;
    searchQueryRef.current = searchQuery;
  }, [loadingMore, hasMore, currentPage, searchQuery]);

  useEffect(() => {
    const onScroll = () => {
      if (loadingMoreRef.current || !hasMoreRef.current) return;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      if (scrollTop + windowHeight >= documentHeight - 240) {
        fetchLatestRef.current(currentPageRef.current + 1, false, searchQueryRef.current);
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isSearchMode = Boolean(searchQuery.trim());
  const showInitialSkeleton = loading && latestProducts.length === 0;

  const blockOrder = useMemo(
    () => storefront.block_order ?? [],
    [storefront.block_order],
  );

  const renderBlock = (blockId: StorefrontBlockId) => {
    switch (blockId) {
      case "hero_slider":
        return (
          <HeroSlider key="hero_slider" banners={storefront.banners} primaryColor={primaryColor} />
        );
      case "categories":
        if (storefront.show_category_row === false) return null;
        return (
          <CategoryRow
            key="categories"
            categories={visibleCategories}
            loading={categoriesLoading}
            shopPath={shopPath}
            primaryColor={primaryColor}
          />
        );
      case "trust":
        return (
          <TrustBar
            key="trust"
            items={storefront.trust_items}
            primaryColor={primaryColor}
          />
        );
      case "best_selling":
        return (
          <ProductRail
            key="best_selling"
            title="پرفروش‌ترین‌ها"
            products={bestSellingProducts}
            loading={bestSellingLoading}
            shopPath={shopPath}
            primaryColor={primaryColor}
            cardStyle={storefront.product_card_style}
          />
        );
      case "category_banners":
        return null;
      case "latest":
        return (
          <Box key="latest">
            <Typography
              sx={{
                fontSize: { xs: 16, md: 18 },
                fontWeight: 800,
                color: "#3f4064",
                mb: 1.5,
              }}
            >
              جدیدترین محصولات
            </Typography>
            {loading && latestProducts.length === 0 ? (
              <Box sx={{ py: 2 }}>
                <CircularProgress size={28} sx={{ color: primaryColor }} />
              </Box>
            ) : (
              <>
                <Grid container spacing={{ xs: 1.5, md: 2 }}>
                  {latestProducts.map((product, i) => (
                    <Grid item xs={6} sm={4} md={3} key={`${product.item_type || "p"}-${product.id}`}>
                      <ProductCard
                        product={product}
                        shopPath={shopPath}
                        primaryColor={primaryColor}
                        priority={i < 4}
                        cardStyle={storefront.product_card_style}
                      />
                    </Grid>
                  ))}
                </Grid>
                {loadingMore ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                    <CircularProgress size={28} sx={{ color: primaryColor }} />
                  </Box>
                ) : null}
              </>
            )}
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f5f5f5",
        pb: { xs: 3, md: 5 },
        "--shop-primary": primaryColor,
      }}
    >
      <Container maxWidth="lg" sx={{ pt: { xs: 1.5, md: 2.5 }, px: { xs: 1.5, md: 2 } }}>
        {showInitialSkeleton ? (
          <HomePageSkeleton />
        ) : isSearchMode ? (
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#3f4064", mb: 2 }}>
              نتایج جستجو برای «{searchQuery}»
            </Typography>
            {loading && latestProducts.length === 0 ? (
              <Grid container spacing={{ xs: 1.5, md: 2 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Grid item xs={6} sm={4} md={3} key={i}>
                    <Box sx={{ bgcolor: "#fff", borderRadius: "10px", p: 1, minHeight: 220 }} />
                  </Grid>
                ))}
              </Grid>
            ) : latestProducts.length === 0 ? (
              <Typography sx={{ color: "#81858b", py: 4, textAlign: "center" }}>
                محصولی یافت نشد.
              </Typography>
            ) : (
              <>
                <Grid container spacing={{ xs: 1.5, md: 2 }}>
                  {latestProducts.map((product, i) => (
                    <Grid item xs={6} sm={4} md={3} key={`${product.item_type || "p"}-${product.id}`}>
                      <ProductCard
                        product={product}
                        shopPath={shopPath}
                        primaryColor={primaryColor}
                        priority={i < 4}
                        cardStyle={storefront.product_card_style}
                      />
                    </Grid>
                  ))}
                </Grid>
                {loadingMore ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                    <CircularProgress size={28} sx={{ color: primaryColor }} />
                  </Box>
                ) : null}
              </>
            )}
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 3 } }}>
            {blockOrder.map((blockId) => renderBlock(blockId))}
          </Box>
        )}
      </Container>
    </Box>
  );
}
