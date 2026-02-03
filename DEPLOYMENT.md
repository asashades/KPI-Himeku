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
