import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Header from "@/components/Header";
import Index from "./pages/Index";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import SupplierDashboard from "./pages/SupplierDashboard";
import SupplierIntegration from "./pages/SupplierIntegration";
import ImportedProducts from "./pages/ImportedProducts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Header />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/produto/:id" element={<ProductPage />} />
              <Route path="/carrinho" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/fornecedores" element={<SupplierDashboard />} />
              <Route path="/fornecedores/integracoes" element={<SupplierIntegration />} />
              <Route path="/fornecedores/produtos" element={<ImportedProducts />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
