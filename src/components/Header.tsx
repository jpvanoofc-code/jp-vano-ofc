import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, MapPin, Search, Heart, Bell, ChevronDown, Truck } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import logo from '@/assets/logo.png';

export default function Header() {
  const { itemCount } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const canAccessAdmin = isAdmin || user?.email === 'jpvanoofc@gmail.com';
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const categories = [
    'Camisetas', 'Calças', 'Tênis', 'Acessórios', 'Bonés', 'Moletom', 'Ofertas do dia'
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top bar */}
      <div className="bg-secondary/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          {/* Top info strip */}
          <div className="hidden md:flex items-center justify-between py-1 text-xs text-muted-foreground border-b border-border/50">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Envio para todo o Brasil</span>
              <span>|</span>
              <Link to="/fornecedores" className="hover:text-foreground transition-colors flex items-center gap-1">
                <Truck className="h-3 w-3" /> Venda com a gente
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {canAccessAdmin && (
                <Link to="/admin" className="hover:text-foreground transition-colors">Painel Admin</Link>
              )}
              {user ? (
                <button onClick={signOut} className="hover:text-foreground transition-colors">Sair</button>
              ) : (
                <>
                  <Link to="/login" className="hover:text-foreground transition-colors">Crie sua conta</Link>
                  <Link to="/login" className="hover:text-foreground transition-colors font-medium text-foreground">Entre</Link>
                </>
              )}
            </div>
          </div>

          {/* Main header row */}
          <div className="flex items-center gap-4 h-14 md:h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img src={logo} alt="JP Vano" className="h-8 w-8 md:h-10 md:w-10 object-contain" />
              <span className="font-display font-bold text-base md:text-lg tracking-wider text-foreground hidden sm:inline">JP VANO</span>
            </Link>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
              <div className="flex items-center bg-background rounded-sm overflow-hidden">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar produtos, marcas e muito mais..."
                  className="flex-1 px-4 py-2 md:py-2.5 text-sm bg-transparent text-foreground placeholder:text-muted-foreground outline-none font-body"
                />
                <button type="submit" className="px-3 md:px-4 py-2 md:py-2.5 bg-accent hover:bg-accent/80 transition-colors">
                  <Search className="h-4 w-4 md:h-5 md:w-5 text-foreground" />
                </button>
              </div>
            </form>

            {/* Right actions */}
            <div className="hidden md:flex items-center gap-5">
              <Link to={user ? '#' : '/login'} className="flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors">
                <User className="h-5 w-5" />
                <span className="text-[10px] mt-0.5 font-body">{user ? 'Minha conta' : 'Entrar'}</span>
              </Link>
              <Link to="/carrinho" className="relative flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors">
                <ShoppingCart className="h-5 w-5" />
                <span className="text-[10px] mt-0.5 font-body">Carrinho</span>
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-body font-bold">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Mobile actions */}
            <div className="flex md:hidden items-center gap-3">
              <Link to="/carrinho" className="relative text-foreground">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-body font-bold">
                    {itemCount}
                  </span>
                )}
              </Link>
              <button onClick={() => setMenuOpen(!menuOpen)} className="text-foreground">
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Categories bar - Desktop */}
      <div className="hidden md:block bg-secondary/60 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-6 h-9 overflow-x-auto scrollbar-hide">
            <button className="flex items-center gap-1 text-xs font-body text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
              <Menu className="h-3.5 w-3.5" /> Categorias
            </button>
            {categories.map(cat => (
              <Link key={cat} to={`/?cat=${encodeURIComponent(cat)}`} className="text-xs font-body text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                {cat}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-secondary border-b border-border px-4 py-4 space-y-3 animate-fade-in">
          <Link to="/" onClick={() => setMenuOpen(false)} className="block text-sm font-body text-muted-foreground hover:text-foreground">Início</Link>
          {categories.map(cat => (
            <Link key={cat} to={`/?cat=${encodeURIComponent(cat)}`} onClick={() => setMenuOpen(false)} className="block text-sm font-body text-muted-foreground hover:text-foreground pl-2">
              {cat}
            </Link>
          ))}
          <div className="border-t border-border pt-3 space-y-3">
            {canAccessAdmin && (
              <Link to="/admin" onClick={() => setMenuOpen(false)} className="block text-sm font-body text-muted-foreground hover:text-foreground">Painel Admin</Link>
            )}
            {user && (
              <Link to="/fornecedores" onClick={() => setMenuOpen(false)} className="block text-sm font-body text-muted-foreground hover:text-foreground">Fornecedores</Link>
            )}
            {user ? (
              <button onClick={() => { signOut(); setMenuOpen(false); }} className="block text-sm font-body text-muted-foreground hover:text-foreground">Sair</button>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block text-sm font-body text-foreground font-medium">Entrar / Criar conta</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
