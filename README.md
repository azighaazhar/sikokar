# Sikokar (Frontend + Backend)

Setup ini menjalankan frontend (Next.js), backend (Express), dan database (MariaDB) lewat satu `docker compose`.

## Prasyarat
- Docker Desktop
- Node.js 18+ (untuk jalanin tanpa Docker full)

## Menjalankan Aplikasi
1. Salin file env contoh:
   - `sikokar-be/.env.example` -> `sikokar-be/.env`
   - `sikokar-fe/.env.example` -> `sikokar-fe/.env.local`

   Nilai default yang dipakai:
   ```
   # sikokar-be/.env
   PORT=3002
   # DB_HOST=db (docker compose), DB_HOST=localhost (local dev)
   DB_HOST=db
   DB_PORT=3306
   DB_USER=sikokar
   DB_PASSWORD=sikokar
   DB_NAME=db_sikokar
   JWT_SECRET=change-me
   JWT_EXPIRES_IN=1d

   # sikokar-fe/.env.local
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3002
   ```
2. Jalankan container:
   ```bash
   docker compose up --build
   ```

## Menjalankan Lokal (Frontend + Backend)
1. Install dependencies di root:
   ```bash
   npm install
   ```
2. Siapkan env:
   - `sikokar-be/.env.example` -> `sikokar-be/.env`
   - `sikokar-fe/.env.example` -> `sikokar-fe/.env.local`
3. Jalankan DB saja:
   ```bash
   npm run dev:db
   ```
4. Jalankan frontend + backend bersamaan:
   ```bash
   npm run dev
   ```

## Menjalankan Lokal (Backend + DB via Docker)
1. Salin file env contoh:
   - `sikokar-be/.env.example` -> `sikokar-be/.env`
2. Ubah `DB_HOST` jadi `localhost` di `sikokar-be/.env`.
3. Jalankan DB saja:
   ```bash
   docker compose up -d db
   ```
4. Masuk ke folder backend dan jalankan:
   ```bash
   cd sikokar-be
   npm install
   npm run dev
   ```
5. Cek health: `http://localhost:3002/health`.

## Akses Aplikasi
- Frontend: http://localhost:3000
- Backend: http://localhost:3002/health

## Catatan
- Database akan dibuat otomatis dari `sikokar-be/db/init.sql` saat container pertama kali jalan.
- Jika ingin stop:
  ```bash
  docker compose down
  ```
- Jika mau hapus data DB:
  ```bash
  docker compose down -v
  ```
