(function () {
  const registrationTable = document.getElementById('registration-table');
  const appointmentTable = document.getElementById('appointment-table');
  const pendingCount = document.getElementById('pending-count');
  const appointmentCount = document.getElementById('appointment-count');
  function toast(message) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }
  function statusClass(status) { if (status === 'approved') return 'success'; if (status === 'rejected') return 'danger'; if (status === 'pending') return 'warning'; return 'muted'; }
  function statusText(status) { if (status === 'approved') return '已通过'; if (status === 'rejected') return '已驳回'; if (status === 'pending') return '待审核'; return '未提交'; }
  function render() {
    const snapshot = DemoStore.getAdminSnapshot();
    pendingCount.textContent = `${snapshot.registrations.filter((item) => item.status === 'pending').length} 条待审核`;
    appointmentCount.textContent = `${snapshot.appointments.length} 条记录`;
    registrationTable.className = snapshot.registrations.length ? 'table-card' : 'table-card empty';
    registrationTable.innerHTML = snapshot.registrations.length ? snapshot.registrations.map((item) => `<div class="card-row"><div class="record-title"><span>${item.realName} · ${item.className}</span><span class="status-chip ${statusClass(item.status)}">${statusText(item.status)}</span></div><div class="meta-grid"><div class="meta-item"><span class="meta-label">登录昵称</span>${item.nickname}</div><div class="meta-item"><span class="meta-label">手机号</span>${item.phone}</div><div class="meta-item"><span class="meta-label">毕业届次</span>${item.graduationYear}</div><div class="meta-item"><span class="meta-label">当前高校</span>${item.currentUniversity}</div><div class="meta-item"><span class="meta-label">院系 / 专业</span>${item.currentCollege} / ${item.currentMajor}</div><div class="meta-item"><span class="meta-label">提交时间</span>${new Date(item.createdAt).toLocaleString('zh-CN')}</div><div class="meta-item full"><span class="meta-label">证件说明</span>${item.certificateNote}</div><div class="meta-item full"><span class="meta-label">审核备注</span>${item.adminRemark || '等待处理'}</div></div><div class="record-actions"><button class="small-btn approve" data-action="approve-registration" data-id="${item.id}">通过审核</button><button class="small-btn reject" data-action="reject-registration" data-id="${item.id}">驳回</button></div></div>`).join('') : '当前暂无注册申请。';
    appointmentTable.className = snapshot.appointments.length ? 'table-card' : 'table-card empty';
    appointmentTable.innerHTML = snapshot.appointments.length ? snapshot.appointments.map((item) => `<div class="card-row"><div class="record-title"><span>${item.realName} · ${item.visitDate}</span><span class="status-chip ${statusClass(item.status)}">${statusText(item.status)}</span></div><div class="meta-grid"><div class="meta-item"><span class="meta-label">用户昵称</span>${item.nickname}</div><div class="meta-item"><span class="meta-label">参访老师</span>${item.visitTeacher}</div><div class="meta-item"><span class="meta-label">同行人数</span>${item.companionCount}</div><div class="meta-item"><span class="meta-label">提交时间</span>${new Date(item.createdAt).toLocaleString('zh-CN')}</div><div class="meta-item full"><span class="meta-label">来校事由</span>${item.purpose}</div><div class="meta-item full"><span class="meta-label">审核备注</span>${item.adminRemark || '等待处理'}</div></div><div class="record-actions"><button class="small-btn approve" data-action="approve-appointment" data-id="${item.id}">通过预约</button><button class="small-btn reject" data-action="reject-appointment" data-id="${item.id}">驳回预约</button></div></div>`).join('') : '当前暂无入校预约。';
  }
  document.body.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const { action, id } = target.dataset;
    if (!action || !id) return;
    if (action === 'approve-registration') DemoStore.updateRegistrationStatus(Number(id), 'approved', '管理员审核通过，可继续预约入校');
    if (action === 'reject-registration') DemoStore.updateRegistrationStatus(Number(id), 'rejected', '资料不完整，请补充后重新提交');
    if (action === 'approve-appointment') DemoStore.updateAppointmentStatus(Number(id), 'approved', '预约通过，请按时到校');
    if (action === 'reject-appointment') DemoStore.updateAppointmentStatus(Number(id), 'rejected', '预约时间冲突，请重新选择');
    toast('操作已完成');
    render();
  });
  document.getElementById('refresh-admin').addEventListener('click', () => { render(); toast('已刷新审核数据'); });
  render();
})();
