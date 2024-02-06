import { defineConfig } from 'vite'
import dns from 'dns'
import { resolve } from 'path'
import pugRollupPlugin from 'rollup-plugin-pug';
import yamPlugin from '@modyfi/vite-plugin-yaml';
import { plugin as mdPlugin } from 'vite-plugin-markdown';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const __dirname = new URL('.', import.meta.url).pathname;
dns.setDefaultResultOrder('verbatim')

export default defineConfig(({ command, mode, ssrBuild }) => {
  const basedir =  resolve(__dirname, 'src');
  console.debug('vite.config.js', { command, mode, ssrBuild })
  return {
    mode,
    root: basedir,
    assetsInclude: ['**/*.svg'],
    build: {
      outDir: '../_site',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          'main': resolve(basedir, 'index.html'),
        },
        plugins: [
          pugRollupPlugin(),
        ]
      }
    },
    plugins: [
      yamPlugin(),
      mdPlugin({mode: 'html'}),
      viteStaticCopy({
        targets: [
          { src: 'assets/fonts/*', dest: '../_site/assets/fonts' },
        ],
      }),
    ],
  }
});