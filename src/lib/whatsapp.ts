export const WHATSAPP_NUMBER = "5518991913165";
export const COMMUNITY_LINK = "https://chat.whatsapp.com/IGFo8iPzIQRBwatmbuudro";

export function whatsappOrderLink(productName: string) {
  const text = `Olá, tenho interesse no produto ${productName}`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
