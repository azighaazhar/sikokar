# Sikokar (Frontend + Backend)

Setup ini menjalankan frontend (Next.js), backend (Express), dan database (MariaDB) lewat satu `docker compose`.

## Prasyarat
- Docker Desktop

## Menjalankan Aplikasi
1. Pastikan file env sudah ada:
   - `sikokar-be/.env`
   - `sikokar-fe/.env.local`

   Isi default yang dipakai:
   ```
   # sikokar-be/.env
   PORT=3002
   DB_HOST=db
   DB_PORT=3306
   DB_USER=sikokar
   DB_PASSWORD=sikokar
   DB_NAME=db_sikokar
   JWT_SECRET=rahasia123
   JWT_EXPIRES_IN=1m

   # sikokar-fe/.env.local
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3002
   ```
2. Jalankan container:
   ```bash
   docker compose up --build
   ```

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
