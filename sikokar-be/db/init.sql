CREATE DATABASE IF NOT EXISTS db_sikokar;
USE db_sikokar;

-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 09, 2026 at 08:34 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `tubes compro`
--

-- --------------------------------------------------------

--
-- Table structure for table `anggota`
--

CREATE TABLE `anggota` (
  `id` varchar(50) NOT NULL,
  `no` varchar(50) NOT NULL,
  `nip` varchar(50) DEFAULT NULL,
  `nama` varchar(100) NOT NULL,
  `nik` varchar(20) DEFAULT NULL,
  `dept` varchar(50) DEFAULT NULL,
  `jabatan` varchar(50) DEFAULT NULL,
  `no_hp` varchar(20) DEFAULT NULL,
  `gaji` decimal(15,2) DEFAULT 0.00,
  `limit_kredit` decimal(15,2) DEFAULT 3000000.00,
  `limit_pinjaman` decimal(15,2) DEFAULT 20000000.00,
  `limit_darurat` decimal(15,2) DEFAULT 5000000.00,
  `max_loans` int(11) DEFAULT 5,
  `status` tinyint(1) DEFAULT 1,
  `tgl_masuk` date DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `approval`
--

CREATE TABLE `approval` (
  `id` varchar(50) NOT NULL,
  `modul` varchar(50) DEFAULT NULL,
  `ref_id` varchar(50) DEFAULT NULL,
  `deskripsi` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `approver_id` varchar(50) DEFAULT NULL,
  `tgl_approval` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `barang`
--

CREATE TABLE `barang` (
  `id` varchar(50) NOT NULL,
  `kode` varchar(50) NOT NULL,
  `barcode` varchar(50) DEFAULT NULL,
  `nama` varchar(150) NOT NULL,
  `kategori` varchar(50) DEFAULT NULL,
  `satuan` varchar(20) DEFAULT 'pcs',
  `harga_beli` decimal(15,2) DEFAULT 0.00,
  `harga_jual` decimal(15,2) DEFAULT 0.00,
  `tipe` varchar(50) DEFAULT 'regular',
  `supplier_id` varchar(50) DEFAULT NULL,
  `is_taxable` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `coa`
--

CREATE TABLE `coa` (
  `id` varchar(50) NOT NULL,
  `kode` varchar(20) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `tipe` enum('aset','kewajiban','ekuitas','pendapatan','beban') NOT NULL,
  `level` int(11) DEFAULT 1,
  `parent_id` varchar(50) DEFAULT NULL,
  `aktif` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jurnal`
--

CREATE TABLE `jurnal` (
  `id` varchar(50) NOT NULL,
  `no` varchar(50) NOT NULL,
  `tgl` date NOT NULL,
  `modul` varchar(50) DEFAULT NULL,
  `ref_id` varchar(50) DEFAULT NULL,
  `ket` text DEFAULT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jurnal_detail`
--

CREATE TABLE `jurnal_detail` (
  `id` varchar(50) NOT NULL,
  `jurnal_id` varchar(50) NOT NULL,
  `coa_id` varchar(50) NOT NULL,
  `debit` decimal(15,2) DEFAULT 0.00,
  `kredit` decimal(15,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lokasi`
--

CREATE TABLE `lokasi` (
  `id` varchar(50) NOT NULL,
  `kode` varchar(20) DEFAULT NULL,
  `nama` varchar(100) NOT NULL,
  `aktif` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lokasi`
--

INSERT INTO `lokasi` (`id`, `kode`, `nama`, `aktif`) VALUES
('L1', 'KM1', 'KOPMART 1', 1),
('L3', 'GDG', 'Gudang Utama', 1);

-- --------------------------------------------------------

--
-- Table structure for table `penjualan`
--

CREATE TABLE `penjualan` (
  `id` varchar(50) NOT NULL,
  `no` varchar(50) NOT NULL,
  `tgl` datetime NOT NULL,
  `lokasi_id` varchar(50) DEFAULT NULL,
  `jenis` enum('cash','piutang') DEFAULT 'cash',
  `anggota_id` varchar(50) DEFAULT NULL,
  `subtotal` decimal(15,2) DEFAULT 0.00,
  `diskon_total` decimal(15,2) DEFAULT 0.00,
  `ppn_total` decimal(15,2) DEFAULT 0.00,
  `total` decimal(15,2) DEFAULT 0.00,
  `status` varchar(20) DEFAULT 'lunas',
  `kasir_id` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `penjualan_item`
--

CREATE TABLE `penjualan_item` (
  `id` varchar(50) NOT NULL,
  `penjualan_id` varchar(50) NOT NULL,
  `barang_id` varchar(50) DEFAULT NULL,
  `nama` varchar(150) DEFAULT NULL,
  `qty` decimal(15,2) DEFAULT 1.00,
  `harga_beli_at` decimal(15,2) DEFAULT 0.00,
  `harga_jual_at` decimal(15,2) DEFAULT 0.00,
  `diskon_pct` decimal(5,2) DEFAULT 0.00,
  `subtotal` decimal(15,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pinjaman`
--

CREATE TABLE `pinjaman` (
  `id` varchar(50) NOT NULL,
  `no` varchar(50) NOT NULL,
  `anggota_id` varchar(50) DEFAULT NULL,
  `jenis` varchar(50) DEFAULT 'regular',
  `nominal_pengajuan` decimal(15,2) DEFAULT 0.00,
  `nominal_disetujui` decimal(15,2) DEFAULT 0.00,
  `tenor` int(11) DEFAULT 12,
  `bunga_pct` decimal(5,2) DEFAULT 1.50,
  `angsuran_per_bulan` decimal(15,2) DEFAULT 0.00,
  `sisa_pokok` decimal(15,2) DEFAULT 0.00,
  `status` enum('pending','aktif','lunas','ditolak') DEFAULT 'pending',
  `tgl_pengajuan` date DEFAULT NULL,
  `tgl_cair` date DEFAULT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pinjaman_bayar`
--

CREATE TABLE `pinjaman_bayar` (
  `id` varchar(50) NOT NULL,
  `pinjaman_id` varchar(50) NOT NULL,
  `tgl` date NOT NULL,
  `nominal_total` decimal(15,2) DEFAULT 0.00,
  `bayar_pokok` decimal(15,2) DEFAULT 0.00,
  `bayar_bunga` decimal(15,2) DEFAULT 0.00,
  `cicilan_ke` int(11) DEFAULT NULL,
  `metode` varchar(50) DEFAULT 'potong-gaji',
  `user_id` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `setting`
--

CREATE TABLE `setting` (
  `key` varchar(50) NOT NULL,
  `value` text DEFAULT NULL,
  `label` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `simpanan`
--

CREATE TABLE `simpanan` (
  `id` varchar(50) NOT NULL,
  `anggota_id` varchar(50) NOT NULL,
  `jenis` enum('pokok','wajib','sukarela') NOT NULL,
  `saldo` decimal(15,2) DEFAULT 0.00,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stok`
--

CREATE TABLE `stok` (
  `id` varchar(50) NOT NULL,
  `barang_id` varchar(50) NOT NULL,
  `lokasi_id` varchar(50) NOT NULL,
  `jumlah` decimal(15,2) DEFAULT 0.00,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `supplier`
--

CREATE TABLE `supplier` (
  `id` varchar(50) NOT NULL,
  `kode` varchar(20) DEFAULT NULL,
  `nama` varchar(100) NOT NULL,
  `jenis` varchar(50) DEFAULT 'regular',
  `is_pkp` tinyint(1) DEFAULT 0,
  `npwp` varchar(50) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `telp` varchar(20) DEFAULT NULL,
  `aktif` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
--
-- Table structure for table `pembelian`
--

CREATE TABLE `pembelian` (
  `id` varchar(50) NOT NULL,
  `no` varchar(50) NOT NULL,
  `tgl` date NOT NULL,
  `supplier_id` varchar(50) DEFAULT NULL,
  `lokasi_id` varchar(50) DEFAULT NULL,
  `status` enum('lunas','hutang') DEFAULT 'lunas',
  `catatan` text DEFAULT NULL,
  `total` decimal(15,2) DEFAULT 0.00,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
--
-- Table structure for table `pembelian_item`
--

CREATE TABLE `pembelian_item` (
  `id` varchar(50) NOT NULL,
  `pembelian_id` varchar(50) NOT NULL,
  `barang_id` varchar(50) DEFAULT NULL,
  `nama` varchar(150) DEFAULT NULL,
  `qty` decimal(15,2) DEFAULT 1.00,
  `harga_beli` decimal(15,2) DEFAULT 0.00,
  `subtotal` decimal(15,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
--
-- Table structure for table `rental_aset`
--

CREATE TABLE `rental_aset` (
  `id` varchar(50) NOT NULL,
  `kode` varchar(50) NOT NULL,
  `nama` varchar(150) NOT NULL,
  `kategori` varchar(50) DEFAULT NULL,
  `tarif_harian` decimal(15,2) DEFAULT 0.00,
  `tarif_bulanan` decimal(15,2) DEFAULT 0.00,
  `kapasitas` int(11) DEFAULT 0,
  `nopol` varchar(50) DEFAULT NULL,
  `status` enum('tersedia','disewa','maintenance') DEFAULT 'tersedia',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
--
-- Table structure for table `rental`
--

CREATE TABLE `rental` (
  `id` varchar(50) NOT NULL,
  `no` varchar(50) NOT NULL,
  `tgl_mulai` date NOT NULL,
  `tgl_selesai` date DEFAULT NULL,
  `aset_id` varchar(50) DEFAULT NULL,
  `kategori` varchar(50) DEFAULT NULL,
  `tipe_harga` enum('harian','bulanan','custom') DEFAULT 'harian',
  `tarif_custom` decimal(15,2) DEFAULT 0.00,
  `total` decimal(15,2) DEFAULT 0.00,
  `status` enum('aktif','selesai') DEFAULT 'aktif',
  `tipe_penyewa` varchar(50) DEFAULT NULL,
  `nama_penyewa` varchar(100) DEFAULT NULL,
  `nama_perusahaan` varchar(100) DEFAULT NULL,
  `no_hp` varchar(20) DEFAULT NULL,
  `keterangan` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
--
-- Table structure for table `kredit`
--

CREATE TABLE `kredit` (
  `id` varchar(50) NOT NULL,
  `no` varchar(50) NOT NULL,
  `anggota_id` varchar(50) NOT NULL,
  `jenis` varchar(50) DEFAULT 'motor',
  `nama_barang` varchar(150) DEFAULT NULL,
  `toko` varchar(150) DEFAULT NULL,
  `tgl_mulai` date DEFAULT NULL,
  `harga_beli` decimal(15,2) DEFAULT 0.00,
  `dp` decimal(15,2) DEFAULT 0.00,
  `pokok` decimal(15,2) DEFAULT 0.00,
  `bunga_pct` decimal(5,2) DEFAULT 0.00,
  `tenor` int(11) DEFAULT 0,
  `angsuran_per_bulan` decimal(15,2) DEFAULT 0.00,
  `sisa` decimal(15,2) DEFAULT 0.00,
  `status` enum('aktif','lunas') DEFAULT 'aktif',
  `catatan` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
--
-- Table structure for table `kredit_bayar`
--

CREATE TABLE `kredit_bayar` (
  `id` varchar(50) NOT NULL,
  `kredit_id` varchar(50) NOT NULL,
  `tgl` date NOT NULL,
  `nominal` decimal(15,2) DEFAULT 0.00,
  `metode` varchar(50) DEFAULT 'tunai',
  `user_id` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
--
-- Table structure for table `simpanan_transaksi`
--

CREATE TABLE `simpanan_transaksi` (
  `id` varchar(50) NOT NULL,
  `anggota_id` varchar(50) NOT NULL,
  `jenis` enum('pokok','wajib','sukarela') NOT NULL,
  `tipe` enum('setoran','penarikan') NOT NULL,
  `tgl` date DEFAULT NULL,
  `nominal` decimal(15,2) DEFAULT 0.00,
  `metode` enum('tunai','transfer','potong_gaji') DEFAULT 'tunai',
  `keterangan` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
--
-- Table structure for table `ppob_transaksi`
--

CREATE TABLE `ppob_transaksi` (
  `id` varchar(50) NOT NULL,
  `anggota_id` varchar(50) DEFAULT NULL,
  `produk` varchar(100) NOT NULL,
  `nominal` decimal(15,2) DEFAULT 0.00,
  `status` enum('pending','success','failed') DEFAULT 'pending',
  `tgl` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
--
-- Table structure for table `kolektif_potong_gaji`
--

CREATE TABLE `kolektif_potong_gaji` (
  `id` varchar(50) NOT NULL,
  `periode` varchar(20) NOT NULL,
  `status` enum('draft','posted','closed') DEFAULT 'draft',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
--
-- Table structure for table `kolektif_potong_gaji_detail`
--

CREATE TABLE `kolektif_potong_gaji_detail` (
  `id` varchar(50) NOT NULL,
  `kolektif_id` varchar(50) NOT NULL,
  `anggota_id` varchar(50) DEFAULT NULL,
  `jenis` varchar(50) DEFAULT NULL,
  `nominal` decimal(15,2) DEFAULT 0.00,
  `status` enum('pending','processed') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `role` varchar(20) DEFAULT 'kasir',
  `nip` varchar(50) DEFAULT NULL,
  `lokasi_id` varchar(50) DEFAULT NULL,
  `custom_menus` text DEFAULT NULL,
  `aktif` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `name`, `role`, `nip`, `lokasi_id`, `custom_menus`, `aktif`, `created_at`, `updated_at`) VALUES
('U01', 'admin', 'admin123', 'Super Admin', 'admin', NULL, NULL, NULL, 1, '2026-05-10 01:27:00', '2026-05-10 01:27:00');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `anggota`
--
ALTER TABLE `anggota`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `no` (`no`);

--
-- Indexes for table `approval`
--
ALTER TABLE `approval`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_app_user` (`approver_id`);

--
-- Indexes for table `barang`
--
ALTER TABLE `barang`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode` (`kode`),
  ADD KEY `fk_barang_sup` (`supplier_id`);

--
-- Indexes for table `coa`
--
ALTER TABLE `coa`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode` (`kode`),
  ADD KEY `fk_coa_parent` (`parent_id`);

--
-- Indexes for table `jurnal`
--
ALTER TABLE `jurnal`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `no` (`no`),
  ADD KEY `fk_jurnal_user` (`user_id`);

--
-- Indexes for table `jurnal_detail`
--
ALTER TABLE `jurnal_detail`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_det_jurnal` (`jurnal_id`),
  ADD KEY `fk_det_coa` (`coa_id`);

--
-- Indexes for table `lokasi`
--
ALTER TABLE `lokasi`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode` (`kode`);

--
-- Indexes for table `penjualan`
--
ALTER TABLE `penjualan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `no` (`no`),
  ADD KEY `fk_penj_lok` (`lokasi_id`),
  ADD KEY `fk_penj_agt` (`anggota_id`),
  ADD KEY `fk_penj_ksr` (`kasir_id`);

--
-- Indexes for table `penjualan_item`
--
ALTER TABLE `penjualan_item`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_item_penj` (`penjualan_id`);

--
-- Indexes for table `pinjaman`
--
ALTER TABLE `pinjaman`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `no` (`no`),
  ADD KEY `fk_pinj_agt` (`anggota_id`),
  ADD KEY `fk_pinj_user` (`user_id`);

--
-- Indexes for table `pinjaman_bayar`
--
ALTER TABLE `pinjaman_bayar`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_bayar_pinj` (`pinjaman_id`);

--
-- Indexes for table `setting`
--
ALTER TABLE `setting`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `simpanan`
--
ALTER TABLE `simpanan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `anggota_id` (`anggota_id`,`jenis`);

--
-- Indexes for table `stok`
--
ALTER TABLE `stok`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `barang_id` (`barang_id`,`lokasi_id`),
  ADD KEY `fk_stok_lok` (`lokasi_id`);

--
-- Indexes for table `supplier`
--
ALTER TABLE `supplier`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode` (`kode`);

--
-- Indexes for table `pembelian`
--
ALTER TABLE `pembelian`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `no` (`no`),
  ADD KEY `fk_pembelian_supplier` (`supplier_id`),
  ADD KEY `fk_pembelian_lokasi` (`lokasi_id`);

--
-- Indexes for table `pembelian_item`
--
ALTER TABLE `pembelian_item`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_item_pembelian` (`pembelian_id`),
  ADD KEY `fk_item_barang` (`barang_id`);

--
-- Indexes for table `rental_aset`
--
ALTER TABLE `rental_aset`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode` (`kode`);

--
-- Indexes for table `rental`
--
ALTER TABLE `rental`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `no` (`no`),
  ADD KEY `fk_rental_aset` (`aset_id`);

--
-- Indexes for table `kredit`
--
ALTER TABLE `kredit`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `no` (`no`),
  ADD KEY `fk_kredit_anggota` (`anggota_id`);

--
-- Indexes for table `kredit_bayar`
--
ALTER TABLE `kredit_bayar`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_kredit_bayar` (`kredit_id`),
  ADD KEY `fk_kredit_bayar_user` (`user_id`);

--
-- Indexes for table `simpanan_transaksi`
--
ALTER TABLE `simpanan_transaksi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_simpanan_trx` (`anggota_id`);

--
-- Indexes for table `ppob_transaksi`
--
ALTER TABLE `ppob_transaksi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_ppob_anggota` (`anggota_id`);

--
-- Indexes for table `kolektif_potong_gaji`
--
ALTER TABLE `kolektif_potong_gaji`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `kolektif_potong_gaji_detail`
--
ALTER TABLE `kolektif_potong_gaji_detail`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_kolektif_detail` (`kolektif_id`),
  ADD KEY `fk_kolektif_anggota` (`anggota_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `fk_user_lokasi` (`lokasi_id`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `approval`
--
ALTER TABLE `approval`
  ADD CONSTRAINT `fk_app_user` FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `barang`
--
ALTER TABLE `barang`
  ADD CONSTRAINT `fk_barang_sup` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `coa`
--
ALTER TABLE `coa`
  ADD CONSTRAINT `fk_coa_parent` FOREIGN KEY (`parent_id`) REFERENCES `coa` (`id`);

--
-- Constraints for table `jurnal`
--
ALTER TABLE `jurnal`
  ADD CONSTRAINT `fk_jurnal_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `jurnal_detail`
--
ALTER TABLE `jurnal_detail`
  ADD CONSTRAINT `fk_det_coa` FOREIGN KEY (`coa_id`) REFERENCES `coa` (`id`),
  ADD CONSTRAINT `fk_det_jurnal` FOREIGN KEY (`jurnal_id`) REFERENCES `jurnal` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `penjualan`
--
ALTER TABLE `penjualan`
  ADD CONSTRAINT `fk_penj_agt` FOREIGN KEY (`anggota_id`) REFERENCES `anggota` (`id`),
  ADD CONSTRAINT `fk_penj_ksr` FOREIGN KEY (`kasir_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_penj_lok` FOREIGN KEY (`lokasi_id`) REFERENCES `lokasi` (`id`);

--
-- Constraints for table `penjualan_item`
--
ALTER TABLE `penjualan_item`
  ADD CONSTRAINT `fk_item_penj` FOREIGN KEY (`penjualan_id`) REFERENCES `penjualan` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `pinjaman`
--
ALTER TABLE `pinjaman`
  ADD CONSTRAINT `fk_pinj_agt` FOREIGN KEY (`anggota_id`) REFERENCES `anggota` (`id`),
  ADD CONSTRAINT `fk_pinj_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `pinjaman_bayar`
--
ALTER TABLE `pinjaman_bayar`
  ADD CONSTRAINT `fk_bayar_pinj` FOREIGN KEY (`pinjaman_id`) REFERENCES `pinjaman` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `simpanan`
--
ALTER TABLE `simpanan`
  ADD CONSTRAINT `fk_simp_agt` FOREIGN KEY (`anggota_id`) REFERENCES `anggota` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stok`
--
ALTER TABLE `stok`
  ADD CONSTRAINT `fk_stok_brg` FOREIGN KEY (`barang_id`) REFERENCES `barang` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_stok_lok` FOREIGN KEY (`lokasi_id`) REFERENCES `lokasi` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_user_lokasi` FOREIGN KEY (`lokasi_id`) REFERENCES `lokasi` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `pembelian`
--
ALTER TABLE `pembelian`
  ADD CONSTRAINT `fk_pembelian_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_pembelian_lokasi` FOREIGN KEY (`lokasi_id`) REFERENCES `lokasi` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `pembelian_item`
--
ALTER TABLE `pembelian_item`
  ADD CONSTRAINT `fk_item_pembelian` FOREIGN KEY (`pembelian_id`) REFERENCES `pembelian` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_item_barang` FOREIGN KEY (`barang_id`) REFERENCES `barang` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `rental`
--
ALTER TABLE `rental`
  ADD CONSTRAINT `fk_rental_aset` FOREIGN KEY (`aset_id`) REFERENCES `rental_aset` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `kredit`
--
ALTER TABLE `kredit`
  ADD CONSTRAINT `fk_kredit_anggota` FOREIGN KEY (`anggota_id`) REFERENCES `anggota` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `kredit_bayar`
--
ALTER TABLE `kredit_bayar`
  ADD CONSTRAINT `fk_kredit_bayar` FOREIGN KEY (`kredit_id`) REFERENCES `kredit` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_kredit_bayar_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `simpanan_transaksi`
--
ALTER TABLE `simpanan_transaksi`
  ADD CONSTRAINT `fk_simpanan_trx` FOREIGN KEY (`anggota_id`) REFERENCES `anggota` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ppob_transaksi`
--
ALTER TABLE `ppob_transaksi`
  ADD CONSTRAINT `fk_ppob_anggota` FOREIGN KEY (`anggota_id`) REFERENCES `anggota` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `kolektif_potong_gaji_detail`
--
ALTER TABLE `kolektif_potong_gaji_detail`
  ADD CONSTRAINT `fk_kolektif_detail` FOREIGN KEY (`kolektif_id`) REFERENCES `kolektif_potong_gaji` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_kolektif_anggota` FOREIGN KEY (`anggota_id`) REFERENCES `anggota` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
