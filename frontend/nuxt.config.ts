// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
import dotenv from "dotenv";

dotenv.config();

export default defineNuxtConfig({
  compatibilityDate: "2026-04-08",
  vite: {
    optimizeDeps: {
      include: ["@vue/devtools-core", "@vue/devtools-kit"],
    },
    plugins: [tailwindcss()],
  },
  devtools: { enabled: true },
  css: ["~/assets/css/tailwind.css"],

  devServer: {
    port: parseInt(process.env.PORT || "5173"),
  },

  modules: ["shadcn-nuxt", "@pinia/nuxt", "@nuxt/eslint"],

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