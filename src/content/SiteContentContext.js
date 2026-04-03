import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { defaultSiteContent } from './defaultSiteContent';

const AUTH_STORAGE_KEY = 'dra-williane-auth-token';
const SiteContentContext = createContext(null);

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(base, override) {
  if (Array.isArray(override)) return override;
  if (!isObject(base) || !isObject(override)) return override ?? base;

  const result = { ...base };
  Object.keys(override).forEach((key) => {
    result[key] = deepMerge(base[key], override[key]);
  });
  return result;
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMessage = typeof payload === 'object' && payload?.error ? payload.error : 'Falha na requisicao.';
    throw new Error(errorMessage);
  }

  return payload;
}

export function SiteContentProvider({ children }) {
  const [rawContent, setRawContent] = useState({});
  const [schedule, setSchedule] = useState(defaultSiteContent.admin);
  const [token, setToken] = useState(() => window.localStorage.getItem(AUTH_STORAGE_KEY) || '');
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [dashboard, setDashboard] = useState({
    summary: null,
    auditLogs: [],
  });
  const [loading, setLoading] = useState(true);

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const siteContent = useMemo(
    () =>
      deepMerge(defaultSiteContent, {
        ...rawContent,
        admin: schedule,
      }),
    [rawContent, schedule]
  );

  const loadSiteContent = async () => {
    const remoteContent = await apiFetch('/api/site-content');
    setRawContent(remoteContent || {});
  };

  const loadSchedule = async (headers = authHeaders) => {
    if (!headers.Authorization) {
      setSchedule(defaultSiteContent.admin);
      return;
    }
    const remoteSchedule = await apiFetch('/api/admin/schedule', { headers });
    setSchedule(deepMerge(defaultSiteContent.admin, remoteSchedule || {}));
  };

  const loadUsers = async (headers = authHeaders) => {
    if (!headers.Authorization) {
      setUsers([]);
      return;
    }
    const userList = await apiFetch('/api/admin/users', { headers });
    setUsers(userList);
  };

  const loadDashboard = async (headers = authHeaders) => {
    if (!headers.Authorization) {
      setDashboard({ summary: null, auditLogs: [] });
      return;
    }
    const result = await apiFetch('/api/admin/dashboard', { headers });
    setDashboard({
      summary: result.summary || null,
      auditLogs: result.auditLogs || [],
    });
  };

  const loadSession = async (headers = authHeaders) => {
    if (!headers.Authorization) {
      setCurrentUser(null);
      setUsers([]);
      setSchedule(defaultSiteContent.admin);
      setDashboard({ summary: null, auditLogs: [] });
      return;
    }

    const me = await apiFetch('/api/auth/me', { headers });
    setCurrentUser(me.user);
    await Promise.all([loadUsers(headers), loadSchedule(headers), loadDashboard(headers)]);
  };

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        await loadSiteContent();
        if (token) {
          await loadSession(token ? { Authorization: `Bearer ${token}` } : {});
        }
      } catch (_error) {
        if (mounted && token) {
          window.localStorage.removeItem(AUTH_STORAGE_KEY);
          setToken('');
          setCurrentUser(null);
          setUsers([]);
          setSchedule(defaultSiteContent.admin);
          setDashboard({ summary: null, auditLogs: [] });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      siteContent,
      token,
      currentUser,
      users,
      dashboard,
      loading,
      async refreshAll() {
        await loadSiteContent();
        if (token) {
          await loadSession(authHeaders);
        }
      },
      async login(username, password) {
        const result = await apiFetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        window.localStorage.setItem(AUTH_STORAGE_KEY, result.token);
        setToken(result.token);
        setCurrentUser(result.user);

        const nextHeaders = {
          Authorization: `Bearer ${result.token}`,
        };
        await Promise.all([loadSiteContent(), loadUsers(nextHeaders), loadSchedule(nextHeaders), loadDashboard(nextHeaders)]);
        return result.user;
      },
      logout() {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        setToken('');
        setCurrentUser(null);
        setUsers([]);
        setSchedule(defaultSiteContent.admin);
        setDashboard({ summary: null, auditLogs: [] });
      },
      async saveContent(nextContent) {
        await apiFetch('/api/admin/site-content', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify(nextContent),
        });
        const nextRaw = { ...nextContent };
        delete nextRaw.admin;
        setRawContent(nextRaw);
        await loadDashboard(authHeaders);
      },
      async resetContent() {
        await apiFetch('/api/admin/site-content', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify({}),
        });
        setRawContent({});
        await loadDashboard(authHeaders);
      },
      async saveSchedule(nextSchedule) {
        const result = await apiFetch('/api/admin/schedule', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify(nextSchedule),
        });
        setSchedule(deepMerge(defaultSiteContent.admin, result.schedule || {}));
        await loadDashboard(authHeaders);
      },
      async changeOwnPassword(currentPassword, newPassword) {
        await apiFetch('/api/auth/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        await loadDashboard(authHeaders);
      },
      async createUser(payload) {
        const result = await apiFetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify(payload),
        });
        await Promise.all([loadUsers(authHeaders), loadDashboard(authHeaders)]);
        return result.user;
      },
      async updateUser(userId, payload) {
        const result = await apiFetch(`/api/admin/users/${userId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify(payload),
        });
        await Promise.all([loadUsers(authHeaders), loadDashboard(authHeaders)]);
        return result.user;
      },
      async downloadBackup() {
        const response = await fetch('/api/admin/backup', {
          headers: {
            ...authHeaders,
          },
        });
        if (!response.ok) {
          const payload = await response.text();
          throw new Error(payload || 'Falha ao gerar backup.');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup-dra-williane-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
    }),
    [siteContent, token, currentUser, users, dashboard, loading, authHeaders]
  );

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  const value = useContext(SiteContentContext);
  if (!value) {
    throw new Error('useSiteContent must be used within SiteContentProvider');
  }
  return value;
}
