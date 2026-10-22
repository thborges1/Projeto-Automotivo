export default {
  build: {
    rollupOptions: {
      input: { main: 'index.html', comparacao: 'comparacao.html' },
      output: { manualChunks(id) { const path = id.replaceAll('\\', '/'); if (path.includes('node_modules/three/src/') || path.includes('node_modules/three/build/')) return 'three'; } },
    },
    chunkSizeWarningLimit: 650,
  },
};
