import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { serveFile } from "https://deno.land/std@0.168.0/http/file_server.ts";

serve(async (request) => {
  const pathname = new URL(request.url).pathname;

  if (pathname === "/") {
    return serveFile(request, "./dist/index.html");
  }

  try {
    return serveFile(request, `./dist${pathname}`);
  } catch {
    return new Response("Not Found", { status: 404 });
  }
});