# KPI Himeku - Deployment Guide

## Quick Deploy Options

### Option 1: Railway (Recommended - Free Tier Available)

1. **Push ke GitHub** (sudah dilakukan)
   
2. **Deploy ke Railway**:
   - Kunjungi [railway.app](https://railway.app)
   - Login dengan GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Pilih repository `KPI-Himeku`
   - Railway akan auto-detect dan deploy
   - Set environment variable: `JWT_SECRET` (random string)

3. **Frontend**: Build static dan deploy terpisah ke Vercel/Netlify
   ```bash
   npm run build
   # Upload folder 'dist' ke Vercel atau Netlify
   ```

### Option 2: Render (Free Tier)

1. Kunjungi [render.com](https://render.com)
2. Connect GitHub repository
3. File `render.yaml` sudah disiapkan
4. Deploy otomatis

### Option 3: VPS (Full Control)

```bash
# Di server VPS
git clone https://github.com/asashades/KPI-Himeku
cd KPI-Himeku
npm install
npm run build  # Build frontend
npm start      # Start server
```

## Environment Variables

Pastikan set di platform hosting:
- `JWT_SECRET`: Secret key untuk JWT (random string)
- `PORT`: Port untuk server (default: 5000)
- `GAS_PRESENSI_URL`: Google Apps Script URL untuk upload foto presensi ke Google Drive

## Setup Google Drive untuk Foto Presensi

Foto presensi akan disimpan di Google Drive menggunakan Apps Script sebagai middleware.

### Langkah Setup:

1. **Buat Folder di Google Drive**
   - Buka [drive.google.com](https://drive.google.com)
   - Buat folder baru, misal "KPI Himeku - Presensi"
   - Copy folder ID dari URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`

2. **Deploy Apps Script**
   - Buka [script.google.com](https://script.google.com)
   - Klik "New Project"
   - Copy isi file `/public/gas-presensi-upload.js` dari repository
   - Ganti `YOUR_FOLDER_ID_HERE` dengan folder ID dari langkah 1
   - Klik menu "Deploy" → "New deployment"
   - Pilih type: "Web app"
   - Execute as: "Me"
   - Who has access: "Anyone"
   - Klik "Deploy"
   - Copy URL yang diberikan

3. **Set Environment Variable**
   ```
   GAS_PRESENSI_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```

4. **Test**
   - Jalankan server
   - Coba presensi dengan foto
   - Cek folder Google Drive, foto akan tersimpan dengan struktur:
     ```
     KPI Himeku - Presensi/
     ├── 2026-02/
     │   ├── presensi_Nama_Staff_123456789.jpg
     │   └── ...
     └── 2026-03/
         └── ...
     ```

**Catatan**: Jika `GAS_PRESENSI_URL` tidak diset, foto akan disimpan sebagai base64 di database (tidak disarankan untuk production).

## Database

SQLite file (`database.db`) akan otomatis dibuat saat pertama kali server jalan.

**Default Login**:
- Username: `admin`
- Password: `admin123`

⚠️ **Ganti password setelah deploy!**

## Troubleshooting

### Login Gagal
- Pastikan database.db ada dan readable
- Check server logs untuk error
- Reset database: hapus `database.db` dan restart server

### CORS Error
- Update `CLIENT_URL` di environment variables
- Sesuaikan dengan domain frontend Anda

## Support

Untuk pertanyaan atau issue, create issue di GitHub repository.
