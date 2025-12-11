import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./vitest.setup.ts"],
        include: ["**/*.test.ts", "**/*.test.tsx"],
        exclude: ["node_modules", ".next"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            include: ["lib/**", "services/**", "app/api/**"],
        },
        alias: {
            // Mock Next.js server modules
            "next/server": resolve(__dirname, "./__mocks__/next-server.ts"),
            "@/auth": resolve(__dirname, "./__mocks__/auth.ts"),
        },
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "./"),
        },
    },
});
