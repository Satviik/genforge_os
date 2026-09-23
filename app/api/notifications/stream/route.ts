import { subscribeToNotifications } from "@/src/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();
  let cleanup: () => void = () => undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: unknown) => controller.enqueue(encoder.encode(`event: notification\ndata: ${JSON.stringify(payload)}\n\n`));
      controller.enqueue(encoder.encode(": connected\n\n"));
      cleanup = subscribeToNotifications(send);
      heartbeat = setInterval(() => controller.enqueue(encoder.encode(": keep-alive\n\n")), 25000);
    },
    cancel() { cleanup(); if (heartbeat) clearInterval(heartbeat); },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" } });
}