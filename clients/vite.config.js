import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";

const ENV_NODE = process.env.NODE_ENV;
const devProxy = {
  "/api": {
    target: "http://localhost:3000",
    changeOrigin: true,
  },
};
const prodProxy = {
  "/api": {
    target: "https://quick-report-api.onrender.com",
    changeOrigin: true,
  },
};
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  resolve : {
    alias: {
      "@" : path.resolve(__dirname, "./src/"),
      "_#": path.resolve(__dirname, "../")
    }
  }
})