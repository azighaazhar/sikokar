-- Jalankan sekali jika database sudah ada sebelum penambahan status pending/ditolak pada kredit.
ALTER TABLE `kredit`
  MODIFY COLUMN `status` ENUM('pending','aktif','lunas','ditolak') NOT NULL DEFAULT 'pending';
