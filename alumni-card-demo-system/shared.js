(function () {
  const STORAGE_KEY = 'alumni-card-demo-store-v1';
  const SESSION_KEY = 'alumni-card-demo-session';
  const seed = { users: [], registrations: [], appointments: [], nextId: 1 };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function readStore() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return clone(seed);
    }
    try { return JSON.parse(raw); } catch { localStorage.setItem(STORAGE_KEY, JSON.stringify(seed)); return clone(seed); }
  }
  function writeStore(store) { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); return store; }
  function nextId(store) { const id = store.nextId || 1; store.nextId = id + 1; return id; }
  function getSession() { const raw = localStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) : null; }
  function setSession(session) { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
  function clearSession() { localStorage.removeItem(SESSION_KEY); }
  function findCurrentUser() {
    const session = getSession();
    if (!session) return null;
    return readStore().users.find((user) => user.id === session.userId) || null;
  }
  function loginUser(phone, nickname) {
    const store = readStore();
    let user = store.users.find((item) => item.phone === phone);
    if (!user) {
      user = { id: nextId(store), phone, nickname, loginAt: new Date().toISOString() };
      store.users.push(user);
    } else {
      user.nickname = nickname;
      user.loginAt = new Date().toISOString();
    }
    writeStore(store);
    setSession({ userId: user.id });
    return user;
  }
  function upsertRegistration(payload) {
    const session = getSession();
    if (!session) throw new Error('请先登录');
    const store = readStore();
    const existing = store.registrations.find((item) => item.userId === session.userId);
    const now = new Date().toISOString();
    const record = { id: existing ? existing.id : nextId(store), userId: session.userId, status: 'pending', adminRemark: '', createdAt: existing?.createdAt || now, updatedAt: now, ...payload };
    if (existing) {
      Object.assign(existing, record);
    } else {
      store.registrations.unshift(record);
    }
    writeStore(store);
    return record;
  }
  function getRegistrationByUser(userId) { return readStore().registrations.find((item) => item.userId === userId) || null; }
  function listMyAppointments() {
    const session = getSession();
    if (!session) return [];
    return readStore().appointments.filter((item) => item.userId === session.userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  function createAppointment(payload) {
    const session = getSession();
    if (!session) throw new Error('请先登录');
    const store = readStore();
    const registration = store.registrations.find((item) => item.userId === session.userId);
    if (!registration || registration.status !== 'approved') throw new Error('需先审核通过后才能预约入校');
    const record = { id: nextId(store), userId: session.userId, status: 'pending', adminRemark: '', createdAt: new Date().toISOString(), ...payload };
    store.appointments.unshift(record);
    writeStore(store);
    return record;
  }
  function updateRegistrationStatus(id, status, adminRemark) {
    const store = readStore();
    const target = store.registrations.find((item) => item.id === id);
    if (!target) return null;
    target.status = status;
    target.adminRemark = adminRemark || '';
    target.updatedAt = new Date().toISOString();
    writeStore(store);
    return target;
  }
  function updateAppointmentStatus(id, status, adminRemark) {
    const store = readStore();
    const target = store.appointments.find((item) => item.id === id);
    if (!target) return null;
    target.status = status;
    target.adminRemark = adminRemark || '';
    target.updatedAt = new Date().toISOString();
    writeStore(store);
    return target;
  }
  function getAdminSnapshot() {
    const store = readStore();
    const usersById = Object.fromEntries(store.users.map((item) => [item.id, item]));
    return {
      registrations: store.registrations.map((item) => ({ ...item, nickname: usersById[item.userId]?.nickname || '未命名用户' })),
      appointments: store.appointments.map((item) => ({ ...item, nickname: usersById[item.userId]?.nickname || '未命名用户', realName: store.registrations.find((row) => row.userId === item.userId)?.realName || '未填写' })),
    };
  }
  function resetDemo() { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(SESSION_KEY); }

  window.DemoStore = { readStore, writeStore, getSession, setSession, clearSession, findCurrentUser, loginUser, upsertRegistration, getRegistrationByUser, listMyAppointments, createAppointment, updateRegistrationStatus, updateAppointmentStatus, getAdminSnapshot, resetDemo };
})();
