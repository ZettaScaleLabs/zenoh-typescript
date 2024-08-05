import { defineConfig } from "vite"

// vite.config.js
export default defineConfig({
    build: {
        outDir: './dist',
        rollupOptions: {
            input: {
                app: './ros2-teleop.html',
            },
        },
        server: {
            open: './ros2-teleop.html',
        },
    }
})