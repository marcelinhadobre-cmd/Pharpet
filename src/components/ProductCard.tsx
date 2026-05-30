import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { formatBRL } from "@/lib/whatsapp";
import { ShoppingBag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { OrderModal } from "@/components/OrderModal";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  primary_image_url: string | null;
}

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);

  const openDetail = () => {
    trackEvent("product_view", product.id, { name: product.name });
    setDetailOpen(true);
  };

  const openOrder = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    trackEvent("order_click", product.id, { name: product.name });
    setDetailOpen(false);
    setOrderOpen(true);
  };

  return (
    <>
      <div
        onClick={openDetail}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDetail();
          }
        }}
        className="card-premium group flex flex-col overflow-hidden rounded-2xl animate-fade-up cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <div className="relative aspect-square overflow-hidden bg-secondary/40">
          {product.primary_image_url ? (
            <img
              src={product.primary_image_url}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              Sem imagem
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <h3 className="font-display text-lg font-semibold leading-tight">{product.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
          </div>
          <div className="mt-auto flex items-center justify-between gap-2">
            <span className="text-xl font-bold text-gradient">{formatBRL(Number(product.price))}</span>
            <button
              onClick={openOrder}
              className="btn-hero inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold"
            >
              <ShoppingBag className="h-4 w-4" />
              Pedir agora
            </button>
          </div>
        </div>
      </div>

      {/* Product detail modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto gap-0 p-0">
          <div className="relative aspect-square w-full overflow-hidden bg-secondary/40">
            {product.primary_image_url ? (
              <img src={product.primary_image_url} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                Sem imagem
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
          </div>
          <div className="flex flex-col gap-4 p-6">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="font-display text-2xl">{product.name}</DialogTitle>
              <DialogDescription className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {product.description || "Sem descrição disponível."}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-2">
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Preço</span>
                <span className="text-2xl font-bold text-gradient">{formatBRL(Number(product.price))}</span>
              </div>
              <button
                onClick={openOrder}
                className="btn-hero inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
              >
                <ShoppingBag className="h-4 w-4" />
                Pedir agora
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order modal */}
      <OrderModal open={orderOpen} onClose={() => setOrderOpen(false)} product={product} />
    </>
  );
}
