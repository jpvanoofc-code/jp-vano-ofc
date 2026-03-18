import { Link } from 'react-router-dom';
import { ShoppingBag, User, Menu, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import logo from '@/assets/logo.png';

export default function Header() {
  const { itemCount } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const canAccessAdmin = isAdmin || user?.email === 'jpvanoofc@gmail.com';
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="JP Vano" className="h-10 w-10 object-contain" />
          <span className="font-display font-bold text-lg tracking-wider text-foreground">JP VANO</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors">
            Início
          </Link>
          {isAdmin && (
            <Link to="/admin" className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors">
              Painel Admin
            </Link>
          )}
          {user ? (
            <button onClick={signOut} className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors">
              Sair
            </button>
          ) : (
            <Link to="/login" className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors">
              <User className="h-5 w-5" />
            </Link>
          )}
          <Link to="/carrinho" className="relative">
            <ShoppingBag className="h-5 w-5 text-foreground" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-body font-semibold">
                {itemCount}
              </span>
            )}
          </Link>
        </nav>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-4">
          <Link to="/carrinho" className="relative">
            <ShoppingBag className="h-5 w-5 text-foreground" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-body font-semibold">
                {itemCount}
              </span>
            )}
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-background border-b border-border px-4 py-4 space-y-3">
          <Link to="/" onClick={() => setMenuOpen(false)} className="block text-sm font-body text-muted-foreground">Início</Link>
          {isAdmin && (
            <Link to="/admin" onClick={() => setMenuOpen(false)} className="block text-sm font-body text-muted-foreground">Painel Admin</Link>
          )}
          {user ? (
            <button onClick={() => { signOut(); setMenuOpen(false); }} className="block text-sm font-body text-muted-foreground">Sair</button>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)} className="block text-sm font-body text-muted-foreground">Entrar</Link>
          )}
        </div>
      )}
    </header>
  );
}
