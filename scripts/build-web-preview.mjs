#!/usr/bin/env node
/**
 * Builds a single self-contained HTML preview of the app:
 *   node scripts/build-web-preview.mjs [outFile]
 *
 * Runs `expo export --platform web`, then inlines the JS bundle and embeds
 * the runtime font assets (Inter + Feather) as data URIs, with a small shim
 * that rewrites asset URLs and normalizes the initial route. The result can
 * be opened from any static host (or claude.ai Artifacts) with no server.
 */
import { execSync } from 'node:child_process';
import { globSync } from 'node:fs';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dist = path.join(root, 'dist-web-preview');
const out = process.argv[2] ?? path.join(root, 'sendplate-preview.html');

execSync(`npx expo export --platform web --output-dir ${JSON.stringify(dist)}`, {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, EXPO_OFFLINE: '1' },
});

const assetGlobs = [
  'assets/node_modules/@expo-google-fonts/inter/400Regular/*.ttf',
  'assets/node_modules/@expo-google-fonts/inter/500Medium/*.ttf',
  'assets/node_modules/@expo-google-fonts/inter/600SemiBold/*.ttf',
  'assets/node_modules/@expo-google-fonts/inter/700Bold/*.ttf',
  'assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.*.ttf',
];
const assetMap = {};
for (const pattern of assetGlobs) {
  for (const file of globSync(pattern, { cwd: dist })) {
    const rel = '/' + file.replaceAll(path.sep, '/');
    assetMap[rel] = 'data:font/ttf;base64,' + fs.readFileSync(path.join(dist, file)).toString('base64');
  }
}

const bundlePath = globSync('_expo/static/js/web/entry-*.js', { cwd: dist })[0];
if (!bundlePath) throw new Error('no web bundle found in export output');
const js = fs
  .readFileSync(path.join(dist, bundlePath), 'utf-8')
  .replaceAll('</script>', '<\\/script>');

const shim = `
<script>
// Single-file preview shim: normalize the initial route and rewrite the
// bundle's root-relative font-asset URLs to embedded data URIs.
try { history.replaceState(null, '', '/'); } catch (e) {}
window.__ASSET_MAP__ = ${JSON.stringify(assetMap)};
(function () {
  var map = window.__ASSET_MAP__;
  var re = /\\/assets\\/[^)"'\\s]+/g;
  function sub(text) {
    return text.replace(re, function (m) {
      var pathOnly = m.split('?')[0];
      return map[pathOnly] || m;
    });
  }
  function fix(node) {
    if (node.tagName === 'STYLE' && node.textContent && node.textContent.indexOf('/assets/') !== -1) {
      node.textContent = sub(node.textContent);
    }
    if (node.tagName === 'IMG') {
      var src = node.getAttribute('src');
      if (src && src.indexOf('/assets/') === 0 && map[src.split('?')[0]]) {
        node.setAttribute('src', map[src.split('?')[0]]);
      }
    }
  }
  new MutationObserver(function (muts) {
    muts.forEach(function (m) {
      Array.prototype.forEach.call(m.addedNodes, function (n) {
        if (n.nodeType === 1) {
          fix(n);
          if (n.querySelectorAll) Array.prototype.forEach.call(n.querySelectorAll('style,img'), fix);
        }
        if (n.nodeType === 3 && n.parentNode && n.parentNode.tagName === 'STYLE') fix(n.parentNode);
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  var origFetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === 'string') input = sub(input);
    else if (input && typeof input.url === 'string') {
      var u = sub(input.url);
      if (u !== input.url) input = new Request(u, input);
    }
    return origFetch.call(this, input, init);
  };
  var origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    var args = Array.prototype.slice.call(arguments);
    if (typeof url === 'string') args[1] = sub(url);
    return origOpen.apply(this, args);
  };
  var OrigFontFace = window.FontFace;
  window.FontFace = function (family, source, descriptors) {
    if (typeof source === 'string') source = sub(source);
    return new OrigFontFace(family, source, descriptors);
  };
  window.FontFace.prototype = OrigFontFace.prototype;
  var origInsertRule = CSSStyleSheet.prototype.insertRule;
  CSSStyleSheet.prototype.insertRule = function (rule, index) {
    return origInsertRule.call(this, sub(rule), index);
  };
})();
</script>
`;

let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf-8');
html = html.replace('<title>SendPlate</title>', '<title>SendPlate</title>\n    <style>body{background:#FBF8F4}</style>');
html = html.replace(/<script src="[^"]+" defer><\/script>/, () => `${shim}<script defer>${js}</script>`);
if (!html.includes('window.__ASSET_MAP__')) throw new Error('bundle inlining failed');
fs.writeFileSync(out, html);
console.log(`wrote ${out} (${(fs.statSync(out).size / 1e6).toFixed(2)} MB)`);
