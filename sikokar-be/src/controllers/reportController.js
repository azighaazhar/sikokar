const { db } = require("../services/db");

const summaryReport = async (_req, res) => {
  const [{ total_penjualan = 0 }] = await db("penjualan").sum({ total_penjualan: "total" });
  const [{ total_simpanan = 0 }] = await db("simpanan").sum({ total_simpanan: "saldo" });
  const [{ total_pinjaman = 0 }] = await db("pinjaman").sum({ total_pinjaman: "nominal_disetujui" });
  const [{ outstanding_pinjaman = 0 }] = await db("pinjaman").sum({ outstanding_pinjaman: "sisa_pokok" }).whereNot({ status: "lunas" });

  return res.json({
    data: {
      total_penjualan,
      total_simpanan,
      total_pinjaman,
      outstanding_pinjaman
    }
  });
};

module.exports = { summaryReport };
