const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { DatabaseSync } = require('node:sqlite');

const ROOT_DIR = path.join(__dirname, '..');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex < 0) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    if (!key || process.env[key] !== undefined) return;

    const value = rawValue.replace(/^['"]|['"]$/g, '');
    process.env[key] = value;
  });
}

[
  path.join(ROOT_DIR, '.env'),
  path.join(ROOT_DIR, '.env.local'),
  path.join(ROOT_DIR, '.env.development.local'),
].forEach(loadEnvFile);

const app = express();
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || 'dra-williane-secret-local';
const CURRENT_ADMIN_USERNAME = 'williane';
const CURRENT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const CURRENT_STAFF_USERNAME = 'secretaria';
const CURRENT_STAFF_PASSWORD = process.env.STAFF_PASSWORD || '';
const LEGACY_ADMIN_USERNAME = 'dra';
const PUBLIC_BASE_URL = String(process.env.PUBLIC_BASE_URL || '').trim().replace(/\/$/, '');
const WHATSAPP_GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || 'v23.0';
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || '';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const DATA_DIR = path.join(__dirname, 'data');
const ARCHIVE_DIR = path.join(DATA_DIR, 'patient-archives');
const SQLITE_PATH = path.join(DATA_DIR, 'database.sqlite');
const LEGACY_JSON_PATH = path.join(DATA_DIR, 'database.json');
const HISTORY_ARCHIVE_AFTER_DAYS = Number(process.env.HISTORY_ARCHIVE_AFTER_DAYS || 30);
const ARCHIVE_FILE_RETENTION_DAYS = Number(process.env.ARCHIVE_FILE_RETENTION_DAYS || 90);
const MEDICAL_RECORD_RETENTION_YEARS = Number(process.env.MEDICAL_RECORD_RETENTION_YEARS || 20);
const DEFAULT_TIME_SLOTS = [
  '07:00', '07:30',
  '08:00', '08:30',
  '09:00', '09:30',
  '10:00', '10:30',
  '11:00', '11:30',
  '12:00', '12:30',
  '13:00', '13:30',
  '14:00', '14:30',
  '15:00', '15:30',
  '16:00', '16:30',
  '17:00', '17:30',
  '18:00',
];

app.use(cors());
app.use(express.json({ limit: '20mb' }));

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(ARCHIVE_DIR, { recursive: true });

const db = new DatabaseSync(SQLITE_PATH);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    display_name TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS available_dates (
    date TEXT PRIMARY KEY,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS available_time_slots (
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (date, time)
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    address TEXT NOT NULL,
    cpf TEXT NOT NULL,
    appointment_date TEXT NOT NULL,
    status TEXT NOT NULL,
    procedure_name TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    created_by_user_id TEXT,
    appointment_time TEXT DEFAULT '',
    source TEXT NOT NULL DEFAULT 'panel',
    contact_phone TEXT DEFAULT '',
    FOREIGN KEY(created_by_user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS patient_archive_files (
    id TEXT PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL DEFAULT 0,
    sha256 TEXT NOT NULL DEFAULT '',
    records_count INTEGER NOT NULL DEFAULT 0,
    period_start TEXT NOT NULL DEFAULT '',
    period_end TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    deleted_at TEXT DEFAULT '',
    deleted_reason TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_user_id TEXT,
    actor_display_name TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS whatsapp_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    direction TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    profile_name TEXT DEFAULT '',
    message_type TEXT NOT NULL,
    message_text TEXT DEFAULT '',
    status TEXT NOT NULL,
    appointment_id TEXT DEFAULT '',
    meta_message_id TEXT DEFAULT '',
    details_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    phone_number TEXT PRIMARY KEY,
    step TEXT NOT NULL,
    draft_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

function columnExists(tableName, columnName) {
  return db.prepare(`PRAGMA table_info(${tableName})`).all().some((column) => column.name === columnName);
}

function ensureColumn(tableName, columnName, definitionSql) {
  if (!columnExists(tableName, columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definitionSql}`);
  }
}

function ensureSchemaMigrations() {
  ensureColumn('appointments', 'appointment_time', `TEXT DEFAULT ''`);
  ensureColumn('appointments', 'source', `TEXT NOT NULL DEFAULT 'panel'`);
  ensureColumn('appointments', 'contact_phone', `TEXT DEFAULT ''`);
  ensureColumn('appointments', 'archived_at', `TEXT DEFAULT ''`);
  ensureColumn('appointments', 'archive_file_id', `TEXT DEFAULT ''`);
}

ensureSchemaMigrations();

function nowIso() {
  return new Date().toISOString();
}

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeCpf(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 11);
}

function normalizePhoneNumber(value) {
  return String(value || '').replace(/\D/g, '').replace(/^00/, '');
}

function normalizeTime(value) {
  const normalized = String(value || '').trim();
  return /^\d{2}:\d{2}$/.test(normalized) ? normalized : '';
}

function sortUniqueTimes(values) {
  return [...new Set(values.map(normalizeTime).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function formatCpf(value) {
  const digits = normalizeCpf(value);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function sortUniqueDates(values) {
  return [...new Set(values.filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value))))].sort((a, b) => a.localeCompare(b));
}

function normalizeAvailableTimeSlotsForDates(dates, slotsByDate = {}) {
  return dates.reduce((accumulator, date) => {
    const slots = sortUniqueTimes(slotsByDate?.[date] || []);
    accumulator[date] = slots.length > 0 ? slots : DEFAULT_TIME_SLOTS;
    return accumulator;
  }, {});
}

function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    displayName: user.display_name,
    active: Boolean(user.active),
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

function getSiteContent() {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('site_content');
  return parseJson(row?.value, {});
}

function setSiteContent(value) {
  const now = nowIso();
  db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `).run('site_content', JSON.stringify(value || {}), now);
}

function mapAppointmentRow(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    address: row.address,
    cpf: row.cpf,
    date: row.appointment_date,
    time: row.appointment_time || '',
    status: row.status,
    procedureName: row.procedure_name || '',
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdByUserId: row.created_by_user_id || '',
    source: row.source || 'panel',
    contactPhone: row.contact_phone || '',
    archivedAt: row.archived_at || '',
    archiveFileId: row.archive_file_id || '',
  };
}

function getSchedule() {
  const availableDates = db.prepare('SELECT date FROM available_dates ORDER BY date ASC').all().map((item) => item.date);
  const availableTimeSlots = db.prepare(`
    SELECT date, time
    FROM available_time_slots
    ORDER BY date ASC, time ASC
  `).all().reduce((accumulator, row) => {
    accumulator[row.date] = accumulator[row.date] || [];
    accumulator[row.date].push(row.time);
    return accumulator;
  }, {});
  const appointments = db.prepare(`
    SELECT id, full_name, address, cpf, appointment_date, appointment_time, status, procedure_name, notes, created_at, updated_at, created_by_user_id, source, contact_phone, archived_at, archive_file_id
    FROM appointments
    ORDER BY appointment_date ASC, full_name ASC
  `).all().map(mapAppointmentRow);

  Object.keys(availableTimeSlots).forEach((date) => {
    availableTimeSlots[date] = sortUniqueTimes(availableTimeSlots[date]);
  });

  return { availableDates, availableTimeSlots, appointments };
}

function getFreeTimeSlotsByDate(schedule = getSchedule()) {
  const occupiedSlotsByDate = schedule.appointments.reduce((accumulator, item) => {
    if (item.status === 'cancelado' || !item.time) return accumulator;
    accumulator[item.date] = accumulator[item.date] || new Set();
    accumulator[item.date].add(item.time);
    return accumulator;
  }, {});

  return schedule.availableDates.reduce((accumulator, date) => {
    const occupied = occupiedSlotsByDate[date] || new Set();
    accumulator[date] = sortUniqueTimes((schedule.availableTimeSlots[date] || []).filter((time) => !occupied.has(time)));
    return accumulator;
  }, {});
}

function getDatesWithFreeSlots(schedule = getSchedule()) {
  const freeTimeSlotsByDate = getFreeTimeSlotsByDate(schedule);
  return schedule.availableDates.filter((date) => (freeTimeSlotsByDate[date] || []).length > 0);
}

function getWhatsAppSession(phoneNumber) {
  if (!phoneNumber) return null;
  const row = db.prepare(`
    SELECT phone_number, step, draft_json, updated_at
    FROM whatsapp_sessions
    WHERE phone_number = ?
  `).get(normalizePhoneNumber(phoneNumber));
  if (!row) return null;

  return {
    phoneNumber: row.phone_number,
    step: row.step,
    draft: parseJson(row.draft_json, {}),
    updatedAt: row.updated_at,
  };
}

function saveWhatsAppSession(phoneNumber, step, draft = {}) {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  if (!normalizedPhone || !step) return null;

  db.prepare(`
    INSERT INTO whatsapp_sessions (phone_number, step, draft_json, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(phone_number) DO UPDATE SET
      step = excluded.step,
      draft_json = excluded.draft_json,
      updated_at = excluded.updated_at
  `).run(normalizedPhone, step, JSON.stringify(draft || {}), nowIso());

  return getWhatsAppSession(normalizedPhone);
}

function clearWhatsAppSession(phoneNumber) {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  if (!normalizedPhone) return;
  db.prepare('DELETE FROM whatsapp_sessions WHERE phone_number = ?').run(normalizedPhone);
}

function getActiveWhatsAppSessionCount() {
  return db.prepare('SELECT COUNT(*) AS total FROM whatsapp_sessions').get().total || 0;
}

function getAppointmentById(id) {
  const row = db.prepare(`
    SELECT id, full_name, address, cpf, appointment_date, appointment_time, status, procedure_name, notes, created_at, updated_at, created_by_user_id, source, contact_phone, archived_at, archive_file_id
    FROM appointments
    WHERE id = ?
  `).get(id);
  return row ? mapAppointmentRow(row) : null;
}

function normalizeStatus(value) {
  const allowed = ['agendado', 'confirmado', 'concluido', 'cancelado'];
  return allowed.includes(value) ? value : 'agendado';
}

function sanitizeAppointment(input, availableDates, availableTimeSlotsByDate, existingId) {
  const fullName = String(input?.fullName || '').trim();
  const address = String(input?.address || '').trim();
  const cpfDigits = normalizeCpf(input?.cpf);
  const date = String(input?.date || '').trim();
  const time = normalizeTime(input?.time);
  const procedureName = String(input?.procedureName || '').trim();
  const notes = String(input?.notes || '').trim();
  const status = normalizeStatus(input?.status);

  if (!fullName || !address || cpfDigits.length !== 11 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }
  if (!availableDates.includes(date)) {
    return null;
  }
  const dateSlots = Array.isArray(availableTimeSlotsByDate?.[date]) ? availableTimeSlotsByDate[date] : [];
  const hasStructuredSlots = dateSlots.length > 0;
  const isLegacyAppointmentWithoutTime = Boolean(existingId) && !time;
  if (hasStructuredSlots && !dateSlots.includes(time) && !isLegacyAppointmentWithoutTime) {
    return null;
  }

  return {
    id: String(existingId || input?.id || `appt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    fullName,
    address,
    cpf: formatCpf(cpfDigits),
    date,
    time,
    status,
    procedureName,
    notes,
    createdAt: input?.createdAt ? String(input.createdAt) : nowIso(),
    updatedAt: nowIso(),
    source: String(input?.source || 'panel').trim() || 'panel',
    contactPhone: normalizePhoneNumber(input?.contactPhone),
  };
}

function findAppointmentByCpfAndDate(cpf, date) {
  const normalized = normalizeCpf(cpf);
  if (!normalized || !date) return null;

  return getSchedule().appointments.find(
    (item) => normalizeCpf(item.cpf) === normalized && item.date === date && item.status !== 'cancelado'
  ) || null;
}

function hasActiveAppointmentAtSlot(appointments, date, time, ignoreAppointmentId = '') {
  return appointments.some(
    (item) =>
      item.id !== ignoreAppointmentId &&
      item.date === date &&
      item.time === time &&
      item.status !== 'cancelado'
  );
}

function createAppointment(input, actor) {
  const schedule = getSchedule();
  const appointment = sanitizeAppointment(input, schedule.availableDates, schedule.availableTimeSlots);
  if (!appointment) {
    const error = new Error('Dados inválidos para criar agendamento.');
    error.statusCode = 400;
    throw error;
  }

  const duplicate = findAppointmentByCpfAndDate(appointment.cpf, appointment.date);
  if (duplicate) {
    const error = new Error('Ja existe um agendamento ativo para esse CPF nessa data.');
    error.statusCode = 409;
    throw error;
  }
  if (appointment.time && hasActiveAppointmentAtSlot(schedule.appointments, appointment.date, appointment.time)) {
    const error = new Error('Esse horário não está mais disponível.');
    error.statusCode = 409;
    throw error;
  }

  const creatorUserId = actor?.id
    ? db.prepare('SELECT id FROM users WHERE id = ?').get(actor.id)?.id || null
    : null;

  db.prepare(`
    INSERT INTO appointments (
      id, full_name, address, cpf, appointment_date, appointment_time, status, procedure_name, notes, created_at, updated_at, created_by_user_id, source, contact_phone, archived_at, archive_file_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    appointment.id,
    appointment.fullName,
    appointment.address,
    appointment.cpf,
    appointment.date,
    appointment.time,
    appointment.status,
    appointment.procedureName,
    appointment.notes,
    appointment.createdAt,
    appointment.updatedAt,
    creatorUserId,
    appointment.source,
    appointment.contactPhone,
    '',
    ''
  );

  return getAppointmentById(appointment.id);
}

function persistSchedule(input, actor) {
  const currentSchedule = getSchedule();
  const datesFromSlots = Object.entries(input?.availableTimeSlots || {})
    .filter(([, slots]) => sortUniqueTimes(slots || []).length > 0)
    .map(([date]) => String(date));
  const nextAvailableDates = actor.role === 'admin'
    ? sortUniqueDates([...(input?.availableDates || []).map((item) => String(item)), ...datesFromSlots])
    : currentSchedule.availableDates;
  const nextAvailableTimeSlots = actor.role === 'admin'
    ? normalizeAvailableTimeSlotsForDates(nextAvailableDates, input?.availableTimeSlots)
    : currentSchedule.availableTimeSlots;

  const existingAppointmentsById = new Map(
    currentSchedule.appointments.map((item) => [item.id, item])
  );

  const sanitizedAppointments = (Array.isArray(input?.appointments) ? input.appointments : [])
    .map((item) => sanitizeAppointment(item, nextAvailableDates, nextAvailableTimeSlots, item?.id))
    .filter(Boolean)
    .filter((item, index, list) => {
      const duplicateIndex = list.findIndex(
        (candidate) =>
          candidate.date === item.date &&
          candidate.time === item.time &&
          candidate.status !== 'cancelado'
      );
      return duplicateIndex === index;
    });

  db.exec('BEGIN');
  try {
    if (actor.role === 'admin') {
      db.prepare('DELETE FROM available_dates').run();
      const insertDate = db.prepare('INSERT INTO available_dates (date, created_at) VALUES (?, ?)');
      nextAvailableDates.forEach((date) => insertDate.run(date, nowIso()));

      db.prepare('DELETE FROM available_time_slots').run();
      const insertTimeSlot = db.prepare('INSERT INTO available_time_slots (date, time, created_at) VALUES (?, ?, ?)');
      nextAvailableDates.forEach((date) => {
        (nextAvailableTimeSlots[date] || []).forEach((time) => insertTimeSlot.run(date, time, nowIso()));
      });
    }

    db.prepare('DELETE FROM appointments').run();
    const insertAppointment = db.prepare(`
      INSERT INTO appointments (
        id, full_name, address, cpf, appointment_date, appointment_time, status, procedure_name, notes, created_at, updated_at, created_by_user_id, source, contact_phone, archived_at, archive_file_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    sanitizedAppointments.forEach((item) => {
      const existing = existingAppointmentsById.get(item.id);
      insertAppointment.run(
        item.id,
        item.fullName,
        item.address,
        item.cpf,
        item.date,
        item.time,
        item.status,
        item.procedureName,
        item.notes,
        existing?.createdAt || item.createdAt,
        nowIso(),
        existing?.createdByUserId || actor.id,
        existing?.source || item.source || 'panel',
        existing?.contactPhone || item.contactPhone || '',
        existing?.archivedAt || item.archivedAt || '',
        existing?.archiveFileId || item.archiveFileId || ''
      );
    });

    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return getSchedule();
}

function writeAuditLog(actor, action, entityType, entityId, details) {
  db.prepare(`
    INSERT INTO audit_logs (actor_user_id, actor_display_name, action, entity_type, entity_id, details_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    actor?.id || null,
    actor?.displayName || 'Sistema',
    action,
    entityType,
    entityId || null,
    JSON.stringify(details || {}),
    nowIso()
  );
}

function updateAppointmentStatus(appointmentId, status, actor) {
  const appointment = getAppointmentById(appointmentId);
  if (!appointment) {
    const error = new Error('Agendamento não encontrado.');
    error.statusCode = 404;
    throw error;
  }

  const nextStatus = normalizeStatus(status);
  db.prepare('UPDATE appointments SET status = ?, updated_at = ? WHERE id = ?').run(nextStatus, nowIso(), appointmentId);
  writeAuditLog(actor, 'update_appointment_status', 'appointment', appointmentId, {
    previousStatus: appointment.status,
    nextStatus,
    source: appointment.source,
  });
  return getAppointmentById(appointmentId);
}

function getAuditLogs(limit = 40) {
  return db.prepare(`
    SELECT id, actor_user_id, actor_display_name, action, entity_type, entity_id, details_json, created_at
    FROM audit_logs
    ORDER BY id DESC
    LIMIT ?
  `).all(limit).map((row) => ({
    id: row.id,
    actorUserId: row.actor_user_id,
    actorDisplayName: row.actor_display_name,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    details: parseJson(row.details_json, {}),
    createdAt: row.created_at,
  }));
}

function logWhatsAppEvent({
  direction,
  phoneNumber,
  profileName = '',
  messageType,
  messageText = '',
  status,
  appointmentId = '',
  metaMessageId = '',
  details = {},
}) {
  db.prepare(`
    INSERT INTO whatsapp_events (
      direction, phone_number, profile_name, message_type, message_text, status, appointment_id, meta_message_id, details_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    direction,
    normalizePhoneNumber(phoneNumber),
    String(profileName || ''),
    messageType,
    String(messageText || ''),
    status,
    appointmentId || '',
    metaMessageId || '',
    JSON.stringify(details || {}),
    nowIso()
  );
}

function getRecentWhatsAppEvents(limit = 30) {
  return db.prepare(`
    SELECT id, direction, phone_number, profile_name, message_type, message_text, status, appointment_id, meta_message_id, details_json, created_at
    FROM whatsapp_events
    ORDER BY id DESC
    LIMIT ?
  `).all(limit).map((row) => ({
    id: row.id,
    direction: row.direction,
    phoneNumber: row.phone_number,
    profileName: row.profile_name || '',
    messageType: row.message_type,
    messageText: row.message_text || '',
    status: row.status,
    appointmentId: row.appointment_id || '',
    metaMessageId: row.meta_message_id || '',
    details: parseJson(row.details_json, {}),
    createdAt: row.created_at,
  }));
}

function getDashboardSummary() {
  const appointments = getSchedule().appointments;
  const activeAppointments = appointments.filter((item) => item.status !== 'cancelado');
  const uniquePatients = new Set(appointments.map((item) => normalizeCpf(item.cpf))).size;
  const byStatus = appointments.reduce((accumulator, item) => {
    accumulator[item.status] = (accumulator[item.status] || 0) + 1;
    return accumulator;
  }, {});

  return {
    totalUsers: db.prepare('SELECT COUNT(*) AS count FROM users').get().count,
    activeUsers: db.prepare('SELECT COUNT(*) AS count FROM users WHERE active = 1').get().count,
    releasedDates: db.prepare('SELECT COUNT(*) AS count FROM available_dates').get().count,
    totalAppointments: appointments.length,
    activeAppointments: activeAppointments.length,
    uniquePatients,
    recentHistory: appointments.filter((item) => !item.archivedAt).length,
    archivedHistory: appointments.filter((item) => item.archivedAt).length,
    archiveFiles: db.prepare("SELECT COUNT(*) AS count FROM patient_archive_files WHERE COALESCE(deleted_at, '') = ''").get().count,
    byStatus,
    bySource: appointments.reduce((accumulator, item) => {
      accumulator[item.source || 'panel'] = (accumulator[item.source || 'panel'] || 0) + 1;
      return accumulator;
    }, {}),
  };
}

function dateKeyFromDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDaysToDate(date, amount) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

function getArchiveFileRows(includeDeleted = false) {
  const where = includeDeleted ? '' : "WHERE COALESCE(deleted_at, '') = ''";
  return db.prepare(`
    SELECT id, file_name, file_path, file_size_bytes, sha256, records_count, period_start, period_end, created_at, deleted_at, deleted_reason
    FROM patient_archive_files
    ${where}
    ORDER BY created_at DESC
  `).all().map((row) => ({
    id: row.id,
    fileName: row.file_name,
    fileSizeBytes: row.file_size_bytes,
    sha256: row.sha256,
    recordsCount: row.records_count,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    createdAt: row.created_at,
    deletedAt: row.deleted_at || '',
    deletedReason: row.deleted_reason || '',
  }));
}

function getRetentionStatus() {
  const today = new Date();
  const archiveCutoff = dateKeyFromDate(addDaysToDate(today, -HISTORY_ARCHIVE_AFTER_DAYS));
  const fileCutoffIso = addDaysToDate(today, -ARCHIVE_FILE_RETENTION_DAYS).toISOString();

  return {
    archiveAfterDays: HISTORY_ARCHIVE_AFTER_DAYS,
    archiveFileRetentionDays: ARCHIVE_FILE_RETENTION_DAYS,
    medicalRecordRetentionYears: MEDICAL_RECORD_RETENTION_YEARS,
    archiveCutoffDate: archiveCutoff,
    fileRetentionCutoffAt: fileCutoffIso,
    pendingArchiveCount: db.prepare(`
      SELECT COUNT(*) AS count
      FROM appointments
      WHERE appointment_date <= ?
        AND COALESCE(archived_at, '') = ''
    `).get(archiveCutoff).count,
    archivedAppointmentCount: db.prepare(`
      SELECT COUNT(*) AS count
      FROM appointments
      WHERE COALESCE(archived_at, '') <> ''
    `).get().count,
    activeArchiveFileCount: db.prepare(`
      SELECT COUNT(*) AS count
      FROM patient_archive_files
      WHERE COALESCE(deleted_at, '') = ''
    `).get().count,
    expiredArchiveFileCount: db.prepare(`
      SELECT COUNT(*) AS count
      FROM patient_archive_files
      WHERE COALESCE(deleted_at, '') = ''
        AND created_at <= ?
    `).get(fileCutoffIso).count,
  };
}

function getPatientHistory({ query = '', archived = 'all', limit = 250 } = {}) {
  const rows = getSchedule().appointments;
  const normalizedQuery = String(query || '').trim().toLowerCase();
  const digits = normalizeCpf(normalizedQuery);

  return rows
    .filter((item) => {
      if (archived === 'recent' && item.archivedAt) return false;
      if (archived === 'archived' && !item.archivedAt) return false;
      if (!normalizedQuery) return true;

      const haystack = [
        item.fullName,
        item.cpf,
        item.address,
        item.contactPhone,
        item.date,
        item.time,
        item.status,
        item.procedureName,
        item.notes,
      ].join(' ').toLowerCase();
      return haystack.includes(normalizedQuery) || (digits && normalizeCpf(item.cpf).includes(digits));
    })
    .sort((a, b) => {
      const dateComparison = b.date.localeCompare(a.date);
      if (dateComparison !== 0) return dateComparison;
      return (b.time || '').localeCompare(a.time || '');
    })
    .slice(0, Number(limit) || 250);
}

function createPatientArchiveFile(appointments, actor, reason = 'automatic_30_day_archive') {
  if (!appointments.length) return null;
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });

  const createdAt = nowIso();
  const id = `archive-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const safeTimestamp = createdAt.replace(/[:.]/g, '-');
  const fileName = `patient-history-${safeTimestamp}.json.gz`;
  const filePath = path.join(ARCHIVE_DIR, fileName);
  const periodStart = appointments.reduce((oldest, item) => (!oldest || item.date < oldest ? item.date : oldest), '');
  const periodEnd = appointments.reduce((latest, item) => (!latest || item.date > latest ? item.date : latest), '');
  const payload = {
    exportedAt: createdAt,
    reason,
    retentionPolicy: {
      visibleRecentDays: HISTORY_ARCHIVE_AFTER_DAYS,
      backupFileRetentionDays: ARCHIVE_FILE_RETENTION_DAYS,
      medicalRecordRetentionYears: MEDICAL_RECORD_RETENTION_YEARS,
      note: 'Este arquivo compacta o histórico para recuperação. O registro principal permanece no banco para retenção legal.',
    },
    records: appointments,
  };
  const compressed = zlib.gzipSync(Buffer.from(JSON.stringify(payload, null, 2), 'utf8'));
  fs.writeFileSync(filePath, compressed);
  const sha256 = crypto.createHash('sha256').update(compressed).digest('hex');

  db.prepare(`
    INSERT INTO patient_archive_files (id, file_name, file_path, file_size_bytes, sha256, records_count, period_start, period_end, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, fileName, filePath, compressed.length, sha256, appointments.length, periodStart, periodEnd, createdAt);

  const updateAppointment = db.prepare('UPDATE appointments SET archived_at = ?, archive_file_id = ?, updated_at = ? WHERE id = ?');
  appointments.forEach((appointment) => updateAppointment.run(createdAt, id, createdAt, appointment.id));

  writeAuditLog(actor, 'archive_patient_history', 'patient_archive_file', id, {
    recordsCount: appointments.length,
    fileName,
    periodStart,
    periodEnd,
    reason,
  });

  return getArchiveFileRows(true).find((item) => item.id === id) || null;
}

function runRetentionMaintenance(actor = { id: 'system', displayName: 'Sistema', role: 'system' }) {
  const today = new Date();
  const archiveCutoff = dateKeyFromDate(addDaysToDate(today, -HISTORY_ARCHIVE_AFTER_DAYS));
  const fileCutoffIso = addDaysToDate(today, -ARCHIVE_FILE_RETENTION_DAYS).toISOString();
  const pendingRows = db.prepare(`
    SELECT id, full_name, address, cpf, appointment_date, appointment_time, status, procedure_name, notes, created_at, updated_at, created_by_user_id, source, contact_phone, archived_at, archive_file_id
    FROM appointments
    WHERE appointment_date <= ?
      AND COALESCE(archived_at, '') = ''
    ORDER BY appointment_date ASC, appointment_time ASC
  `).all().map(mapAppointmentRow);

  let createdArchive = null;
  if (pendingRows.length > 0) {
    createdArchive = createPatientArchiveFile(pendingRows, actor);
  }

  const expiredFiles = db.prepare(`
    SELECT id, file_name, file_path
    FROM patient_archive_files
    WHERE COALESCE(deleted_at, '') = ''
      AND created_at <= ?
  `).all(fileCutoffIso);
  const deletedAt = nowIso();
  expiredFiles.forEach((file) => {
    const resolvedPath = path.resolve(file.file_path);
    const archiveRoot = path.resolve(ARCHIVE_DIR);
    if (resolvedPath.startsWith(archiveRoot) && fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
    }
    db.prepare(`
      UPDATE patient_archive_files
      SET deleted_at = ?, deleted_reason = ?
      WHERE id = ?
    `).run(deletedAt, `Retencao de ${ARCHIVE_FILE_RETENTION_DAYS} dias para arquivos compactados.`, file.id);
    writeAuditLog(actor, 'delete_expired_archive_file', 'patient_archive_file', file.id, {
      fileName: file.file_name,
      retentionDays: ARCHIVE_FILE_RETENTION_DAYS,
    });
  });

  return {
    ok: true,
    ranAt: nowIso(),
    archivedAppointments: pendingRows.length,
    createdArchive,
    deletedArchiveFiles: expiredFiles.length,
    status: getRetentionStatus(),
    archiveFiles: getArchiveFileRows(),
  };
}

function buildSystemCheckReport(auth) {
  const checks = [];
  const startedAt = nowIso();

  const pushCheck = (key, label, runCheck) => {
    try {
      const details = runCheck();
      checks.push({
        key,
        label,
        ok: true,
        details: details || {},
      });
    } catch (error) {
      checks.push({
        key,
        label,
        ok: false,
        error: error.message || 'Falha ao executar verificação.',
      });
    }
  };

  pushCheck('api', 'API do servidor', () => ({
    status: 'online',
    serverTime: nowIso(),
  }));

  pushCheck('auth', 'Sessão autenticada', () => ({
    userId: auth.id,
    role: auth.role,
    username: auth.username,
  }));

  pushCheck('schedule', 'Agenda e disponibilidade', () => {
    const schedule = getSchedule();
    const dates = Array.isArray(schedule.availableDates) ? schedule.availableDates.length : 0;
    const appointments = Array.isArray(schedule.appointments) ? schedule.appointments.length : 0;
    const invalidDates = (schedule.availableDates || []).filter((date) => (schedule.availableTimeSlots?.[date] || []).length === 0);

    if (invalidDates.length > 0) {
      throw new Error(`Existem datas liberadas sem horário: ${invalidDates[0]}.`);
    }

    return {
      availableDates: dates,
      appointments,
      freeDates: getDatesWithFreeSlots(schedule).length,
    };
  });

  pushCheck('dashboard', 'Painel e resumo', () => {
    const summary = getDashboardSummary();
    return {
      activeAppointments: summary.activeAppointments ?? 0,
      releasedDates: summary.releasedDates ?? 0,
      activeUsers: summary.activeUsers ?? 0,
    };
  });

  if (auth.role === 'admin') {
    pushCheck('whatsapp', 'Integracao do WhatsApp', () => {
      const status = getWhatsAppStatus({ auth });
      return {
        configured: Boolean(status?.configured),
        verifyTokenConfigured: Boolean(status?.verifyTokenConfigured),
        accessTokenConfigured: Boolean(status?.accessTokenConfigured),
        phoneNumberIdConfigured: Boolean(status?.phoneNumberIdConfigured),
        activeConversations: status?.activeConversations ?? 0,
      };
    });

    pushCheck('users', 'Usuários do painel', () => {
      const users = db.prepare('SELECT COUNT(*) as total, SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active FROM users').get();
      return {
        totalUsers: users?.total ?? 0,
        activeUsers: users?.active ?? 0,
      };
    });

    pushCheck('retention', 'Histórico, compactação e backups', () => {
      const status = getRetentionStatus();
      return {
        arquivarAposDias: status.archiveAfterDays,
        apagarArquivosAposDias: status.archiveFileRetentionDays,
        prontuarioAnos: status.medicalRecordRetentionYears,
        pendentesParaArquivar: status.pendingArchiveCount,
        arquivosAtivos: status.activeArchiveFileCount,
        arquivosVencidos: status.expiredArchiveFileCount,
      };
    });
  }

  const failures = checks.filter((item) => !item.ok);
  return {
    ok: failures.length === 0,
    startedAt,
    finishedAt: nowIso(),
    role: auth.role,
    checks,
    summary: failures.length === 0
      ? 'Tudo certo nas verificações principais.'
      : `${failures.length} verificação(ões) apresentou(aram) falha.`,
  };
}

function buildBackupSnapshot() {
  return {
    exportedAt: nowIso(),
    users: db.prepare(`
      SELECT id, username, role, display_name AS displayName, active, created_at AS createdAt, updated_at AS updatedAt
      FROM users
      ORDER BY created_at ASC
    `).all(),
    siteContent: getSiteContent(),
    schedule: getSchedule(),
    retention: {
      status: getRetentionStatus(),
      archiveFiles: getArchiveFileRows(true),
    },
    auditLogs: getAuditLogs(500),
    whatsapp: {
      events: getRecentWhatsAppEvents(500),
    },
  };
}

function ensureSeedData() {
  const hasUsers = db.prepare('SELECT COUNT(*) AS count FROM users').get().count > 0;
  if (hasUsers) return;

  if (!CURRENT_ADMIN_PASSWORD || !CURRENT_STAFF_PASSWORD) {
    throw new Error('Defina ADMIN_PASSWORD e STAFF_PASSWORD no ambiente antes de iniciar uma base nova.');
  }

  const now = nowIso();
  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password_hash, role, display_name, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    'user-dra',
    CURRENT_ADMIN_USERNAME,
    bcrypt.hashSync(CURRENT_ADMIN_PASSWORD, 10),
    'admin',
    'Dra. Williane',
    1,
    now,
    now
  );
  insertUser.run('user-secretaria', CURRENT_STAFF_USERNAME, bcrypt.hashSync(CURRENT_STAFF_PASSWORD, 10), 'staff', 'Secretaria', 1, now, now);
  setSiteContent({});
}

function migrateLegacyJsonIfNeeded() {
  if (!fs.existsSync(LEGACY_JSON_PATH)) return;
  const hasAnyAppointments = db.prepare('SELECT COUNT(*) AS count FROM appointments').get().count > 0;
  const hasAvailableDates = db.prepare('SELECT COUNT(*) AS count FROM available_dates').get().count > 0;
  const siteContentRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('site_content');
  if (hasAnyAppointments || hasAvailableDates || siteContentRow?.value) return;

  const legacy = parseJson(fs.readFileSync(LEGACY_JSON_PATH, 'utf8'), null);
  if (!legacy) return;

  if (legacy.siteContent) {
    setSiteContent(legacy.siteContent);
  }

  if (legacy.schedule || legacy.admin) {
    persistSchedule(
      legacy.schedule || legacy.admin,
      { id: 'system', role: 'admin', displayName: 'Migracao' }
    );
  }

  if (Array.isArray(legacy.users)) {
    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    legacy.users.forEach((user) => {
      const now = nowIso();
      insertUser.run(
        user.id,
        user.username,
        user.passwordHash,
        user.role,
        user.displayName,
        user.active ? 1 : 0,
        now,
        now
      );
    });
  }

  writeAuditLog(
    { id: 'system', displayName: 'Migracao', role: 'admin' },
    'legacy_import',
    'database',
    'legacy-json',
    { source: LEGACY_JSON_PATH }
  );
}

ensureSeedData();
migrateLegacyJsonIfNeeded();

function migrateDefaultAdminCredentialsIfNeeded() {
  if (!CURRENT_ADMIN_PASSWORD) return;
  const adminUser = db.prepare('SELECT * FROM users WHERE id = ?').get('user-dra');
  if (!adminUser || adminUser.role !== 'admin') return;

  const hasLegacyUsername = adminUser.username === LEGACY_ADMIN_USERNAME;
  const hasCurrentUsername = adminUser.username === CURRENT_ADMIN_USERNAME;
  const hasCurrentPassword = bcrypt.compareSync(CURRENT_ADMIN_PASSWORD, adminUser.password_hash);

  if (hasCurrentUsername && hasCurrentPassword) return;

  if (hasLegacyUsername || hasCurrentUsername) {
    db.prepare('UPDATE users SET username = ?, password_hash = ?, updated_at = ? WHERE id = ?').run(
      CURRENT_ADMIN_USERNAME,
      bcrypt.hashSync(CURRENT_ADMIN_PASSWORD, 10),
      nowIso(),
      adminUser.id
    );
  }
}

migrateDefaultAdminCredentialsIfNeeded();

function migrateDefaultStaffCredentialsIfNeeded() {
  if (!CURRENT_STAFF_PASSWORD) return;
  const staffUser = db.prepare('SELECT * FROM users WHERE id = ?').get('user-secretaria');
  if (!staffUser || staffUser.role !== 'staff') return;

  const hasCurrentUsername = staffUser.username === CURRENT_STAFF_USERNAME;
  const hasCurrentPassword = bcrypt.compareSync(CURRENT_STAFF_PASSWORD, staffUser.password_hash);

  if (hasCurrentUsername && hasCurrentPassword) return;

  if (staffUser.username === CURRENT_STAFF_USERNAME) {
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(
      bcrypt.hashSync(CURRENT_STAFF_PASSWORD, 10),
      nowIso(),
      staffUser.id
    );
  }
}

migrateDefaultStaffCredentialsIfNeeded();

try {
  runRetentionMaintenance({ id: 'system', displayName: 'Sistema', role: 'system' });
} catch (error) {
  console.warn(`Retention maintenance skipped: ${error.message}`);
}

setInterval(() => {
  try {
    runRetentionMaintenance({ id: 'system', displayName: 'Sistema', role: 'system' });
  } catch (error) {
    console.warn(`Retention maintenance failed: ${error.message}`);
  }
}, 24 * 60 * 60 * 1000);

function buildExternalBaseUrl(req) {
  if (PUBLIC_BASE_URL) return PUBLIC_BASE_URL;

  const protocol = req?.protocol || 'https';
  const hostFromGetter = typeof req?.get === 'function' ? req.get('host') : '';
  const hostFromHeaders = req?.headers?.host || '';
  const host = hostFromGetter || hostFromHeaders;

  if (host) {
    return `${protocol}://${host}`;
  }

  return 'https://willianeholanda.com.br';
}

function getWhatsAppStatus(req) {
  return {
    configured: Boolean(WHATSAPP_VERIFY_TOKEN && WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID),
    verifyTokenConfigured: Boolean(WHATSAPP_VERIFY_TOKEN),
    accessTokenConfigured: Boolean(WHATSAPP_ACCESS_TOKEN),
    phoneNumberIdConfigured: Boolean(WHATSAPP_PHONE_NUMBER_ID),
    graphVersion: WHATSAPP_GRAPH_VERSION,
    callbackUrl: `${buildExternalBaseUrl(req)}/api/whatsapp/webhook`,
    activeConversations: getActiveWhatsAppSessionCount(),
    recentEvents: getRecentWhatsAppEvents(25),
  };
}

function normalizeCommandKey(key) {
  return String(key || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function parseStructuredWhatsAppFields(text) {
  return text
    .split(/\n|;/)
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((accumulator, item) => {
      const separatorIndex = item.search(/[:=]/);
      if (separatorIndex <= 0) return accumulator;

      const key = normalizeCommandKey(item.slice(0, separatorIndex));
      const value = item.slice(separatorIndex + 1).trim();
      if (key && value) {
        accumulator[key] = value;
      }
      return accumulator;
    }, {});
}

function parseWhatsAppCommand(text) {
  const rawText = String(text || '').trim();
  const normalizedText = rawText
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (!rawText) return { type: 'help' };
  if (/^(ajuda|menu|oi|ola|help)\b/.test(normalizedText)) return { type: 'help' };
  if (/(^|\b)(datas|datas liberadas|ver datas|listar datas)\b/.test(normalizedText)) return { type: 'list_dates' };

  const fields = parseStructuredWhatsAppFields(rawText);

  if (/^agendar\b/.test(normalizedText)) return { type: 'create_appointment', fields };
  if (/^cancelar\b/.test(normalizedText)) return { type: 'cancel_appointment', fields };
  if (/^status\b/.test(normalizedText)) return { type: 'appointment_status', fields };

  return { type: 'help' };
}

function buildAvailableDatesMessage() {
  const schedule = getSchedule();
  const freeTimeSlotsByDate = getFreeTimeSlotsByDate(schedule);
  const dates = getDatesWithFreeSlots(schedule).slice(0, 12);
  if (dates.length === 0) {
    return 'No momento não existem datas liberadas. Envie "AJUDA" para ver os comandos disponíveis.';
  }

  return [
    'Datas liberadas:',
    ...dates.map((date, index) => `${index + 1}. ${date} - ${freeTimeSlotsByDate[date].join(', ')}`),
    '',
    'Para agendar, envie AGENDAR e eu vou te guiando passo a passo.',
    '',
    'Ou, se preferir, envie no formato completo:',
    'AGENDAR',
    'NOME: Nome Completo',
    'CPF: 12345678901',
    'ENDERECO: Rua Exemplo, 10',
    `DATA: ${dates[0]}`,
    `HORA: ${freeTimeSlotsByDate[dates[0]][0]}`,
    'PROCEDIMENTO: Consulta',
    'OBS: Opcional',
  ].join('\n');
}

function buildWhatsAppHelpMessage() {
  return [
    'Comandos disponíveis:',
    '1. DATAS',
    '2. AGENDAR para fluxo guiado',
    '3. AGENDAR + campos em linhas separadas',
    '4. STATUS + CPF e DATA',
    '5. CANCELAR + CPF e DATA',
    '',
    'Exemplo guiado:',
    'AGENDAR',
    '',
    'Exemplo completo:',
    'AGENDAR',
    'NOME: Maria da Silva',
    'CPF: 12345678901',
    'ENDERECO: Rua Exemplo, 10',
    'DATA: 2026-04-12',
    'HORA: 09:00',
    'PROCEDIMENTO: Consulta',
  ].join('\n');
}

function sendWhatsAppTextMessage(to, body) {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    const error = new Error('WhatsApp Cloud API não configurada.');
    error.statusCode = 503;
    throw error;
  }

  return fetch(`https://graph.facebook.com/${WHATSAPP_GRAPH_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: normalizePhoneNumber(to),
      type: 'text',
      text: {
        preview_url: false,
        body,
      },
    }),
  }).then(async (response) => {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload?.error?.message || 'Falha ao enviar mensagem pelo WhatsApp.');
      error.statusCode = response.status;
      error.payload = payload;
      throw error;
    }
    return payload;
  });
}

function resolveCommandField(fields, aliases) {
  for (const alias of aliases) {
    const value = fields[normalizeCommandKey(alias)];
    if (value) return value;
  }
  return '';
}

function isGuidedScheduleTrigger(text) {
  const normalizedText = String(text || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return /^(agendar|marcar|quero agendar|agendamento)\b/.test(normalizedText);
}

function buildFreeDatesListText(schedule = getSchedule()) {
  const freeTimeSlotsByDate = getFreeTimeSlotsByDate(schedule);
  const dates = getDatesWithFreeSlots(schedule);
  if (dates.length === 0) {
    return 'No momento não existem datas liberadas.';
  }

  return dates
    .slice(0, 12)
    .map((date, index) => `${index + 1}. ${date} (${freeTimeSlotsByDate[date].length} horário(s) livre(s))`)
    .join('\n');
}

function resolveDateSelection(input, schedule = getSchedule()) {
  const value = String(input || '').trim();
  if (!value) return '';

  const dates = getDatesWithFreeSlots(schedule);
  if (/^\d+$/.test(value)) {
    const index = Number(value) - 1;
    return dates[index] || '';
  }

  return dates.includes(value) ? value : '';
}

function resolveTimeSelection(date, input, schedule = getSchedule()) {
  const value = String(input || '').trim();
  if (!date || !value) return '';

  const freeTimeSlotsByDate = getFreeTimeSlotsByDate(schedule);
  const times = freeTimeSlotsByDate[date] || [];

  if (/^\d+$/.test(value)) {
    const index = Number(value) - 1;
    return times[index] || '';
  }

  return times.includes(normalizeTime(value)) ? normalizeTime(value) : '';
}

function buildFreeTimesListText(date, schedule = getSchedule()) {
  const freeTimeSlotsByDate = getFreeTimeSlotsByDate(schedule);
  const times = freeTimeSlotsByDate[date] || [];
  if (times.length === 0) {
    return `Não há horários livres para ${date}.`;
  }

  return [
    `Horarios livres em ${date}:`,
    ...times.map((time, index) => `${index + 1}. ${time}`),
  ].join('\n');
}

function buildGuidedStartMessage() {
  const schedule = getSchedule();
  const dates = getDatesWithFreeSlots(schedule);
  if (dates.length === 0) {
    return 'No momento não existem datas liberadas. Envie "AJUDA" para ver os comandos disponíveis.';
  }

  return [
    'Vamos agendar pelo WhatsApp.',
    'Primeiro, me envie o nome completo do paciente.',
    '',
    'Datas com vaga no momento:',
    buildFreeDatesListText(schedule),
  ].join('\n');
}

function buildGuidedSummary(draft) {
  return [
    'Confira os dados do agendamento:',
    `Nome: ${draft.fullName}`,
    `CPF: ${formatCpf(draft.cpf)}`,
    `Endereco: ${draft.address}`,
    `Data: ${draft.date}`,
    `Horario: ${draft.time}`,
    `Procedimento: ${draft.procedureName || 'Não informado'}`,
    `Observacoes: ${draft.notes || 'Nenhuma'}`,
    '',
    'Responda CONFIRMAR para concluir ou CANCELAR FLUXO para apagar esse atendimento.',
  ].join('\n');
}

function executeGuidedWhatsAppFlow(session, text, sender) {
  const message = String(text || '').trim();
  const normalizedMessage = normalizeCommandKey(message);
  const schedule = getSchedule();
  const datesWithFreeSlots = getDatesWithFreeSlots(schedule);

  if (!datesWithFreeSlots.length) {
    clearWhatsAppSession(sender.phoneNumber);
    return {
      replyText: 'No momento não existem datas liberadas. Envie "AJUDA" para ver os comandos disponíveis.',
      action: 'guided_no_dates',
    };
  }

  if (normalizedMessage === 'cancelarfluxo') {
    clearWhatsAppSession(sender.phoneNumber);
    return {
      replyText: 'Fluxo de agendamento cancelado. Quando quiser voltar, envie AGENDAR.',
      action: 'guided_cancelled',
    };
  }

  const draft = { ...(session?.draft || {}) };

  if (session.step === 'name') {
    if (message.length < 5) {
      return { replyText: 'Me envie o nome completo do paciente.', action: 'guided_retry_name' };
    }
    draft.fullName = message;
    saveWhatsAppSession(sender.phoneNumber, 'cpf', draft);
    return { replyText: 'Agora me envie o CPF com 11 dígitos.', action: 'guided_collect_cpf' };
  }

  if (session.step === 'cpf') {
    const cpf = normalizeCpf(message);
    if (cpf.length !== 11) {
      return { replyText: 'CPF inválido. Envie os 11 dígitos do CPF.', action: 'guided_retry_cpf' };
    }
    draft.cpf = cpf;
    saveWhatsAppSession(sender.phoneNumber, 'address', draft);
    return { replyText: 'Perfeito. Agora me envie o endereco completo.', action: 'guided_collect_address' };
  }

  if (session.step === 'address') {
    if (message.length < 6) {
      return { replyText: 'Me envie um endereco mais completo para continuar.', action: 'guided_retry_address' };
    }
    draft.address = message;
    saveWhatsAppSession(sender.phoneNumber, 'date', draft);
    return {
      replyText: [
        'Escolha a data do atendimento.',
        'Você pode responder com o número da lista ou com a data no formato AAAA-MM-DD.',
        '',
        buildFreeDatesListText(schedule),
      ].join('\n'),
      action: 'guided_collect_date',
    };
  }

  if (session.step === 'date') {
    const selectedDate = resolveDateSelection(message, schedule);
    if (!selectedDate) {
      return {
        replyText: [
          'Não consegui identificar uma data livre.',
          'Responda com o numero da lista ou com a data no formato AAAA-MM-DD.',
          '',
          buildFreeDatesListText(schedule),
        ].join('\n'),
        action: 'guided_retry_date',
      };
    }
    draft.date = selectedDate;
    saveWhatsAppSession(sender.phoneNumber, 'time', draft);
    return {
      replyText: [
        'Agora escolha o horário.',
        'Você pode responder com o número da lista ou com o horário no formato HH:MM.',
        '',
        buildFreeTimesListText(selectedDate, schedule),
      ].join('\n'),
      action: 'guided_collect_time',
    };
  }

  if (session.step === 'time') {
    const selectedTime = resolveTimeSelection(draft.date, message, schedule);
    if (!selectedTime) {
      return {
        replyText: [
          'Esse horário não está livre.',
          'Escolha um dos horários abaixo:',
          '',
          buildFreeTimesListText(draft.date, schedule),
        ].join('\n'),
        action: 'guided_retry_time',
      };
    }
    draft.time = selectedTime;
    saveWhatsAppSession(sender.phoneNumber, 'procedure', draft);
    return {
      replyText: 'Se quiser, me envie o procedimento. Se preferir pular, responda PULAR.',
      action: 'guided_collect_procedure',
    };
  }

  if (session.step === 'procedure') {
    draft.procedureName = normalizedMessage === 'pular' ? '' : message;
    saveWhatsAppSession(sender.phoneNumber, 'notes', draft);
    return {
      replyText: 'Se quiser adicionar observações, envie agora. Se não, responda PULAR.',
      action: 'guided_collect_notes',
    };
  }

  if (session.step === 'notes') {
    draft.notes = normalizedMessage === 'pular' ? '' : message;
    saveWhatsAppSession(sender.phoneNumber, 'confirm', draft);
    return {
      replyText: buildGuidedSummary(draft),
      action: 'guided_confirm',
    };
  }

  if (session.step === 'confirm') {
    if (normalizedMessage !== 'confirmar') {
      return {
        replyText: 'Para concluir, responda CONFIRMAR. Se quiser apagar esse fluxo, envie CANCELAR FLUXO.',
        action: 'guided_retry_confirm',
      };
    }

    const appointment = createAppointment(
      {
        fullName: draft.fullName,
        address: draft.address,
        cpf: draft.cpf,
        date: draft.date,
        time: draft.time,
        procedureName: draft.procedureName || '',
        notes: draft.notes || '',
        source: 'whatsapp',
        contactPhone: sender.phoneNumber,
      },
      { id: 'whatsapp-bot', displayName: 'WhatsApp', role: 'system' }
    );

    clearWhatsAppSession(sender.phoneNumber);
    writeAuditLog(
      { id: 'whatsapp-bot', displayName: 'WhatsApp', role: 'system' },
      'create_appointment_whatsapp_guided',
      'appointment',
      appointment.id,
      { phoneNumber: sender.phoneNumber }
    );

    return {
      replyText: `Agendamento confirmado para ${appointment.fullName} em ${appointment.date} as ${appointment.time}.`,
      action: 'guided_create_appointment',
      appointment,
    };
  }

  clearWhatsAppSession(sender.phoneNumber);
  return {
    replyText: buildWhatsAppHelpMessage(),
    action: 'guided_reset',
  };
}

function executeWhatsAppCommand(command, sender) {
  if (command.type === 'help') {
    clearWhatsAppSession(sender.phoneNumber);
    return { replyText: buildWhatsAppHelpMessage(), action: 'help' };
  }

  if (command.type === 'list_dates') {
    clearWhatsAppSession(sender.phoneNumber);
    return { replyText: buildAvailableDatesMessage(), action: 'list_dates' };
  }

  const cpf = resolveCommandField(command.fields || {}, ['cpf']);
  const date = resolveCommandField(command.fields || {}, ['data', 'date']);
  const time = resolveCommandField(command.fields || {}, ['hora', 'horario', 'time']);

  if (command.type === 'appointment_status') {
    const appointment = findAppointmentByCpfAndDate(cpf, date);
    if (!appointment) {
      return {
        replyText: 'Não encontrei agendamento ativo com esse CPF e essa data. Envie "DATAS" para ver as datas liberadas.',
        action: 'status_not_found',
      };
    }

    return {
      replyText: `Agendamento encontrado para ${appointment.fullName} em ${appointment.date}${appointment.time ? ` as ${appointment.time}` : ''}. Status atual: ${appointment.status}.`,
      action: 'status_found',
      appointment,
    };
  }

  if (command.type === 'cancel_appointment') {
    const appointment = findAppointmentByCpfAndDate(cpf, date);
    if (!appointment) {
      return {
        replyText: 'Não encontrei agendamento ativo para cancelar com esse CPF e essa data.',
        action: 'cancel_not_found',
      };
    }

    const updated = updateAppointmentStatus(appointment.id, 'cancelado', {
      id: 'whatsapp-bot',
      displayName: 'WhatsApp',
      role: 'system',
    });
    return {
      replyText: `Agendamento de ${updated.fullName} em ${updated.date}${updated.time ? ` as ${updated.time}` : ''} foi cancelado com sucesso.`,
      action: 'cancel_appointment',
      appointment: updated,
    };
  }

  if (command.type === 'create_appointment') {
    const fullName = resolveCommandField(command.fields || {}, ['nome', 'nomecompleto']);
    const address = resolveCommandField(command.fields || {}, ['endereco']);
    const procedureName = resolveCommandField(command.fields || {}, ['procedimento']);
    const notes = resolveCommandField(command.fields || {}, ['obs', 'observacoes', 'observacao']);

    if (!fullName || !address || !cpf || !date || !time) {
      saveWhatsAppSession(sender.phoneNumber, 'name', {});
      return {
        replyText: buildGuidedStartMessage(),
        action: 'guided_start',
      };
    }

    const appointment = createAppointment(
      {
        fullName,
        address,
        cpf,
        date,
        time,
        procedureName,
        notes,
        source: 'whatsapp',
        contactPhone: sender.phoneNumber,
      },
      { id: 'whatsapp-bot', displayName: 'WhatsApp', role: 'system' }
    );

    writeAuditLog(
      { id: 'whatsapp-bot', displayName: 'WhatsApp', role: 'system' },
      'create_appointment_whatsapp',
      'appointment',
      appointment.id,
      { phoneNumber: sender.phoneNumber }
    );

    return {
      replyText: `Agendamento criado com sucesso para ${appointment.fullName} em ${appointment.date} as ${appointment.time}. Status: ${appointment.status}.`,
      action: 'create_appointment',
      appointment,
    };
  }

  return { replyText: buildWhatsAppHelpMessage(), action: 'help' };
}

async function processIncomingWhatsAppMessage({
  from,
  profileName,
  text,
  metaMessageId = '',
  source = 'meta',
}) {
  const sender = {
    phoneNumber: normalizePhoneNumber(from),
    profileName: String(profileName || ''),
  };
  const command = parseWhatsAppCommand(text);
  const activeSession = getWhatsAppSession(sender.phoneNumber);

  logWhatsAppEvent({
    direction: 'inbound',
    phoneNumber: sender.phoneNumber,
    profileName: sender.profileName,
    messageType: 'text',
    messageText: text,
    status: 'received',
    metaMessageId,
    details: { source, commandType: command.type },
  });

  let outcome;
  try {
    if (activeSession && command.type === 'help' && !/^(ajuda|menu|oi|ola|help)\b/i.test(String(text || '').trim())) {
      outcome = executeGuidedWhatsAppFlow(activeSession, text, sender);
    } else if (activeSession && command.type === 'help') {
      clearWhatsAppSession(sender.phoneNumber);
      outcome = executeWhatsAppCommand(command, sender);
    } else if (isGuidedScheduleTrigger(text) && command.type !== 'create_appointment') {
      saveWhatsAppSession(sender.phoneNumber, 'name', {});
      outcome = {
        replyText: buildGuidedStartMessage(),
        action: 'guided_start',
      };
    } else {
      outcome = executeWhatsAppCommand(command, sender);
    }
  } catch (error) {
    outcome = {
      replyText: error.message || 'Não foi possível processar sua mensagem agora. Tente novamente em instantes.',
      action: 'error',
      error,
    };
  }

  let outboundMetaMessageId = '';
  let deliveryStatus = 'simulated';
  if (source === 'meta') {
    const sendResult = await sendWhatsAppTextMessage(sender.phoneNumber, outcome.replyText);
    outboundMetaMessageId = sendResult?.messages?.[0]?.id || '';
    deliveryStatus = 'sent';
  }

  logWhatsAppEvent({
    direction: 'outbound',
    phoneNumber: sender.phoneNumber,
    profileName: sender.profileName,
    messageType: 'text',
    messageText: outcome.replyText,
    status: deliveryStatus,
    appointmentId: outcome.appointment?.id || '',
    metaMessageId: outboundMetaMessageId,
    details: {
      source,
      action: outcome.action,
      commandType: command.type,
      error: outcome.error?.message || '',
    },
  });

  return {
    sender,
    commandType: command.type,
    action: outcome.action,
    replyText: outcome.replyText,
    appointment: outcome.appointment || null,
    delivered: source === 'meta',
  };
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    return res.status(401).json({ error: 'Token ausente.' });
  }

  try {
    req.auth = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: 'Token inválido.' });
  }
}

function adminRequired(req, res, next) {
  if (req.auth.role !== 'admin') {
    return res.status(403).json({ error: 'Apenas administradores podem fazer isso.' });
  }
  return next();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/site-content', (_req, res) => {
  res.json(getSiteContent());
});

app.get('/api/admin/schedule', authRequired, (_req, res) => {
  res.json(getSchedule());
});

app.get('/api/admin/dashboard', authRequired, (req, res) => {
  res.json({
    summary: getDashboardSummary(),
    auditLogs: getAuditLogs(req.auth.role === 'admin' ? 40 : 15),
  });
});

app.get('/api/admin/system-check', authRequired, (req, res) => {
  try {
    const report = buildSystemCheckReport(req.auth);
    return res.json(report);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Falha ao executar diagnóstico do sistema.' });
  }
});

app.get('/api/admin/integrations/whatsapp', authRequired, adminRequired, (req, res) => {
  res.json(getWhatsAppStatus(req));
});

app.get('/api/admin/backup', authRequired, adminRequired, (_req, res) => {
  const snapshot = buildBackupSnapshot();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="backup-dra-williane-${Date.now()}.json"`);
  res.send(JSON.stringify(snapshot, null, 2));
});

app.get('/api/admin/patient-history', authRequired, (req, res) => {
  res.json({
    retention: getRetentionStatus(),
    archiveFiles: req.auth.role === 'admin' ? getArchiveFileRows() : [],
    records: getPatientHistory({
      query: req.query.q,
      archived: req.query.archived,
      limit: req.query.limit,
    }),
  });
});

app.post('/api/admin/retention/run', authRequired, adminRequired, (req, res) => {
  try {
    const result = runRetentionMaintenance(req.auth);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Falha ao executar manutenção do histórico.' });
  }
});

app.get('/api/admin/archive-files', authRequired, adminRequired, (_req, res) => {
  res.json({
    retention: getRetentionStatus(),
    archiveFiles: getArchiveFileRows(),
  });
});

app.get('/api/admin/archive-files/:id/download', authRequired, adminRequired, (req, res) => {
  const file = db.prepare(`
    SELECT id, file_name, file_path
    FROM patient_archive_files
    WHERE id = ?
      AND COALESCE(deleted_at, '') = ''
  `).get(req.params.id);

  if (!file) {
    return res.status(404).json({ error: 'Arquivo de histórico não encontrado.' });
  }

  const resolvedPath = path.resolve(file.file_path);
  const archiveRoot = path.resolve(ARCHIVE_DIR);
  if (!resolvedPath.startsWith(archiveRoot) || !fs.existsSync(resolvedPath)) {
    return res.status(404).json({ error: 'Arquivo físico não está disponível no servidor.' });
  }

  res.setHeader('Content-Type', 'application/gzip');
  res.setHeader('Content-Disposition', `attachment; filename="${file.file_name}"`);
  return res.sendFile(resolvedPath);
});

app.get('/api/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const challenge = req.query['hub.challenge'];
  const verifyToken = req.query['hub.verify_token'];

  if (mode === 'subscribe' && verifyToken && verifyToken === WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.status(403).json({ error: 'Falha na verificação do webhook do WhatsApp.' });
});

app.post('/api/whatsapp/webhook', async (req, res) => {
  const changes = Array.isArray(req.body?.entry)
    ? req.body.entry.flatMap((entry) => entry.changes || [])
    : [];

  try {
    for (const change of changes) {
      const value = change?.value || {};
      const contacts = value.contacts || [];
      const messages = value.messages || [];

      for (const message of messages) {
        if (message?.type !== 'text') continue;
        const contact = contacts.find((item) => normalizePhoneNumber(item.wa_id) === normalizePhoneNumber(message.from)) || contacts[0];
        await processIncomingWhatsAppMessage({
          from: message.from,
          profileName: contact?.profile?.name || '',
          text: message.text?.body || '',
          metaMessageId: message.id || '',
          source: 'meta',
        });
      }
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message || 'Falha ao processar webhook do WhatsApp.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const normalizedUsername = String(username || '').trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(normalizedUsername);

  if (!user || !user.active || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      displayName: user.display_name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  writeAuditLog(sanitizeUser(user), 'login', 'session', user.id, { username: user.username });

  return res.json({
    token,
    user: sanitizeUser(user),
  });
});

app.get('/api/auth/me', authRequired, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth.id);
  if (!user || !user.active) {
    return res.status(401).json({ error: 'Usuário não encontrado.' });
  }
  return res.json({ user: sanitizeUser(user) });
});

app.post('/api/auth/change-password', authRequired, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || String(newPassword).trim().length < 6) {
    return res.status(400).json({ error: 'A nova senha precisa ter pelo menos 6 caracteres.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }
  if (!bcrypt.compareSync(currentPassword || '', user.password_hash)) {
    return res.status(401).json({ error: 'Senha atual inválida.' });
  }

  db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(
    bcrypt.hashSync(String(newPassword), 10),
    nowIso(),
    user.id
  );

  writeAuditLog(req.auth, 'change_password', 'user', user.id, {});
  return res.json({ ok: true });
});

app.post('/api/admin/whatsapp/simulate-inbound', authRequired, adminRequired, async (req, res) => {
  const from = normalizePhoneNumber(req.body?.from);
  const text = String(req.body?.text || '').trim();
  const profileName = String(req.body?.profileName || 'Simulação').trim();

  if (!from || !text) {
    return res.status(400).json({ error: 'Informe telefone e mensagem para simular o WhatsApp.' });
  }

  try {
    const result = await processIncomingWhatsAppMessage({
      from,
      profileName,
      text,
      source: 'simulation',
    });

    return res.json({
      ok: true,
      result,
      status: getWhatsAppStatus(req),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message || 'Falha ao simular mensagem do WhatsApp.' });
  }
});

app.post('/api/admin/whatsapp/test-message', authRequired, adminRequired, async (req, res) => {
  const to = normalizePhoneNumber(req.body?.to);
  const text = String(req.body?.text || '').trim();

  if (!to || !text) {
    return res.status(400).json({ error: 'Informe telefone e mensagem para enviar o teste.' });
  }

  try {
    const payload = await sendWhatsAppTextMessage(to, text);
    logWhatsAppEvent({
      direction: 'outbound',
      phoneNumber: to,
      messageType: 'text',
      messageText: text,
      status: 'sent',
      metaMessageId: payload?.messages?.[0]?.id || '',
      details: { source: 'admin_test' },
    });
    return res.json({ ok: true, payload, status: getWhatsAppStatus(req) });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Falha ao enviar teste do WhatsApp.',
      details: error.payload || null,
    });
  }
});

app.get('/api/admin/users', authRequired, (_req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY created_at ASC').all().map(sanitizeUser);
  res.json(users);
});

app.post('/api/admin/users', authRequired, adminRequired, (req, res) => {
  const { username, password, role, displayName } = req.body || {};
  if (!username || !password || !displayName) {
    return res.status(400).json({ error: 'Preencha usuário, senha e nome de exibição.' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres.' });
  }

  const normalizedUsername = String(username).trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(normalizedUsername);
  if (existing) {
    return res.status(409).json({ error: 'Esse usuário já existe.' });
  }

  const user = {
    id: `user-${Date.now()}`,
    username: normalizedUsername,
    passwordHash: bcrypt.hashSync(String(password), 10),
    role: role === 'admin' ? 'admin' : 'staff',
    displayName: String(displayName).trim(),
    active: 1,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  db.prepare(`
    INSERT INTO users (id, username, password_hash, role, display_name, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(user.id, user.username, user.passwordHash, user.role, user.displayName, user.active, user.createdAt, user.updatedAt);

  writeAuditLog(req.auth, 'create_user', 'user', user.id, { username: user.username, role: user.role });
  return res.status(201).json({ user: sanitizeUser({ ...user, display_name: user.displayName }) });
});

app.patch('/api/admin/users/:id', authRequired, adminRequired, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  const nextDisplayName = req.body.displayName ? String(req.body.displayName).trim() : user.display_name;
  const nextRole = req.body.role === 'admin' ? 'admin' : req.body.role === 'staff' ? 'staff' : user.role;
  const nextActive = typeof req.body.active === 'boolean' ? (req.body.active ? 1 : 0) : user.active;
  const nextPasswordHash =
    req.body.password && String(req.body.password).length >= 6
      ? bcrypt.hashSync(String(req.body.password), 10)
      : user.password_hash;

  if (req.body.password && String(req.body.password).length < 6) {
    return res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres.' });
  }

  db.prepare(`
    UPDATE users
    SET display_name = ?, role = ?, active = ?, password_hash = ?, updated_at = ?
    WHERE id = ?
  `).run(nextDisplayName, nextRole, nextActive, nextPasswordHash, nowIso(), user.id);

  writeAuditLog(req.auth, 'update_user', 'user', user.id, {
    role: nextRole,
    active: Boolean(nextActive),
    passwordChanged: Boolean(req.body.password),
  });

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  return res.json({ user: sanitizeUser(updated) });
});

app.put('/api/admin/site-content', authRequired, adminRequired, (req, res) => {
  const nextContent = { ...(req.body || {}) };
  delete nextContent.admin;
  setSiteContent(nextContent);
  writeAuditLog(req.auth, 'save_content', 'site_content', 'site_content', {
    sections: Object.keys(nextContent || {}),
  });
  return res.json({ ok: true });
});

app.put('/api/admin/schedule', authRequired, (req, res) => {
  const schedule = persistSchedule(req.body, req.auth);
  writeAuditLog(req.auth, 'save_schedule', 'schedule', 'main', {
    availableDates: schedule.availableDates.length,
    availableTimeSlots: Object.values(schedule.availableTimeSlots || {}).reduce((total, items) => total + items.length, 0),
    appointments: schedule.appointments.length,
  });
  return res.json({ ok: true, schedule });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});


