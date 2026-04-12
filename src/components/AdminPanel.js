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

function normalizeTime(value) {
  return /^\d{2}:\d{2}$/.test(String(value || '').trim()) ? String(value).trim() : '';
}

function sortTimes(values) {
  return [...new Set(values.map(normalizeTime).filter(Boolean))].sort((a, b) => a.localeCompare(b));
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

const DEFAULT_TIME_SLOTS = ['08:00', '09:00', '10:00', '14:00', '15:00', '16:00'];

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

function SectionCard({ title, eyebrow, description, children, style }) {
  return (
    <section
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,20,0.98) 0%, rgba(11,11,11,0.98) 100%)',
        border: '1px solid rgba(201,169,110,0.14)',
        borderRadius: '28px',
        padding: '28px',
        marginBottom: '24px',
        boxShadow: '0 18px 44px rgba(0,0,0,0.28)',
        ...style,
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

function Row({ children, minWidth = 220, style }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`, gap: '16px', ...style }}>{children}</div>;
}

function ActionButton({ children, onClick, variant = 'outline', type = 'button', disabled = false, stretch = false, style }) {
  const [isHovered, setIsHovered] = useState(false);
  const palette =
    variant === 'primary'
      ? { background: '#C9A96E', color: '#151515', border: '1px solid #C9A96E', hoverBackground: '#D8B77C', hoverColor: '#111111', hoverBorder: '#D8B77C', hoverShadow: '0 14px 28px rgba(201,169,110,0.24)' }
      : variant === 'danger'
        ? { background: 'transparent', color: '#E7B1B1', border: '1px solid rgba(231,177,177,0.35)', hoverBackground: 'rgba(231,177,177,0.08)', hoverColor: '#F2C6C6', hoverBorder: 'rgba(231,177,177,0.55)', hoverShadow: '0 12px 24px rgba(231,177,177,0.12)' }
        : { background: 'transparent', color: '#F5F0E8', border: '1px solid rgba(255,255,255,0.12)', hoverBackground: 'rgba(255,255,255,0.08)', hoverColor: '#FFFFFF', hoverBorder: 'rgba(201,169,110,0.26)', hoverShadow: '0 12px 24px rgba(0,0,0,0.18)' };

  const hoverStyles = !disabled && isHovered
    ? {
      background: palette.hoverBackground,
      color: palette.hoverColor,
      border: `1px solid ${palette.hoverBorder}`,
      transform: 'translateY(-1px)',
      boxShadow: palette.hoverShadow,
    }
    : {};

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ ...palette, ...hoverStyles, borderRadius: '999px', padding: '12px 18px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1, fontWeight: 500, width: stretch ? '100%' : 'auto', transition: 'background 180ms ease, color 180ms ease, border 180ms ease, transform 180ms ease, box-shadow 180ms ease', ...style }}
    >
      {children}
    </button>
  );
}

function QuickActionCard({ title, description, children }) {
  return (
    <div style={{ background: 'rgba(23,23,23,0.92)', borderRadius: '20px', padding: '18px', border: '1px solid rgba(255,255,255,0.05)', display: 'grid', gap: '12px' }}>
      <div>
        <strong style={{ display: 'block', fontSize: '17px', marginBottom: '6px' }}>{title}</strong>
        <p style={{ margin: 0, color: 'rgba(245,240,232,0.62)', lineHeight: 1.7 }}>{description}</p>
      </div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>{children}</div>
    </div>
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
  return <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: 'rgba(245,240,232,0.68)', fontSize: '13px' }}><span>Liberada: dourado suave</span><span>Com paciente: contorno verde</span><span>Fora do mês: opaco</span></div>;
}

function UserStatusPill({ active, role }) {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <span style={{ borderRadius: '999px', padding: '7px 11px', background: role === 'admin' ? 'rgba(201,169,110,0.16)' : 'rgba(255,255,255,0.06)', color: role === 'admin' ? '#E8D5A3' : '#F5F0E8', fontSize: '12px' }}>{role === 'admin' ? 'Admin' : 'Equipe'}</span>
      <span style={{ borderRadius: '999px', padding: '7px 11px', background: active ? 'rgba(91,196,142,0.16)' : 'rgba(231,177,177,0.16)', color: active ? '#9BE6BA' : '#E7B1B1', fontSize: '12px' }}>{active ? 'Ativo' : 'Inativo'}</span>
    </div>
  );
}

function SourcePill({ source }) {
  const palette = source === 'whatsapp'
    ? { background: 'rgba(91,196,142,0.16)', color: '#9BE6BA' }
    : { background: 'rgba(201,169,110,0.16)', color: '#E8D5A3' };

  return (
    <span style={{ borderRadius: '999px', padding: '7px 11px', background: palette.background, color: palette.color, fontSize: '12px' }}>
      {source === 'whatsapp' ? 'WhatsApp' : 'Painel'}
    </span>
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
    whatsAppStatus,
    saveContent,
    resetContent,
    saveSchedule,
    changeOwnPassword,
    createUser,
    updateUser,
    downloadBackup,
    simulateWhatsAppInbound,
    sendWhatsAppTestMessage,
    runSystemCheck,
    refreshAll,
  } = useSiteContent();

  const [draft, setDraft] = useState(() => cloneContent(siteContent));
  const [loginForm, setLoginForm] = useState({ username: 'williane', password: '' });
  const [appointmentForm, setAppointmentForm] = useState({ fullName: '', address: '', cpf: '', date: '', time: '', procedureName: '', notes: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [userForm, setUserForm] = useState({ displayName: '', username: '', password: '', role: 'staff' });
  const [slotEditor, setSlotEditor] = useState({ date: '', time: '' });
  const [whatsAppSimulationForm, setWhatsAppSimulationForm] = useState({
    from: '5599999999999',
    profileName: 'Paciente WhatsApp',
    text: 'AGENDAR',
  });
  const [whatsAppOutboundForm, setWhatsAppOutboundForm] = useState({
    to: '5599999999999',
    text: 'Mensagem de teste enviada pelo painel.',
  });
  const [userEdits, setUserEdits] = useState({});
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('');
  const [notice, setNotice] = useState(null);
  const [busyKey, setBusyKey] = useState('');
  const [systemCheckReport, setSystemCheckReport] = useState(null);
  const [systemCheckModalOpen, setSystemCheckModalOpen] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);

  const isAdmin = currentUser?.role === 'admin';
  const dashboardUrl = useMemo(() => `${window.location.origin}/`, []);
  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth < 1100;
  const sectionPadding = isMobile ? '20px' : '28px';
  const pagePadding = isMobile ? '14px' : '24px';
  const calendarCellMinHeight = isMobile ? '64px' : '78px';
  const calendarGap = isMobile ? '6px' : '8px';
  const compactButtonStyle = isMobile ? { width: '100%' } : null;
  const adminScheduleOnly = isAdmin;

  useEffect(() => {
    setDraft(cloneContent(siteContent));
  }, [siteContent]);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setSelectedCalendarDate((previous) => {
      if (previous && siteContent.admin.availableDates.includes(previous)) return previous;
      return siteContent.admin.availableDates[0] || '';
    });
  }, [siteContent.admin.availableDates]);

  useEffect(() => {
    setUserEdits(users.reduce((accumulator, user) => {
      accumulator[user.id] = { displayName: user.displayName, role: user.role, active: user.active, password: '' };
      return accumulator;
    }, {}));
  }, [users]);

  const flashNotice = (type, message) => setNotice({ type, message });
  const updateDraft = (path, value) => setDraft((previous) => setAtPath(previous, path, value));
  const availableTimeSlots = draft.admin.availableTimeSlots || {};
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
      const nextAvailableTimeSlots = { ...(previous.admin.availableTimeSlots || {}) };
      if (exists) {
        delete nextAvailableTimeSlots[dateString];
      } else {
        nextAvailableTimeSlots[dateString] = sortTimes([...(nextAvailableTimeSlots[dateString] || []), ...DEFAULT_TIME_SLOTS]);
      }

      return {
        ...previous,
        admin: {
          ...previous.admin,
          availableDates: nextDates,
          availableTimeSlots: nextAvailableTimeSlots,
          appointments: nextAppointments,
        },
      };
    });

    setSelectedCalendarDate(dateString);
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

  const addTimeSlotToDate = (dateString, timeValue) => {
    const normalizedTime = normalizeTime(timeValue);
    if (!dateString || !normalizedTime) {
      flashNotice('error', 'Selecione uma data e informe um horário válido.');
      return;
    }

    setDraft((previous) => {
      const nextSlots = sortTimes([...(previous.admin.availableTimeSlots?.[dateString] || []), normalizedTime]);
      return {
        ...previous,
        admin: {
          ...previous.admin,
          availableTimeSlots: {
            ...(previous.admin.availableTimeSlots || {}),
            [dateString]: nextSlots,
          },
        },
      };
    });
    setSlotEditor((previous) => ({ ...previous, time: '' }));
  };

  const removeTimeSlotFromDate = (dateString, timeValue) => {
    const hasAppointment = draft.admin.appointments.some(
      (item) => item.date === dateString && item.time === timeValue && item.status !== 'cancelado'
    );
    if (hasAppointment) {
      flashNotice('error', 'Não é possível remover um horário que já possui paciente agendado.');
      return;
    }

    setDraft((previous) => ({
      ...previous,
      admin: {
        ...previous.admin,
        availableTimeSlots: {
          ...(previous.admin.availableTimeSlots || {}),
          [dateString]: (previous.admin.availableTimeSlots?.[dateString] || []).filter((item) => item !== timeValue),
        },
      },
    }));

    setAppointmentForm((previous) => (
      previous.date === dateString && previous.time === timeValue
        ? { ...previous, time: '' }
        : previous
    ));
  };

  const handleAddAppointment = () => {
    const normalizedCpf = normalizeCpf(appointmentForm.cpf);

    if (!appointmentForm.fullName.trim() || !appointmentForm.address.trim() || !normalizedCpf || !appointmentForm.date || !appointmentForm.time) {
      flashNotice('error', 'Preencha nome completo, endereço, CPF e data.');
      return;
    }
    if (normalizedCpf.length !== 11) {
      flashNotice('error', 'O CPF precisa ter 11 dígitos.');
      return;
    }
    if (!draft.admin.availableDates.includes(appointmentForm.date)) {
      flashNotice('error', 'A data escolhida não foi liberada pela Dra.');
      return;
    }
    if (!(draft.admin.availableTimeSlots?.[appointmentForm.date] || []).includes(appointmentForm.time)) {
      flashNotice('error', 'O horário escolhido não está liberado pela Dra.');
      return;
    }

    const duplicate = draft.admin.appointments.some((item) => item.date === appointmentForm.date && item.time === appointmentForm.time && item.status !== 'cancelado');
    if (duplicate) {
      flashNotice('error', 'Já existe um agendamento ativo nesse horário.');
      return;
    }

    addArrayItem(['admin', 'appointments'], {
      id: `appt-${Date.now()}`,
      fullName: appointmentForm.fullName.trim(),
      address: appointmentForm.address.trim(),
      cpf: formatCpf(normalizedCpf),
      date: appointmentForm.date,
      time: appointmentForm.time,
      status: 'agendado',
      procedureName: appointmentForm.procedureName.trim(),
      notes: appointmentForm.notes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setAppointmentForm({ fullName: '', address: '', cpf: '', date: appointmentForm.date, time: '', procedureName: '', notes: '' });
    flashNotice('success', 'Agendamento adicionado ao painel. Agora é só salvar a agenda.');
  };

  const appointmentsByDate = useMemo(() => [...draft.admin.appointments].sort((a, b) => {
    const dateComparison = a.date.localeCompare(b.date);
    if (dateComparison !== 0) return dateComparison;
    const timeComparison = (a.time || '').localeCompare(b.time || '');
    if (timeComparison !== 0) return timeComparison;
    return a.fullName.localeCompare(b.fullName);
  }), [draft.admin.appointments]);

  const monthGrid = useMemo(() => monthDays(calendarMonth), [calendarMonth]);
  const occupiedSlotsByDate = useMemo(
    () => draft.admin.appointments.reduce((accumulator, item) => {
      if (item.status === 'cancelado' || !item.time) return accumulator;
      accumulator[item.date] = accumulator[item.date] || [];
      accumulator[item.date].push(item.time);
      return accumulator;
    }, {}),
    [draft.admin.appointments]
  );
  const freeTimeSlotsByDate = useMemo(
    () => draft.admin.availableDates.reduce((accumulator, date) => {
      const occupied = new Set(occupiedSlotsByDate[date] || []);
      accumulator[date] = sortTimes((availableTimeSlots[date] || []).filter((time) => !occupied.has(time)));
      return accumulator;
    }, {}),
    [draft.admin.availableDates, availableTimeSlots, occupiedSlotsByDate]
  );
  const receptionistAvailableDates = useMemo(
    () => draft.admin.availableDates.filter((date) => (freeTimeSlotsByDate[date] || []).length > 0),
    [draft.admin.availableDates, freeTimeSlotsByDate]
  );
  const upcomingHighlights = useMemo(() => receptionistAvailableDates.slice(0, 8), [receptionistAvailableDates]);
  const nextSlotsPreview = useMemo(
    () => receptionistAvailableDates.slice(0, 3).map((date) => ({
      date,
      times: (freeTimeSlotsByDate[date] || []).slice(0, 3),
      count: (freeTimeSlotsByDate[date] || []).length,
    })),
    [receptionistAvailableDates, freeTimeSlotsByDate]
  );
  const nextAvailableDate = receptionistAvailableDates[0] || '';
  const selectedDateSlots = availableTimeSlots[selectedCalendarDate] || [];
  const selectedDateFreeSlots = freeTimeSlotsByDate[selectedCalendarDate] || [];
  const selectedDateOccupiedSlots = selectedDateSlots.filter((time) => !selectedDateFreeSlots.includes(time));
  const selectedDateIsAvailable = draft.admin.availableDates.includes(selectedCalendarDate);
  const selectedDateIsFull = selectedDateIsAvailable && selectedDateSlots.length > 0 && selectedDateFreeSlots.length === 0;
  const datesWithoutSlots = draft.admin.availableDates.filter((date) => (availableTimeSlots[date] || []).length === 0);
  const appointmentTimeOptions = appointmentForm.date ? (freeTimeSlotsByDate[appointmentForm.date] || []) : [];
  const summary = dashboard?.summary || {};
  useEffect(() => {
    if (appointmentForm.date && !(freeTimeSlotsByDate[appointmentForm.date] || []).includes(appointmentForm.time)) {
      setAppointmentForm((previous) => ({ ...previous, time: '' }));
    }
  }, [appointmentForm.date, appointmentForm.time, freeTimeSlotsByDate]);
  useEffect(() => {
    if (!appointmentForm.date) return;
    const options = freeTimeSlotsByDate[appointmentForm.date] || [];
    if (options.length === 1 && appointmentForm.time !== options[0]) {
      setAppointmentForm((previous) => ({ ...previous, time: options[0] }));
    }
  }, [appointmentForm.date, appointmentForm.time, freeTimeSlotsByDate]);
  const auditLogs = dashboard?.auditLogs || [];
  const whatsAppEvents = whatsAppStatus?.recentEvents || [];
  const todayDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayAppointments = useMemo(
    () => appointmentsByDate.filter((item) => item.date === todayDate && item.status !== 'cancelado'),
    [appointmentsByDate, todayDate]
  );
  const quickSlotPresets = DEFAULT_TIME_SLOTS;
  const visibleMonthGrid = useMemo(
    () => (isAdmin ? monthGrid : monthGrid.filter((date) => (freeTimeSlotsByDate[date.toISOString().slice(0, 10)] || []).length > 0)),
    [isAdmin, monthGrid, freeTimeSlotsByDate]
  );
  const quickActionDate = selectedCalendarDate || nextAvailableDate || todayDate;

  const jumpToDate = (dateString) => {
    if (!dateString) return;
    const targetDate = new Date(`${dateString}T12:00:00`);
    setCalendarMonth(new Date(targetDate.getFullYear(), targetDate.getMonth(), 1));
    setSelectedCalendarDate(dateString);
  };

  const applyPresetSlotsToDate = (dateString) => {
    if (!isAdmin || !dateString) return;
    setDraft((previous) => {
      const nextSlots = sortTimes([...(previous.admin.availableTimeSlots?.[dateString] || []), ...quickSlotPresets]);
      const nextDates = previous.admin.availableDates.includes(dateString)
        ? previous.admin.availableDates
        : sortDates([...previous.admin.availableDates, dateString]);

      return {
        ...previous,
        admin: {
          ...previous.admin,
          availableDates: nextDates,
          availableTimeSlots: {
            ...(previous.admin.availableTimeSlots || {}),
            [dateString]: nextSlots,
          },
        },
      };
    });
    jumpToDate(dateString);
    flashNotice('success', `Horários padrão aplicados em ${formatDateLabel(dateString)}.`);
  };

  const prepareQuickAppointment = (dateString) => {
    if (!dateString) return;
    jumpToDate(dateString);
    setAppointmentForm((previous) => ({
      ...previous,
      date: dateString,
      time: '',
    }));
  };

  useEffect(() => {
    if (isAdmin || !currentUser) return;
    if (selectedCalendarDate && receptionistAvailableDates.includes(selectedCalendarDate)) return;
    if (nextAvailableDate) jumpToDate(nextAvailableDate);
  }, [currentUser, isAdmin, nextAvailableDate, receptionistAvailableDates, selectedCalendarDate]);

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
    if (isAdmin && datesWithoutSlots.length > 0) {
      flashNotice('error', `Existe data liberada sem horário: ${datesWithoutSlots[0]}.`);
      return;
    }

    setBusyKey('schedule');
    try {
      await saveSchedule(draft.admin);
      flashNotice('success', isAdmin ? 'Agenda salva. A recepção já pode ver as datas com horários livres.' : 'Agenda salva no servidor com sucesso.');
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
      flashNotice('success', 'Conteúdo do site salvo com sucesso.');
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
      flashNotice('success', 'Conteúdo visual restaurado para o padrão do projeto.');
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
      flashNotice('error', 'A confirmação da nova senha não confere.');
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
      flashNotice('error', 'Preencha nome, usuário e uma senha com pelo menos 6 caracteres.');
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

  const handleRefreshPanel = async () => {
    setBusyKey('refresh');
    try {
      await refreshAll();
      flashNotice('success', 'Agenda atualizada com as informações mais recentes.');
    } catch (error) {
      flashNotice('error', error.message);
    } finally {
      setBusyKey('');
    }
  };

  const handleSimulateWhatsApp = async () => {
    setBusyKey('whatsapp-simulate');
    try {
      const result = await simulateWhatsAppInbound(whatsAppSimulationForm);
      flashNotice('success', `Simulação processada: ${result.replyText}`);
    } catch (error) {
      flashNotice('error', error.message);
    } finally {
      setBusyKey('');
    }
  };

  const handleSendWhatsAppTest = async () => {
    setBusyKey('whatsapp-send');
    try {
      await sendWhatsAppTestMessage(whatsAppOutboundForm);
      flashNotice('success', 'Mensagem de teste enviada pelo WhatsApp.');
    } catch (error) {
      flashNotice('error', error.message);
    } finally {
      setBusyKey('');
    }
  };

  const handleRunSystemCheck = async () => {
    setBusyKey('system-check');
    try {
      const report = await runSystemCheck();
      setSystemCheckReport(report);
      setSystemCheckModalOpen(true);
      flashNotice(report.ok ? 'success' : 'error', report.summary);
    } catch (error) {
      flashNotice('error', error.message);
    } finally {
      setBusyKey('');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, rgba(201,169,110,0.12) 0%, rgba(10,10,10,1) 55%)', color: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: pagePadding }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#C9A96E', letterSpacing: '0.22em', textTransform: 'uppercase', fontSize: '11px', marginBottom: '10px' }}>Painel administrativo</div>
          <h1 style={{ margin: 0, fontFamily: "'Cormorant Garamond', serif", fontSize: '40px', fontWeight: 400 }}>Carregando ambiente</h1>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, rgba(201,169,110,0.12) 0%, rgba(10,10,10,1) 55%)', color: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: pagePadding }}>
        <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '480px', background: 'linear-gradient(180deg, rgba(17,17,17,0.98) 0%, rgba(10,10,10,0.98) 100%)', border: '1px solid rgba(201,169,110,0.16)', borderRadius: '28px', padding: isMobile ? '24px' : '34px', boxShadow: '0 32px 70px rgba(0,0,0,0.34)' }}>
          <div style={{ color: '#C9A96E', textTransform: 'uppercase', letterSpacing: '0.24em', fontSize: '11px', marginBottom: '12px' }}>Painel Admin</div>
          <h1 style={{ margin: '0 0 12px', fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: isMobile ? '34px' : '42px' }}>Entrar no painel</h1>
          <p style={{ margin: '0 0 22px', color: 'rgba(245,240,232,0.66)', lineHeight: 1.8 }}>A Dra controla o conteúdo e libera as datas. A equipe usa o mesmo painel para cadastrar pacientes somente nas datas abertas.</p>
          <Row minWidth={isMobile ? 180 : 220}>
            <Field label="Usuário" value={loginForm.username} onChange={(value) => setLoginForm((previous) => ({ ...previous, username: value }))} />
            <Field label="Senha" type="password" value={loginForm.password} onChange={(value) => setLoginForm((previous) => ({ ...previous, password: value }))} />
          </Row>
          <div style={{ display: 'grid', gap: '10px', marginTop: '18px', color: 'rgba(245,240,232,0.6)', fontSize: '14px', lineHeight: 1.7 }}>
            <div>Dra: <code>williane</code> / <code>Acesso@2025</code></div>
            <div>Equipe: <code>secretaria</code> / <code>secretaria123</code></div>
          </div>
          <div style={{ marginTop: '18px' }}><ActionButton type="submit" variant="primary" disabled={busyKey === 'login'} stretch={isMobile}>{busyKey === 'login' ? 'Entrando...' : 'Entrar'}</ActionButton></div>
          {notice ? <div style={{ marginTop: '16px', borderRadius: '16px', padding: '14px 16px', background: notice.type === 'error' ? 'rgba(231,177,177,0.1)' : 'rgba(201,169,110,0.1)', border: notice.type === 'error' ? '1px solid rgba(231,177,177,0.24)' : '1px solid rgba(201,169,110,0.24)' }}>{notice.message}</div> : null}
        </form>
      </div>
    );
  }

  return (
    <>
      <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, rgba(201,169,110,0.10) 0%, rgba(9,9,9,1) 58%)', color: '#F5F0E8', padding: pagePadding }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: '18px', flexWrap: 'wrap', marginBottom: '24px', padding: '20px 0' }}>
          <div>
            <div style={{ color: '#C9A96E', textTransform: 'uppercase', letterSpacing: '0.22em', fontSize: '11px', marginBottom: '8px' }}>Painel Administrativo</div>
            <h1 style={{ margin: 0, fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? '38px' : '50px', fontWeight: 400 }}>Dra. Williane Holanda</h1>
            <p style={{ margin: '10px 0 0', color: 'rgba(245,240,232,0.64)' }}>Logada como <strong>{currentUser.displayName}</strong> ({isAdmin ? 'Admin' : 'Equipe'})</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(150px, max-content))', gap: '12px', width: isMobile ? '100%' : 'auto' }}>
            <a href={dashboardUrl} target="_blank" rel="noreferrer" style={{ color: '#F5F0E8' }}><ActionButton>Ver site</ActionButton></a>
            <ActionButton onClick={handleRefreshPanel} disabled={busyKey === 'refresh'} stretch={isMobile}>{busyKey === 'refresh' ? 'Atualizando...' : 'Atualizar agenda'}</ActionButton>
            <ActionButton onClick={handleSaveSchedule} variant="primary" disabled={busyKey === 'schedule'} stretch={isMobile}>{busyKey === 'schedule' ? 'Salvando agenda...' : 'Salvar agenda'}</ActionButton>
            <ActionButton onClick={logout} stretch={isMobile}>Sair</ActionButton>
          </div>
        </div>

        {notice ? <div style={{ marginBottom: '20px', background: notice.type === 'error' ? 'rgba(231,177,177,0.1)' : 'rgba(201,169,110,0.1)', border: notice.type === 'error' ? '1px solid rgba(231,177,177,0.24)' : '1px solid rgba(201,169,110,0.24)', borderRadius: '16px', padding: '14px 16px' }}>{notice.message}</div> : null}

        <SectionCard eyebrow="Ações rápidas" title={adminScheduleOnly ? 'Agenda da Dra' : 'Atalhos do dia'} description={adminScheduleOnly ? 'Aqui a Dra libera os dias e os horários que ficarão disponíveis para a recepção e para o WhatsApp.' : 'Os botões abaixo deixam o uso mais direto no celular e no atendimento do dia a dia.'} style={{ padding: sectionPadding }}>
          <Row minWidth={isMobile ? 180 : 240}>
            <QuickActionCard title="Agenda" description="Abra o dia certo e já deixe a agenda pronta para uso.">
              <ActionButton onClick={() => jumpToDate(todayDate)} stretch={isMobile} style={compactButtonStyle}>Ir para hoje</ActionButton>
              <ActionButton onClick={() => jumpToDate(nextAvailableDate)} disabled={!nextAvailableDate} stretch={isMobile} style={compactButtonStyle}>Próxima vaga</ActionButton>
              {isAdmin ? <ActionButton onClick={() => applyPresetSlotsToDate(quickActionDate)} variant="primary" stretch={isMobile} style={compactButtonStyle}>Aplicar horários padrão</ActionButton> : null}
              {isAdmin ? <ActionButton onClick={() => toggleAvailableDate(todayDate)} variant={draft.admin.availableDates.includes(todayDate) ? 'danger' : 'primary'} stretch={isMobile} style={compactButtonStyle}>{draft.admin.availableDates.includes(todayDate) ? 'Fechar hoje' : 'Liberar hoje'}</ActionButton> : null}
              {isAdmin ? <ActionButton onClick={handleSaveSchedule} disabled={busyKey === 'schedule'} stretch={isMobile} style={compactButtonStyle}>{busyKey === 'schedule' ? 'Salvando agenda...' : 'Salvar agenda'}</ActionButton> : null}
            </QuickActionCard>
            {!adminScheduleOnly ? <QuickActionCard title="Atendimento" description="Comece um agendamento sem ficar procurando data disponível.">
              <ActionButton onClick={() => prepareQuickAppointment(nextAvailableDate || todayDate)} variant="primary" disabled={!nextAvailableDate && !todayDate} stretch={isMobile} style={compactButtonStyle}>Novo agendamento</ActionButton>
              <ActionButton onClick={handleRefreshPanel} disabled={busyKey === 'refresh'} stretch={isMobile} style={compactButtonStyle}>{busyKey === 'refresh' ? 'Atualizando...' : 'Atualizar agenda'}</ActionButton>
              <ActionButton onClick={handleSaveSchedule} disabled={busyKey === 'schedule'} stretch={isMobile} style={compactButtonStyle}>Salvar agenda</ActionButton>
            </QuickActionCard> : null}
            {!adminScheduleOnly ? <QuickActionCard title="Comunicação" description="Tenha os comandos mais usados à mão para testes e operação.">
              <ActionButton onClick={handleRunSystemCheck} disabled={busyKey === 'system-check'} stretch={isMobile} style={compactButtonStyle}>{busyKey === 'system-check' ? 'Testando sistema...' : 'Testar todo o sistema'}</ActionButton>
              {!isAdmin ? <ActionButton onClick={() => jumpToDate(nextAvailableDate)} disabled={!nextAvailableDate} stretch={isMobile} style={compactButtonStyle}>Ver próxima data livre</ActionButton> : null}
              {!isAdmin ? <ActionButton onClick={logout} stretch={isMobile} style={compactButtonStyle}>Sair do painel</ActionButton> : null}
            </QuickActionCard> : null}
          </Row>
        </SectionCard>

        {!adminScheduleOnly && systemCheckReport ? (
          <SectionCard eyebrow="Diagnóstico" title="Último teste do sistema" description="Esse relatório ajuda o suporte a entender rapidamente se o problema está no login, agenda, painel ou WhatsApp." style={{ padding: sectionPadding }}>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ padding: '16px 18px', borderRadius: '18px', background: systemCheckReport.ok ? 'rgba(91,196,142,0.12)' : 'rgba(231,177,177,0.12)', border: systemCheckReport.ok ? '1px solid rgba(91,196,142,0.24)' : '1px solid rgba(231,177,177,0.24)' }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: systemCheckReport.ok ? '#9BE6BA' : '#F2C6C6' }}>
                  {systemCheckReport.ok ? 'Sistema aprovado nas verificações principais' : 'Foram encontrados pontos para revisar'}
                </strong>
                <div style={{ color: 'rgba(245,240,232,0.76)', lineHeight: 1.7 }}>
                  <div><strong>Resumo:</strong> {systemCheckReport.summary}</div>
                  <div><strong>Executado em:</strong> {systemCheckReport.finishedAt ? new Date(systemCheckReport.finishedAt).toLocaleString('pt-BR') : '-'}</div>
                  <div><strong>Perfil:</strong> {systemCheckReport.role === 'admin' ? 'Administração' : 'Recepção'}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '10px' }}>
                {systemCheckReport.checks.map((item) => (
                  <div key={item.key} style={{ padding: '14px 16px', borderRadius: '18px', background: 'rgba(23,23,23,0.92)', border: item.ok ? '1px solid rgba(91,196,142,0.20)' : '1px solid rgba(231,177,177,0.24)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <strong>{item.label}</strong>
                      <span style={{ color: item.ok ? '#9BE6BA' : '#F2C6C6', fontSize: '13px' }}>{item.ok ? 'OK' : 'Falhou'}</span>
                    </div>
                    {item.ok ? (
                      <div style={{ color: 'rgba(245,240,232,0.72)', fontSize: '13px', lineHeight: 1.7 }}>
                        {Object.entries(item.details || {}).map(([key, value]) => (
                          <div key={key}><strong>{key}:</strong> {String(value)}</div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: '#F2C6C6', fontSize: '13px', lineHeight: 1.7 }}>
                        {item.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        ) : null}

        {!adminScheduleOnly ? (
          <SectionCard eyebrow="Visão geral" title="Painel executivo" description="Resumo rápido para a Dra acompanhar equipe, agenda e base de pacientes sem depender do código." style={{ padding: sectionPadding }}>
            <Row>
              <StatCard label="Usuários ativos" value={summary.activeUsers ?? 0} />
              <StatCard label="Datas liberadas" value={summary.releasedDates ?? 0} />
              <StatCard label="Agendamentos ativos" value={summary.activeAppointments ?? 0} tone="green" />
              <StatCard label="Pacientes únicos" value={summary.uniquePatients ?? 0} tone="white" />
              <StatCard label="Conversas Whats" value={whatsAppStatus?.activeConversations ?? 0} tone="white" />
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
        ) : null}

        <SectionCard eyebrow="Fluxo real da clínica" title={adminScheduleOnly ? 'Agenda da Dra' : 'Agenda e agendamentos'} description={adminScheduleOnly ? 'Nesta área a Dra só precisa liberar os dias de atendimento e os horários que devem aparecer para a recepção e para o WhatsApp.' : 'A Dra libera os dias de atendimento. A equipe cadastra o paciente com nome completo, endereço e CPF, e só consegue trabalhar em datas liberadas.'} style={{ padding: sectionPadding }}>
          <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr' : 'minmax(340px, 1.25fr) minmax(320px, 0.95fr)', gap: '20px' }}>
            <div style={{ background: 'rgba(23,23,23,0.92)', borderRadius: '22px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
                <ActionButton onClick={() => setCalendarMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() - 1, 1))} stretch={isMobile}>Mês anterior</ActionButton>
                <strong style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? '26px' : '30px', fontWeight: 400, textTransform: 'capitalize', textAlign: 'center', flex: 1 }}>{calendarMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</strong>
                <ActionButton onClick={() => setCalendarMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() + 1, 1))} stretch={isMobile}>Próximo mês</ActionButton>
              </div>

              {isAdmin ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: calendarGap, marginBottom: '10px', textAlign: 'center', color: 'rgba(245,240,232,0.6)', fontSize: isMobile ? '10px' : '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((item) => <div key={item}>{item}</div>)}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: calendarGap }}>
                    {monthGrid.map((date) => {
                      const dateString = date.toISOString().slice(0, 10);
                      const isCurrentMonth = sameMonth(date, calendarMonth);
                      const isAvailable = draft.admin.availableDates.includes(dateString);
                      const hasAppointment = draft.admin.appointments.some((item) => item.date === dateString && item.status !== 'cancelado');
                      const hasFreeSlot = (freeTimeSlotsByDate[dateString] || []).length > 0;
                      const totalSlots = (availableTimeSlots[dateString] || []).length;
                      const freeSlots = (freeTimeSlotsByDate[dateString] || []).length;
                      const isFull = isAvailable && totalSlots > 0 && freeSlots === 0;
                      const isSelected = selectedCalendarDate === dateString;
                      const canSelectDate = true;
                      const dayTextColor = !isCurrentMonth
                        ? 'rgba(245,240,232,0.18)'
                        : canSelectDate
                          ? '#F5F0E8'
                          : 'rgba(245,240,232,0.38)';
                      const dayBackground = isAvailable
                        ? 'rgba(201,169,110,0.16)'
                        : 'rgba(14,14,14,0.65)';

                      return (
                        <button key={dateString} type="button" onClick={() => setSelectedCalendarDate(dateString)} style={{ minHeight: calendarCellMinHeight, padding: isMobile ? '6px' : '8px', borderRadius: '16px', border: isSelected ? '1px solid #C9A96E' : hasAppointment ? '1px solid rgba(91,196,142,0.7)' : '1px solid rgba(255,255,255,0.06)', background: dayBackground, color: dayTextColor, cursor: 'pointer', opacity: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: isMobile ? '12px' : '13px' }}>{date.getDate()}</span>
                          <div style={{ display: 'grid', gap: '2px' }}>
                            {hasFreeSlot ? <span style={{ fontSize: isMobile ? '9px' : '10px', color: freeSlots === 1 ? '#F1DEC0' : '#7AE1A5' }}>{freeSlots === 1 ? 'Última vaga' : `${freeSlots} vaga(s)`}</span> : null}
                            {isFull ? <span style={{ fontSize: isMobile ? '9px' : '10px', color: '#E7B1B1' }}>Lotado</span> : null}
                            {hasAppointment && !isFull ? <span style={{ fontSize: isMobile ? '9px' : '10px', color: '#7AE1A5' }}>Paciente</span> : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  <p style={{ margin: 0, color: 'rgba(245,240,232,0.62)', lineHeight: 1.7 }}>
                    A recepção vê apenas as datas com vaga disponível.
                  </p>
                  {visibleMonthGrid.length === 0 ? (
                    <p style={{ margin: 0, color: '#E7B1B1', lineHeight: 1.7 }}>
                      Nenhuma data livre encontrada neste mês.
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {visibleMonthGrid.map((date) => {
                        const dateString = date.toISOString().slice(0, 10);
                        const freeSlots = (freeTimeSlotsByDate[dateString] || []).length;
                        const isSelected = selectedCalendarDate === dateString;

                        return (
                          <button key={dateString} type="button" onClick={() => setSelectedCalendarDate(dateString)} style={{ textAlign: 'left', minHeight: '72px', padding: '12px 14px', borderRadius: '18px', border: isSelected ? '1px solid #C9A96E' : '1px solid rgba(201,169,110,0.18)', background: isSelected ? 'rgba(201,169,110,0.16)' : 'rgba(23,23,23,0.86)', color: '#F5F0E8', cursor: 'pointer', display: 'grid', gap: '6px' }}>
                            <strong style={{ fontSize: '14px' }}>{formatDateLabel(dateString)}</strong>
                            <span style={{ fontSize: '12px', color: freeSlots === 1 ? '#F1DEC0' : '#9BE6BA' }}>
                              {freeSlots === 1 ? 'Última vaga disponível' : `${freeSlots} horários livres`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginTop: '18px', display: 'grid', gap: '12px' }}>
                <CalendarLegend />
                {!isAdmin ? <div style={{ color: 'rgba(245,240,232,0.58)', fontSize: '13px' }}>Somente a Dra pode liberar ou bloquear datas e horários.</div> : null}
              </div>
            </div>

            <div style={{ display: 'grid', gap: '18px' }}>
              {!adminScheduleOnly ? (
                <div style={{ background: 'rgba(23,23,23,0.92)', borderRadius: '22px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <strong style={{ display: 'block', marginBottom: '14px', fontSize: '18px' }}>Novo agendamento</strong>
                  <p style={{ margin: '0 0 14px', color: 'rgba(245,240,232,0.62)', lineHeight: 1.7 }}>
                    A recepção só enxerga dias e horários realmente livres.
                  </p>
                  {appointmentForm.date ? (
                    <div style={{ display: 'grid', gap: '10px', marginBottom: '14px', padding: '14px', borderRadius: '18px', background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.18)' }}>
                      <strong style={{ fontSize: '14px', color: '#F1DEC0' }}>Resumo da data escolhida</strong>
                      <div style={{ color: 'rgba(245,240,232,0.78)', fontSize: '13px' }}>{formatDateLabel(appointmentForm.date)}</div>
                      <div style={{ color: (appointmentTimeOptions.length === 1) ? '#F1DEC0' : 'rgba(245,240,232,0.72)', fontSize: '13px' }}>
                        {appointmentTimeOptions.length === 1 ? `Última vaga disponível: ${appointmentTimeOptions[0]}` : `${appointmentTimeOptions.length} horários livres nesta data`}
                      </div>
                    </div>
                  ) : null}
                  <div style={{ display: 'grid', gap: '14px' }}>
                    <Field label="Nome completo do paciente" value={appointmentForm.fullName} onChange={(value) => setAppointmentForm((previous) => ({ ...previous, fullName: value }))} />
                    <Field label="Endereço" value={appointmentForm.address} onChange={(value) => setAppointmentForm((previous) => ({ ...previous, address: value }))} />
                    <Field label="CPF" value={appointmentForm.cpf} onChange={(value) => setAppointmentForm((previous) => ({ ...previous, cpf: formatCpf(value) }))} />
                    <Field label="Procedimento (opcional)" value={appointmentForm.procedureName} onChange={(value) => setAppointmentForm((previous) => ({ ...previous, procedureName: value }))} />
                    <SelectField label="Data liberada" value={appointmentForm.date} onChange={(value) => setAppointmentForm((previous) => ({ ...previous, date: value, time: '' }))} options={[{ value: '', label: 'Selecione uma data' }, ...receptionistAvailableDates.map((date) => ({ value: date, label: formatDateLabel(date) }))]} />
                    <Field label="Observações internas" value={appointmentForm.notes} onChange={(value) => setAppointmentForm((previous) => ({ ...previous, notes: value }))} multiline />
                    <SelectField label="Horário livre" value={appointmentForm.time} onChange={(value) => setAppointmentForm((previous) => ({ ...previous, time: value }))} options={[{ value: '', label: appointmentForm.date ? (appointmentTimeOptions.length === 1 ? 'Horário preenchido automaticamente' : 'Selecione um horário') : 'Escolha a data primeiro' }, ...appointmentTimeOptions.map((time) => ({ value: time, label: time }))]} />
                    <ActionButton onClick={handleAddAppointment} variant="primary" stretch={isMobile}>Adicionar agendamento</ActionButton>
                  </div>
                  {receptionistAvailableDates.length === 0 ? (
                    <p style={{ margin: '14px 0 0', color: '#E7B1B1', lineHeight: 1.7 }}>
                      Nenhum dia está liberado com horário disponível no momento.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {!adminScheduleOnly ? (
                <div style={{ background: 'rgba(23,23,23,0.92)', borderRadius: '22px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <strong style={{ display: 'block', marginBottom: '14px', fontSize: '18px' }}>Próximas vagas</strong>
                  <p style={{ margin: '0 0 14px', color: 'rgba(245,240,232,0.62)', lineHeight: 1.7 }}>
                    Uma leitura rápida para a recepção bater o olho e responder o paciente.
                  </p>
                  {nextSlotsPreview.length === 0 ? (
                    <p style={{ margin: 0, color: 'rgba(245,240,232,0.62)', lineHeight: 1.7 }}>Ainda não existem datas abertas para atendimento.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {nextSlotsPreview.map((item) => (
                        <button key={item.date} type="button" onClick={() => prepareQuickAppointment(item.date)} style={{ textAlign: 'left', padding: '14px', borderRadius: '18px', background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.24)', color: '#F1DEC0', cursor: 'pointer' }}>
                          <strong style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>{formatDateLabel(item.date)}</strong>
                          <span style={{ display: 'block', color: item.count === 1 ? '#F1DEC0' : 'rgba(245,240,232,0.72)', fontSize: '12px', marginBottom: '8px' }}>
                            {item.count === 1 ? 'Última vaga do dia' : `${item.count} horários livres`}
                          </span>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {item.times.map((time) => (
                              <span key={time} style={{ padding: '6px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', color: '#F5F0E8', fontSize: '12px' }}>{time}</span>
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              <div style={{ background: 'rgba(23,23,23,0.92)', borderRadius: '22px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <strong style={{ display: 'block', marginBottom: '14px', fontSize: '18px' }}>Datas liberadas</strong>
                {upcomingHighlights.length === 0 ? <p style={{ margin: 0, color: 'rgba(245,240,232,0.62)', lineHeight: 1.7 }}>Ainda não existem datas abertas para atendimento.</p> : <div style={{ display: 'grid', gap: '10px' }}>{upcomingHighlights.map((date) => { const freeSlotsCount = (freeTimeSlotsByDate[date] || []).length; return <div key={date} style={{ padding: '12px 14px', borderRadius: '18px', background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.24)', color: '#F1DEC0' }}><strong style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>{formatDateLabel(date)}</strong><span style={{ fontSize: '12px', color: freeSlotsCount === 1 ? '#F1DEC0' : 'rgba(245,240,232,0.72)' }}>{freeSlotsCount === 1 ? 'Última vaga disponível' : `${freeSlotsCount} horário(s) livre(s)`}</span></div>; })}</div>}
              </div>

              <div style={{ background: 'rgba(23,23,23,0.92)', borderRadius: '22px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <strong style={{ display: 'block', marginBottom: '14px', fontSize: '18px' }}>Horários do dia</strong>
                <p style={{ margin: '0 0 14px', color: 'rgba(245,240,232,0.62)', lineHeight: 1.7 }}>
                  {selectedCalendarDate ? formatDateLabel(selectedCalendarDate) : 'Selecione um dia no calendário para ver ou editar os horários.'}
                </p>
                {selectedCalendarDate ? (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    <span style={{ borderRadius: '999px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', fontSize: '12px' }}>{selectedDateSlots.length} horário(s)</span>
                    <span style={{ borderRadius: '999px', padding: '8px 12px', background: 'rgba(91,196,142,0.12)', color: '#9BE6BA', fontSize: '12px' }}>{selectedDateFreeSlots.length} livre(s)</span>
                    <span style={{ borderRadius: '999px', padding: '8px 12px', background: 'rgba(231,177,177,0.12)', color: '#E7B1B1', fontSize: '12px' }}>{selectedDateOccupiedSlots.length} ocupado(s)</span>
                    {selectedDateFreeSlots.length === 1 ? <span style={{ borderRadius: '999px', padding: '8px 12px', background: 'rgba(201,169,110,0.16)', color: '#F1DEC0', fontSize: '12px' }}>Última vaga</span> : null}
                    {selectedDateIsFull ? <span style={{ borderRadius: '999px', padding: '8px 12px', background: 'rgba(231,177,177,0.12)', color: '#E7B1B1', fontSize: '12px' }}>Dia lotado</span> : null}
                  </div>
                ) : null}
                {selectedCalendarDate ? (
                  <>
                    {isAdmin ? (
                      <div style={{ display: 'grid', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <ActionButton onClick={() => toggleAvailableDate(selectedCalendarDate)} variant={draft.admin.availableDates.includes(selectedCalendarDate) ? 'danger' : 'primary'} stretch={isMobile} style={compactButtonStyle}>
                            {draft.admin.availableDates.includes(selectedCalendarDate) ? 'Bloquear dia' : 'Liberar dia'}
                          </ActionButton>
                          {['08:00', '09:00', '10:00', '14:00', '15:00', '16:00'].map((time) => (
                            <ActionButton key={time} onClick={() => addTimeSlotToDate(selectedCalendarDate, time)}>{time}</ActionButton>
                          ))}
                        </div>
                        <Field label="Novo horário" type="time" value={slotEditor.time} onChange={(value) => setSlotEditor((previous) => ({ ...previous, time: value }))} />
                        <ActionButton onClick={() => addTimeSlotToDate(selectedCalendarDate, slotEditor.time)} variant="primary" stretch={isMobile}>Adicionar horário</ActionButton>
                      </div>
                    ) : null}

                    <div style={{ display: 'grid', gap: '10px', marginTop: '14px' }}>
                      {(selectedDateSlots.length === 0) ? (
                        <p style={{ margin: 0, color: 'rgba(245,240,232,0.62)' }}>
                          Nenhum horário cadastrado para este dia.
                        </p>
                      ) : (
                        selectedDateSlots.map((time) => (
                          <div key={time} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div>
                              <strong>{time}</strong>
                              <div style={{ color: 'rgba(245,240,232,0.62)', fontSize: '13px' }}>
                                {(selectedDateFreeSlots || []).includes(time) ? 'Horário livre' : 'Horário ocupado'}
                              </div>
                            </div>
                            {isAdmin ? <ActionButton variant="danger" onClick={() => removeTimeSlotFromDate(selectedCalendarDate, time)}>Remover</ActionButton> : null}
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {!adminScheduleOnly ? (
            <div>
              <strong style={{ display: 'block', marginBottom: '14px', fontSize: '18px' }}>Pacientes cadastrados</strong>
              {appointmentsByDate.length === 0 ? <p style={{ margin: 0, color: 'rgba(245,240,232,0.62)', lineHeight: 1.7 }}>Nenhum agendamento cadastrado ainda.</p> : <div style={{ display: 'grid', gap: '14px' }}>{appointmentsByDate.map((appointment) => <div key={appointment.id} style={{ background: 'rgba(23,23,23,0.92)', borderRadius: '20px', padding: '18px', border: '1px solid rgba(255,255,255,0.05)' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}><div><strong style={{ display: 'block', fontSize: '18px' }}>{appointment.fullName}</strong><span style={{ color: '#C9A96E', fontSize: '13px' }}>{formatDateLabel(appointment.date)}{appointment.time ? ` as ${appointment.time}` : ''}</span></div><div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}><SourcePill source={appointment.source} /><select value={appointment.status} onChange={(event) => updateAppointment(appointment.id, 'status', event.target.value)} style={{ ...baseInputStyle(), width: 'auto', padding: '10px 12px' }}><option value="agendado">Agendado</option><option value="confirmado">Confirmado</option><option value="concluido">Concluído</option><option value="cancelado">Cancelado</option></select><ActionButton variant="danger" onClick={() => removeAppointment(appointment.id)}>Excluir</ActionButton></div></div><div style={{ display: 'grid', gap: '8px', color: 'rgba(245,240,232,0.76)', lineHeight: 1.7 }}><div><strong>Horário:</strong> {appointment.time || '-'}</div><div><strong>CPF:</strong> {appointment.cpf}</div><div><strong>Endereço:</strong> {appointment.address}</div><div><strong>Procedimento:</strong> {appointment.procedureName || '-'}</div><div><strong>Observações:</strong> {appointment.notes || '-'}</div><div><strong>Criado em:</strong> {appointment.createdAt ? new Date(appointment.createdAt).toLocaleString('pt-BR') : '-'}</div></div></div>)}</div>}
            </div>
          ) : null}
        </SectionCard>

        {!adminScheduleOnly ? (
          <>
            <SectionCard eyebrow="Segurança" title="Meu acesso" description="Cada pessoa entra com seu próprio usuário. A senha pode ser alterada sem mexer no restante do sistema." style={{ padding: sectionPadding }}>
              <Row minWidth={isMobile ? 180 : 220}>
                <Field label="Senha atual" type="password" value={passwordForm.currentPassword} onChange={(value) => setPasswordForm((previous) => ({ ...previous, currentPassword: value }))} />
                <Field label="Nova senha" type="password" value={passwordForm.newPassword} onChange={(value) => setPasswordForm((previous) => ({ ...previous, newPassword: value }))} />
                <Field label="Confirmar nova senha" type="password" value={passwordForm.confirmPassword} onChange={(value) => setPasswordForm((previous) => ({ ...previous, confirmPassword: value }))} />
              </Row>
              <ActionButton onClick={handleChangePassword} variant="primary" disabled={busyKey === 'password'} stretch={isMobile}>{busyKey === 'password' ? 'Atualizando...' : 'Atualizar senha'}</ActionButton>
            </SectionCard>

            <SectionCard eyebrow="Modo equipe" title="Permissões da secretaria" description="Neste perfil, o painel fica focado no operacional: ver datas liberadas, cadastrar pacientes, atualizar status e manter os dados organizados.">
              <p style={{ margin: 0, color: 'rgba(245,240,232,0.7)', lineHeight: 1.8 }}>A parte visual do site e a liberação de agenda ficam reservadas para o acesso de administração da Dra.</p>
            </SectionCard>
          </>
        ) : null}
        </div>
      </div>

      {systemCheckModalOpen && systemCheckReport ? (
        <div
          onClick={() => setSystemCheckModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.72)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '16px' : '24px',
            zIndex: 9999,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '560px',
              background: 'linear-gradient(180deg, rgba(20,20,20,0.98) 0%, rgba(11,11,11,0.98) 100%)',
              border: systemCheckReport.ok ? '1px solid rgba(91,196,142,0.28)' : '1px solid rgba(231,177,177,0.28)',
              borderRadius: '28px',
              padding: isMobile ? '22px' : '28px',
              boxShadow: '0 28px 70px rgba(0,0,0,0.34)',
              color: '#F5F0E8',
              display: 'grid',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ color: systemCheckReport.ok ? '#9BE6BA' : '#F2C6C6', textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: '11px', marginBottom: '10px' }}>
                Diagnóstico do sistema
              </div>
              <h2 style={{ margin: '0 0 10px', fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: isMobile ? '34px' : '42px' }}>
                {systemCheckReport.ok ? 'Tudo funcionando perfeitamente' : 'Encontramos um problema'}
              </h2>
              <p style={{ margin: 0, color: 'rgba(245,240,232,0.72)', lineHeight: 1.8 }}>
                {systemCheckReport.ok
                  ? 'As verificações principais passaram. Se ainda existir algum comportamento estranho, envie esse resultado para o suporte com o horário do teste.'
                  : 'Uma ou mais verificações falharam. Entre em contato com o suporte e envie esse resultado para acelerar o atendimento.'}
              </p>
            </div>

            <div style={{ padding: '16px 18px', borderRadius: '18px', background: systemCheckReport.ok ? 'rgba(91,196,142,0.10)' : 'rgba(231,177,177,0.10)', border: systemCheckReport.ok ? '1px solid rgba(91,196,142,0.22)' : '1px solid rgba(231,177,177,0.22)' }}>
              <div style={{ color: 'rgba(245,240,232,0.8)', lineHeight: 1.8 }}>
                <div><strong>Resumo:</strong> {systemCheckReport.summary}</div>
                <div><strong>Executado em:</strong> {systemCheckReport.finishedAt ? new Date(systemCheckReport.finishedAt).toLocaleString('pt-BR') : '-'}</div>
                <div><strong>Perfil:</strong> {systemCheckReport.role === 'admin' ? 'Administração' : 'Recepção'}</div>
              </div>
            </div>

            {!systemCheckReport.ok ? (
              <div style={{ display: 'grid', gap: '10px' }}>
                {systemCheckReport.checks.filter((item) => !item.ok).map((item) => (
                  <div key={item.key} style={{ padding: '14px 16px', borderRadius: '18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(231,177,177,0.18)' }}>
                    <strong style={{ display: 'block', marginBottom: '6px', color: '#F2C6C6' }}>{item.label}</strong>
                    <div style={{ color: 'rgba(245,240,232,0.74)', lineHeight: 1.7 }}>{item.error}</div>
                  </div>
                ))}
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <ActionButton onClick={() => setSystemCheckModalOpen(false)} variant="primary" stretch={isMobile}>Fechar</ActionButton>
              <ActionButton onClick={handleRunSystemCheck} disabled={busyKey === 'system-check'} stretch={isMobile}>
                {busyKey === 'system-check' ? 'Testando novamente...' : 'Testar novamente'}
              </ActionButton>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}






