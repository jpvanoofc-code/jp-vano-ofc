import { Link } from 'react-router-dom';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
}

export default function ProductCard({ id, name, price, image_url }: ProductCardProps) {
  return (
    <Link
      to={`/produto/${id}`}
      className="group block animate-fade-in"
    >
      <div className="aspect-square bg-card rounded overflow-hidden mb-3">
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
      <h3 className="font-display font-semibold text-sm text-foreground tracking-wide">{name}</h3>
      <p className="font-body text-sm text-muted-foreground mt-1">
        R$ {price.toFixed(2).replace('.', ',')}
      </p>
    </Link>
  );
}
