import React, { useEffect, useMemo, useRef, useState } from 'react';
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

function formatDateKey(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
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

function getEditableTimeOptions(dateString, appointment, freeTimeSlotsByDate) {
  if (!dateString) return [];
  const currentTime = appointment?.date === dateString && appointment?.time ? [appointment.time] : [];
  return sortTimes([...(freeTimeSlotsByDate[dateString] || []), ...currentTime]);
}

const DEFAULT_TIME_SLOTS = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

function toggleDateInSchedule(schedule, dateString) {
  const exists = schedule.availableDates.includes(dateString);
  const nextDates = exists ? schedule.availableDates.filter((item) => item !== dateString) : sortDates([...schedule.availableDates, dateString]);
  const nextAppointments = schedule.appointments.filter((item) => item.status === 'cancelado' || nextDates.includes(item.date));
  const nextAvailableTimeSlots = { ...(schedule.availableTimeSlots || {}) };

  if (exists) {
    delete nextAvailableTimeSlots[dateString];
  } else {
    nextAvailableTimeSlots[dateString] = sortTimes([...(nextAvailableTimeSlots[dateString] || []), ...DEFAULT_TIME_SLOTS]);
  }

  return {
    ...schedule,
    availableDates: nextDates,
    availableTimeSlots: nextAvailableTimeSlots,
    appointments: nextAppointments,
  };
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

function Field({ label, value, onChange, multiline = false, placeholder, type = 'text', disabled = false, autoFocus = false, onKeyDown }) {
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
          onKeyDown={onKeyDown}
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
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
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
    refreshSchedule,
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
  const [systemDate, setSystemDate] = useState(() => new Date());
  const [calendarMonth, setCalendarMonth] = useState(() => monthStart(new Date()));
  const autoFollowSystemMonth = useRef(true);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('');
  const [notice, setNotice] = useState(null);
  const [busyKey, setBusyKey] = useState('');
  const [systemCheckReport, setSystemCheckReport] = useState(null);
  const [systemCheckModalOpen, setSystemCheckModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [appointmentDetailsOpen, setAppointmentDetailsOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [appointmentEditOpen, setAppointmentEditOpen] = useState(false);
  const [appointmentEditForm, setAppointmentEditForm] = useState({ date: '', time: '' });
  const [lastConfirmation, setLastConfirmation] = useState('');
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
    const refreshSystemDate = () => {
      const nextDate = new Date();
      setSystemDate(nextDate);
      if (autoFollowSystemMonth.current) {
        setCalendarMonth(monthStart(nextDate));
      }
    };

    refreshSystemDate();
    const interval = window.setInterval(refreshSystemDate, 60000);
    return () => window.clearInterval(interval);
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

  useEffect(() => {
    closeAppointmentEditor();
  }, [selectedPatientId]);

  const flashNotice = (type, message) => setNotice({ type, message });
  const updateDraft = (path, value) => setDraft((previous) => setAtPath(previous, path, value));
  const availableTimeSlots = draft.admin.availableTimeSlots || {};

  const saveScheduleOptimistically = async (nextSchedule, successMessage, rollbackSchedule = draft.admin, busy = 'schedule') => {
    setDraft((previous) => ({ ...previous, admin: nextSchedule }));
    setBusyKey(busy);
    try {
      await saveSchedule(nextSchedule);
      if (successMessage) flashNotice('success', successMessage);
      return true;
    } catch (error) {
      setDraft((previous) => ({ ...previous, admin: rollbackSchedule }));
      flashNotice('error', error.message);
      return false;
    } finally {
      setBusyKey('');
    }
  };

  const toggleAvailableDate = async (dateString) => {
    if (!isAdmin || busyKey) return;

    const wasAvailable = draft.admin.availableDates.includes(dateString);
    const nextSchedule = toggleDateInSchedule(draft.admin, dateString);

    setDraft((previous) => ({ ...previous, admin: toggleDateInSchedule(previous.admin, dateString) }));

    setSelectedCalendarDate(dateString);
    setBusyKey('schedule');
    try {
      await saveSchedule(nextSchedule);
      flashNotice('success', wasAvailable ? 'Dia bloqueado e agenda salva automaticamente.' : 'Dia liberado e agenda salva automaticamente para a recepção.');
    } catch (error) {
      setDraft((previous) => ({ ...previous, admin: draft.admin }));
      flashNotice('error', error.message);
    } finally {
      setBusyKey('');
    }
  };

  const updateAppointment = async (id, field, value) => {
    const appointmentIndex = draft.admin.appointments.findIndex((item) => item.id === id);
    if (appointmentIndex < 0) return;
    const nextAppointments = draft.admin.appointments.map((item) => (
      item.id === id ? { ...item, [field]: value, updatedAt: new Date().toISOString() } : item
    ));
    await saveScheduleOptimistically(
      { ...draft.admin, appointments: nextAppointments },
      'Agendamento atualizado automaticamente.',
      draft.admin,
      `appointment-${id}`
    );
  };

  const cancelAppointment = async (id) => {
    const appointment = draft.admin.appointments.find((item) => item.id === id);
    if (!appointment) return;
    const nextAppointments = draft.admin.appointments.map((item) => (
      item.id === id ? { ...item, status: 'cancelado', updatedAt: new Date().toISOString() } : item
    ));
    const saved = await saveScheduleOptimistically(
      { ...draft.admin, appointments: nextAppointments },
      'Agendamento cancelado e horário liberado automaticamente.',
      draft.admin,
      `appointment-${id}`
    );
    if (saved && selectedPatientId === id) setSelectedPatientId('');
  };

  const openAppointmentEditor = (appointment) => {
    if (!appointment) return;
    setAppointmentEditForm({ date: appointment.date, time: appointment.time || '' });
    setAppointmentEditOpen(true);
  };

  const closeAppointmentEditor = () => {
    setAppointmentEditOpen(false);
    setAppointmentEditForm({ date: '', time: '' });
  };

  const openAppointmentDetails = (id) => {
    const appointment = draft.admin.appointments.find((item) => item.id === id);
    if (!appointment) return;
    setSelectedPatientId(id);
    setAppointmentEditOpen(false);
    setAppointmentEditForm({ date: appointment.date, time: appointment.time || '' });
    jumpToDate(appointment.date);
  };

  const handleRescheduleAppointment = async () => {
    if (!selectedPatient || busyKey === `appointment-${selectedPatient.id}`) return;

    const nextDate = appointmentEditForm.date;
    const nextTime = normalizeTime(appointmentEditForm.time);

    if (!nextDate || !nextTime) {
      flashNotice('error', 'Selecione a nova data e o novo horário.');
      return;
    }
    if (!draft.admin.availableDates.includes(nextDate)) {
      flashNotice('error', 'A data escolhida não foi liberada pela Dra.');
      return;
    }
    if (!(draft.admin.availableTimeSlots?.[nextDate] || []).includes(nextTime)) {
      flashNotice('error', 'O horário escolhido não está liberado pela Dra.');
      return;
    }

    const duplicate = draft.admin.appointments.some((item) => (
      item.id !== selectedPatient.id &&
      item.date === nextDate &&
      item.time === nextTime &&
      item.status !== 'cancelado'
    ));
    if (duplicate) {
      flashNotice('error', 'Já existe outro paciente nesse horário.');
      return;
    }

    const nextAppointments = draft.admin.appointments.map((item) => (
      item.id === selectedPatient.id
        ? { ...item, date: nextDate, time: nextTime, updatedAt: new Date().toISOString() }
        : item
    ));
    const saved = await saveScheduleOptimistically(
      { ...draft.admin, appointments: nextAppointments },
      'Horário do paciente alterado com sucesso.',
      draft.admin,
      `appointment-${selectedPatient.id}`
    );

    if (saved) {
      setAppointmentEditOpen(false);
      jumpToDate(nextDate);
    }
  };

  const addTimeSlotToDate = async (dateString, timeValue) => {
    const normalizedTime = normalizeTime(timeValue);
    if (!dateString || !normalizedTime) {
      flashNotice('error', 'Selecione uma data e informe um horário válido.');
      return;
    }

    const nextSlots = sortTimes([...(draft.admin.availableTimeSlots?.[dateString] || []), normalizedTime]);
    const nextDates = draft.admin.availableDates.includes(dateString)
      ? draft.admin.availableDates
      : sortDates([...draft.admin.availableDates, dateString]);
    const nextSchedule = {
      ...draft.admin,
      availableDates: nextDates,
      availableTimeSlots: {
        ...(draft.admin.availableTimeSlots || {}),
        [dateString]: nextSlots,
      },
    };

    const saved = await saveScheduleOptimistically(nextSchedule, 'Horário salvo automaticamente para a recepção.', draft.admin);
    if (saved) setSlotEditor((previous) => ({ ...previous, time: '' }));
  };

  const removeTimeSlotFromDate = async (dateString, timeValue) => {
    const hasAppointment = draft.admin.appointments.some(
      (item) => item.date === dateString && item.time === timeValue && item.status !== 'cancelado'
    );
    if (hasAppointment) {
      flashNotice('error', 'Não é possível remover um horário que já possui paciente agendado.');
      return;
    }

    const nextSchedule = {
      ...draft.admin,
      availableTimeSlots: {
        ...(draft.admin.availableTimeSlots || {}),
        [dateString]: (draft.admin.availableTimeSlots?.[dateString] || []).filter((item) => item !== timeValue),
      },
    };

    const saved = await saveScheduleOptimistically(nextSchedule, 'Horário removido automaticamente.', draft.admin);
    if (saved) {
      setAppointmentForm((previous) => (
        previous.date === dateString && previous.time === timeValue
          ? { ...previous, time: '' }
          : previous
      ));
    }
  };
  const closeAppointmentModal = () => {
    setAppointmentModalOpen(false);
    setAppointmentDetailsOpen(false);
    setAppointmentForm({ fullName: '', address: '', cpf: '', date: '', time: '', procedureName: '', notes: '' });
  };

  const openAppointmentModal = (dateString, timeValue = '') => {
    if (!dateString) return;
    const freeTimes = freeTimeSlotsByDate[dateString] || [];
    jumpToDate(dateString);
    setAppointmentForm((previous) => ({
      ...previous,
      date: dateString,
      time: timeValue || freeTimes[0] || '',
    }));
    setAppointmentDetailsOpen(false);
    setAppointmentModalOpen(true);
  };

  const handleAddAppointment = async () => {
    if (busyKey === 'appointment') return;
    const normalizedCpf = normalizeCpf(appointmentForm.cpf);

    if (!appointmentForm.fullName.trim() || !appointmentForm.address.trim() || !normalizedCpf || !appointmentForm.date || !appointmentForm.time) {
      flashNotice('error', 'Preencha nome completo, endereço, CPF, data e horário.');
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

    const newAppointment = {
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
      source: 'panel',
    };
    const nextSchedule = {
      ...draft.admin,
      appointments: [...draft.admin.appointments, newAppointment],
    };

    setBusyKey('appointment');
    setDraft((previous) => ({
      ...previous,
      admin: {
        ...previous.admin,
        appointments: [...previous.admin.appointments, newAppointment],
      },
    }));

    try {
      await saveSchedule(nextSchedule);
      const confirmation = `Olá, ${newAppointment.fullName}. Seu atendimento com a Dra. Williane Holanda foi agendado para ${formatDateLabel(newAppointment.date)} às ${newAppointment.time}.`;
      setLastConfirmation(confirmation);
      flashNotice('success', 'Agendamento salvo e agenda atualizada para todos os painéis.');
      closeAppointmentModal();
    } catch (error) {
      setDraft((previous) => ({
        ...previous,
        admin: {
          ...previous.admin,
          appointments: previous.admin.appointments.filter((item) => item.id !== newAppointment.id),
        },
      }));
      flashNotice('error', error.message);
    } finally {
      setBusyKey('');
    }
  };

  const handleAppointmentKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    handleAddAppointment();
  };

  const copyLastConfirmation = async () => {
    if (!lastConfirmation) return;
    try {
      await navigator.clipboard.writeText(lastConfirmation);
      flashNotice('success', 'Confirmação copiada.');
    } catch (_error) {
      flashNotice('error', 'Não foi possível copiar automaticamente.');
    }
  };

  const appointmentsByDate = useMemo(() => [...draft.admin.appointments].sort((a, b) => {
    const dateComparison = a.date.localeCompare(b.date);
    if (dateComparison !== 0) return dateComparison;
    const timeComparison = (a.time || '').localeCompare(b.time || '');
    if (timeComparison !== 0) return timeComparison;
    return a.fullName.localeCompare(b.fullName);
  }), [draft.admin.appointments]);
  const selectedPatient = useMemo(
    () => draft.admin.appointments.find((item) => item.id === selectedPatientId) || null,
    [draft.admin.appointments, selectedPatientId]
  );

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
  const appointmentEditDateOptions = useMemo(() => {
    if (!selectedPatient) return [];
    return sortDates([
      ...draft.admin.availableDates.filter((date) => (freeTimeSlotsByDate[date] || []).length > 0),
      selectedPatient.date,
    ]).map((date) => ({ value: date, label: formatDateLabel(date) }));
  }, [draft.admin.availableDates, freeTimeSlotsByDate, selectedPatient]);
  const appointmentEditTimeOptions = useMemo(
    () => getEditableTimeOptions(appointmentEditForm.date, selectedPatient, freeTimeSlotsByDate),
    [appointmentEditForm.date, freeTimeSlotsByDate, selectedPatient]
  );
  const summary = dashboard?.summary || {};
  useEffect(() => {
    if (appointmentForm.date && !(freeTimeSlotsByDate[appointmentForm.date] || []).includes(appointmentForm.time)) {
      setAppointmentForm((previous) => ({ ...previous, time: '' }));
    }
  }, [appointmentForm.date, appointmentForm.time, freeTimeSlotsByDate]);
  useEffect(() => {
    if (!appointmentForm.date) return;
    const options = freeTimeSlotsByDate[appointmentForm.date] || [];
    if (!appointmentForm.time && options.length > 0) {
      setAppointmentForm((previous) => ({ ...previous, time: options[0] }));
    }
  }, [appointmentForm.date, appointmentForm.time, freeTimeSlotsByDate]);
  const auditLogs = dashboard?.auditLogs || [];
  const whatsAppEvents = whatsAppStatus?.recentEvents || [];
  const todayDate = useMemo(() => formatDateKey(systemDate), [systemDate]);
  const todayAppointments = useMemo(
    () => appointmentsByDate.filter((item) => item.date === todayDate && item.status !== 'cancelado'),
    [appointmentsByDate, todayDate]
  );
  const upcomingAppointments = useMemo(
    () => appointmentsByDate
      .filter((item) => item.status !== 'cancelado' && item.date >= todayDate)
      .slice(0, 5),
    [appointmentsByDate, todayDate]
  );
  const filteredAppointments = useMemo(() => {
    const query = patientSearch.trim().toLowerCase();
    if (!query) return appointmentsByDate;
    const digits = normalizeCpf(query);
    return appointmentsByDate.filter((item) => {
      const haystack = [
        item.fullName,
        item.cpf,
        item.address,
        item.date,
        item.time,
        item.procedureName,
        item.status,
      ].join(' ').toLowerCase();
      return haystack.includes(query) || (digits && normalizeCpf(item.cpf).includes(digits));
    });
  }, [appointmentsByDate, patientSearch]);
  const quickSlotPresets = DEFAULT_TIME_SLOTS;
  const quickActionDate = selectedCalendarDate || nextAvailableDate || todayDate;

  const jumpToDate = (dateString) => {
    if (!dateString) return;
    const targetDate = new Date(`${dateString}T12:00:00`);
    autoFollowSystemMonth.current = dateString === todayDate;
    setCalendarMonth(new Date(targetDate.getFullYear(), targetDate.getMonth(), 1));
    setSelectedCalendarDate(dateString);
  };

  const applyPresetSlotsToDate = async (dateString) => {
    if (!isAdmin || !dateString) return;
    const nextSlots = sortTimes([...(draft.admin.availableTimeSlots?.[dateString] || []), ...quickSlotPresets]);
    const nextDates = draft.admin.availableDates.includes(dateString)
      ? draft.admin.availableDates
      : sortDates([...draft.admin.availableDates, dateString]);
    const nextSchedule = {
      ...draft.admin,
      availableDates: nextDates,
      availableTimeSlots: {
        ...(draft.admin.availableTimeSlots || {}),
        [dateString]: nextSlots,
      },
    };

    await saveScheduleOptimistically(nextSchedule, `Horários padrão salvos em ${formatDateLabel(dateString)}.`, draft.admin);
    jumpToDate(dateString);
  };

  const prepareQuickAppointment = (dateString) => {
    if (!dateString) return;
    openAppointmentModal(dateString);
  };

  useEffect(() => {
    if (isAdmin || !currentUser) return;
    if (selectedCalendarDate && receptionistAvailableDates.includes(selectedCalendarDate)) return;
    if (nextAvailableDate) jumpToDate(nextAvailableDate);
  }, [currentUser, isAdmin, nextAvailableDate, receptionistAvailableDates, selectedCalendarDate]);

  useEffect(() => {
    if (isAdmin || !currentUser) return undefined;

    const refreshVisibleSchedule = () => {
      if (document.visibilityState === 'visible') {
        refreshSchedule().catch(() => {});
      }
    };

    const interval = window.setInterval(refreshVisibleSchedule, 4000);
    window.addEventListener('focus', refreshVisibleSchedule);
    document.addEventListener('visibilitychange', refreshVisibleSchedule);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshVisibleSchedule);
      document.removeEventListener('visibilitychange', refreshVisibleSchedule);
    };
  }, [currentUser, isAdmin, refreshSchedule]);

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
              {isAdmin ? <ActionButton onClick={() => toggleAvailableDate(todayDate)} variant={draft.admin.availableDates.includes(todayDate) ? 'danger' : 'primary'} disabled={busyKey === 'schedule'} stretch={isMobile} style={compactButtonStyle}>{draft.admin.availableDates.includes(todayDate) ? 'Fechar hoje' : 'Liberar hoje'}</ActionButton> : null}
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
          {!adminScheduleOnly ? (
            <div style={{ marginTop: '18px', background: 'rgba(23,23,23,0.92)', borderRadius: '22px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <strong style={{ display: 'block', marginBottom: '6px', fontSize: '18px' }}>Próximos pacientes</strong>
                  <span style={{ color: 'rgba(245,240,232,0.62)', fontSize: '14px', lineHeight: 1.7 }}>
                    Resumo rápido para a recepção saber quem vem a seguir.
                  </span>
                </div>
                {nextAvailableDate ? (
                  <ActionButton onClick={() => prepareQuickAppointment(nextAvailableDate)} variant="primary" stretch={isMobile} style={compactButtonStyle}>
                    Abrir próxima vaga
                  </ActionButton>
                ) : null}
              </div>
              {upcomingAppointments.length === 0 ? (
                <p style={{ margin: 0, color: 'rgba(245,240,232,0.62)', lineHeight: 1.7 }}>
                  Ainda não existem pacientes agendados para os próximos dias.
                </p>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {upcomingAppointments.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openAppointmentDetails(item.id)}
                      style={{ textAlign: 'left', padding: '14px 16px', borderRadius: '18px', background: item.date === todayDate ? 'rgba(91,196,142,0.12)' : 'rgba(255,255,255,0.04)', border: item.date === todayDate ? '1px solid rgba(91,196,142,0.24)' : '1px solid rgba(255,255,255,0.05)', color: '#F5F0E8', cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div>
                          <strong style={{ display: 'block', marginBottom: '4px' }}>{item.fullName}</strong>
                          <span style={{ color: 'rgba(245,240,232,0.62)', fontSize: '13px' }}>
                            {item.procedureName || 'Procedimento a definir'}
                          </span>
                        </div>
                        <div style={{ display: 'grid', justifyItems: isMobile ? 'flex-start' : 'end', gap: '4px' }}>
                          <span style={{ color: item.date === todayDate ? '#9BE6BA' : '#C9A96E', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {item.date === todayDate ? 'Hoje' : formatDateLabel(item.date)}
                          </span>
                          <strong style={{ fontSize: '15px' }}>{item.time || 'Sem horário'}</strong>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
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
                <ActionButton onClick={() => {
                  autoFollowSystemMonth.current = false;
                  setCalendarMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() - 1, 1));
                }} stretch={isMobile}>Mês anterior</ActionButton>
                <strong style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? '26px' : '30px', fontWeight: 400, textTransform: 'capitalize', textAlign: 'center', flex: 1 }}>{calendarMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</strong>
                <ActionButton onClick={() => {
                  autoFollowSystemMonth.current = false;
                  setCalendarMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() + 1, 1));
                }} stretch={isMobile}>Próximo mês</ActionButton>
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
                    Clique em um dia com vaga para escolher o horário e cadastrar o paciente.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: calendarGap, marginBottom: '2px', textAlign: 'center', color: 'rgba(245,240,232,0.6)', fontSize: isMobile ? '10px' : '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((item) => <div key={item}>{item}</div>)}
                  </div>
                  {monthGrid.every((date) => (freeTimeSlotsByDate[date.toISOString().slice(0, 10)] || []).length === 0) ? (
                    <p style={{ margin: 0, color: '#E7B1B1', lineHeight: 1.7 }}>
                      Nenhuma data livre encontrada neste mês.
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: calendarGap }}>
                      {monthGrid.map((date) => {
                        const dateString = date.toISOString().slice(0, 10);
                        const isCurrentMonth = sameMonth(date, calendarMonth);
                        const freeSlots = (freeTimeSlotsByDate[dateString] || []).length;
                        const hasFreeSlot = freeSlots > 0;
                        const isSelected = selectedCalendarDate === dateString;

                        return (
                          <button key={dateString} type="button" disabled={!hasFreeSlot} onClick={() => openAppointmentModal(dateString)} style={{ minHeight: calendarCellMinHeight, padding: isMobile ? '6px' : '8px', borderRadius: '16px', border: isSelected ? '1px solid #C9A96E' : hasFreeSlot ? '1px solid rgba(201,169,110,0.28)' : '1px solid rgba(255,255,255,0.05)', background: hasFreeSlot ? 'rgba(201,169,110,0.15)' : 'rgba(14,14,14,0.55)', color: !isCurrentMonth ? 'rgba(245,240,232,0.18)' : hasFreeSlot ? '#F5F0E8' : 'rgba(245,240,232,0.32)', cursor: hasFreeSlot ? 'pointer' : 'not-allowed', opacity: isCurrentMonth ? 1 : 0.62, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: isMobile ? '12px' : '13px' }}>{date.getDate()}</span>
                            {hasFreeSlot ? (
                              <span style={{ fontSize: isMobile ? '9px' : '10px', color: freeSlots === 1 ? '#F1DEC0' : '#9BE6BA' }}>
                                {freeSlots === 1 ? 'Última' : `${freeSlots} livres`}
                              </span>
                            ) : null}
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
                    Escolha um dia no calendário. O formulário abre em uma janela rápida com os horários livres daquele dia.
                  </p>
                  <ActionButton onClick={() => prepareQuickAppointment(nextAvailableDate)} variant="primary" disabled={!nextAvailableDate} stretch={isMobile}>Abrir próxima vaga</ActionButton>
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
                          <ActionButton onClick={() => toggleAvailableDate(selectedCalendarDate)} variant={draft.admin.availableDates.includes(selectedCalendarDate) ? 'danger' : 'primary'} disabled={busyKey === 'schedule'} stretch={isMobile} style={compactButtonStyle}>
                            {busyKey === 'schedule' ? 'Salvando...' : draft.admin.availableDates.includes(selectedCalendarDate) ? 'Bloquear dia' : 'Liberar dia'}
                          </ActionButton>
                          {DEFAULT_TIME_SLOTS.map((time) => (
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
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
                <strong style={{ display: 'block', fontSize: '18px' }}>Pacientes</strong>
                {lastConfirmation ? <ActionButton onClick={copyLastConfirmation}>Copiar confirmação</ActionButton> : null}
              </div>
              <Field label="Buscar paciente" value={patientSearch} onChange={setPatientSearch} placeholder="Nome, CPF, data ou status" />
              <div style={{ height: '14px' }} />
              {filteredAppointments.length === 0 ? (
                <p style={{ margin: 0, color: 'rgba(245,240,232,0.62)', lineHeight: 1.7 }}>
                  {appointmentsByDate.length === 0 ? 'Nenhum agendamento cadastrado ainda.' : 'Nenhum paciente encontrado nessa busca.'}
                </p>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {filteredAppointments.map((appointment) => (
                    <button key={appointment.id} type="button" onClick={() => openAppointmentDetails(appointment.id)} style={{ textAlign: 'left', background: appointment.status === 'cancelado' ? 'rgba(231,177,177,0.08)' : 'rgba(23,23,23,0.92)', borderRadius: '8px', padding: '14px', border: appointment.status === 'cancelado' ? '1px solid rgba(231,177,177,0.18)' : '1px solid rgba(255,255,255,0.05)', color: '#F5F0E8', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div>
                          <strong style={{ display: 'block', fontSize: '16px' }}>{appointment.fullName}</strong>
                          <span style={{ color: '#C9A96E', fontSize: '13px' }}>{formatDateLabel(appointment.date)}{appointment.time ? ` às ${appointment.time}` : ''}</span>
                        </div>
                        <span style={{ borderRadius: '8px', padding: '7px 10px', background: appointment.status === 'cancelado' ? 'rgba(231,177,177,0.14)' : 'rgba(91,196,142,0.12)', color: appointment.status === 'cancelado' ? '#E7B1B1' : '#9BE6BA', fontSize: '12px' }}>{appointment.status}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
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

      {selectedPatient ? (
        <div
          onClick={() => {
            setSelectedPatientId('');
            closeAppointmentEditor();
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.72)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '12px' : '24px',
            zIndex: 9998,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '760px',
              maxHeight: '92vh',
              overflowY: 'auto',
              background: 'linear-gradient(180deg, rgba(20,20,20,0.98) 0%, rgba(11,11,11,0.98) 100%)',
              border: '1px solid rgba(201,169,110,0.24)',
              borderRadius: '28px',
              padding: isMobile ? '20px' : '28px',
              boxShadow: '0 28px 70px rgba(0,0,0,0.34)',
              color: '#F5F0E8',
              display: 'grid',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: '#C9A96E', textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: '11px', marginBottom: '10px' }}>
                  Atendimento
                </div>
                <h2 style={{ margin: '0 0 8px', fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: isMobile ? '32px' : '40px' }}>
                  {selectedPatient.fullName}
                </h2>
                <p style={{ margin: 0, color: 'rgba(245,240,232,0.68)', lineHeight: 1.7 }}>
                  {formatDateLabel(selectedPatient.date)}{selectedPatient.time ? ` às ${selectedPatient.time}` : ''}
                </p>
              </div>
              <ActionButton onClick={() => {
                setSelectedPatientId('');
                closeAppointmentEditor();
              }}>Fechar</ActionButton>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap', padding: '14px', borderRadius: '8px', background: selectedPatient.status === 'cancelado' ? 'rgba(231,177,177,0.08)' : 'rgba(91,196,142,0.08)', border: selectedPatient.status === 'cancelado' ? '1px solid rgba(231,177,177,0.18)' : '1px solid rgba(91,196,142,0.18)' }}>
                <div>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>Agendamento atual</strong>
                  <span style={{ color: 'rgba(245,240,232,0.72)' }}>{formatDateLabel(selectedPatient.date)}{selectedPatient.time ? ` às ${selectedPatient.time}` : ''}</span>
                </div>
                <span style={{ borderRadius: '8px', padding: '8px 10px', background: selectedPatient.status === 'cancelado' ? 'rgba(231,177,177,0.14)' : 'rgba(91,196,142,0.12)', color: selectedPatient.status === 'cancelado' ? '#E7B1B1' : '#9BE6BA', fontSize: '12px' }}>{selectedPatient.status}</span>
              </div>
              <Row minWidth={isMobile ? 180 : 260}>
                <div style={{ display: 'grid', gap: '8px', padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(245,240,232,0.78)', lineHeight: 1.7 }}>
                  <strong style={{ color: '#F5F0E8' }}>Dados do paciente</strong>
                  <div><strong>Nome:</strong> {selectedPatient.fullName}</div>
                  <div><strong>CPF:</strong> {selectedPatient.cpf}</div>
                  <div><strong>Endereço:</strong> {selectedPatient.address}</div>
                  {selectedPatient.contactPhone ? <div><strong>Telefone:</strong> {selectedPatient.contactPhone}</div> : null}
                </div>
                <div style={{ display: 'grid', gap: '8px', padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(245,240,232,0.78)', lineHeight: 1.7 }}>
                  <strong style={{ color: '#F5F0E8' }}>Dados do agendamento</strong>
                  <div><strong>Data:</strong> {formatDateLabel(selectedPatient.date)}</div>
                  <div><strong>Horário:</strong> {selectedPatient.time || 'Sem horário'}</div>
                  <div><strong>Procedimento:</strong> {selectedPatient.procedureName || 'Procedimento a definir'}</div>
                  <div><strong>Origem:</strong> {selectedPatient.source === 'whatsapp' ? 'WhatsApp' : 'Painel'}</div>
                </div>
              </Row>
              <div style={{ display: 'grid', gap: '8px', padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(245,240,232,0.78)', lineHeight: 1.7 }}>
                <strong style={{ color: '#F5F0E8' }}>Observações internas</strong>
                <div>{selectedPatient.notes || 'Sem observações registradas.'}</div>
              </div>
            </div>

            {appointmentEditOpen ? (
              <div style={{ display: 'grid', gap: '12px', padding: '14px', borderRadius: '8px', background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.18)' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '16px', marginBottom: '4px' }}>Remarcar paciente</strong>
                  <span style={{ color: 'rgba(245,240,232,0.66)', lineHeight: 1.7, fontSize: '13px' }}>Escolha uma data e um horário livre. O sistema já bloqueia horários ocupados.</span>
                </div>
                <Row minWidth={isMobile ? 180 : 220}>
                  <SelectField
                    label="Nova data"
                    value={appointmentEditForm.date}
                    onChange={(value) => {
                      const timeOptions = getEditableTimeOptions(value, selectedPatient, freeTimeSlotsByDate);
                      setAppointmentEditForm({ date: value, time: timeOptions[0] || '' });
                    }}
                    options={appointmentEditDateOptions}
                    disabled={busyKey === `appointment-${selectedPatient.id}` || selectedPatient.status === 'cancelado'}
                  />
                  <SelectField
                    label="Novo horário"
                    value={appointmentEditForm.time}
                    onChange={(value) => setAppointmentEditForm((previous) => ({ ...previous, time: value }))}
                    options={appointmentEditTimeOptions.length > 0 ? appointmentEditTimeOptions.map((time) => ({ value: time, label: time })) : [{ value: '', label: 'Sem horário livre' }]}
                    disabled={busyKey === `appointment-${selectedPatient.id}` || selectedPatient.status === 'cancelado' || appointmentEditTimeOptions.length === 0}
                  />
                </Row>
                {appointmentEditForm.date && appointmentEditForm.time ? (
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.20)', border: '1px solid rgba(255,255,255,0.06)', color: '#F1DEC0', lineHeight: 1.7 }}>
                    Vai mudar para <strong>{formatDateLabel(appointmentEditForm.date)} às {appointmentEditForm.time}</strong>.
                  </div>
                ) : null}
                <p style={{ margin: 0, color: 'rgba(245,240,232,0.66)', lineHeight: 1.7, fontSize: '13px' }}>
                  O horário antigo volta a ficar livre assim que a alteração for salva.
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <ActionButton onClick={handleRescheduleAppointment} variant="primary" disabled={busyKey === `appointment-${selectedPatient.id}` || selectedPatient.status === 'cancelado' || appointmentEditTimeOptions.length === 0} stretch={isMobile}>
                    {busyKey === `appointment-${selectedPatient.id}` ? 'Salvando...' : 'Salvar novo horário'}
                  </ActionButton>
                  <ActionButton onClick={closeAppointmentEditor} disabled={busyKey === `appointment-${selectedPatient.id}`} stretch={isMobile}>Voltar</ActionButton>
                </div>
              </div>
            ) : null}

            {!appointmentEditOpen ? (
              <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(245,240,232,0.68)', lineHeight: 1.7 }}>
                Para mudar o dia ou horário, use <strong style={{ color: '#F5F0E8' }}>Remarcar paciente</strong>. Para liberar o horário sem escolher outro, use <strong style={{ color: '#F5F0E8' }}>Cancelar agendamento</strong>.
              </div>
            ) : null}

            <div style={{ color: '#C9A96E', textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: '11px' }}>
              Ações do agendamento
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <ActionButton onClick={() => openAppointmentEditor(selectedPatient)} variant="primary" disabled={busyKey === `appointment-${selectedPatient.id}` || selectedPatient.status === 'cancelado'} stretch={isMobile}>Remarcar paciente</ActionButton>
              <ActionButton onClick={() => updateAppointment(selectedPatient.id, 'confirmado')} variant="primary" disabled={busyKey === `appointment-${selectedPatient.id}`} stretch={isMobile}>Confirmar</ActionButton>
              <ActionButton onClick={() => updateAppointment(selectedPatient.id, 'concluido')} disabled={busyKey === `appointment-${selectedPatient.id}`} stretch={isMobile}>Concluir</ActionButton>
              <ActionButton onClick={() => cancelAppointment(selectedPatient.id)} variant="danger" disabled={busyKey === `appointment-${selectedPatient.id}` || selectedPatient.status === 'cancelado'} stretch={isMobile}>Cancelar agendamento</ActionButton>
            </div>
          </div>
        </div>
      ) : null}

      {appointmentModalOpen && !isAdmin ? (
        <div
          onClick={closeAppointmentModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.72)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '12px' : '24px',
            zIndex: 9998,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '720px',
              maxHeight: '92vh',
              overflowY: 'auto',
              background: 'linear-gradient(180deg, rgba(20,20,20,0.98) 0%, rgba(11,11,11,0.98) 100%)',
              border: '1px solid rgba(201,169,110,0.24)',
              borderRadius: '28px',
              padding: isMobile ? '20px' : '28px',
              boxShadow: '0 28px 70px rgba(0,0,0,0.34)',
              color: '#F5F0E8',
              display: 'grid',
              gap: '18px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: '#C9A96E', textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: '11px', marginBottom: '10px' }}>
                  Novo agendamento
                </div>
                <h2 style={{ margin: '0 0 8px', fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: isMobile ? '34px' : '42px' }}>
                  {appointmentForm.date ? formatDateLabel(appointmentForm.date) : 'Escolha uma data'}
                </h2>
                <p style={{ margin: 0, color: 'rgba(245,240,232,0.68)', lineHeight: 1.7 }}>
                  Selecione um horário livre e complete os dados do paciente.
                </p>
              </div>
              <ActionButton onClick={closeAppointmentModal} disabled={busyKey === 'appointment'}>Fechar</ActionButton>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '16px' }}>Horários disponíveis</strong>
                {appointmentForm.time ? <span style={{ borderRadius: '8px', padding: '8px 12px', background: 'rgba(91,196,142,0.12)', color: '#9BE6BA', fontSize: '13px' }}>Selecionado: {appointmentForm.time}</span> : null}
              </div>
              {appointmentTimeOptions.length === 0 ? (
                <p style={{ margin: 0, color: '#E7B1B1', lineHeight: 1.7 }}>Não há horário livre nessa data.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))', gap: '10px' }}>
                  {appointmentTimeOptions.map((time) => {
                    const selected = appointmentForm.time === time;
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setAppointmentForm((previous) => ({ ...previous, time }))}
                        style={{
                          minHeight: '56px',
                          borderRadius: '8px',
                          border: selected ? '1px solid #C9A96E' : '1px solid rgba(255,255,255,0.10)',
                          background: selected ? 'rgba(201,169,110,0.18)' : 'rgba(255,255,255,0.05)',
                          color: selected ? '#F1DEC0' : '#F5F0E8',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <Row minWidth={isMobile ? 180 : 260}>
              <Field label="Nome completo do paciente" value={appointmentForm.fullName} onChange={(value) => setAppointmentForm((previous) => ({ ...previous, fullName: value }))} autoFocus onKeyDown={handleAppointmentKeyDown} />
              <Field label="CPF" value={appointmentForm.cpf} onChange={(value) => setAppointmentForm((previous) => ({ ...previous, cpf: formatCpf(value) }))} onKeyDown={handleAppointmentKeyDown} />
            </Row>
            <Field label="Endereço" value={appointmentForm.address} onChange={(value) => setAppointmentForm((previous) => ({ ...previous, address: value }))} onKeyDown={handleAppointmentKeyDown} />
            {appointmentDetailsOpen ? (
              <>
                <Row minWidth={isMobile ? 180 : 260}>
                  <Field label="Procedimento (opcional)" value={appointmentForm.procedureName} onChange={(value) => setAppointmentForm((previous) => ({ ...previous, procedureName: value }))} onKeyDown={handleAppointmentKeyDown} />
                  <SelectField label="Data" value={appointmentForm.date} onChange={(value) => setAppointmentForm((previous) => ({ ...previous, date: value, time: (freeTimeSlotsByDate[value] || [])[0] || '' }))} options={[{ value: '', label: 'Selecione uma data' }, ...receptionistAvailableDates.map((date) => ({ value: date, label: formatDateLabel(date) }))]} />
                </Row>
                <Field label="Observações internas" value={appointmentForm.notes} onChange={(value) => setAppointmentForm((previous) => ({ ...previous, notes: value }))} multiline />
              </>
            ) : (
              <ActionButton onClick={() => setAppointmentDetailsOpen(true)} stretch={isMobile}>Adicionar detalhes</ActionButton>
            )}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <ActionButton onClick={handleAddAppointment} variant="primary" disabled={busyKey === 'appointment' || appointmentTimeOptions.length === 0} stretch={isMobile}>
                {busyKey === 'appointment' ? 'Salvando agendamento...' : 'Confirmar agendamento'}
              </ActionButton>
              <ActionButton onClick={closeAppointmentModal} disabled={busyKey === 'appointment'} stretch={isMobile}>Cancelar</ActionButton>
            </div>
          </div>
        </div>
      ) : null}

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






