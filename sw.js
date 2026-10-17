/* Service worker QC Inspection Stamping.
   Menyimpan "kulit" aplikasi (halaman ini, manifest, ikon) supaya cepat dibuka dan bisa dipasang.
   Data inspeksi tetap diambil langsung dari Apps Script (script.google.com) dan tidak disimpan di sini.
   Setiap kali file di GitHub diubah, naikkan angka VERSI supaya HP mengambil versi baru. */
const VERSI = 'qc-gate-v4';
const FILE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSI).then(c => c.addAll(FILE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSI).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; /* Apps Script dan Google tidak disentuh */

  if (req.mode === 'navigate') {
    /* Halaman: ambil dari internet dulu (versi terbaru), kalau gagal pakai salinan. */
    e.respondWith(
      fetch(req)
        .then(res => { const salin = res.clone(); caches.open(VERSI).then(c => c.put('./index.html', salin)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  /* Ikon dan manifest: pakai salinan, sambil diperbarui di belakang. */
  e.respondWith(
    caches.match(req).then(ada => {
      const baru = fetch(req).then(res => { if (res.ok) { const salin = res.clone(); caches.open(VERSI).then(c => c.put(req, salin)); } return res; }).catch(() => ada);
      return ada || baru;
    })
  );
});
