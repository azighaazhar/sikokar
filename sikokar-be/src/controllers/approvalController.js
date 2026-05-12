const { db } = require("../services/db");

const approvalSelectFields = [
  "id",
  "modul",
  "ref_id",
  "deskripsi",
  "status",
  "approver_id",
  "tgl_approval",
  "created_at"
];

const listApproval = async (req, res) => {
  const { status, modul, approver_id } = req.query || {};
  const query = db("approval").select(approvalSelectFields).orderBy("created_at", "desc");

  if (status) {
    query.where({ status });
  }

  if (modul) {
    query.where({ modul });
  }

  if (approver_id) {
    query.where({ approver_id });
  }

  const rows = await query;
  return res.json({ data: rows });
};

const getApprovalById = async (req, res) => {
  const { id } = req.params || {};
  const row = await db("approval").select(approvalSelectFields).where({ id }).first();

  if (!row) {
    return res.status(404).json({ message: "Approval not found" });
  }

  return res.json({ data: row });
};

const createApproval = async (req, res) => {
  const { id, modul, ref_id, deskripsi, status, approver_id, tgl_approval } = req.body || {};

  if (!id) {
    return res.status(400).json({ message: "id is required" });
  }

  const exists = await db("approval").where({ id }).first();
  if (exists) {
    return res.status(409).json({ message: "Approval id already exists" });
  }

  const payload = {
    id,
    modul: modul || null,
    ref_id: ref_id || null,
    deskripsi: deskripsi || null,
    status: status || "pending",
    approver_id: approver_id || null,
    tgl_approval: tgl_approval || null
  };

  await db("approval").insert(payload);

  return res.status(201).json({ id: payload.id, status: payload.status });
};

module.exports = { listApproval, getApprovalById, createApproval };
