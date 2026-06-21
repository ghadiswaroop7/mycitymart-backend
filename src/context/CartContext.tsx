import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CartContextType {
  cart: { [productId: string]: number };
  addToCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  getItemQuantity: (productId: string) => number;
  getTotalCartCount: () => number;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<{ [productId: string]: number }>({});

  const addToCart = (productId: string) => {
    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const current = prev[productId] || 0;
      if (current <= 1) {
        const newCart = { ...prev };
        delete newCart[productId];
        return newCart;
      }
      return {
        ...prev,
        [productId]: current - 1,
      };
    });
  };

  const getItemQuantity = (productId: string) => {
    return cart[productId] || 0;
  };

  const getTotalCartCount = () => {
    return Object.values(cart).reduce((total, count) => total + count, 0);
  };

  const clearCart = () => {
    setCart({});
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, getItemQuantity, getTotalCartCount, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
