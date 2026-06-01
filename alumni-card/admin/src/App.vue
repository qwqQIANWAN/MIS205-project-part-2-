<script setup lang='ts'>
import { computed, onMounted, reactive, ref } from 'vue';
import axios from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';

type MenuKey =
  | 'dashboard'
  | 'alumni'
  | 'teachers'
  | 'appointments'
  | 'associations'
  | 'activities'
  | 'articles'
  | 'interviews';
type DataMenuKey = Exclude<MenuKey, 'dashboard'>;

interface StatItem {
  label: string;
  value: string;
  hint: string;
}

interface ColumnDef {
  prop: string;
  label: string;
  width?: string | number;
  minWidth?: string | number;
}

interface DetailField {
  label: string;
  value: string;
}

interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

interface AlumniApiItem {
  id: number;
  user_id: number;
  real_name: string;
  student_id?: string | null;
  class_name?: string | null;
  graduation_year?: string | null;
  current_university?: string | null;
  current_college?: string | null;
  current_major?: string | null;
  verification_status?: string | null;
  verification_remark?: string | null;
  certificate_image?: string | null;
  verified_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  nickname?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  id_number?: string | null;
}

interface TeacherApiItem {
  id: number;
  user_id?: number | null;
  name: string;
  phone: string;
  subject?: string | null;
  title?: string | null;
  is_active: boolean;
  pending_count?: number;
  created_at?: string | null;
}

interface AppointmentApiItem {
  id: number;
  user_id: number;
  real_name?: string | null;
  visit_date: string;
  companion_count: number;
  purpose?: string | null;
  status?: string | null;
  teacher_id?: number | null;
  teacher_name?: string | null;
  teacher_title?: string | null;
  teacher_comment?: string | null;
  teacher_reviewed_at?: string | null;
  reject_reason?: string | null;
  qr_code?: string | null;
  qr_code_expire_at?: string | null;
  remark?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  nickname?: string | null;
  avatar_url?: string | null;
  companions?: Array<{
    id: number;
    name: string;
    relation?: string | null;
    phone?: string | null;
    id_number?: string | null;
  }>;
}

interface AssociationApiItem {
  id: number;
  name: string;
  city?: string | null;
  address?: string | null;
  member_count?: number | null;
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

const menuItems = [
  { key: 'dashboard', label: '数据看板' },
  { key: 'alumni', label: '校友审核' },
  { key: 'teachers', label: '老师管理' },
  { key: 'appointments', label: '返校预约' },
  { key: 'associations', label: '校友会管理' },
  { key: 'activities', label: '活动管理' },
  { key: 'articles', label: '文章管理' },
  { key: 'interviews', label: '校友风采' },
] as const;

const demoAlumni: AlumniApiItem[] = [
  {
    id: 101,
    user_id: 31,
    real_name: '张晓岚',
    class_name: '高三(2)班',
    graduation_year: '2020',
    current_university: '华南师范大学',
    current_college: '教育信息技术学院',
    current_major: '教育技术学',
    phone: '13800000000',
    verification_status: 'pending',
    verification_remark: '等待管理员审核证件',
    certificate_image: 'https://picsum.photos/id/338/900/600',
    created_at: '2026-05-31T09:00:00',
  },
  {
    id: 102,
    user_id: 32,
    real_name: '李思远',
    class_name: '高三(5)班',
    graduation_year: '2019',
    current_university: '中山大学',
    current_college: '计算机学院',
    current_major: '软件工程',
    phone: '13900000001',
    verification_status: 'approved',
    verification_remark: '资料完整，已通过',
    created_at: '2026-05-28T14:30:00',
  },
];

const demoTeachers: TeacherApiItem[] = [
  {
    id: 1,
    user_id: 12,
    name: '陈老师',
    phone: '13600000000',
    subject: '语文',
    title: '高三年级主任',
    is_active: true,
    pending_count: 2,
    created_at: '2026-05-25T08:00:00',
  },
  {
    id: 2,
    user_id: null,
    name: '王老师',
    phone: '13700000000',
    subject: '数学',
    title: '班主任',
    is_active: true,
    pending_count: 1,
    created_at: '2026-05-26T08:00:00',
  },
];

const demoAppointments: AppointmentApiItem[] = [
  {
    id: 501,
    user_id: 31,
    real_name: '张晓岚',
    visit_date: '2026-06-08',
    companion_count: 1,
    purpose: '回校看望老师并参加校友分享',
    status: 'pending',
    teacher_id: 1,
    teacher_name: '陈老师',
    teacher_title: '高三年级主任',
    created_at: '2026-05-31T10:10:00',
    companions: [{ id: 1, name: '张同学', relation: '同班同学', phone: '13800000002' }],
  },
  {
    id: 502,
    user_id: 32,
    real_name: '李思远',
    visit_date: '2026-06-12',
    companion_count: 0,
    purpose: '返校参加毕业班经验交流',
    status: 'approved',
    teacher_id: 2,
    teacher_name: '王老师',
    teacher_title: '班主任',
    teacher_comment: '王老师审批通过',
    qr_code_expire_at: '2026-06-13T08:00:00',
    created_at: '2026-05-29T15:00:00',
  },
];

const demoAssociations: AssociationApiItem[] = [
  { id: 1, name: '广州校友会', city: '广州', address: '天河区校友活动中心', member_count: 68 },
];

const demoActivities: ActivityApiItem[] = [
  { id: 1, title: '高中校友返校日', location: '学校报告厅', status: 'upcoming' },
];

const demoArticles: ArticleApiItem[] = [
  { id: 1, title: 'sx校友卡系统上线通知', source: '校友办', summary: '支持注册、认证、返校预约与老师审批。' },
];

const demoInterviews: InterviewApiItem[] = [
  { id: 1, title: '优秀校友专访', alumnus_name: '张晓岚', current_position: '教育科技产品经理', is_published: true },
];

const activeMenu = ref<MenuKey>('dashboard');
const apiBaseUrl = ref(localStorage.getItem(STORAGE_KEY_API_BASE_URL) || '');
const token = ref(localStorage.getItem(STORAGE_KEY_TOKEN) || '');
const loading = ref(false);
const teacherSaving = ref(false);
const detailVisible = ref(false);
const detailTitle = ref('');
const detailFields = ref<DetailField[]>([]);
const detailImage = ref('');
const detailRawTitle = ref('');

const stats = ref<StatItem[]>([]);
const alumniRows = ref<AlumniApiItem[]>([]);
const teacherRows = ref<TeacherApiItem[]>([]);
const appointmentRows = ref<AppointmentApiItem[]>([]);
const associationRows = ref<AssociationApiItem[]>([]);
const activityRows = ref<ActivityApiItem[]>([]);
const articleRows = ref<ArticleApiItem[]>([]);
const interviewRows = ref<InterviewApiItem[]>([]);

const teacherForm = reactive({
  name: '',
  phone: '',
  subject: '',
  title: '',
});

const canUseLiveApi = computed(() => Boolean(normalizeBaseUrl(apiBaseUrl.value) && token.value.trim()));
const currentMenuLabel = computed(() => menuItems.find((item) => item.key === activeMenu.value)?.label || '数据列表');
const showCreateTeacher = computed(() => activeMenu.value === 'teachers');

const currentRows = computed(() => {
  switch (activeMenu.value) {
    case 'alumni':
      return alumniRows.value;
    case 'teachers':
      return teacherRows.value;
    case 'appointments':
      return appointmentRows.value;
    case 'associations':
      return associationRows.value;
    case 'activities':
      return activityRows.value;
    case 'articles':
      return articleRows.value;
    case 'interviews':
      return interviewRows.value;
    default:
      return [];
  }
});

const currentColumns = computed<ColumnDef[]>(() => {
  switch (activeMenu.value) {
    case 'alumni':
      return [
        { prop: 'id', label: '编号', width: 80 },
        { prop: 'real_name', label: '姓名', width: 120 },
        { prop: 'class_name', label: '高中班级', minWidth: 140 },
        { prop: 'graduation_year', label: '毕业届次', width: 110 },
        { prop: 'current_university', label: '当前高校', minWidth: 180 },
        { prop: 'current_college', label: '当前院系', minWidth: 160 },
        { prop: 'current_major', label: '当前专业', minWidth: 150 },
        { prop: 'phone', label: '电话', minWidth: 140 },
        { prop: 'verification_status', label: '审核状态', width: 120 },
      ];
    case 'teachers':
      return [
        { prop: 'id', label: '编号', width: 80 },
        { prop: 'name', label: '老师姓名', width: 120 },
        { prop: 'subject', label: '学科', width: 120 },
        { prop: 'title', label: '职务', minWidth: 160 },
        { prop: 'phone', label: '电话', minWidth: 140 },
        { prop: 'pending_count', label: '待审批预约', width: 120 },
        { prop: 'user_id', label: '绑定账号', width: 100 },
        { prop: 'is_active', label: '状态', width: 100 },
      ];
    case 'appointments':
      return [
        { prop: 'id', label: '编号', width: 80 },
        { prop: 'real_name', label: '申请人', width: 120 },
        { prop: 'visit_date', label: '到校日期', width: 120 },
        { prop: 'teacher_name', label: '参访老师', width: 120 },
        { prop: 'teacher_title', label: '老师职务', minWidth: 140 },
        { prop: 'purpose', label: '来访事由', minWidth: 220 },
        { prop: 'teacher_comment', label: '审批意见', minWidth: 160 },
        { prop: 'status', label: '状态', width: 120 },
      ];
    case 'associations':
      return [
        { prop: 'id', label: '编号', width: 80 },
        { prop: 'name', label: '名称', minWidth: 180 },
        { prop: 'city', label: '城市', width: 120 },
        { prop: 'address', label: '地址', minWidth: 220 },
        { prop: 'member_count', label: '成员数', width: 100 },
      ];
    case 'activities':
      return [
        { prop: 'id', label: '编号', width: 80 },
        { prop: 'title', label: '活动标题', minWidth: 220 },
        { prop: 'location', label: '地点', minWidth: 180 },
        { prop: 'status', label: '状态', width: 120 },
      ];
    case 'articles':
      return [
        { prop: 'id', label: '编号', width: 80 },
        { prop: 'title', label: '文章标题', minWidth: 220 },
        { prop: 'source', label: '来源', minWidth: 140 },
        { prop: 'summary', label: '摘要', minWidth: 280 },
      ];
    case 'interviews':
      return [
        { prop: 'id', label: '编号', width: 80 },
        { prop: 'title', label: '标题', minWidth: 220 },
        { prop: 'alumnus_name', label: '校友姓名', width: 120 },
        { prop: 'current_position', label: '当前职务', minWidth: 180 },
        { prop: 'is_published', label: '发布状态', width: 120 },
      ];
    default:
      return [];
  }
});

const currentActions = computed(() => {
  if (activeMenu.value === 'alumni' || activeMenu.value === 'appointments') {
    return ['查看', '通过', '拒绝'];
  }
  return ['查看'];
});

function normalizeBaseUrl(url: string) {
  return url.trim().replace(/\/$/, '');
}

function getAssetBaseUrl() {
  const baseUrl = normalizeBaseUrl(apiBaseUrl.value);
  if (!baseUrl) {
    return '';
  }

  try {
    const url = new URL(baseUrl);
    return url.origin;
  } catch {
    return baseUrl.replace(/\/api\/v\d+$/, '');
  }
}

function resolveAssetUrl(path?: string | null) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const assetBaseUrl = getAssetBaseUrl();
  if (!assetBaseUrl) return path;
  return `${assetBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
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
  if (!status) return '待处理';

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
  return labels[normalized] || status;
}

function getStatusType(status?: string | null, published?: boolean) {
  const label = toStatusLabel(status, published);
  if (label === '已通过' || label === '已发布' || label === '进行中') return 'success';
  if (label === '待审核' || label === '即将开始' || label === '待处理') return 'warning';
  if (label === '已拒绝' || label === '已取消') return 'danger';
  return 'info';
}

function formatDateTime(value?: string | null) {
  if (!value) return '未填写';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', { hour12: false });
}

function formatCell(prop: string, value: unknown) {
  if (prop === 'verification_status' || prop === 'status') {
    return toStatusLabel(String(value || ''));
  }
  if (prop === 'is_published') {
    return toStatusLabel(undefined, Boolean(value));
  }
  if (prop === 'is_active') {
    return value ? '启用' : '停用';
  }
  if (prop.includes('date') || prop.includes('created_at') || prop.includes('updated_at') || prop.includes('reviewed_at')) {
    return formatDateTime(typeof value === 'string' ? value : value ? String(value) : null);
  }
  if (value === null || value === undefined || value === '') {
    return '未填写';
  }
  if (prop === 'user_id') {
    return value ? `已绑定 #${value}` : '未绑定';
  }
  return String(value);
}

function loadDemoData() {
  alumniRows.value = demoAlumni;
  teacherRows.value = demoTeachers;
  appointmentRows.value = demoAppointments;
  associationRows.value = demoAssociations;
  activityRows.value = demoActivities;
  articleRows.value = demoArticles;
  interviewRows.value = demoInterviews;
  stats.value = [
    { label: '待审核校友', value: '1', hint: '注册后待管理员人工审核' },
    { label: '老师档案', value: String(demoTeachers.length), hint: '支持老师绑定小程序账号' },
    { label: '待处理预约', value: '1', hint: '按参访老师自动分配审批' },
    { label: '已发布内容', value: '2', hint: '活动与文章可继续扩展' },
  ];
}

async function loadDashboard() {
  if (!canUseLiveApi.value) {
    loadDemoData();
    return;
  }

  loading.value = true;
  try {
    const [alumni, teachers, appointments, activities, articles] = await Promise.all([
      apiGet<PaginatedData<AlumniApiItem>>('/alumni/verifications?status=pending&page=1&page_size=20'),
      apiGet<TeacherApiItem[]>('/teachers'),
      apiGet<PaginatedData<AppointmentApiItem>>('/appointments/admin?page=1&page_size=20&status=pending'),
      apiGet<PaginatedData<ActivityApiItem>>('/activities?page=1&page_size=20'),
      apiGet<PaginatedData<ArticleApiItem>>('/articles?page=1&page_size=20'),
    ]);

    alumniRows.value = alumni.items || [];
    teacherRows.value = teachers || [];
    appointmentRows.value = appointments.items || [];
    activityRows.value = activities.items || [];
    articleRows.value = articles.items || [];

    stats.value = [
      { label: '待审核校友', value: String(alumni.total || alumni.items.length), hint: '等待管理员审核证件资料' },
      { label: '老师档案', value: String(teachers.length), hint: '可供校友预约时直接选择' },
      { label: '待处理预约', value: String(appointments.total || appointments.items.length), hint: '会按参访老师分配审批' },
      { label: '已发布内容', value: String((activities.total || activities.items.length) + (articles.total || articles.items.length)), hint: '活动与文章总量' },
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
    loadDemoData();
    return;
  }

  loading.value = true;
  try {
    if (key === 'alumni') {
      const data = await apiGet<PaginatedData<AlumniApiItem>>('/alumni/verifications?page=1&page_size=20');
      alumniRows.value = data.items || [];
    } else if (key === 'teachers') {
      teacherRows.value = await apiGet<TeacherApiItem[]>('/teachers');
    } else if (key === 'appointments') {
      const data = await apiGet<PaginatedData<AppointmentApiItem>>('/appointments/admin?page=1&page_size=20');
      appointmentRows.value = data.items || [];
    } else if (key === 'associations') {
      const data = await apiGet<PaginatedData<AssociationApiItem>>('/associations?page=1&page_size=20');
      associationRows.value = data.items || [];
    } else if (key === 'activities') {
      const data = await apiGet<PaginatedData<ActivityApiItem>>('/activities?page=1&page_size=20');
      activityRows.value = data.items || [];
    } else if (key === 'articles') {
      const data = await apiGet<PaginatedData<ArticleApiItem>>('/articles?page=1&page_size=20');
      articleRows.value = data.items || [];
    } else if (key === 'interviews') {
      const data = await apiGet<PaginatedData<InterviewApiItem>>('/interviews/?page=1&page_size=20');
      interviewRows.value = data.items || [];
    }
  } catch (error) {
    console.error(`[Admin] ${key} load failed`, error);
    ElMessage.error(`加载${currentMenuLabel.value}失败。`);
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
    loadDemoData();
    ElMessage.warning('未填写接口或令牌，当前展示本地演示数据。');
    return;
  }

  await loadDashboard();
  if (activeMenu.value !== 'dashboard') {
    await loadMenuRecords(activeMenu.value);
  }
  ElMessage.success('后台接口连接已更新。');
}

function resetTeacherForm() {
  teacherForm.name = '';
  teacherForm.phone = '';
  teacherForm.subject = '';
  teacherForm.title = '';
}

async function createTeacher() {
  if (!canUseLiveApi.value) {
    ElMessage.warning('请先连接后台接口后再创建老师档案。');
    return;
  }
  if (!teacherForm.name.trim() || !teacherForm.phone.trim()) {
    ElMessage.warning('请填写老师姓名和电话。');
    return;
  }

  teacherSaving.value = true;
  try {
    await apiPost('/teachers', {
      name: teacherForm.name.trim(),
      phone: teacherForm.phone.trim(),
      subject: teacherForm.subject.trim() || undefined,
      title: teacherForm.title.trim() || undefined,
    });
    ElMessage.success('老师档案创建成功。');
    resetTeacherForm();
    await loadDashboard();
    await loadMenuRecords('teachers');
  } catch (error) {
    console.error('[Admin] create teacher failed', error);
    ElMessage.error('老师档案创建失败。');
  } finally {
    teacherSaving.value = false;
  }
}

function buildGenericFields(source: Record<string, unknown>) {
  return Object.entries(source)
    .filter(([key]) => key !== 'id')
    .map(([key, value]) => ({
      label: key,
      value: formatCell(key, value),
    }));
}

function showDetails(title: string, fields: DetailField[], image?: string | null, rawTitle?: string) {
  detailTitle.value = title;
  detailFields.value = fields;
  detailImage.value = resolveAssetUrl(image);
  detailRawTitle.value = rawTitle || '';
  detailVisible.value = true;
}

async function handleView(row: Record<string, unknown>) {
  if (!canUseLiveApi.value) {
    const rawTitle =
      typeof row.real_name === 'string'
        ? row.real_name
        : typeof row.name === 'string'
          ? row.name
          : typeof row.title === 'string'
            ? row.title
            : `记录 #${row.id}`;
    showDetails(currentMenuLabel.value, buildGenericFields(row), (row.certificate_image as string | null) || '', rawTitle);
    return;
  }

  try {
    if (activeMenu.value === 'alumni') {
      const detail = await apiGet<AlumniApiItem>(`/alumni/${row.id}`);
      showDetails(
        '校友审核详情',
        [
          { label: '姓名', value: detail.real_name },
          { label: '联系电话', value: formatCell('phone', detail.phone) },
          { label: '学号/编号', value: formatCell('student_id', detail.student_id) },
          { label: '毕业届次', value: formatCell('graduation_year', detail.graduation_year) },
          { label: '高中班级', value: formatCell('class_name', detail.class_name) },
          { label: '当前高校', value: formatCell('current_university', detail.current_university) },
          { label: '当前院系', value: formatCell('current_college', detail.current_college) },
          { label: '当前专业', value: formatCell('current_major', detail.current_major) },
          { label: '审核状态', value: toStatusLabel(detail.verification_status) },
          { label: '审核备注', value: formatCell('verification_remark', detail.verification_remark) },
          { label: '提交时间', value: formatCell('created_at', detail.created_at) },
        ],
        detail.certificate_image,
        detail.real_name,
      );
      return;
    }

    if (activeMenu.value === 'appointments') {
      const detail = await apiGet<AppointmentApiItem>(`/appointments/${row.id}`);
      const companions = (detail.companions || [])
        .map((item) => [item.name, item.relation, item.phone].filter(Boolean).join(' / '))
        .join('\n');
      showDetails(
        '返校预约详情',
        [
          { label: '申请人', value: formatCell('real_name', detail.real_name) },
          { label: '到校日期', value: formatCell('visit_date', detail.visit_date) },
          { label: '参访老师', value: [detail.teacher_name, detail.teacher_title].filter(Boolean).join(' / ') || '未填写' },
          { label: '来访事由', value: formatCell('purpose', detail.purpose) },
          { label: '当前状态', value: toStatusLabel(detail.status) },
          { label: '老师意见', value: formatCell('teacher_comment', detail.teacher_comment) },
          { label: '拒绝原因', value: formatCell('reject_reason', detail.reject_reason) },
          { label: '二维码到期', value: formatCell('qr_code_expire_at', detail.qr_code_expire_at) },
          { label: '同行人员', value: companions || '无同行人' },
          { label: '提交时间', value: formatCell('created_at', detail.created_at) },
        ],
        detail.qr_code,
        `预约 #${detail.id}`,
      );
      return;
    }

    showDetails(currentMenuLabel.value, buildGenericFields(row), '', String(row.id));
  } catch (error) {
    console.error('[Admin] load detail failed', error);
    ElMessage.error('详情加载失败。');
  }
}

async function collectActionRemark(action: 'approve' | 'reject', kind: 'alumni' | 'appointment') {
  const isReject = action === 'reject';
  const title = kind === 'alumni' ? '校友审核' : '预约审批';
  const placeholder = isReject ? '请输入拒绝原因' : '请输入审批备注';
  const defaultValue =
    kind === 'alumni'
      ? isReject
        ? '资料不完整，请重新提交'
        : '资料齐全，审核通过'
      : isReject
        ? '本次返校申请未通过'
        : '审批通过，请按时到校';

  try {
    const { value } = await ElMessageBox.prompt(placeholder, title, {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      inputValue: defaultValue,
      inputValidator: (inputValue) => {
        if (isReject && !inputValue.trim()) {
          return '拒绝时必须填写原因';
        }
        return true;
      },
    });
    return value.trim();
  } catch {
    return null;
  }
}

async function handleAction(action: string, row: Record<string, unknown>) {
  if (action === '查看') {
    await handleView(row);
    return;
  }

  if (!canUseLiveApi.value) {
    ElMessage.warning('演示模式下仅支持查看，连接接口后可执行审批。');
    return;
  }

  loading.value = true;
  try {
    if (activeMenu.value === 'alumni') {
      const remark = await collectActionRemark(action === '通过' ? 'approve' : 'reject', 'alumni');
      if (remark === null) return;
      await apiPost(`/alumni/verify/${row.id}`, {
        action: action === '通过' ? 'approve' : 'reject',
        remark,
      });
      ElMessage.success('校友审核状态已更新。');
    } else if (activeMenu.value === 'appointments') {
      const remark = await collectActionRemark(action === '通过' ? 'approve' : 'reject', 'appointment');
      if (remark === null) return;
      if (action === '通过') {
        await apiPut(`/appointments/${row.id}/approve`, {
          remark,
          qr_code_expire_days: 1,
        });
      } else {
        await apiPut(`/appointments/${row.id}/reject`, {
          reason: remark,
        });
      }
      ElMessage.success('预约审批状态已更新。');
    } else {
      ElMessage.info('当前模块仅支持查看。');
      return;
    }

    await loadDashboard();
    if (activeMenu.value !== 'dashboard') {
      await loadMenuRecords(activeMenu.value);
    }
  } catch (error) {
    console.error('[Admin] action failed', error);
    ElMessage.error('操作失败，请检查权限或当前记录状态。');
  } finally {
    loading.value = false;
  }
}

function handleMenuSelect(key: string) {
  activeMenu.value = key as MenuKey;
  void refreshCurrentView();
}

onMounted(() => {
  loadDemoData();
  void loadDashboard();
});
</script>

<template>
  <el-container class='layout'>
    <el-aside width='220px' class='aside'>
      <div class='brand'>sx校友卡后台</div>
      <div class='brandHint'>高中校友认证与返校审批</div>
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
          <p class='headerDesc'>支持高中校友注册审核、老师档案维护与返校预约审批。</p>
        </div>
        <div class='headerTools'>
          <el-input v-model='apiBaseUrl' placeholder='接口基础地址，例如 http://127.0.0.1/api/v1' class='input' />
          <el-input v-model='token' placeholder='管理员令牌' class='input' show-password />
          <el-button type='primary' @click='applyConnectionSettings'>连接接口</el-button>
        </div>
      </el-header>

      <el-main class='main'>
        <template v-if="activeMenu === 'dashboard'">
          <el-alert
            :title="canUseLiveApi ? '当前展示实时后台数据' : '当前展示本地演示数据，连接接口后切换为实时数据'"
            type='info'
            show-icon
            :closable='false'
            class='notice'
          />
          <el-row :gutter='16'>
            <el-col v-for='item in stats' :key='item.label' :span='6'>
              <el-card shadow='hover' class='statCard'>
                <div class='statValue'>{{ item.value }}</div>
                <div class='statLabel'>{{ item.label }}</div>
                <div class='statHint'>{{ item.hint }}</div>
              </el-card>
            </el-col>
          </el-row>
          <el-row :gutter='16' class='tableCard'>
            <el-col :span='12'>
              <el-card shadow='never' class='summaryCard'>
                <template #header>流程说明</template>
                <p>1. 用户先在“我的”页面完成姓名和手机号注册。</p>
                <p>2. 再补充高中班级、毕业届次、当前高校信息并上传学生证或毕业证。</p>
                <p>3. 管理员在本后台审核资料，审核通过后用户才可提交返校预约。</p>
                <p>4. 预约时选择参访老师，系统自动将申请分配给对应老师审批。</p>
              </el-card>
            </el-col>
            <el-col :span='12'>
              <el-card shadow='never' class='summaryCard'>
                <template #header>当前重点</template>
                <p>校友审核：展示班级、毕业届次、当前高校/院系/专业与证件图。</p>
                <p>老师管理：后台可创建老师档案，供小程序预约选择和老师账号绑定。</p>
                <p>预约审批：可查看参访老师、审批意见、拒绝原因和二维码有效期。</p>
              </el-card>
            </el-col>
          </el-row>
        </template>

        <el-card v-else class='tableCard' shadow='never'>
          <template #header>
            <div class='cardHeader'>
              <div>
                <div class='cardTitle'>{{ currentMenuLabel }}</div>
                <div class='cardDesc'>
                  <span v-if="activeMenu === 'alumni'">查看证件、班级与当前高校信息后进行人工审核。</span>
                  <span v-else-if="activeMenu === 'teachers'">创建老师档案，供返校预约选择并绑定老师账号。</span>
                  <span v-else-if="activeMenu === 'appointments'">查看返校申请及参访老师，支持管理员直接审批。</span>
                  <span v-else>当前模块为内容管理演示视图。</span>
                </div>
              </div>
              <div class='toolbar'>
                <el-button type='primary' plain @click='refreshCurrentView'>刷新数据</el-button>
              </div>
            </div>
          </template>

          <div v-if="showCreateTeacher" class='teacherFormWrap'>
            <el-form :inline='true' class='teacherForm'>
              <el-form-item label='老师姓名'>
                <el-input v-model='teacherForm.name' placeholder='例如 陈老师' />
              </el-form-item>
              <el-form-item label='电话'>
                <el-input v-model='teacherForm.phone' placeholder='请输入手机号' />
              </el-form-item>
              <el-form-item label='学科'>
                <el-input v-model='teacherForm.subject' placeholder='例如 数学' />
              </el-form-item>
              <el-form-item label='职务'>
                <el-input v-model='teacherForm.title' placeholder='例如 班主任' />
              </el-form-item>
              <el-form-item>
                <el-button type='primary' :loading='teacherSaving' @click='createTeacher'>新增老师</el-button>
                <el-button @click='resetTeacherForm'>清空</el-button>
              </el-form-item>
            </el-form>
          </div>

          <el-table :data='currentRows' v-loading='loading'>
            <el-table-column v-for='column in currentColumns' :key='column.prop' :prop='column.prop' :label='column.label' :width='column.width' :min-width='column.minWidth'>
              <template #default='scope'>
                <el-tag
                  v-if="['verification_status', 'status', 'is_published', 'is_active'].includes(column.prop)"
                  :type="getStatusType(scope.row[column.prop], column.prop === 'is_published' ? Boolean(scope.row[column.prop]) : undefined)"
                >
                  {{ formatCell(column.prop, scope.row[column.prop]) }}
                </el-tag>
                <span v-else>{{ formatCell(column.prop, scope.row[column.prop]) }}</span>
              </template>
            </el-table-column>
            <el-table-column label='操作' width='220' fixed='right'>
              <template #default='scope'>
                <el-button
                  v-for='action in currentActions'
                  :key='action'
                  link
                  :type="action === '通过' ? 'success' : action === '拒绝' ? 'danger' : 'primary'"
                  @click="handleAction(action, scope.row)"
                >
                  {{ action }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-main>
    </el-container>
  </el-container>

  <el-dialog v-model='detailVisible' width='720px' :title='detailTitle'>
    <div class='detailRawTitle' v-if='detailRawTitle'>{{ detailRawTitle }}</div>
    <div class='detailGrid'>
      <div v-for='item in detailFields' :key='item.label' class='detailItem'>
        <div class='detailLabel'>{{ item.label }}</div>
        <div class='detailValue preWrap'>{{ item.value }}</div>
      </div>
    </div>
    <div v-if='detailImage' class='detailImageWrap'>
      <div class='detailLabel'>附件预览</div>
      <img :src='detailImage' alt='附件预览' class='detailImage' />
    </div>
  </el-dialog>
</template>

<style scoped>
.layout { min-height: 100vh; background: #f5f7fb; }
.aside { background: linear-gradient(180deg, #fe0000 0%, #b40000 100%); color: #fff; }
.brand { padding: 24px 20px 6px; font-size: 20px; font-weight: 700; }
.brandHint { padding: 0 20px 20px; color: rgba(255, 255, 255, 0.7); font-size: 13px; }
.menu { border-right: none; background: transparent; }
.header { display: flex; align-items: center; justify-content: space-between; gap: 24px; height: auto; padding: 24px 28px 12px; background: transparent; }
.headerTitle { margin: 0; font-size: 28px; }
.headerDesc { margin: 8px 0 0; color: #64748b; }
.headerTools { display: flex; gap: 12px; flex-wrap: wrap; justify-content: flex-end; }
.input { width: 280px; }
.main { padding: 12px 28px 28px; }
.notice { margin-bottom: 20px; }
.statCard { border-radius: 18px; }
.statValue { font-size: 30px; font-weight: 700; color: #fe0000; }
.statLabel { margin-top: 6px; font-size: 15px; color: #0f172a; }
.statHint { margin-top: 8px; color: #64748b; line-height: 1.5; }
.tableCard { margin-top: 20px; border-radius: 18px; }
.summaryCard { height: 100%; border-radius: 18px; }
.summaryCard p { margin: 0 0 12px; color: #475569; line-height: 1.7; }
.summaryCard p:last-child { margin-bottom: 0; }
.cardHeader { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.cardTitle { font-size: 18px; font-weight: 700; color: #0f172a; }
.cardDesc { margin-top: 6px; color: #64748b; }
.toolbar { display: flex; gap: 12px; }
.teacherFormWrap { margin-bottom: 18px; padding: 16px 16px 4px; background: #f8fafc; border-radius: 14px; }
.teacherForm { display: flex; flex-wrap: wrap; }
.detailRawTitle { margin-bottom: 16px; font-size: 18px; font-weight: 700; color: #0f172a; }
.detailGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.detailItem { padding: 14px; background: #f8fafc; border-radius: 12px; }
.detailLabel { margin-bottom: 6px; color: #64748b; font-size: 13px; }
.detailValue { color: #0f172a; line-height: 1.6; }
.detailImageWrap { margin-top: 18px; }
.detailImage { width: 100%; max-height: 360px; object-fit: contain; border-radius: 14px; background: #f8fafc; }
.preWrap { white-space: pre-wrap; word-break: break-word; }
</style>
