export interface CartItem {
  id: number;
  name: string;
  sale_price: string;
  original_sale_price?: string;
  discount_percent?: number;
  quantity: number;
  image?: string;
  images?: any[];
  size?: string | null;
  color?: string | null;
}

const CART_STORAGE_KEY = 'shikshoo_cart';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://webinoplus.ir';

// دریافت توکن کاربر
const getCustomerToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('customer_token');
};

// همگام‌سازی سبد خرید با سرور
export const syncCartWithServer = async (): Promise<void> => {
  const token = getCustomerToken();
  if (!token) return; // اگر کاربر لاگین نکرده، sync نکن

  const cart = getCart();
  
  // تبدیل سبد به فرمت API
  const products = cart.map(item => ({
    product_id: item.id,
    quantity: item.quantity,
    ...(item.size && { size: item.size }),
    ...(item.color && { color: item.color }),
  }));

  try {
    const response = await fetch(`${BASE_URL}/api/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ products }),
    });

    if (!response.ok) {
      console.error('Error syncing cart with server:', response.status);
    }
  } catch (error) {
    console.error('Error syncing cart with server:', error);
  }
};

export const getCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const cart = localStorage.getItem(CART_STORAGE_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch (error) {
    console.error('Error getting cart:', error);
    return [];
  }
};

export const addToCart = (product: {
  id: number;
  name: string;
  sale_price: string | number;
  original_sale_price?: string;
  discount_percent?: number;
  image?: string;
  images?: any[];
  size?: string | null;
  color?: string | null;
}): CartItem[] => {
  const cart = getCart();
  // چک کردن اینکه آیا محصول با همان id، size و color وجود دارد
  const existingItemIndex = cart.findIndex(item => 
    item.id === product.id && 
    item.size === (product.size || null) && 
    item.color === (product.color || null)
  );
  
  if (existingItemIndex >= 0) {
    cart[existingItemIndex].quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      sale_price: typeof product.sale_price === 'string' ? product.sale_price : product.sale_price.toString(),
      original_sale_price: product.original_sale_price,
      discount_percent: product.discount_percent,
      quantity: 1,
      image: product.image,
      images: product.images,
      size: product.size || null,
      color: product.color || null,
    });
  }
  
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  
  // همگام‌سازی با سرور (بدون await - در پس‌زمینه اجرا می‌شود)
  syncCartWithServer().catch(err => console.error('Error syncing cart:', err));
  
  return cart;
};

export const removeFromCart = (productId: number): CartItem[] => {
  const cart = getCart();
  const newCart = cart.filter(item => item.id !== productId);
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
  
  // همگام‌سازی با سرور (بدون await - در پس‌زمینه اجرا می‌شود)
  syncCartWithServer().catch(err => console.error('Error syncing cart:', err));
  
  return newCart;
};

export const updateCartItemQuantity = (productId: number, quantity: number): CartItem[] => {
  const cart = getCart();
  const itemIndex = cart.findIndex(item => item.id === productId);
  
  if (itemIndex >= 0) {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }
    cart[itemIndex].quantity = quantity;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    
    // همگام‌سازی با سرور (بدون await - در پس‌زمینه اجرا می‌شود)
    syncCartWithServer().catch(err => console.error('Error syncing cart:', err));
  }
  
  return cart;
};

export const getCartItemCount = (): number => {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.quantity, 0);
};

export const clearCart = async (): Promise<void> => {
  localStorage.removeItem(CART_STORAGE_KEY);
  
  // حذف سبد از سرور
  const token = getCustomerToken();
  if (token) {
    try {
      await fetch(`${BASE_URL}/api/cart`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error clearing cart on server:', error);
    }
  }
};

export const isProductInCart = (productId: number): boolean => {
  const cart = getCart();
  return cart.some(item => item.id === productId);
};

export const getCartItemQuantity = (productId: number): number => {
  const cart = getCart();
  const item = cart.find(item => item.id === productId);
  return item ? item.quantity : 0;
};

