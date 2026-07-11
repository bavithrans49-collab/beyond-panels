"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface CartItem {
  id: string;
  comicId: string;
  title: string;
  coverImage: string;
  price: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (comicId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  total: number;
  count: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: async () => {},
  removeItem: async () => {},
  clearCart: async () => {},
  total: 0,
  count: 0,
  loading: false,
});

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!session?.user) {
      setItems([]);
      return;
    }
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch {}
  }, [session]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = async (item: CartItem) => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comicId: item.comicId }),
      });
      if (res.ok) {
        await fetchCart();
      }
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (comicId: string) => {
    if (!session?.user) return;
    setLoading(true);
    try {
      await fetch(`/api/cart?comicId=${comicId}`, { method: "DELETE" });
      await fetchCart();
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!session?.user) return;
    try {
      await fetch("/api/cart", { method: "DELETE" });
      setItems([]);
    } catch {}
  };

  const total = items.reduce((sum, item) => sum + item.price, 0);
  const count = items.length;

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, total, count, loading }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
