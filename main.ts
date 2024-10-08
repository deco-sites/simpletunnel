import { serve } from "jsr:@deco/warp@0.3.7";

const portEnv = Deno.env.get("PORT");
const port = portEnv ? +portEnv : 8000;
serve({
  port,
  apiKeys: Deno.env.get("API_KEYS")?.split(",") ?? [],
});
