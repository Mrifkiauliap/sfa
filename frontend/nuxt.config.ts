// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
import dotenv from "dotenv";

dotenv.config();

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  vite: {
    optimizeDeps: {
      include: ["@vue/devtools-core", "@vue/devtools-kit"],
    },
  },
  devtools: { enabled: true },
  css: ["~/assets/css/tailwind.css"],

  devServer: {
    port: parseInt(process.env.PORT || "5173"),
  },

  vite: {
    plugins: [tailwindcss()],
  },

  modules: ["shadcn-nuxt", "@pinia/nuxt"],

  shadcn: {
    prefix: "",
    componentDir: "@/components/ui",
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || "http://localhost:3000",
    },
  },
});
