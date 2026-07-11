"use client";

import { useCart } from "@/lib/cart-context";
import Link from "next/link";

export default function CartPage() {
  const { items, removeItem, total, count } = useCart();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-heading text-4xl font-bold text-heroic-blue mb-2">YOUR CART</h1>
      <div className="action-line mb-8 h-4" />

      {count === 0 ? (
        <div className="text-center py-20">
          <div className="speech-bubble inline-block px-8 py-4 text-xl font-heading">
            Your cart is empty!
          </div>
          <div className="mt-6">
            <Link
              href="/catalog"
              className="bg-heroic-blue text-white font-bold px-8 py-3 rounded comic-panel hover:bg-blue-800 transition"
            >
              BROWSE COMICS
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-8">
            {items.map((item) => (
              <div key={item.comicId} className="comic-panel bg-white p-4 flex items-center gap-4">
                <div className="w-16 h-20 bg-heroic-blue/10 rounded flex items-center justify-center flex-shrink-0">
                  {item.coverImage ? (
                    <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover rounded" />
                  ) : (
                    <span className="font-heading text-xl text-heroic-blue/30">{item.title[0]}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-bold">{item.title}</h3>
                  <span className="font-heading text-lg font-bold text-comic-red">₹{item.price}</span>
                </div>
                <button
                  onClick={() => removeItem(item.comicId)}
                  className="text-comic-red font-bold hover:underline text-sm"
                >
                  REMOVE
                </button>
              </div>
            ))}
          </div>

          <div className="comic-panel bg-white p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="font-heading text-2xl font-bold">Total</span>
              <span className="font-heading text-3xl font-bold text-comic-red">₹{total}</span>
            </div>
            <Link
              href="/checkout"
              className="block w-full bg-comic-red text-white font-bold text-center py-3 rounded text-lg hover:bg-red-700 transition"
            >
              PROCEED TO CHECKOUT
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
