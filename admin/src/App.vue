<script setup lang='ts'>
import { computed, onMounted, ref } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';

type MenuKey = 'dashboard' | 'alumni' | 'associations' | 'appointments' | 'activities' | 'articles' | 'interviews';
type DataMenuKey = Exclude<MenuKey, 'dashboard'>;

interface StatItem {
  label: string;
  value: string;
}

interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

interface RecordItem {
  id: number;
  title: string;
  subtitle: string;
  status?: string;
  menuKey: DataMenuKey;
}

interface AlumniApiItem {
  id: number;
  real_name: string;
  department?: string | null;
  grade?: string | null;
  verification_status?: string | null;
}

interface AssociationApiItem {
  id: number;
  name: string;
  city?: string | null;
  address?: string | null;
  member_count?: number | null;
}

interface AppointmentApiItem {
  id: number;
  visit_date: string;
  purpose?: string | null;
  status?: string | null;
}

interface ActivityApiItem {
  id: number;
  title: string;
  location?: string | null;
  status?: string | null;
}

interface ArticleApiItem {
  id: number;
  title: string;
  source?: string | null;
  summary?: string | null;
}

interface InterviewApiItem {
  id: number;
  title: string;
  alumnus_name: string;
  current_position?: string | null;
  is_published?: boolean;
}

const STORAGE_KEY_API_BASE_URL = 'alumni-admin-api-base-url';
const STORAGE_KEY_TOKEN = 'alumni-admin-token';

const activeMenu = ref<MenuKey>('dashboard');
const apiBaseUrl = ref(localStorage.getItem(STORAGE_KEY_API_BASE_URL) || '');
const token = ref(localStorage.getItem(STORAGE_KEY_TOKEN) || '');
const loading = ref(false);
const stats = ref<StatItem[]>([
  { label: '待审核校友', value: '0' },
  { label: '预约申请', value: '0' },
  { label: '活动总数', value: '0' },
  { label: '文章总数', value: '0' },
]);
const records = ref<Record<MenuKey, RecordItem[]>>({
  dashboard: [],
  alumni: [],
  associations: [],
  appointments: [],
  activities: [],
  articles: [],
  interviews: [],
});

const menuItems = [
  { key: 'dashboard', label: '数据看板' },
  { key: 'alumni', label: '校友审核' },
  { key: 'associations', label: '校友会管理' },
  { key: 'appointments', label: '返校预约' },
  { key: 'activities', label: '活动管理' },
  { key: 'articles', label: '文章管理' },
  { key: 'interviews', label: '校友风采' },
] as const;

const currentRecords = computed(() => records.value[activeMenu.value]);
const canUseLiveApi = computed(() => Boolean(normalizeBaseUrl(apiBaseUrl.value) && token.value.trim()));

function normalizeBaseUrl(url: string) {
  return url.trim().replace(/\/$/, '');
}

function getRequestHeaders() {
  return token.value.trim()
    ? {
        Authorization: `Bearer ${token.value.trim()}`,
      }
    : undefined;
}

function buildUrl(path: string) {
  const baseUrl = normalizeBaseUrl(apiBaseUrl.value);
  if (!baseUrl) {
    throw new Error('请先填写接口基础地址');
  }
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

async function apiGet<T>(path: string): Promise<T> {
  const response = await axios.get<{ data?: T } | T>(buildUrl(path), {
    headers: getRequestHeaders(),
  });
  const payload = response.data as { data?: T } | T;
  return (payload as { data?: T }).data ?? (payload as T);
}

async function apiPost<T>(path: string, data: Record<string, unknown>) {
  const response = await axios.post<{ data?: T } | T>(buildUrl(path), data, {
    headers: getRequestHeaders(),
  });
  const payload = response.data as { data?: T } | T;
  return (payload as { data?: T }).data ?? (payload as T);
}

async function apiPut<T>(path: string, data: Record<string, unknown>) {
  const response = await axios.put<{ data?: T } | T>(buildUrl(path), data, {
    headers: getRequestHeaders(),
  });
  const payload = response.data as { data?: T } | T;
  return (payload as { data?: T }).data ?? (payload as T);
}

function toStatusLabel(status?: string | null, published?: boolean) {
  if (typeof published === 'boolean') {
    return published ? '已发布' : '草稿';
  }
  if (!status) return '待审核';

  const normalized = status.toLowerCase();
  const labels: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    cancelled: '已取消',
    upcoming: '即将开始',
    ongoing: '进行中',
    ended: '已结束',
  };

  return labels[normalized] || `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
}

function mapAlumni(items: AlumniApiItem[]): RecordItem[] {
  return items.map((item) => ({
    id: item.id,
    title: item.real_name,
    subtitle: [item.department, item.grade].filter(Boolean).join(' - ') || '待审核资料',
    status: toStatusLabel(item.verification_status),
    menuKey: 'alumni',
  }));
}

function mapAssociations(items: AssociationApiItem[]): RecordItem[] {
  return items.map((item) => ({
    id: item.id,
    title: item.name,
    subtitle: `${item.city || '待补充城市'} - ${item.member_count || 0} 人`,
    status: '启用中',
    menuKey: 'associations',
  }));
}

function mapAppointments(items: AppointmentApiItem[]): RecordItem[] {
  return items.map((item) => ({
    id: item.id,
    title: item.visit_date,
    subtitle: item.purpose || '返校申请',
    status: toStatusLabel(item.status),
    menuKey: 'appointments',
  }));
}

function mapActivities(items: ActivityApiItem[]): RecordItem[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: item.location || '地点待补充',
    status: toStatusLabel(item.status),
    menuKey: 'activities',
  }));
}

function mapArticles(items: ArticleApiItem[]): RecordItem[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: item.summary || item.source || '官方文章',
    status: '已发布',
    menuKey: 'articles',
  }));
}

function mapInterviews(items: InterviewApiItem[]): RecordItem[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: `${item.alumnus_name} - ${item.current_position || '校友简介'}`,
    status: toStatusLabel(undefined, item.is_published),
    menuKey: 'interviews',
  }));
}

async function loadDashboard() {
  if (!canUseLiveApi.value) {
    stats.value = [
      { label: '待审核校友', value: String(records.value.alumni.length) },
      { label: '预约申请', value: String(records.value.appointments.length) },
      { label: '活动总数', value: String(records.value.activities.length) },
      { label: '文章总数', value: String(records.value.articles.length) },
    ];
    return;
  }

  loading.value = true;
  try {
    const [alumni, appointments, activities, articles] = await Promise.all([
      apiGet<PaginatedData<AlumniApiItem>>('/alumni/verifications?status=pending'),
      apiGet<PaginatedData<AppointmentApiItem>>('/appointments/admin?page=1&page_size=20'),
      apiGet<PaginatedData<ActivityApiItem>>('/activities?page=1&page_size=20'),
      apiGet<PaginatedData<ArticleApiItem>>('/articles?page=1&page_size=20'),
    ]);

    records.value.alumni = mapAlumni(alumni.items || []);
    records.value.appointments = mapAppointments(appointments.items || []);
    records.value.activities = mapActivities(activities.items || []);
    records.value.articles = mapArticles(articles.items || []);

    stats.value = [
      { label: '待审核校友', value: String(alumni.total || alumni.items.length) },
      { label: '预约申请', value: String(appointments.total || appointments.items.length) },
      { label: '活动总数', value: String(activities.total || activities.items.length) },
      { label: '文章总数', value: String(articles.total || articles.items.length) },
    ];
  } catch (error) {
    console.error('[Admin] dashboard load failed', error);
    ElMessage.error('实时数据加载失败，请检查接口地址和管理员令牌。');
  } finally {
    loading.value = false;
  }
}

async function loadMenuRecords(key: DataMenuKey) {
  if (!canUseLiveApi.value) {
    return;
  }

  loading.value = true;
  try {
    if (key === 'alumni') {
      const data = await apiGet<PaginatedData<AlumniApiItem>>('/alumni/verifications?page=1&page_size=20');
      records.value.alumni = mapAlumni(data.items || []);
    } else if (key === 'associations') {
      const data = await apiGet<PaginatedData<AssociationApiItem>>('/associations?page=1&page_size=20');
      records.value.associations = mapAssociations(data.items || []);
    } else if (key === 'appointments') {
      const data = await apiGet<PaginatedData<AppointmentApiItem>>('/appointments/admin?page=1&page_size=20');
      records.value.appointments = mapAppointments(data.items || []);
    } else if (key === 'activities') {
      const data = await apiGet<PaginatedData<ActivityApiItem>>('/activities?page=1&page_size=20');
      records.value.activities = mapActivities(data.items || []);
    } else if (key === 'articles') {
      const data = await apiGet<PaginatedData<ArticleApiItem>>('/articles?page=1&page_size=20');
      records.value.articles = mapArticles(data.items || []);
    } else if (key === 'interviews') {
      const data = await apiGet<PaginatedData<InterviewApiItem>>('/interviews/?page=1&page_size=20');
      records.value.interviews = mapInterviews(data.items || []);
    }
  } catch (error) {
    console.error(`[Admin] ${key} load failed`, error);
    ElMessage.error(`加载 ${key} 数据失败。`);
  } finally {
    loading.value = false;
  }
}

async function refreshCurrentView() {
  if (activeMenu.value === 'dashboard') {
    await loadDashboard();
    return;
  }

  await loadMenuRecords(activeMenu.value);
}

async function applyConnectionSettings() {
  localStorage.setItem(STORAGE_KEY_API_BASE_URL, normalizeBaseUrl(apiBaseUrl.value));
  localStorage.setItem(STORAGE_KEY_TOKEN, token.value.trim());

  if (!canUseLiveApi.value) {
    ElMessage.warning('请同时填写接口地址和管理员令牌后再连接。');
    return;
  }

  await loadDashboard();
  await refreshCurrentView();
  ElMessage.success('后台接口连接已更新。');
}

async function handleAction(action: string, row: RecordItem) {
  if (!canUseLiveApi.value) {
    ElMessage.warning('请先连接后台接口。');
    return;
  }

  try {
    if (row.menuKey === 'alumni' && action !== '查看') {
      await apiPost(`/alumni/verify/${row.id}`, {
        action: action === '通过' ? 'approve' : 'reject',
        remark: action === '通过' ? '后台审核通过' : '后台审核拒绝',
      });
      ElMessage.success('校友审核状态已更新。');
    } else if (row.menuKey === 'appointments' && action !== '查看') {
      if (action === '通过') {
        await apiPut(`/appointments/${row.id}/approve`, {
          remark: '后台审批通过',
          qr_code_expire_days: 1,
        });
      } else {
        await apiPut(`/appointments/${row.id}/reject`, {
          reason: '后台审批拒绝',
        });
      }
      ElMessage.success('预约状态已更新。');
    } else {
      ElMessage.info(`${row.title} 当前在演示版中仅支持查看。`);
      return;
    }

    await loadDashboard();
    await loadMenuRecords(row.menuKey);
  } catch (error) {
    console.error('[Admin] action failed', error);
    ElMessage.error('操作失败，请检查权限或当前记录状态。');
  }
}

function handleMenuSelect(key: string) {
  activeMenu.value = key as MenuKey;
  void refreshCurrentView();
}

onMounted(() => {
  void loadDashboard();
});
</script>

<template>
  <el-container class='layout'>
    <el-aside width='220px' class='aside'>
      <div class='brand'>sx校友卡后台</div>
      <el-menu :default-active='activeMenu' class='menu' @select='handleMenuSelect'>
        <el-menu-item v-for='item in menuItems' :key='item.key' :index='item.key'>
          {{ item.label }}
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class='header'>
        <div>
          <h2 class='headerTitle'>sx校友卡管理看板</h2>
          <p class='headerDesc'>填写已部署接口地址和管理员令牌后，即可加载实时数据并处理审核请求。</p>
        </div>
        <div class='headerTools'>
          <el-input v-model='apiBaseUrl' placeholder='接口基础地址' class='input' />
          <el-input v-model='token' placeholder='管理员令牌' class='input' show-password />
          <el-button type='primary' @click='applyConnectionSettings'>连接接口</el-button>
        </div>
      </el-header>

      <el-main class='main'>
        <template v-if="activeMenu === 'dashboard'">
          <el-row :gutter='16'>
            <el-col v-for='item in stats' :key='item.label' :span='6'>
              <el-card shadow='hover' class='statCard'>
                <div class='statValue'>{{ item.value }}</div>
                <div class='statLabel'>{{ item.label }}</div>
              </el-card>
            </el-col>
          </el-row>
          <el-card class='tableCard'>
            <template #header>演示说明</template>
            <p>当前后台已支持通过可配置接口地址与管理员令牌读取受保护数据。</p>
            <p>校友审核与返校预约审批流程已完成端到端打通，适合课程演示。</p>
          </el-card>
        </template>

        <el-card v-else class='tableCard' shadow='never'>
          <template #header>
            <div class='cardHeader'>
              <span>{{ menuItems.find((item) => item.key === activeMenu)?.label }}</span>
              <el-button type='primary' @click='refreshCurrentView'>刷新数据</el-button>
            </div>
          </template>

          <el-table :data='currentRecords' v-loading='loading'>
            <el-table-column prop='id' label='编号' width='80' />
            <el-table-column prop='title' label='标题' min-width='260' />
            <el-table-column prop='subtitle' label='摘要' min-width='280' />
            <el-table-column prop='status' label='状态' width='120'>
              <template #default='scope'>
                <el-tag>{{ scope.row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label='操作' width='220'>
              <template #default='scope'>
                <el-button link type='primary' @click="handleAction('查看', scope.row)">查看</el-button>
                <el-button link type='success' @click="handleAction('通过', scope.row)">通过</el-button>
                <el-button link type='danger' @click="handleAction('拒绝', scope.row)">拒绝</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout { min-height: 100vh; }
.aside { background: linear-gradient(180deg, #16315f 0%, #0f1f3a 100%); color: #fff; }
.brand { padding: 24px 20px; font-size: 20px; font-weight: 700; }
.menu { border-right: none; }
.header { display: flex; align-items: center; justify-content: space-between; height: auto; padding: 24px 28px 12px; background: transparent; }
.headerTitle { margin: 0; }
.headerDesc { margin: 6px 0 0; color: #64748b; }
.headerTools { display: flex; gap: 12px; }
.input { width: 260px; }
.main { padding: 12px 28px 28px; }
.statCard { border-radius: 18px; }
.statValue { font-size: 30px; font-weight: 700; color: #0f6fff; }
.statLabel { margin-top: 6px; color: #64748b; }
.tableCard { margin-top: 20px; border-radius: 18px; }
.cardHeader { display: flex; justify-content: space-between; align-items: center; }
</style>
