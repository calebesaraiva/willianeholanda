import React, { useEffect, useMemo, useState } from 'react';
import { defaultSiteContent } from '../content/defaultSiteContent';
import { useSiteContent } from '../content/SiteContentContext';

function cloneContent(content) {
  return JSON.parse(JSON.stringify(content));
}

function setAtPath(obj, path, value) {
  const next = Array.isArray(obj) ? [...obj] : { ...obj };
  let current = next;

  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index];
    current[key] = Array.isArray(current[key]) ? [...current[key]] : { ...current[key] };
    current = current[key];
  }

  current[path[path.length - 1]] = value;
  return next;
}

function formatCpf(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function normalizeCpf(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 11);
}

function formatDateLabel(dateString) {
  if (!dateString) return '';
  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function monthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function sameMonth(a, b) {
  return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function monthDays(date) {
  const first = monthStart(date);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  const days = [];
  for (let index = 0; index < 42; index += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    days.push(current);
  }
  return days;
}

function sortDates(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function baseInputStyle() {
  return {
    width: '100%',
    background: 'rgba(17,17,17,0.95)',
    border: '1px solid rgba(201,169,110,0.18)',
    color: '#F5F0E8',
    borderRadius: '14px',
    padding: '12px 14px',
    fontFamily: "'Outfit', sans-serif",
    fontSize: '14px',
    lineHeight: 1.6,
    outline: 'none',
  };
}

function Field({ label, value, onChange, multiline = false, placeholder, type = 'text', disabled = false }) {
  const sharedStyle = {
    ...baseInputStyle(),
    opacity: disabled ? 0.55 : 1,
  };

  return (
    <label style={{ display: 'block' }}>
      <div
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '11px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#C9A96E',
          marginBottom: '8px',
        }}
      >
        {label}
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={4}
          disabled={disabled}
          style={{ ...sharedStyle, resize: 'vertical', minHeight: '110px' }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={sharedStyle}
        />
      )}
    </label>
  );
}

function SelectField({ label, value, onChange, options, disabled = false }) {
  return (
    <label style={{ display: 'block' }}>
      <div
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '11px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#C9A96E',
          marginBottom: '8px',
        }}
      >
        {label}
      </div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        style={{
          ...baseInputStyle(),
          opacity: disabled ? 0.55 : 1,
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SectionCard({ title, eyebrow, description, children }) {
  return (
    <section
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,20,0.98) 0%, rgba(11,11,11,0.98) 100%)',
        border: '1px solid rgba(201,169,110,0.14)',
        borderRadius: '28px',
        padding: '28px',
        marginBottom: '24px',
        boxShadow: '0 18px 44px rgba(0,0,0,0.28)',
      }}
    >
      <div style={{ marginBottom: '20px' }}>
        {eyebrow ? (
          <div style={{ color: '#C9A96E', textTransform: 'uppercase', letterSpacing: '0.24em', fontSize: '11px', marginBottom: '8px' }}>
            {eyebrow}
          </div>
        ) : null}
        <h2 style={{ margin: 0, fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '34px', color: '#F5F0E8' }}>
          {title}
        </h2>
        {description ? <p style={{ margin: '10px 0 0', color: 'rgba(245,240,232,0.68)', lineHeight: 1.8 }}>{description}</p> : null}
      </div>
      <div style={{ display: 'grid', gap: '18px' }}>{children}</div>
    </section>
  );
}

function Row({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>{children}</div>;
}

function ActionButton({ children, onClick, variant = 'outline', type = 'button', disabled = false }) {
  const palette =
    variant === 'primary'
      ? { background: '#C9A96E', color: '#151515', border: '1px solid #C9A96E' }
      : variant === 'danger'
        ? { background: 'transparent', color: '#E7B1B1', border: '1px solid rgba(231,177,177,0.35)' }
        : { background: 'transparent', color: '#F5F0E8', border: '1px solid rgba(255,255,255,0.12)' };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...palette, borderRadius: '999px', padding: '12px 18px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1, fontWeight: 500 }}
    >
      {children}
    </button>
  );
}

function ItemCard({ title, children, onRemove }) {
  return (
    <div style={{ background: 'rgba(23,23,23,0.94)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
        <strong style={{ color: '#F5F0E8', fontFamily: "'Outfit', sans-serif", fontWeight: 500 }}>{title}</strong>
        {onRemove ? <ActionButton variant="danger" onClick={onRemove}>Remover</ActionButton> : null}
      </div>
      <div style={{ display: 'grid', gap: '14px' }}>{children}</div>
    </div>
  );
}

function UploadField({ label, value, onChange }) {
  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <Field label={`${label} (URL ou base64)`} value={value} onChange={onChange} multiline />
      <div style={{ marginTop: '10px' }}>
        <input type="file" accept="image/*" onChange={handleUpload} />
      </div>
      {value ? <div style={{ marginTop: '14px' }}><img src={value} alt={label} style={{ width: '100%', maxWidth: '260px', borderRadius: '16px', border: '1px solid rgba(201,169,110,0.22)', boxShadow: '0 18px 34px rgba(0,0,0,0.24)' }} /></div> : null}
    </div>
  );
}

function CalendarLegend() {
  return <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: 'rgba(245,240,232,0.68)', fontSize: '13px' }}><span>Liberada: dourado suave</span><span>Com paciente: contorno verde</span><span>Fora do mes: opaco</span></div>;
}

function UserStatusPill({ active, role }) {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <span style={{ borderRadius: '999px', padding: '7px 11px', background: role === 'admin' ? 'rgba(201,169,110,0.16)' : 'rgba(255,255,255,0.06)', color: role === 'admin' ? '#E8D5A3' : '#F5F0E8', fontSize: '12px' }}>{role === 'admin' ? 'Admin' : 'Equipe'}</span>
      <span style={{ borderRadius: '999px', padding: '7px 11px', background: active ? 'rgba(91,196,142,0.16)' : 'rgba(231,177,177,0.16)', color: active ? '#9BE6BA' : '#E7B1B1', fontSize: '12px' }}>{active ? 'Ativo' : 'Inativo'}</span>
    </div>
  );
}

function StatCard({ label, value, tone = 'gold' }) {
  const tones = {
    gold: { background: 'rgba(201,169,110,0.12)', border: 'rgba(201,169,110,0.22)', color: '#F1DEC0' },
    green: { background: 'rgba(91,196,142,0.12)', border: 'rgba(91,196,142,0.22)', color: '#9BE6BA' },
    white: { background: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.12)', color: '#F5F0E8' },
  };
  const palette = tones[tone] || tones.gold;

  return (
    <div style={{ background: palette.background, border: `1px solid ${palette.border}`, borderRadius: '20px', padding: '18px' }}>
      <div style={{ color: 'rgba(245,240,232,0.62)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>
        {label}
      </div>
      <strong style={{ color: palette.color, fontSize: '32px', fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}>
        {value}
      </strong>
    </div>
  );
}

export default function AdminPanel() {
  const {
    siteContent,
    loading,
    login,
    logout,
    currentUser,
    users,
    dashboard,
    saveContent,
    resetContent,
    saveSchedule,
    changeOwnPassword,
    createUser,
    updateUser,
    downloadBackup,
  } = useSiteContent();

  const [draft, setDraft] = useState(() => cloneContent(siteContent));
  const [loginForm, setLoginForm] = useState({ username: 'dra', password: '' });
  const [appointmentForm, setAppointmentForm] = useState({ fullName: '', address: '', cpf: '', date: '', procedureName: '', notes: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [userForm, setUserForm] = useState({ displayName: '', username: '', password: '', role: 'staff' });
  const [userEdits, setUserEdits] = useState({});
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [notice, setNotice] = useState(null);
  const [busyKey, setBusyKey] = useState('');

  const isAdmin = currentUser?.role === 'admin';
  const dashboardUrl = useMemo(() => `${window.location.origin}/`, []);

  useEffect(() => {
    setDraft(cloneContent(siteContent));
  }, [siteContent]);

  useEffect(() => {
    setUserEdits(users.reduce((accumulator, user) => {
      accumulator[user.id] = { displayName: user.displayName, role: user.role, active: user.active, password: '' };
      return accumulator;
    }, {}));
  }, [users]);

  const flashNotice = (type, message) => setNotice({ type, message });
  const updateDraft = (path, value) => setDraft((previous) => setAtPath(previous, path, value));
  const addArrayItem = (path, item) => setDraft((previous) => {
    const target = path.reduce((accumulator, key) => accumulator[key], previous);
    return setAtPath(previous, path, [...target, item]);
  });
  const removeArrayItem = (path, index) => setDraft((previous) => {
    const target = path.reduce((accumulator, key) => accumulator[key], previous);
    return setAtPath(previous, path, target.filter((_, itemIndex) => itemIndex !== index));
  });

  const toggleAvailableDate = (dateString) => {
    if (!isAdmin) return;

    setDraft((previous) => {
      const exists = previous.admin.availableDates.includes(dateString);
      const nextDates = exists ? previous.admin.availableDates.filter((item) => item !== dateString) : sortDates([...previous.admin.availableDates, dateString]);
      const nextAppointments = previous.admin.appointments.filter((item) => item.status === 'cancelado' || nextDates.includes(item.date));

      return {
        ...previous,
        admin: {
          ...previous.admin,
          availableDates: nextDates,
          appointments: nextAppointments,
        },
      };
    });
  };

  const updateAppointment = (id, field, value) => {
    const appointmentIndex = draft.admin.appointments.findIndex((item) => item.id === id);
    if (appointmentIndex < 0) return;
    updateDraft(['admin', 'appointments', appointmentIndex, field], value);
  };

  const removeAppointment = (id) => {
    const appointmentIndex = draft.admin.appointments.findIndex((item) => item.id === id);
    if (appointmentIndex < 0) return;
    removeArrayItem(['admin', 'appointments'], appointmentIndex);
  };

  const handleAddAppointment = () => {
    const normalizedCpf = normalizeCpf(appointmentForm.cpf);

    if (!appointmentForm.fullName.trim() || !appointmentForm.address.trim() || !normalizedCpf || !appointmentForm.date) {
      flashNotice('error', 'Preencha nome completo, endereco, CPF e data.');
      return;
    }
    if (normalizedCpf.length !== 11) {
      flashNotice('error', 'O CPF precisa ter 11 digitos.');
      return;
    }
    if (!draft.admin.availableDates.includes(appointmentForm.date)) {
      flashNotice('error', 'A data escolhida nao foi liberada pela Dra.');
      return;
    }

    const duplicate = draft.admin.appointments.some((item) => item.date === appointmentForm.date && normalizeCpf(item.cpf) === normalizedCpf && item.status !== 'cancelado');
    if (duplicate) {
      flashNotice('error', 'Ja existe um agendamento ativo para esse CPF nessa data.');
      return;
    }

    addArrayItem(['admin', 'appointments'], {
      id: `appt-${Date.now()}`,
      fullName: appointmentForm.fullName.trim(),
      address: appointmentForm.address.trim(),
      cpf: formatCpf(normalizedCpf),
      date: appointmentForm.date,
      status: 'agendado',
      procedureName: appointmentForm.procedureName.trim(),
      notes: appointmentForm.notes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setAppointmentForm({ fullName: '', address: '', cpf: '', date: '', procedureName: '', notes: '' });
    flashNotice('success', 'Agendamento adicionado ao painel. Agora e so salvar a agenda.');
  };

  const appointmentsByDate = useMemo(() => [...draft.admin.appointments].sort((a, b) => {
    const dateComparison = a.date.localeCompare(b.date);
    if (dateComparison !== 0) return dateComparison;
    return a.fullName.localeCompare(b.fullName);
  }), [draft.admin.appointments]);

  const monthGrid = useMemo(() => monthDays(calendarMonth), [calendarMonth]);
  const upcomingHighlights = useMemo(() => draft.admin.availableDates.slice(0, 8), [draft.admin.availableDates]);
  const summary = dashboard?.summary || {};
  const auditLogs = dashboard?.auditLogs || [];
  const todayDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayAppointments = useMemo(
    () => appointmentsByDate.filter((item) => item.date === todayDate && item.status !== 'cancelado'),
    [appointmentsByDate, todayDate]
  );

  const handleLogin = async (event) => {
    event.preventDefault();
    setBusyKey('login');
    try {
      await login(loginForm.username, loginForm.password);
      setLoginForm((previous) => ({ ...previous, password: '' }));
      flashNotice('success', 'Acesso liberado.');
    } catch (error) {
      flashNotice('error', error.message);
    } finally {
      setBusyKey('');
    }
  };

  const handleSaveSchedule = async () => {
    setBusyKey('schedule');
    try {
      await saveSchedule(draft.admin);
      flashNotice('success', 'Agenda salva no servidor com sucesso.');
    } catch (error) {
      flashNotice('error', error.message);
    } finally {
      setBusyKey('');
    }
  };

  const handleSaveContent = async () => {
    setBusyKey('content');
    try {
      await saveContent(draft);
      flashNotice('success', 'Conteudo do site salvo com sucesso.');
    } catch (error) {
      flashNotice('error', error.message);
    } finally {
      setBusyKey('');
    }
  };

  const handleReset = async () => {
    setBusyKey('reset');
    try {
      await resetContent();
      setDraft(cloneContent(defaultSiteContent));
      flashNotice('success', 'Conteudo visual restaurado para o padrao do projeto.');
    } catch (error) {
      flashNotice('error', error.message);
    } finally {
      setBusyKey('');
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      flashNotice('error', 'Preencha a senha atual e a nova senha.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      flashNotice('error', 'A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      flashNotice('error', 'A confirmacao da nova senha nao confere.');
      return;
    }

    setBusyKey('password');
    try {
      await changeOwnPassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      flashNotice('success', 'Senha atualizada com sucesso.');
    } catch (error) {
      flashNotice('error', error.message);
    } finally {
      setBusyKey('');
    }
  };

  const handleCreateUser = async () => {
    if (!isAdmin) return;
    if (!userForm.displayName.trim() || !userForm.username.trim() || userForm.password.length < 6) {
      flashNotice('error', 'Preencha nome, usuario e uma senha com pelo menos 6 caracteres.');
      return;
    }

    setBusyKey('create-user');
    try {
      await createUser({ displayName: userForm.displayName.trim(), username: userForm.username.trim(), password: userForm.password, role: userForm.role });
      setUserForm({ displayName: '', username: '', password: '', role: 'staff' });
      flashNotice('success', 'Novo acesso criado para a equipe.');
    } catch (error) {
      flashNotice('error', error.message);
    } finally {
      setBusyKey('');
    }
  };

  const handleUpdateUser = async (userId) => {
    if (!isAdmin) return;
    const edit = userEdits[userId];
    if (!edit) return;

    const payload = { displayName: edit.displayName.trim(), role: edit.role, active: edit.active };
    if (edit.password) payload.password = edit.password;

    setBusyKey(`user-${userId}`);
    try {
      await updateUser(userId, payload);
      setUserEdits((previous) => ({ ...previous, [userId]: { ...previous[userId], password: '' } }));
      flashNotice('success', 'Perfil atualizado com sucesso.');
    } catch (error) {
      flashNotice('error', error.message);
    } finally {
      setBusyKey('');
    }
  };

  const handleBackupDownload = async () => {
    setBusyKey('backup');
    try {
      await downloadBackup();
      flashNotice('success', 'Backup exportado com sucesso.');
    } catch (error) {
      flashNotice('error', error.message);
    } finally {
      setBusyKey('');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, rgba(201,169,110,0.12) 0%, rgba(10,10,10,1) 55%)', color: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#C9A96E', letterSpacing: '0.22em', textTransform: 'uppercase', fontSize: '11px', marginBottom: '10px' }}>Painel administrativo</div>
          <h1 style={{ margin: 0, fontFamily: "'Cormorant Garamond', serif", fontSize: '40px', fontWeight: 400 }}>Carregando ambiente</h1>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, rgba(201,169,110,0.12) 0%, rgba(10,10,10,1) 55%)', color: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
        <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '480px', background: 'linear-gradient(180deg, rgba(17,17,17,0.98) 0%, rgba(10,10,10,0.98) 100%)', border: '1px solid rgba(201,169,110,0.16)', borderRadius: '28px', padding: '34px', boxShadow: '0 32px 70px rgba(0,0,0,0.34)' }}>
          <div style={{ color: '#C9A96E', textTransform: 'uppercase', letterSpacing: '0.24em', fontSize: '11px', marginBottom: '12px' }}>Painel Admin</div>
          <h1 style={{ margin: '0 0 12px', fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '42px' }}>Entrar no painel</h1>
          <p style={{ margin: '0 0 22px', color: 'rgba(245,240,232,0.66)', lineHeight: 1.8 }}>A Dra controla o conteudo e libera as datas. A equipe usa o mesmo painel para cadastrar pacientes somente nas datas abertas.</p>
          <Row>
            <Field label="Usuario" value={loginForm.username} onChange={(value) => setLoginForm((previous) => ({ ...previous, username: value }))} />
            <Field label="Senha" type="password" value={loginForm.password} onChange={(value) => setLoginForm((previous) => ({ ...previous, password: value }))} />
          </Row>
          <div style={{ display: 'grid', gap: '10px', marginTop: '18px', color: 'rgba(245,240,232,0.6)', fontSize: '14px', lineHeight: 1.7 }}>
            <div>Dra: <code>dra</code> / <code>DraWilliane#2026!</code></div>
            <div>Equipe: <code>secretaria</code> / <code>EquipeWH#2026!</code></div>
          </div>
          <div style={{ marginTop: '18px' }}><ActionButton type="submit" variant="primary" disabled={busyKey === 'login'}>{busyKey === 'login' ? 'Entrando...' : 'Entrar'}</ActionButton></div>
          {notice ? <div style={{ marginTop: '16px', borderRadius: '16px', padding: '14px 16px', background: notice.type === 'error' ? 'rgba(231,177,177,0.1)' : 'rgba(201,169,110,0.1)', border: notice.type === 'error' ? '1px solid rgba(231,177,177,0.24)' : '1px solid rgba(201,169,110,0.24)' }}>{notice.message}</div> : null}
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, rgba(201,169,110,0.10) 0%, rgba(9,9,9,1) 58%)', color: '#F5F0E8', padding: '24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '18px', flexWrap: 'wrap', marginBottom: '24px', padding: '20px 0' }}>
          <div>
            <div style={{ color: '#C9A96E', textTransform: 'uppercase', letterSpacing: '0.22em', fontSize: '11px', marginBottom: '8px' }}>Painel Administrativo</div>
            <h1 style={{ margin: 0, fontFamily: "'Cormorant Garamond', serif", fontSize: '50px', fontWeight: 400 }}>Dra. Williane Holanda</h1>
            <p style={{ margin: '10px 0 0', color: 'rgba(245,240,232,0.64)' }}>Logada como <strong>{currentUser.displayName}</strong> ({isAdmin ? 'Admin' : 'Equipe'})</p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a href={dashboardUrl} target="_blank" rel="noreferrer" style={{ color: '#F5F0E8' }}><ActionButton>Ver site</ActionButton></a>
            <ActionButton onClick={handleSaveSchedule} variant="primary" disabled={busyKey === 'schedule'}>{busyKey === 'schedule' ? 'Salvando agenda...' : 'Salvar agenda'}</ActionButton>
            {isAdmin ? <ActionButton onClick={handleSaveContent} variant="primary" disabled={busyKey === 'content'}>{busyKey === 'content' ? 'Salvando site...' : 'Salvar site'}</ActionButton> : null}
            {isAdmin ? <ActionButton onClick={handleReset} variant="danger" disabled={busyKey === 'reset'}>Restaurar visual</ActionButton> : null}
            <ActionButton onClick={logout}>Sair</ActionButton>
          </div>
        </div>

        {notice ? <div style={{ marginBottom: '20px', background: notice.type === 'error' ? 'rgba(231,177,177,0.1)' : 'rgba(201,169,110,0.1)', border: notice.type === 'error' ? '1px solid rgba(231,177,177,0.24)' : '1px solid rgba(201,169,110,0.24)', borderRadius: '16px', padding: '14px 16px' }}>{notice.message}</div> : null}

        <SectionCard eyebrow="Visao geral" title="Painel executivo" description="Resumo rapido para a Dra acompanhar equipe, agenda e base de pacientes sem depender do codigo.">
          <Row>
            <StatCard label="Usuarios ativos" value={summary.activeUsers ?? 0} />
            <StatCard label="Datas liberadas" value={summary.releasedDates ?? 0} />
            <StatCard label="Agendamentos ativos" value={summary.activeAppointments ?? 0} tone="green" />
            <StatCard label="Pacientes unicos" value={summary.uniquePatients ?? 0} tone="white" />
          </Row>

          <div style={{ background: 'rgba(23,23,23,0.92)', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <strong style={{ display: 'block', marginBottom: '12px', fontSize: '18px' }}>
              Atendimentos de hoje
            </strong>
            {todayAppointments.length === 0 ? (
              <p style={{ margin: 0, color: 'rgba(245,240,232,0.62)', lineHeight: 1.7 }}>
                Nenhum atendimento ativo para hoje.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {todayAppointments.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <strong style={{ display: 'block' }}>{item.fullName}</strong>
                      <span style={{ color: 'rgba(245,240,232,0.62)', fontSize: '14px' }}>{item.procedureName || 'Procedimento a definir'}</span>
                    </div>
                    <span style={{ color: '#C9A96E', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Fluxo real da clinica" title="Agenda e agendamentos" description="A Dra libera os dias de atendimento. A equipe cadastra o paciente com nome completo, endereco e CPF, e so consegue trabalhar em datas liberadas.">
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1.25fr) minmax(320px, 0.95fr)', gap: '20px' }}>
            <div style={{ background: 'rgba(23,23,23,0.92)', borderRadius: '22px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
                <ActionButton onClick={() => setCalendarMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() - 1, 1))}>Mes anterior</ActionButton>
                <strong style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '30px', fontWeight: 400, textTransform: 'capitalize' }}>{calendarMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</strong>
                <ActionButton onClick={() => setCalendarMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() + 1, 1))}>Proximo mes</ActionButton>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '10px', textAlign: 'center', color: 'rgba(245,240,232,0.6)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((item) => <div key={item}>{item}</div>)}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                {monthGrid.map((date) => {
                  const dateString = date.toISOString().slice(0, 10);
                  const isCurrentMonth = sameMonth(date, calendarMonth);
                  const isAvailable = draft.admin.availableDates.includes(dateString);
                  const hasAppointment = draft.admin.appointments.some((item) => item.date === dateString && item.status !== 'cancelado');

                  return (
                    <button key={dateString} type="button" onClick={() => toggleAvailableDate(dateString)} disabled={!isAdmin} style={{ minHeight: '78px', padding: '8px', borderRadius: '16px', border: hasAppointment ? '1px solid rgba(91,196,142,0.7)' : '1px solid rgba(255,255,255,0.06)', background: isAvailable ? 'rgba(201,169,110,0.16)' : 'rgba(14,14,14,0.95)', color: isCurrentMonth ? '#F5F0E8' : 'rgba(245,240,232,0.26)', cursor: isAdmin ? 'pointer' : 'default', opacity: isAdmin ? 1 : 0.95, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '13px' }}>{date.getDate()}</span>
                      {hasAppointment ? <span style={{ fontSize: '10px', color: '#7AE1A5' }}>Paciente</span> : null}
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop: '18px', display: 'grid', gap: '12px' }}>
                <CalendarLegend />
                {!isAdmin ? <div style={{ color: 'rgba(245,240,232,0.58)', fontSize: '13px' }}>Somente a Dra pode liberar ou bloquear datas.</div> : null}
              </div>
            </div>

            <div style={{ display: 'grid', gap: '18px' }}>
              <div style={{ background: 'rgba(23,23,23,0.92)', borderRadius: '22px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <strong style={{ display: 'block', marginBottom: '14px', fontSize: '18px' }}>Datas liberadas</strong>
                {upcomingHighlights.length === 0 ? <p style={{ margin: 0, color: 'rgba(245,240,232,0.62)', lineHeight: 1.7 }}>Ainda nao existem datas abertas para atendimento.</p> : <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>{upcomingHighlights.map((date) => <span key={date} style={{ padding: '10px 12px', borderRadius: '999px', background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.24)', color: '#F1DEC0', fontSize: '13px' }}>{formatDateLabel(date)}</span>)}</div>}
              </div>

              <div style={{ background: 'rgba(23,23,23,0.92)', borderRadius: '22px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <strong style={{ display: 'block', marginBottom: '14px', fontSize: '18px' }}>Novo agendamento</strong>
                <div style={{ display: 'grid', gap: '14px' }}>
                  <Field label="Nome completo do paciente" value={appointmentForm.fullName} onChange={(value) => setAppointmentForm((previous) => ({ ...previous, fullName: value }))} />
                  <Field label="Endereco" value={appointmentForm.address} onChange={(value) => setAppointmentForm((previous) => ({ ...previous, address: value }))} />
                  <Field label="CPF" value={appointmentForm.cpf} onChange={(value) => setAppointmentForm((previous) => ({ ...previous, cpf: formatCpf(value) }))} />
                  <Field label="Procedimento (opcional)" value={appointmentForm.procedureName} onChange={(value) => setAppointmentForm((previous) => ({ ...previous, procedureName: value }))} />
                  <SelectField label="Data liberada" value={appointmentForm.date} onChange={(value) => setAppointmentForm((previous) => ({ ...previous, date: value }))} options={[{ value: '', label: 'Selecione uma data' }, ...draft.admin.availableDates.map((date) => ({ value: date, label: formatDateLabel(date) }))]} />
                  <Field label="Observacoes internas" value={appointmentForm.notes} onChange={(value) => setAppointmentForm((previous) => ({ ...previous, notes: value }))} multiline />
                  <ActionButton onClick={handleAddAppointment} variant="primary">Adicionar agendamento</ActionButton>
                </div>
              </div>
            </div>
          </div>

          <div>
            <strong style={{ display: 'block', marginBottom: '14px', fontSize: '18px' }}>Pacientes cadastrados</strong>
            {appointmentsByDate.length === 0 ? <p style={{ margin: 0, color: 'rgba(245,240,232,0.62)', lineHeight: 1.7 }}>Nenhum agendamento cadastrado ainda.</p> : <div style={{ display: 'grid', gap: '14px' }}>{appointmentsByDate.map((appointment) => <div key={appointment.id} style={{ background: 'rgba(23,23,23,0.92)', borderRadius: '20px', padding: '18px', border: '1px solid rgba(255,255,255,0.05)' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}><div><strong style={{ display: 'block', fontSize: '18px' }}>{appointment.fullName}</strong><span style={{ color: '#C9A96E', fontSize: '13px' }}>{formatDateLabel(appointment.date)}</span></div><div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}><select value={appointment.status} onChange={(event) => updateAppointment(appointment.id, 'status', event.target.value)} style={{ ...baseInputStyle(), width: 'auto', padding: '10px 12px' }}><option value="agendado">Agendado</option><option value="confirmado">Confirmado</option><option value="concluido">Concluido</option><option value="cancelado">Cancelado</option></select><ActionButton variant="danger" onClick={() => removeAppointment(appointment.id)}>Excluir</ActionButton></div></div><div style={{ display: 'grid', gap: '8px', color: 'rgba(245,240,232,0.76)', lineHeight: 1.7 }}><div><strong>CPF:</strong> {appointment.cpf}</div><div><strong>Endereco:</strong> {appointment.address}</div><div><strong>Procedimento:</strong> {appointment.procedureName || '-'}</div><div><strong>Observacoes:</strong> {appointment.notes || '-'}</div><div><strong>Criado em:</strong> {appointment.createdAt ? new Date(appointment.createdAt).toLocaleString('pt-BR') : '-'}</div></div></div>)}</div>}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Seguranca" title="Meu acesso" description="Cada pessoa entra com seu proprio usuario. A senha pode ser alterada sem mexer no restante do sistema.">
          <Row>
            <Field label="Senha atual" type="password" value={passwordForm.currentPassword} onChange={(value) => setPasswordForm((previous) => ({ ...previous, currentPassword: value }))} />
            <Field label="Nova senha" type="password" value={passwordForm.newPassword} onChange={(value) => setPasswordForm((previous) => ({ ...previous, newPassword: value }))} />
            <Field label="Confirmar nova senha" type="password" value={passwordForm.confirmPassword} onChange={(value) => setPasswordForm((previous) => ({ ...previous, confirmPassword: value }))} />
          </Row>
          <ActionButton onClick={handleChangePassword} variant="primary" disabled={busyKey === 'password'}>{busyKey === 'password' ? 'Atualizando...' : 'Atualizar senha'}</ActionButton>
        </SectionCard>

        <SectionCard eyebrow="Controle e rastreio" title="Backup e auditoria" description="Aqui fica a camada mais segura para demo e operacao controlada: exportacao da base e historico das ultimas acoes do painel.">
          {isAdmin ? (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <ActionButton onClick={handleBackupDownload} variant="primary" disabled={busyKey === 'backup'}>
                {busyKey === 'backup' ? 'Gerando backup...' : 'Baixar backup completo'}
              </ActionButton>
            </div>
          ) : (
            <p style={{ margin: 0, color: 'rgba(245,240,232,0.64)', lineHeight: 1.8 }}>
              Somente a administracao pode exportar backup da base.
            </p>
          )}

          <div style={{ display: 'grid', gap: '12px' }}>
            {auditLogs.length === 0 ? (
              <p style={{ margin: 0, color: 'rgba(245,240,232,0.62)', lineHeight: 1.7 }}>
                Ainda nao existem registros de auditoria.
              </p>
            ) : (
              auditLogs.map((item) => (
                <div key={item.id} style={{ background: 'rgba(23,23,23,0.92)', borderRadius: '18px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <strong>{item.actorDisplayName || 'Sistema'}</strong>
                    <span style={{ color: '#C9A96E', fontSize: '13px' }}>{item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : '-'}</span>
                  </div>
                  <div style={{ color: 'rgba(245,240,232,0.76)', lineHeight: 1.7 }}>
                    <div><strong>Acao:</strong> {item.action}</div>
                    <div><strong>Area:</strong> {item.entityType}</div>
                    {item.entityId ? <div><strong>Referencia:</strong> {item.entityId}</div> : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        {isAdmin ? (
          <SectionCard eyebrow="Equipe" title="Acessos do painel" description="A Dra pode criar perfis para as funcionarias, redefinir senhas e desativar acessos sem abrir o codigo.">
            <div style={{ background: 'rgba(23,23,23,0.92)', borderRadius: '22px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <strong style={{ display: 'block', marginBottom: '14px', fontSize: '18px' }}>Criar novo acesso</strong>
              <Row>
                <Field label="Nome de exibicao" value={userForm.displayName} onChange={(value) => setUserForm((previous) => ({ ...previous, displayName: value }))} />
                <Field label="Usuario" value={userForm.username} onChange={(value) => setUserForm((previous) => ({ ...previous, username: value }))} />
                <Field label="Senha inicial" type="password" value={userForm.password} onChange={(value) => setUserForm((previous) => ({ ...previous, password: value }))} />
                <SelectField label="Perfil" value={userForm.role} onChange={(value) => setUserForm((previous) => ({ ...previous, role: value }))} options={[{ value: 'staff', label: 'Equipe' }, { value: 'admin', label: 'Admin' }]} />
              </Row>
              <div style={{ marginTop: '16px' }}><ActionButton onClick={handleCreateUser} variant="primary" disabled={busyKey === 'create-user'}>{busyKey === 'create-user' ? 'Criando...' : 'Criar acesso'}</ActionButton></div>
            </div>

            <div style={{ display: 'grid', gap: '14px' }}>
              {users.map((user) => {
                const edit = userEdits[user.id] || { displayName: user.displayName, role: user.role, active: user.active, password: '' };
                return <div key={user.id} style={{ background: 'rgba(23,23,23,0.92)', borderRadius: '22px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '14px' }}><div><strong style={{ display: 'block', fontSize: '18px' }}>{user.username}</strong><span style={{ color: 'rgba(245,240,232,0.6)' }}>ID: {user.id}</span></div><UserStatusPill active={edit.active} role={edit.role} /></div><Row><Field label="Nome de exibicao" value={edit.displayName} onChange={(value) => setUserEdits((previous) => ({ ...previous, [user.id]: { ...previous[user.id], displayName: value } }))} /><SelectField label="Perfil" value={edit.role} onChange={(value) => setUserEdits((previous) => ({ ...previous, [user.id]: { ...previous[user.id], role: value } }))} options={[{ value: 'staff', label: 'Equipe' }, { value: 'admin', label: 'Admin' }]} /><Field label="Nova senha (opcional)" type="password" value={edit.password} onChange={(value) => setUserEdits((previous) => ({ ...previous, [user.id]: { ...previous[user.id], password: value } }))} /></Row><div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginTop: '14px' }}><label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(245,240,232,0.72)' }}><input type="checkbox" checked={Boolean(edit.active)} onChange={(event) => setUserEdits((previous) => ({ ...previous, [user.id]: { ...previous[user.id], active: event.target.checked } }))} />Acesso ativo</label><ActionButton onClick={() => handleUpdateUser(user.id)} variant="primary" disabled={busyKey === `user-${user.id}`}>{busyKey === `user-${user.id}` ? 'Salvando...' : 'Salvar usuario'}</ActionButton></div></div>;
              })}
            </div>
          </SectionCard>
        ) : null}

        {isAdmin ? (
          <>
            <SectionCard eyebrow="Site publico" title="Acesso e links globais">
              <Row>
                <Field label="WhatsApp URL" value={draft.global.whatsappUrl} onChange={(value) => updateDraft(['global', 'whatsappUrl'], value)} />
                <Field label="Instagram URL" value={draft.global.instagramUrl} onChange={(value) => updateDraft(['global', 'instagramUrl'], value)} />
                <Field label="Instagram @" value={draft.global.instagramHandle} onChange={(value) => updateDraft(['global', 'instagramHandle'], value)} />
                <Field label="Telefone" value={draft.global.phone} onChange={(value) => updateDraft(['global', 'phone'], value)} />
                <Field label="Localizacao" value={draft.global.location} onChange={(value) => updateDraft(['global', 'location'], value)} />
                <Field label="Atendimento" value={draft.global.attendance} onChange={(value) => updateDraft(['global', 'attendance'], value)} />
                <Field label="CRM" value={draft.global.crm} onChange={(value) => updateDraft(['global', 'crm'], value)} />
              </Row>
              <Field label="Mensagem padrao do WhatsApp" value={draft.global.whatsappMessage} onChange={(value) => updateDraft(['global', 'whatsappMessage'], value)} multiline />
            </SectionCard>

            <SectionCard eyebrow="Primeira dobra" title="Navbar e hero">
              <Row>
                <Field label="Marca destaque" value={draft.navbar.brandAccent} onChange={(value) => updateDraft(['navbar', 'brandAccent'], value)} />
                <Field label="Marca nome" value={draft.navbar.brandName} onChange={(value) => updateDraft(['navbar', 'brandName'], value)} />
                <Field label="CTA do menu" value={draft.navbar.ctaLabel} onChange={(value) => updateDraft(['navbar', 'ctaLabel'], value)} />
                <Field label="Hero label" value={draft.hero.label} onChange={(value) => updateDraft(['hero', 'label'], value)} />
                <Field label="Hero titulo 1" value={draft.hero.titlePrimary} onChange={(value) => updateDraft(['hero', 'titlePrimary'], value)} />
                <Field label="Hero titulo 2" value={draft.hero.titleAccent} onChange={(value) => updateDraft(['hero', 'titleAccent'], value)} />
                <Field label="Botao principal" value={draft.hero.primaryCta} onChange={(value) => updateDraft(['hero', 'primaryCta'], value)} />
                <Field label="Botao secundario" value={draft.hero.secondaryCta} onChange={(value) => updateDraft(['hero', 'secondaryCta'], value)} />
              </Row>
              <Field label="Descricao do hero" value={draft.hero.tagline} onChange={(value) => updateDraft(['hero', 'tagline'], value)} multiline />
              <UploadField label="Imagem do hero" value={draft.hero.backgroundImage} onChange={(value) => updateDraft(['hero', 'backgroundImage'], value)} />
            </SectionCard>

            <SectionCard eyebrow="Autoridade" title="Sobre">
              <Row>
                <Field label="Label da secao" value={draft.about.sectionLabel} onChange={(value) => updateDraft(['about', 'sectionLabel'], value)} />
                <Field label="Titulo antes" value={draft.about.titlePrefix} onChange={(value) => updateDraft(['about', 'titlePrefix'], value)} />
                <Field label="Titulo destaque" value={draft.about.titleAccent} onChange={(value) => updateDraft(['about', 'titleAccent'], value)} />
                <Field label="Selo titulo" value={draft.about.badgeTitle} onChange={(value) => updateDraft(['about', 'badgeTitle'], value)} />
                <Field label="Selo subtitulo" value={draft.about.badgeSubtitle} onChange={(value) => updateDraft(['about', 'badgeSubtitle'], value)} />
              </Row>
              <UploadField label="Imagem do sobre" value={draft.about.image} onChange={(value) => updateDraft(['about', 'image'], value)} />
              {draft.about.paragraphs.map((paragraph, index) => <Field key={index} label={`Paragrafo ${index + 1}`} value={paragraph} onChange={(value) => updateDraft(['about', 'paragraphs', index], value)} multiline />)}
              {draft.about.credentials.map((item, index) => <Field key={index} label={`Credencial ${index + 1}`} value={item} onChange={(value) => updateDraft(['about', 'credentials', index], value)} />)}
            </SectionCard>

            <SectionCard eyebrow="Servicos" title="Especialidades">
              <Row>
                <Field label="Label da secao" value={draft.specialties.sectionLabel} onChange={(value) => updateDraft(['specialties', 'sectionLabel'], value)} />
                <Field label="Titulo antes" value={draft.specialties.headingPrefix} onChange={(value) => updateDraft(['specialties', 'headingPrefix'], value)} />
                <Field label="Titulo destaque" value={draft.specialties.headingAccent} onChange={(value) => updateDraft(['specialties', 'headingAccent'], value)} />
              </Row>
              {draft.specialties.items.map((item, index) => <ItemCard key={index} title={`Especialidade ${index + 1}`} onRemove={draft.specialties.items.length > 1 ? () => removeArrayItem(['specialties', 'items'], index) : undefined}><Row><Field label="Numero" value={item.number} onChange={(value) => updateDraft(['specialties', 'items', index, 'number'], value)} /><Field label="Titulo" value={item.title} onChange={(value) => updateDraft(['specialties', 'items', index, 'title'], value)} /></Row><Field label="Descricao" value={item.desc} onChange={(value) => updateDraft(['specialties', 'items', index, 'desc'], value)} multiline /></ItemCard>)}
              <ActionButton onClick={() => addArrayItem(['specialties', 'items'], { number: '07', title: 'Nova especialidade', desc: 'Descricao da especialidade.' })}>Adicionar especialidade</ActionButton>
            </SectionCard>

            <SectionCard eyebrow="Historia" title="Trajetoria">
              <Row>
                <Field label="Label da secao" value={draft.journey.sectionLabel} onChange={(value) => updateDraft(['journey', 'sectionLabel'], value)} />
                <Field label="Titulo antes" value={draft.journey.headingPrefix} onChange={(value) => updateDraft(['journey', 'headingPrefix'], value)} />
                <Field label="Titulo destaque" value={draft.journey.headingAccent} onChange={(value) => updateDraft(['journey', 'headingAccent'], value)} />
              </Row>
              {draft.journey.items.map((item, index) => <ItemCard key={index} title={`Etapa ${index + 1}`} onRemove={draft.journey.items.length > 1 ? () => removeArrayItem(['journey', 'items'], index) : undefined}><Row><Field label="Ano" value={item.year} onChange={(value) => updateDraft(['journey', 'items', index, 'year'], value)} /><Field label="Titulo" value={item.title} onChange={(value) => updateDraft(['journey', 'items', index, 'title'], value)} /></Row><Field label="Descricao" value={item.desc} onChange={(value) => updateDraft(['journey', 'items', index, 'desc'], value)} multiline /></ItemCard>)}
              <ActionButton onClick={() => addArrayItem(['journey', 'items'], { year: 'Novo', title: 'Novo marco', desc: 'Descricao do marco.' })}>Adicionar etapa</ActionButton>
            </SectionCard>

            <SectionCard eyebrow="Imagens" title="Galeria">
              <Row>
                <Field label="Label da secao" value={draft.gallery.sectionLabel} onChange={(value) => updateDraft(['gallery', 'sectionLabel'], value)} />
                <Field label="Titulo antes" value={draft.gallery.headingPrefix} onChange={(value) => updateDraft(['gallery', 'headingPrefix'], value)} />
                <Field label="Titulo destaque" value={draft.gallery.headingAccent} onChange={(value) => updateDraft(['gallery', 'headingAccent'], value)} />
                <Field label="Texto do botao" value={draft.gallery.buttonLabel} onChange={(value) => updateDraft(['gallery', 'buttonLabel'], value)} />
              </Row>
              {draft.gallery.items.map((item, index) => <ItemCard key={index} title={`Imagem ${index + 1}`} onRemove={draft.gallery.items.length > 1 ? () => removeArrayItem(['gallery', 'items'], index) : undefined}><UploadField label="Foto" value={item.src} onChange={(value) => updateDraft(['gallery', 'items', index, 'src'], value)} /><Row><Field label="Legenda" value={item.caption} onChange={(value) => updateDraft(['gallery', 'items', index, 'caption'], value)} /><Field label="Alt" value={item.alt} onChange={(value) => updateDraft(['gallery', 'items', index, 'alt'], value)} /></Row></ItemCard>)}
              <ActionButton onClick={() => addArrayItem(['gallery', 'items'], { src: '', caption: 'Nova imagem', alt: 'Nova imagem' })}>Adicionar imagem</ActionButton>
            </SectionCard>

            <SectionCard eyebrow="Prova social" title="Depoimentos">
              <Field label="Label da secao" value={draft.testimonials.sectionLabel} onChange={(value) => updateDraft(['testimonials', 'sectionLabel'], value)} />
              {draft.testimonials.items.map((item, index) => <ItemCard key={index} title={`Depoimento ${index + 1}`} onRemove={draft.testimonials.items.length > 1 ? () => removeArrayItem(['testimonials', 'items'], index) : undefined}><Field label="Texto" value={item.text} onChange={(value) => updateDraft(['testimonials', 'items', index, 'text'], value)} multiline /><Row><Field label="Nome" value={item.name} onChange={(value) => updateDraft(['testimonials', 'items', index, 'name'], value)} /><Field label="Procedimento" value={item.procedure} onChange={(value) => updateDraft(['testimonials', 'items', index, 'procedure'], value)} /><Field label="Estrelas" type="number" value={String(item.stars)} onChange={(value) => updateDraft(['testimonials', 'items', index, 'stars'], Number(value) || 5)} /></Row></ItemCard>)}
              <ActionButton onClick={() => addArrayItem(['testimonials', 'items'], { text: 'Novo depoimento.', name: 'Paciente', procedure: 'Procedimento', stars: 5 })}>Adicionar depoimento</ActionButton>
            </SectionCard>

            <SectionCard eyebrow="Conversao" title="Contato e rodape">
              <Row>
                <Field label="Label da secao" value={draft.contact.sectionLabel} onChange={(value) => updateDraft(['contact', 'sectionLabel'], value)} />
                <Field label="Titulo antes" value={draft.contact.titlePrefix} onChange={(value) => updateDraft(['contact', 'titlePrefix'], value)} />
                <Field label="Titulo destaque" value={draft.contact.titleAccent} onChange={(value) => updateDraft(['contact', 'titleAccent'], value)} />
                <Field label="Titulo do card lateral" value={draft.contact.panelTitle} onChange={(value) => updateDraft(['contact', 'panelTitle'], value)} />
                <Field label="Texto do botao" value={draft.contact.buttonLabel} onChange={(value) => updateDraft(['contact', 'buttonLabel'], value)} />
              </Row>
              <Field label="Descricao de contato" value={draft.contact.description} onChange={(value) => updateDraft(['contact', 'description'], value)} multiline />
              <Field label="Texto do card lateral" value={draft.contact.panelBody} onChange={(value) => updateDraft(['contact', 'panelBody'], value)} multiline />
              {draft.contact.cards.map((item, index) => <ItemCard key={index} title={`Contato ${index + 1}`} onRemove={draft.contact.cards.length > 1 ? () => removeArrayItem(['contact', 'cards'], index) : undefined}><Row><Field label="Label" value={item.label} onChange={(value) => updateDraft(['contact', 'cards', index, 'label'], value)} /><Field label="Valor" value={item.value} onChange={(value) => updateDraft(['contact', 'cards', index, 'value'], value)} /><Field label="Tipo" value={item.type} onChange={(value) => updateDraft(['contact', 'cards', index, 'type'], value)} /></Row></ItemCard>)}
              <ActionButton onClick={() => addArrayItem(['contact', 'cards'], { label: 'Novo contato', value: 'Valor', type: 'static' })}>Adicionar item de contato</ActionButton>
              {draft.contact.panelBullets.map((item, index) => <Field key={index} label={`Bullet ${index + 1}`} value={item} onChange={(value) => updateDraft(['contact', 'panelBullets', index], value)} />)}
              <Field label="Descricao do rodape" value={draft.footer.brandDescription} onChange={(value) => updateDraft(['footer', 'brandDescription'], value)} multiline />
              {draft.footer.contactItems.map((item, index) => <Field key={index} label={`Rodape contato ${index + 1}`} value={item} onChange={(value) => updateDraft(['footer', 'contactItems', index], value)} />)}
              <Row>
                <Field label="Copyright prefixo" value={draft.footer.copyrightPrefix} onChange={(value) => updateDraft(['footer', 'copyrightPrefix'], value)} />
                <Field label="Copyright texto" value={draft.footer.copyrightSuffix} onChange={(value) => updateDraft(['footer', 'copyrightSuffix'], value)} />
                <Field label="Tagline rodape" value={draft.footer.tagline} onChange={(value) => updateDraft(['footer', 'tagline'], value)} />
              </Row>
            </SectionCard>
          </>
        ) : (
          <SectionCard eyebrow="Modo equipe" title="Permissoes da secretaria" description="Neste perfil, o painel fica focado no operacional: ver datas liberadas, cadastrar pacientes, atualizar status e manter os dados organizados.">
            <p style={{ margin: 0, color: 'rgba(245,240,232,0.7)', lineHeight: 1.8 }}>A parte visual do site, os textos e as imagens ficam reservados para o acesso de administracao da Dra.</p>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
