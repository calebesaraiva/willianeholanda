const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || 'dra-williane-secret-local';
const CURRENT_ADMIN_USERNAME = 'williane';
const CURRENT_ADMIN_PASSWORD = 'Acesso@2025';
const LEGACY_ADMIN_USERNAME = 'dra';
const LEGACY_ADMIN_PASSWORD = 'admin123';
const DATA_DIR = path.join(__dirname, 'data');
const SQLITE_PATH = path.join(DATA_DIR, 'database.sqlite');
const LEGACY_JSON_PATH = path.join(DATA_DIR, 'database.json');

app.use(cors());
app.use(express.json({ limit: '20mb' }));

fs.mkdirSync(DATA_DIR, { recursive: true });

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
    FOREIGN KEY(created_by_user_id) REFERENCES users(id)
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
`);

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

function getSchedule() {
  const availableDates = db.prepare('SELECT date FROM available_dates ORDER BY date ASC').all().map((item) => item.date);
  const appointments = db.prepare(`
    SELECT id, full_name, address, cpf, appointment_date, status, procedure_name, notes, created_at, updated_at, created_by_user_id
    FROM appointments
    ORDER BY appointment_date ASC, full_name ASC
  `).all().map((row) => ({
    id: row.id,
    fullName: row.full_name,
    address: row.address,
    cpf: row.cpf,
    date: row.appointment_date,
    status: row.status,
    procedureName: row.procedure_name || '',
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdByUserId: row.created_by_user_id || '',
  }));

  return { availableDates, appointments };
}

function normalizeStatus(value) {
  const allowed = ['agendado', 'confirmado', 'concluido', 'cancelado'];
  return allowed.includes(value) ? value : 'agendado';
}

function sanitizeAppointment(input, availableDates, existingId) {
  const fullName = String(input?.fullName || '').trim();
  const address = String(input?.address || '').trim();
  const cpfDigits = normalizeCpf(input?.cpf);
  const date = String(input?.date || '').trim();
  const procedureName = String(input?.procedureName || '').trim();
  const notes = String(input?.notes || '').trim();
  const status = normalizeStatus(input?.status);

  if (!fullName || !address || cpfDigits.length !== 11 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }
  if (!availableDates.includes(date)) {
    return null;
  }

  return {
    id: String(existingId || input?.id || `appt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    fullName,
    address,
    cpf: formatCpf(cpfDigits),
    date,
    status,
    procedureName,
    notes,
    createdAt: input?.createdAt ? String(input.createdAt) : nowIso(),
    updatedAt: nowIso(),
  };
}

function persistSchedule(input, actor) {
  const nextAvailableDates = actor.role === 'admin'
    ? sortUniqueDates((input?.availableDates || []).map((item) => String(item)))
    : getSchedule().availableDates;

  const existingAppointmentsById = new Map(
    getSchedule().appointments.map((item) => [item.id, item])
  );

  const sanitizedAppointments = (Array.isArray(input?.appointments) ? input.appointments : [])
    .map((item) => sanitizeAppointment(item, nextAvailableDates, item?.id))
    .filter(Boolean)
    .filter((item, index, list) => {
      const duplicateIndex = list.findIndex(
        (candidate) =>
          candidate.date === item.date &&
          normalizeCpf(candidate.cpf) === normalizeCpf(item.cpf) &&
          candidate.status !== 'cancelado'
      );
      return duplicateIndex === index;
    });

  const transaction = db.transaction(() => {
    if (actor.role === 'admin') {
      db.prepare('DELETE FROM available_dates').run();
      const insertDate = db.prepare('INSERT INTO available_dates (date, created_at) VALUES (?, ?)');
      nextAvailableDates.forEach((date) => insertDate.run(date, nowIso()));
    }

    db.prepare('DELETE FROM appointments').run();
    const insertAppointment = db.prepare(`
      INSERT INTO appointments (
        id, full_name, address, cpf, appointment_date, status, procedure_name, notes, created_at, updated_at, created_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    sanitizedAppointments.forEach((item) => {
      const existing = existingAppointmentsById.get(item.id);
      insertAppointment.run(
        item.id,
        item.fullName,
        item.address,
        item.cpf,
        item.date,
        item.status,
        item.procedureName,
        item.notes,
        existing?.createdAt || item.createdAt,
        nowIso(),
        existing?.createdByUserId || actor.id
      );
    });
  });

  transaction();
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
    byStatus,
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
    auditLogs: getAuditLogs(500),
  };
}

function ensureSeedData() {
  const hasUsers = db.prepare('SELECT COUNT(*) AS count FROM users').get().count > 0;
  if (hasUsers) return;

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
  insertUser.run('user-secretaria', 'secretaria', bcrypt.hashSync('secretaria123', 10), 'staff', 'Secretaria', 1, now, now);
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
  const adminUser = db.prepare('SELECT * FROM users WHERE id = ?').get('user-dra');
  if (!adminUser || adminUser.role !== 'admin') return;

  const hasLegacyUsername = adminUser.username === LEGACY_ADMIN_USERNAME;
  const hasLegacyPassword = bcrypt.compareSync(LEGACY_ADMIN_PASSWORD, adminUser.password_hash);
  const hasCurrentUsername = adminUser.username === CURRENT_ADMIN_USERNAME;
  const hasCurrentPassword = bcrypt.compareSync(CURRENT_ADMIN_PASSWORD, adminUser.password_hash);

  if (hasCurrentUsername && hasCurrentPassword) return;

  if ((hasLegacyUsername && hasLegacyPassword) || (hasCurrentUsername && hasLegacyPassword)) {
    db.prepare('UPDATE users SET username = ?, password_hash = ?, updated_at = ? WHERE id = ?').run(
      CURRENT_ADMIN_USERNAME,
      bcrypt.hashSync(CURRENT_ADMIN_PASSWORD, 10),
      nowIso(),
      adminUser.id
    );
  }
}

migrateDefaultAdminCredentialsIfNeeded();

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

app.get('/api/admin/backup', authRequired, adminRequired, (_req, res) => {
  const snapshot = buildBackupSnapshot();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="backup-dra-williane-${Date.now()}.json"`);
  res.send(JSON.stringify(snapshot, null, 2));
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
    appointments: schedule.appointments.length,
  });
  return res.json({ ok: true, schedule });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
