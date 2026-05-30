import { supabase } from "@/integrations/supabase/client";

function getSessionId() {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem("pharpep_sid");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("pharpep_sid", id);
  }
  return id;
}

export async function trackEvent(eventType: string, productId?: string, metadata: Record<string, unknown> = {}) {
  try {
    await supabase.from("analytics_events").insert({
      event_type: eventType,
      product_id: productId ?? null,
      session_id: getSessionId(),
      metadata: metadata as never,
    });
  } catch (e) {
    console.error("track error", e);
  }
}
