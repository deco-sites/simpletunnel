import { PunchmoleServer } from "https://esm.sh/gh/mcandeia/punchmole@3f96d0c4da5211c357b9eae895775053c32a0b1b/PunchmoleServer.js";

PunchmoleServer(
  Deno.env.get("PORT") ?? 8000, // port number to listen on
  Deno.env.get("API_KEYS")?.split(",") ?? [], // array of api keys (random strings)
  "/_punchmole", // /_punchmole is the default path
  console, // console, {info: {}, debug: {}, error: {}} for no logs or e.g. an instance of log4js
);
