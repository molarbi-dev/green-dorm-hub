import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { handlePaystackWebhook } from "./lib/api/paystack-webhook";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);

    // Paystack webhook — must be handled before SSR (needs raw body)
    if (url.pathname === "/api/paystack/webhook" && request.method === "POST") {
      return handlePaystackWebhook(request);
    }

    // Image upload proxy — forwards to Imgur server-side so the browser
    // only needs to reach our own domain (already whitelisted in the hotspot).
    if (url.pathname === "/api/upload-image" && request.method === "POST") {
      try {
        const contentType = request.headers.get("content-type") ?? "";
        if (!contentType.includes("multipart/form-data")) {
          return new Response(JSON.stringify({ error: "Expected multipart/form-data" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const formData = await request.formData();
        const file = formData.get("image");
        if (!file || !(file instanceof File)) {
          return new Response(JSON.stringify({ error: "No image file provided" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Size limit: 10MB
        if (file.size > 10 * 1024 * 1024) {
          return new Response(JSON.stringify({ error: "Image must be under 10MB" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const imgurForm = new FormData();
        imgurForm.append("image", file);
        imgurForm.append("type", "file");

        const imgurRes = await fetch("https://api.imgur.com/3/image", {
          method: "POST",
          headers: { Authorization: "Client-ID f121133fedaa48b" },
          body: imgurForm,
        });

        const imgurJson = await imgurRes.json() as { success: boolean; data?: { link: string }; error?: string };

        if (!imgurRes.ok || !imgurJson.success || !imgurJson.data?.link) {
          console.error("[upload-image] Imgur error:", imgurJson);
          return new Response(JSON.stringify({ error: "Image upload failed" }), {
            status: 502,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ url: imgurJson.data.link }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        console.error("[upload-image] error:", err);
        return new Response(JSON.stringify({ error: "Image upload failed" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
