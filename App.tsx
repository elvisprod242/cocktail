import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { POS } from './pages/POS';
import { Kitchen } from './pages/Kitchen';
import { Dashboard } from './pages/Dashboard';
import { InventoryAI } from './pages/InventoryAI';
import { Products } from './pages/Products';
import { CartItem, Product, Order, OrderStatus } from './types';
import { initDB, getProducts, getOrders, insertOrder, updateOrderStatusInDB } from './services/db';
import { Loader2 } from 'lucide-react';

// Helper to generate IDs without external deps
const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [isDbReady, setIsDbReady] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const setup = async () => {
      try {
        await initDB();
        setOrders(getOrders());
        setProducts(getProducts());
        setIsDbReady(true);
      } catch (e) {
        console.error("Failed to init DB", e);
      }
    };
    setup();
  }, []);

  const refreshData = () => {
     setProducts(getProducts());
     setOrders(getOrders());
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => setCart([]);

  const placeOrder = (tableNumber: number) => {
    if (cart.length === 0) return;

    const newOrder: Order = {
      id: generateId(),
      items: [...cart],
      total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: OrderStatus.PENDING,
      timestamp: Date.now(),
      tableNumber
    };

    // Persistence SQLite
    insertOrder(newOrder);
    
    // Update local state from DB to be sure
    refreshData();
    clearCart();
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    // Persistence SQLite
    updateOrderStatusInDB(orderId, status);
    // Update local state
    setOrders(getOrders());
  };

  if (!isDbReady) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin mb-4 text-bar-accent" size={48} />
        <p>Chargement de la base de données SQLite...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
        <Navbar />
        <main className="flex-1 h-full overflow-hidden md:ml-20 lg:ml-64 relative">
          <Routes>
            <Route 
              path="/" 
              element={
                <POS 
                  products={products} // Pass dynamic products
                  cart={cart} 
                  addToCart={addToCart} 
                  removeFromCart={removeFromCart} 
                  clearCart={clearCart}
                  placeOrder={placeOrder}
                />
              } 
            />
            <Route 
              path="/kitchen" 
              element={
                <Kitchen 
                  orders={orders} 
                  updateOrderStatus={updateOrderStatus} 
                />
              } 
            />
            <Route 
              path="/dashboard" 
              element={<Dashboard orders={orders} />} 
            />
             <Route 
              path="/products" 
              element={<Products />} 
            />
            <Route 
              path="/ai-mixologist" 
              element={<InventoryAI />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;