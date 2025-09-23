# Panduan Deployment ke Vercel

## 📋 Persiapan Sebelum Deploy

### 1. ✅ Build Berhasil
Aplikasi telah berhasil di-build tanpa error:
```bash
npm run build
```

### 2. ✅ Konfigurasi Sudah Siap
- `next.config.ts` sudah dikonfigurasi dengan benar
- `package.json` memiliki semua dependencies yang diperlukan
- Environment variables sudah diidentifikasi

## 🚀 Langkah-langkah Deployment ke Vercel

### Opsi 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login ke Vercel**
   ```bash
   vercel login
   ```

3. **Deploy Aplikasi**
   ```bash
   vercel
   ```
   
   Ikuti prompt yang muncul:
   - Set up and deploy? → Yes
   - Which scope? → Pilih account Anda
   - Link to existing project? → No (untuk project baru)
   - What's your project's name? → lppm-iaipi-mhs
   - In which directory is your code located? → ./

4. **Deploy Production**
   ```bash
   vercel --prod
   ```

### Opsi 2: Deploy via Vercel Dashboard

1. **Push ke GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import Project di Vercel**
   - Buka [vercel.com](https://vercel.com)
   - Klik "New Project"
   - Import repository dari GitHub
   - Pilih repository `lppm-iaipi-mhs`

3. **Konfigurasi Project**
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

## ⚙️ Environment Variables

Setelah deploy, tambahkan environment variables di Vercel Dashboard:

1. **Buka Project Settings**
   - Masuk ke dashboard Vercel
   - Pilih project Anda
   - Klik tab "Settings"
   - Pilih "Environment Variables"

2. **Tambahkan Variables**
   ```
   Name: NEXT_PUBLIC_POCKETBASE_URL
   Value: https://api-lppm-1.suhendararyadi.com
   Environment: Production, Preview, Development
   ```

3. **Redeploy**
   Setelah menambahkan environment variables, lakukan redeploy:
   ```bash
   vercel --prod
   ```

## 🔧 Konfigurasi Domain (Opsional)

1. **Custom Domain**
   - Di Vercel Dashboard → Project Settings → Domains
   - Tambahkan domain custom Anda
   - Ikuti instruksi DNS configuration

2. **SSL Certificate**
   - Vercel otomatis menyediakan SSL certificate
   - Domain akan accessible via HTTPS

## 📊 Monitoring & Analytics

1. **Vercel Analytics**
   - Aktifkan di Project Settings → Analytics
   - Monitor performa aplikasi

2. **Function Logs**
   - Lihat logs di Dashboard → Functions
   - Debug issues jika ada

## 🔄 Continuous Deployment

Setelah setup awal, setiap push ke branch `main` akan otomatis trigger deployment baru.

```bash
git add .
git commit -m "Update feature"
git push origin main
# Vercel akan otomatis deploy perubahan
```

## 🚨 Troubleshooting

### Build Errors
- Pastikan semua dependencies terinstall
- Check TypeScript errors
- Verifikasi environment variables

### Runtime Errors
- Check Function logs di Vercel Dashboard
- Pastikan PocketBase URL accessible
- Verifikasi CORS settings di PocketBase

### Performance Issues
- Gunakan Vercel Analytics
- Optimize images dan assets
- Check bundle size

## 📝 Checklist Deployment

- [x] Build berhasil tanpa error
- [x] Environment variables dikonfigurasi
- [x] Repository di-push ke GitHub
- [ ] Project di-import ke Vercel
- [ ] Environment variables ditambahkan di Vercel
- [ ] Domain dikonfigurasi (jika perlu)
- [ ] Testing di production URL
- [ ] Monitoring setup

## 🎯 URL Production

Setelah deployment berhasil, aplikasi akan tersedia di:
- Vercel URL: `https://lppm-iaipi-mhs.vercel.app`
- Custom domain (jika dikonfigurasi): `https://yourdomain.com`

---

**Note**: Pastikan PocketBase backend (`https://api-lppm-1.suhendararyadi.com`) dapat diakses dari production environment dan CORS sudah dikonfigurasi dengan benar.