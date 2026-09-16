# ARLive

Aplikasi AR web untuk pembelajaran nouns (kata nama) dalam 3 bahasa — English, Bahasa Melayu, dan Bahasa Semai.

Murid mewarna worksheet bergambar, kemudian halakan kamera telefon ke gambar itu melalui web app ini — gambar "hidup" dengan animasi/objek 3D dan label 3 bahasa dipaparkan.

## Tech Stack
- [AR.js](https://ar-js-org.github.io/AR.js-Docs/) (NFT — Natural Feature Tracking) + [A-Frame](https://aframe.io/)
- Hosting: GitHub Pages (perlu HTTPS untuk akses kamera)

## Struktur Fail
```
ARLive/
├── index.html          # App utama, baca senarai noun daripada data/nouns.json
├── data/
│   └── nouns.json       # Config setiap noun: marker path, label 3 bahasa, model
├── markers/
│   └── <noun-id>/       # Fail NFT marker (.fset, .fset3, .iset) per noun
├── images/               # Gambar sumber/outline asal (sebelum diwarna)
└── assets/models/        # Model 3D (.gltf/.glb) untuk gantikan placeholder
```

## Tambah Noun Baru
1. Letak gambar outline di `images/`
2. Jana fail marker NFT (guna [NFT Marker Creator](https://carnaux.github.io/NFT-Marker-Creator/)) dan letak dalam `markers/<noun-id>/`
3. Tambah entri baru dalam `data/nouns.json`:
```json
{
  "id": "cat",
  "marker": "markers/cat/cat-marker",
  "labels": { "en": "Cat", "bm": "Kucing", "semai": "..." },
  "model": { "type": "placeholder-box", "color": "#4A90D9" }
}
```
4. (Pilihan) guna model 3D sebenar dengan `"model": { "type": "gltf", "url": "assets/models/cat.glb" }`

## Status
- [ ] Marker NFT untuk tiger belum dijana
- [ ] Model 3D/sprite sebenar belum ada (masih placeholder kotak)
- [ ] Label Bahasa Semai belum disahkan penutur asli
- [ ] Belum deploy & test di GitHub Pages dengan telefon sebenar
