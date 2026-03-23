import { Link } from 'react-router-dom';
import { Truck } from 'lucide-react';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
}

export default function ProductCard({ id, name, price, image_url }: ProductCardProps) {
  const installments = Math.min(12, Math.max(1, Math.floor(price / 10)));
  const installmentValue = price / installments;

  return (
    <Link
      to={`/produto/${id}`}
      className="group block bg-card rounded-sm overflow-hidden hover:shadow-lg hover:shadow-black/20 transition-all duration-300 animate-fade-in"
    >
      <div className="aspect-square bg-card overflow-hidden">
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground font-body text-sm">
            Sem imagem
          </div>
        )}
      </div>
      <div className="p-3 md:p-4 space-y-1.5">
        <h3 className="font-body text-sm text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {name}
        </h3>
        <p className="font-display font-bold text-xl md:text-2xl text-foreground">
          R$ {price.toFixed(2).replace('.', ',')}
        </p>
        {installments > 1 && (
          <p className="font-body text-xs text-muted-foreground">
            em {installments}x R$ {installmentValue.toFixed(2).replace('.', ',')} sem juros
          </p>
        )}
        <div className="flex items-center gap-1 text-green-400 mt-1">
          <Truck className="h-3.5 w-3.5" />
          <span className="font-body text-xs font-medium">Frete grátis</span>
        </div>
      </div>
    </Link>
  );
}
