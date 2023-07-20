import { defineConfig } from 'vite';
import copy from 'rollup-plugin-copy';

export default defineConfig({
  build: {
    outDir: '../', // Specify the path to the folder above the root directory
    rollupOptions: {
      input: {
        main: './index.html',
        projects: './projects.json'
      }
    }
  },
  plugins: [
    copy({
      targets: [
        { src: 'scenedata/', dest: '../' },
        { src: 'projects.json', dest: '../' },
        { src: 'bg.hdr', dest: '../' },
        { src: 'image_loader.php', dest: '../' },
        { src: 'model_loader.php', dest: '../' },
        { src: 'bg_loader.php', dest: '../' },
        { src: 'node_modules/', dest: '../assets' }
      ]
    })
  ]
});
