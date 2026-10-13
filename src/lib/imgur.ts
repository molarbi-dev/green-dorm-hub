// Image upload — proxied through our own server so it works on the hostel
// WiFi captive portal (our domain is whitelisted, api.imgur.com is not).
// The server forwards the file to Imgur and returns the URL.

export async function uploadToImgur(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch("/api/upload-image", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `Upload failed (${res.status})` })) as { error?: string };
    throw new Error(err.error ?? `Upload failed (${res.status})`);
  }

  const json = await res.json() as { url?: string; error?: string };

  if (!json.url) throw new Error(json.error ?? "Upload failed — no URL returned.");

  return json.url; // e.g. https://i.imgur.com/abc123.jpg
}
