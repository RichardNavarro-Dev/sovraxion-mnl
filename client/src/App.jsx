import { useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import Footer from './components/Footer';
import IntroSplash from './components/IntroSplash';
import Navbar from './components/Navbar';
import Toaster from './components/Toaster';
import Account from './pages/Account';
import {
  ArticleDetailPage,
  ArticlesPage,
  CollectionsPage,
  FAQPage,
  ForbiddenPage,
  NotFoundPage,
  OurStoryPage,
} from './pages/ContentPages';
import Home from './pages/Home';
import ProductPage from './pages/ProductPage';
import Shop from './pages/Shop';
import { useAuthStore } from './store/useAuthStore';
import { useUIStore } from './store/useUIStore';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function AdminRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const openAuth = useUIStore((s) => s.openAuth);

  useEffect(() => {
    if (status === 'ready' && !user) openAuth('login', 'admin');
  }, [status, user, openAuth]);

  if (status !== 'ready') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center pt-28">
        <Loader2 className="h-6 w-6 animate-spin text-gold" aria-label="Checking access" />
      </div>
    );
  }
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-5 pt-40 text-center">
        <p className="font-display text-2xl font-semibold text-bone">Owner sign-in required</p>
        <button onClick={() => openAuth('login', 'admin')} className="btn-gold mt-6" data-testid="button-admin-signin">Sign in</button>
      </div>
    );
  }
  if (!user.isOwner) return <ForbiddenPage />;
  return children;
}

function Shell() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/sale" element={<Navigate to="/shop?sale=true" replace />} />
          <Route path="/accessories" element={<Navigate to="/shop?category=Accessories" replace />} />
          <Route path="/collectibles" element={<Navigate to="/shop?category=Collectibles" replace />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/our-story" element={<OurStoryPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/articles/:slug" element={<ArticleDetailPage />} />
          <Route path="/account" element={<Account />} />
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
      <CheckoutModal />
      <AuthModal />
      <Toaster />
    </div>
  );
}

export default function App() {
  const [introDone, setIntroDone] = useState(false);
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <HashRouter>
      <div aria-hidden={!introDone} className={introDone ? '' : 'pointer-events-none'}>
        <Shell />
      </div>
      {!introDone && <IntroSplash onFinish={() => setIntroDone(true)} />}
    </HashRouter>
  );
}
