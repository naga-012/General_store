import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('kirana_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('kirana_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, selectedVariant, quantity = 1) => {
    const key = `${product._id}-${selectedVariant.unit}`;

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.key === key);

      if (existingIndex > -1) {
        const existing = prevItems[existingIndex];
        const updatedQty = Math.min(
          existing.quantity + quantity,
          selectedVariant.stock
        );
        const updatedItems = [...prevItems];
        updatedItems[existingIndex] = {
          ...existing,
          quantity: updatedQty,
          price: selectedVariant.price,
        };
        return updatedItems;
      } else {
        const newItem = {
          key,
          productId: product._id,
          name: product.name,
          image: product.image,
          unit: selectedVariant.unit,
          price: selectedVariant.price,
          quantity: Math.min(quantity, selectedVariant.stock),
          maxStock: selectedVariant.stock,
        };
        return [...prevItems, newItem];
      }
    });
  };

  const updateQuantity = (key, quantity) => {
    if (quantity <= 0) {
      removeFromCart(key);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.key === key) {
          const validQty = Math.min(quantity, item.maxStock);
          return { ...item, quantity: validQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (key) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.key !== key));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('kirana_cart');
  };

  const [deliveryOption, setDeliveryOption] = useState('pickup'); // 'pickup' (0) or 'delivery' (40 or Free)

  const FREE_DELIVERY_THRESHOLD = 1000;
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const isFreeDeliveryEligible = subtotal >= FREE_DELIVERY_THRESHOLD;
  const freeDeliveryRemaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const deliveryFee = deliveryOption === 'delivery' ? (isFreeDeliveryEligible ? 0 : 40) : 0;
  const grandTotal = subtotal + deliveryFee;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalItems,
        subtotal,
        deliveryFee,
        grandTotal,
        deliveryOption,
        setDeliveryOption,
        FREE_DELIVERY_THRESHOLD,
        isFreeDeliveryEligible,
        freeDeliveryRemaining,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
