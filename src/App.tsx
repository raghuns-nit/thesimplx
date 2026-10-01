import { Routes, Route } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import { LoaderProvider } from './context/LoaderContext';
import PublicLayout from './components/PublicLayout';
import HomePage from './pages/public/HomePage';
import ProductsPage from './pages/public/ProductsPage';
import ProductDetailPage from './pages/public/ProductDetailPage';
import ContactPage from './pages/public/ContactPage';
import EstimatorPage from './pages/public/EstimatorPage';
import VisualSearchPage from './pages/public/VisualSearchPage';
import AboutPage from './pages/public/AboutPage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminApp from './pages/admin/AdminApp';

export default function App() {
  return (
    <SettingsProvider>
      <LoaderProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/estimator" element={<EstimatorPage />} />
            <Route path="/visual-search" element={<VisualSearchPage />} />
            <Route path="/we-are" element={<AboutPage />} />
          </Route>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminApp />} />
        </Routes>
      </LoaderProvider>
    </SettingsProvider>
  );
}
