(function () {
  const $ = (id) => document.getElementById(id);
  const loginPhone = $('login-phone');
  const loginNickname = $('login-nickname');
  const loginStatus = $('login-status');
  const verifyStatus = $('verify-status');
  const appointmentStatus = $('appointment-status');
  const profileSummary = $('profile-summary');
  const appointmentList = $('appointment-list');

  function toast(message) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }
  function statusClass(status) {
    if (status === 'approved') return 'success';
    if (status === 'rejected') return 'danger';
    if (status === 'pending') return 'warning';
    return 'muted';
  }
  function statusText(status) {
    if (status === 'approved') return '已通过';
    if (status === 'rejected') return '已驳回';
    if (status === 'pending') return '待审核';
    return '未提交';
  }
  function renderProfile() {
    const user = DemoStore.findCurrentUser();
    const registration = user ? DemoStore.getRegistrationByUser(user.id) : null;
    const appointments = DemoStore.listMyAppointments();
    loginStatus.className = `status-chip ${user ? 'success' : 'muted'}`;
    loginStatus.textContent = user ? `已登录：${user.nickname}` : '未登录';
    verifyStatus.className = `status-chip ${statusClass(registration?.status)}`;
    verifyStatus.textContent = statusText(registration?.status);
    appointmentStatus.className = `status-chip ${appointments[0] ? statusClass(appointments[0].status) : 'muted'}`;
    appointmentStatus.textContent = appointments[0] ? `最近预约：${statusText(appointments[0].status)}` : '未提交';
    if (!user) {
      profileSummary.className = 'summary-card empty';
      profileSummary.textContent = '登录后，这里会显示当前注册与审核状态。';
    } else if (!registration) {
      profileSummary.className = 'summary-card empty';
      profileSummary.textContent = '当前账号尚未提交注册审核，请填写资料后提交。';
    } else {
      profileSummary.className = 'summary-card';
      profileSummary.innerHTML = `<div class="record-title"><span>${registration.realName} · ${registration.className}</span><span class="status-chip ${statusClass(registration.status)}">${statusText(registration.status)}</span></div><div class="meta-grid"><div class="meta-item"><span class="meta-label">手机号</span>${registration.phone}</div><div class="meta-item"><span class="meta-label">毕业届次</span>${registration.graduationYear}</div><div class="meta-item"><span class="meta-label">当前高校</span>${registration.currentUniversity}</div><div class="meta-item"><span class="meta-label">当前院系 / 专业</span>${registration.currentCollege} / ${registration.currentMajor}</div><div class="meta-item full"><span class="meta-label">证件材料</span>${registration.certificateNote}</div><div class="meta-item full"><span class="meta-label">审核备注</span>${registration.adminRemark || '等待管理员处理'}</div></div>`;
    }
    if (!appointments.length) {
      appointmentList.className = 'list-card empty';
      appointmentList.textContent = '审核通过后即可提交预约，预约记录会显示在这里。';
      return;
    }
    appointmentList.className = 'list-card';
    appointmentList.innerHTML = appointments.map((item) => `<div class="card-row"><div class="record-title"><span>${item.visitDate} · ${item.visitTeacher}</span><span class="status-chip ${statusClass(item.status)}">${statusText(item.status)}</span></div><div class="meta-grid"><div class="meta-item"><span class="meta-label">同行人数</span>${item.companionCount}</div><div class="meta-item"><span class="meta-label">提交时间</span>${new Date(item.createdAt).toLocaleString('zh-CN')}</div><div class="meta-item full"><span class="meta-label">来校事由</span>${item.purpose}</div><div class="meta-item full"><span class="meta-label">审核备注</span>${item.adminRemark || '等待后台审核'}</div></div></div>`).join('');
  }
  function fillProfileFromUser() { const user = DemoStore.findCurrentUser(); if (user) $('register-phone').value = user.phone || ''; }

  $('login-btn').addEventListener('click', () => {
    const phone = loginPhone.value.trim();
    const nickname = loginNickname.value.trim() || '微信演示用户';
    if (!phone) return toast('请先输入手机号再登录');
    DemoStore.loginUser(phone, nickname);
    fillProfileFromUser();
    renderProfile();
    toast('模拟微信登录成功');
  });
  $('logout-btn').addEventListener('click', () => { DemoStore.clearSession(); renderProfile(); toast('已退出当前账号'); });
  $('fill-demo-profile').addEventListener('click', () => {
    $('real-name').value = '张晓岚';
    $('register-phone').value = loginPhone.value.trim() || '13800000000';
    $('class-name').value = '高三(2)班';
    $('graduation-year').value = '2024';
    $('current-university').value = '华南师范大学';
    $('current-college').value = '教育信息技术学院';
    $('current-major').value = '教育技术学';
    $('certificate-note').value = '已上传学生证照片（演示文本）';
    toast('已填入演示资料');
  });
  $('submit-registration').addEventListener('click', () => {
    const user = DemoStore.findCurrentUser();
    if (!user) return toast('请先模拟微信登录');
    const payload = {
      realName: $('real-name').value.trim(), phone: $('register-phone').value.trim(), className: $('class-name').value.trim(), graduationYear: $('graduation-year').value.trim(), currentUniversity: $('current-university').value.trim(), currentCollege: $('current-college').value.trim(), currentMajor: $('current-major').value.trim(), certificateNote: $('certificate-note').value.trim(),
    };
    if (!Object.values(payload).every(Boolean)) return toast('请完整填写注册资料');
    DemoStore.upsertRegistration(payload);
    renderProfile();
    toast('注册信息已提交，后台现在可以审核');
  });
  $('fill-demo-appointment').addEventListener('click', () => {
    $('visit-teacher').value = '陈老师';
    $('visit-date').value = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    $('companion-count').value = '1';
    $('visit-purpose').value = '返校看望老师并分享大学生活';
    toast('已填入演示预约');
  });
  $('submit-appointment').addEventListener('click', () => {
    try {
      DemoStore.createAppointment({ visitTeacher: $('visit-teacher').value.trim(), visitDate: $('visit-date').value, companionCount: Number($('companion-count').value || '0'), purpose: $('visit-purpose').value.trim() });
      renderProfile();
      toast('入校预约已提交，后台可查看');
    } catch (error) {
      toast(error.message || '提交失败');
    }
  });
  $('reset-demo').addEventListener('click', () => { DemoStore.resetDemo(); location.reload(); });
  fillProfileFromUser();
  renderProfile();
})();
