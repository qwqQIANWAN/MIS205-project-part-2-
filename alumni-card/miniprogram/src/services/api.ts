import Taro from '@tarojs/taro';
import {
  mockActivities,
  mockAppointments,
  mockArticles,
  mockAssociations,
  mockHomeData,
  mockInterviews,
  mockProfile,
  mockTeachers,
} from '@/data/mock';
import type {
  ActivityItem,
  AlumniDirectoryItem,
  AppointmentItem,
  ArticleItem,
  AssociationItem,
  CompanionItem,
  HomeData,
  InterviewItem,
  RegisterPayload,
  TeacherItem,
  UserProfile,
  VerificationPayload,
} from '@/types';
import {
  DEFAULT_API_BASE_URL,
  PREVIEW_MOCK_TOKEN,
  STORAGE_KEY_API_BASE_URL,
  STORAGE_KEY_APPOINTMENTS,
  STORAGE_KEY_PREVIEW_PROFILE,
  STORAGE_KEY_TOKEN,
} from './config';
import { request } from './http';

interface PaginatedResult<T> {
  items?: T[];
}

interface BackendAssociation {
  id: number;
  name: string;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  address?: string | null;
  cover_image?: string | null;
  member_count?: number | null;
  president_name?: string | null;
  contact_name?: string | null;
  description?: string | null;
}

interface BackendAlumnus {
  id: number;
  user_id: number;
  real_name: string;
  class_name?: string | null;
  graduation_year?: string | null;
  current_university?: string | null;
  current_college?: string | null;
  current_major?: string | null;
  avatar_url?: string | null;
}

interface BackendActivity {
  id: number;
  title: string;
  cover_image?: string | null;
  location?: string | null;
  start_time: string;
  end_time: string;
  current_participants?: number | null;
  max_participants?: number | null;
  status?: string | null;
  description?: string | null;
  organizer?: string | null;
}

interface BackendArticle {
  id: number;
  title: string;
  summary?: string | null;
  url: string;
  cover_image?: string | null;
  source?: string | null;
  category?: string | null;
  created_at?: string;
}

interface BackendInterview {
  id: number;
  title: string;
  alumnus_name: string;
  alumnus_avatar?: string | null;
  cover_image?: string | null;
  current_position?: string | null;
  department?: string | null;
  grade?: string | null;
}

interface BackendTeacher {
  id: number;
  name: string;
  phone: string;
  subject?: string | null;
  title?: string | null;
  is_active?: boolean;
}

interface BackendAlumniInfo {
  class_name?: string | null;
  graduation_year?: string | null;
  current_university?: string | null;
  current_college?: string | null;
  current_major?: string | null;
  verification_status?: string | null;
  verification_remark?: string | null;
  certificate_image?: string | null;
}

interface BackendProfile {
  id: number;
  real_name?: string | null;
  nickname?: string | null;
  phone?: string | null;
  is_admin?: boolean;
  is_registered?: boolean;
  is_verified?: boolean;
  is_teacher?: boolean;
  alumni_info?: BackendAlumniInfo | null;
  teacher_profile?: BackendTeacher | null;
}

interface BackendCompanion {
  id?: number;
  name: string;
  id_number?: string | null;
  phone?: string | null;
  relation?: string | null;
}

interface BackendAppointment {
  id: number;
  visit_date: string;
  purpose?: string | null;
  status?: string | null;
  companion_count?: number | null;
  qr_code?: string | null;
  teacher_id?: number | null;
  teacher_name?: string | null;
  teacher_title?: string | null;
  teacher_comment?: string | null;
  teacher_reviewed_at?: string | null;
  reject_reason?: string | null;
  real_name?: string | null;
  companions?: BackendCompanion[];
}

interface BackendLoginResponse {
  token: string;
  user: {
    id: number;
  };
}

function getStoredToken() {
  return Taro.getStorageSync<string>(STORAGE_KEY_TOKEN);
}

function hasToken() {
  return Boolean(getStoredToken());
}

function isPreviewMockToken() {
  return getStoredToken() === PREVIEW_MOCK_TOKEN;
}

function getCurrentEnvName() {
  try {
    const env = Taro.getEnv();
    return typeof env === 'string' ? env.toUpperCase() : '';
  } catch (error) {
    console.error('[MiniApp] get env failed', error);
    return '';
  }
}

function canUseWechatLoginApi() {
  return getCurrentEnvName() === 'WEAPP';
}

function canUseNativeUploadApi() {
  return ['WEAPP', 'ALIPAY', 'TT', 'QQ', 'JD', 'SWAN'].includes(getCurrentEnvName());
}

function getErrorMessage(error: unknown) {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const maybeError = error as { errMsg?: string; message?: string };
    return maybeError.errMsg || maybeError.message || JSON.stringify(error);
  }
  return String(error);
}

function createPreviewProfile(): UserProfile {
  return {
    ...mockProfile,
    realName: '',
    nickname: '体验用户',
    phone: '',
    isAdmin: false,
    isTeacher: false,
    isRegistered: false,
    isVerified: false,
    alumniStatus: '未认证',
    className: '资料待完善',
    graduationYear: '待补充',
    currentUniversity: '待完善',
    currentCollege: '待完善',
    currentMajor: '待完善',
    verificationRemark: '',
    certificateImage: '',
    teacherProfile: undefined,
  };
}

function getPreviewProfile() {
  const stored = Taro.getStorageSync<UserProfile>(STORAGE_KEY_PREVIEW_PROFILE);
  if (stored && typeof stored.id === 'number') {
    return stored;
  }
  return createPreviewProfile();
}

function setPreviewProfile(profile: UserProfile) {
  Taro.setStorageSync(STORAGE_KEY_PREVIEW_PROFILE, profile);
}

function enablePreviewLogin() {
  const profile = getPreviewProfile();
  Taro.setStorageSync(STORAGE_KEY_TOKEN, PREVIEW_MOCK_TOKEN);
  setPreviewProfile(profile);
  return profile;
}

function getBaseUrl() {
  return (Taro.getStorageSync<string>(STORAGE_KEY_API_BASE_URL) || DEFAULT_API_BASE_URL || '').replace(/\/$/, '');
}

function shouldUseMockContentApi() {
  return isPreviewMockToken() || !getBaseUrl();
}

function getSiteRoot() {
  return getBaseUrl().replace(/\/api\/v1$/, '');
}

function resolveAssetUrl(url?: string | null) {
  if (!url) return '';
  if (/^https?:\/\//.test(url)) return url;
  const siteRoot = getSiteRoot();
  return siteRoot ? `${siteRoot}${url}` : url;
}

function formatStatusLabel(status?: string | null) {
  if (!status) return '待审核';

  const normalized = status.toLowerCase();
  const labels: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    cancelled: '已取消',
    completed: '已完成',
    upcoming: '即将开始',
    ongoing: '进行中',
    ended: '已结束',
  };

  return labels[normalized] || normalized;
}

function getLocalAppointments(): AppointmentItem[] {
  const local = Taro.getStorageSync<AppointmentItem[]>(STORAGE_KEY_APPOINTMENTS);
  return local && local.length ? local : mockAppointments;
}

function mapTeacher(item: BackendTeacher): TeacherItem {
  return {
    id: item.id,
    name: item.name,
    phone: item.phone,
    subject: item.subject || '',
    title: item.title || '',
    isActive: item.is_active ?? true,
  };
}

function mapAssociation(item: BackendAssociation): AssociationItem {
  return {
    id: item.id,
    name: item.name,
    city: item.city || item.province || '待补充',
    address: item.address || '地址待补充',
    memberCount: item.member_count || 0,
    presidentName: item.president_name || item.contact_name || '待补充',
    description: item.description || '区域校友联络组织',
    coverImage: resolveAssetUrl(item.cover_image),
    province: item.province || '',
    district: item.district || '',
  };
}

function mapAlumnus(item: BackendAlumnus): AlumniDirectoryItem {
  return {
    id: item.id,
    userId: item.user_id,
    realName: item.real_name,
    avatarUrl: resolveAssetUrl(item.avatar_url),
    className: item.class_name || '',
    graduationYear: item.graduation_year || '',
    currentUniversity: item.current_university || '',
    currentCollege: item.current_college || '',
    currentMajor: item.current_major || '',
  };
}

function mapActivity(item: BackendActivity): ActivityItem {
  return {
    id: item.id,
    title: item.title,
    coverImage: resolveAssetUrl(item.cover_image),
    location: item.location || '校园内',
    startTime: item.start_time,
    endTime: item.end_time,
    currentParticipants: item.current_participants || 0,
    maxParticipants: item.max_participants || 0,
    status: formatStatusLabel(item.status),
    summary: item.description || item.organizer || '活动详情将陆续公布。',
  };
}

function mapArticle(item: BackendArticle): ArticleItem {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary || '点击可复制原文链接。',
    url: item.url,
    coverImage: resolveAssetUrl(item.cover_image),
    source: item.source || '官方公众号',
    category: item.category || '公众号文章',
    createdAt: item.created_at,
  };
}

function mapInterview(item: BackendInterview): InterviewItem {
  const summaryParts = [item.department, item.grade, item.current_position].filter(Boolean);
  return {
    id: item.id,
    title: item.title,
    alumnusName: item.alumnus_name,
    coverImage: resolveAssetUrl(item.cover_image || item.alumnus_avatar),
    currentPosition: item.current_position || '校友故事',
    summary: summaryParts.join(' - ') || '精选校友人物专访',
  };
}

function mapProfile(profile: BackendProfile): UserProfile {
  const verificationStatus = profile.alumni_info?.verification_status?.toLowerCase();
  return {
    id: profile.id,
    realName: profile.real_name || '',
    nickname: profile.nickname || profile.real_name || '校友用户',
    phone: profile.phone || '',
    isAdmin: Boolean(profile.is_admin),
    isTeacher: Boolean(profile.is_teacher),
    isRegistered: Boolean(profile.is_registered),
    isVerified: Boolean(profile.is_verified),
    alumniStatus:
      verificationStatus === 'approved' ? '已认证' : verificationStatus === 'pending' ? '待审核' : '未认证',
    className: profile.alumni_info?.class_name || '待完善',
    graduationYear: profile.alumni_info?.graduation_year || '待补充',
    currentUniversity: profile.alumni_info?.current_university || '待完善',
    currentCollege: profile.alumni_info?.current_college || '待完善',
    currentMajor: profile.alumni_info?.current_major || '待完善',
    verificationRemark: profile.alumni_info?.verification_remark || '',
    certificateImage: resolveAssetUrl(profile.alumni_info?.certificate_image),
    teacherProfile: profile.teacher_profile ? mapTeacher(profile.teacher_profile) : undefined,
  };
}

function mapCompanion(item: BackendCompanion): CompanionItem {
  return {
    id: item.id,
    name: item.name,
    idNumber: item.id_number || '',
    phone: item.phone || '',
    relation: item.relation || '',
  };
}

function mapAppointment(item: BackendAppointment): AppointmentItem {
  return {
    id: item.id,
    visitDate: item.visit_date,
    purpose: item.purpose || '返校访问',
    status: formatStatusLabel(item.status),
    companionCount: item.companion_count || 0,
    teacherId: item.teacher_id || undefined,
    teacherName: item.teacher_name || '',
    teacherTitle: item.teacher_title || '',
    teacherComment: item.teacher_comment || '',
    teacherReviewedAt: item.teacher_reviewed_at || '',
    rejectReason: item.reject_reason || '',
    qrCode: resolveAssetUrl(item.qr_code),
    realName: item.real_name || '',
    companions: item.companions?.map(mapCompanion) || [],
  };
}

export async function getHomeData(): Promise<HomeData> {
  if (!hasToken()) {
    return { ...mockHomeData, appointments: getLocalAppointments() };
  }

  try {
    const [profile, associations, activities, articles, interviews, appointments] = await Promise.all([
      getProfile(),
      getAssociations(),
      getActivities(),
      getArticles(),
      getInterviews(),
      getAppointments(),
    ]);

    return {
      profile,
      associations,
      activities,
      articles,
      interviews,
      appointments,
    };
  } catch (error) {
    console.error('[MiniApp] getHomeData failed', error);
    return { ...mockHomeData, appointments: getLocalAppointments() };
  }
}

export async function loginWithWechat(): Promise<UserProfile> {
  if (!canUseWechatLoginApi()) {
    console.info('[MiniApp] login fallback to preview profile', { env: getCurrentEnvName() });
    return enablePreviewLogin();
  }

  try {
    const loginResult = await Taro.login();
    if (!loginResult.code) {
      throw new Error('获取微信登录凭证失败');
    }

    const response = await request<BackendLoginResponse>('/auth/wechat-login', {
      method: 'POST',
      data: { code: loginResult.code },
    });
    Taro.setStorageSync(STORAGE_KEY_TOKEN, response.token);
    return getProfile();
  } catch (error) {
    const message = getErrorMessage(error);
    if (message.includes('接口基础地址未配置')) {
      throw new Error('请先配置小程序接口地址后再登录');
    }
    if (message.includes('暂时不支持 API') || message.includes('login:fail')) {
      console.info('[MiniApp] login api unsupported, fallback to preview profile', error);
      return enablePreviewLogin();
    }
    throw error;
  }
}

export function logout() {
  Taro.removeStorageSync(STORAGE_KEY_TOKEN);
  Taro.removeStorageSync(STORAGE_KEY_PREVIEW_PROFILE);
}

export async function registerUser(payload: RegisterPayload): Promise<UserProfile> {
  if (isPreviewMockToken()) {
    const nextProfile: UserProfile = {
      ...getPreviewProfile(),
      realName: payload.realName,
      nickname: payload.realName || '体验用户',
      phone: payload.phone,
      isRegistered: true,
    };
    setPreviewProfile(nextProfile);
    return nextProfile;
  }

  const response = await request<BackendProfile>('/auth/register', {
    method: 'POST',
    data: {
      real_name: payload.realName,
      phone: payload.phone,
    },
  });
  return mapProfile(response);
}

export async function submitVerification(payload: VerificationPayload): Promise<UserProfile> {
  if (isPreviewMockToken()) {
    const nextProfile: UserProfile = {
      ...getPreviewProfile(),
      isRegistered: true,
      isVerified: false,
      alumniStatus: '待审核',
      className: payload.className,
      graduationYear: payload.graduationYear,
      currentUniversity: payload.currentUniversity,
      currentCollege: payload.currentCollege,
      currentMajor: payload.currentMajor,
      verificationRemark: '资料已提交，等待管理员人工审核',
      certificateImage: payload.certificateImage,
    };
    setPreviewProfile(nextProfile);
    return nextProfile;
  }

  const response = await request<BackendProfile>('/auth/alumni-verify', {
    method: 'POST',
    data: {
      student_id: payload.studentId || '',
      graduation_year: payload.graduationYear,
      class_name: payload.className,
      current_university: payload.currentUniversity,
      current_college: payload.currentCollege,
      current_major: payload.currentMajor,
      certificate_image: payload.certificateImage,
    },
  });
  return mapProfile(response);
}

export async function uploadCertificateImage(filePath: string): Promise<string> {
  if (isPreviewMockToken() || !canUseNativeUploadApi()) {
    console.info('[MiniApp] upload fallback to local preview asset', { env: getCurrentEnvName() });
    return filePath;
  }

  const token = Taro.getStorageSync<string>(STORAGE_KEY_TOKEN);
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new Error('接口基础地址未配置');
  }

  const uploadResult = await Taro.uploadFile({
    url: `${baseUrl}/upload/certificate`,
    filePath,
    name: 'file',
    header: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  if (uploadResult.statusCode >= 400) {
    throw new Error(`上传失败：${uploadResult.statusCode}`);
  }

  const parsed = JSON.parse(uploadResult.data) as { data?: { url?: string } };
  return resolveAssetUrl(parsed.data?.url);
}

export async function getTeachers(): Promise<TeacherItem[]> {
  if (shouldUseMockContentApi()) return mockTeachers;
  try {
    const response = await request<BackendTeacher[]>('/teachers/options');
    return response.map(mapTeacher);
  } catch (error) {
    console.error('[MiniApp] getTeachers failed', error);
    return mockTeachers;
  }
}

export async function bindTeacherIdentity(payload: { name: string; phone: string }): Promise<UserProfile> {
  if (isPreviewMockToken()) {
    const normalizedName = payload.name.trim();
    const normalizedPhone = payload.phone.trim();
    const teacher =
      mockTeachers.find((item) => item.name === normalizedName && item.phone === normalizedPhone) ||
      mockTeachers.find((item) => item.name === normalizedName) ||
      mockTeachers.find((item) => item.phone === normalizedPhone) || {
        id: Date.now(),
        name: normalizedName,
        phone: normalizedPhone,
        subject: '待补充',
        title: '预览老师',
        isActive: true,
      };

    const nextProfile: UserProfile = {
      ...getPreviewProfile(),
      isTeacher: true,
      teacherProfile: teacher,
    };
    setPreviewProfile(nextProfile);
    return nextProfile;
  }

  await request('/teachers/bind', {
    method: 'POST',
    data: payload,
  });
  return getProfile();
}

export async function getAssociations(): Promise<AssociationItem[]> {
  if (!hasToken() || shouldUseMockContentApi()) return mockAssociations;
  try {
    const response = await request<PaginatedResult<BackendAssociation>>('/associations');
    return response.items?.map(mapAssociation) || mockAssociations;
  } catch (error) {
    console.error('[MiniApp] getAssociations failed', error);
    return mockAssociations;
  }
}

export async function getAlumniDirectory(keyword = ''): Promise<AlumniDirectoryItem[]> {
  if (!hasToken() || shouldUseMockContentApi()) {
    return mockInterviews.map((item, index) => ({
      id: item.id,
      userId: index + 1,
      realName: item.alumnusName,
      avatarUrl: item.coverImage,
      currentMajor: item.currentPosition,
    }));
  }
  try {
    const query = keyword.trim() ? `?keyword=${encodeURIComponent(keyword.trim())}` : '';
    const response = await request<PaginatedResult<BackendAlumnus>>(`/alumni/directory${query}`);
    return response.items?.map(mapAlumnus) || [];
  } catch (error) {
    console.error('[MiniApp] getAlumniDirectory failed', error);
    return [];
  }
}

export async function getActivities(): Promise<ActivityItem[]> {
  if (!hasToken() || shouldUseMockContentApi()) return mockActivities;
  try {
    const response = await request<PaginatedResult<BackendActivity>>('/activities');
    return response.items?.map(mapActivity) || mockActivities;
  } catch (error) {
    console.error('[MiniApp] getActivities failed', error);
    return mockActivities;
  }
}

export async function getActivityDetail(id: number): Promise<ActivityItem> {
  if (!hasToken() || shouldUseMockContentApi()) {
    return mockActivities.find((item) => item.id === id) || mockActivities[0];
  }
  try {
    const response = await request<BackendActivity>(`/activities/${id}`);
    return mapActivity(response);
  } catch (error) {
    console.error('[MiniApp] getActivityDetail failed', error);
    return mockActivities.find((item) => item.id === id) || mockActivities[0];
  }
}

export async function getArticles(): Promise<ArticleItem[]> {
  if (!hasToken() || shouldUseMockContentApi()) return mockArticles;
  try {
    const response = await request<PaginatedResult<BackendArticle>>('/articles');
    return response.items?.map(mapArticle) || mockArticles;
  } catch (error) {
    console.error('[MiniApp] getArticles failed', error);
    return mockArticles;
  }
}

export async function getArticleDetail(id: number): Promise<ArticleItem> {
  if (!hasToken() || shouldUseMockContentApi()) {
    return mockArticles.find((item) => item.id === id) || mockArticles[0];
  }
  try {
    const response = await request<BackendArticle>(`/articles/${id}`);
    return mapArticle(response);
  } catch (error) {
    console.error('[MiniApp] getArticleDetail failed', error);
    return mockArticles.find((item) => item.id === id) || mockArticles[0];
  }
}

export async function getInterviews(): Promise<InterviewItem[]> {
  if (!hasToken() || shouldUseMockContentApi()) return mockInterviews;
  try {
    const response = await request<PaginatedResult<BackendInterview>>('/interviews/');
    return response.items?.map(mapInterview) || mockInterviews;
  } catch (error) {
    console.error('[MiniApp] getInterviews failed', error);
    return mockInterviews;
  }
}

export async function getProfile(): Promise<UserProfile> {
  if (!hasToken()) {
    return {
      ...mockProfile,
      isRegistered: false,
      isVerified: false,
      isTeacher: false,
      alumniStatus: '未认证',
    };
  }

  if (isPreviewMockToken()) {
    return getPreviewProfile();
  }

  try {
    const response = await request<BackendProfile>('/auth/profile');
    return mapProfile(response);
  } catch (error) {
    console.error('[MiniApp] getProfile failed', error);
    return mockProfile;
  }
}

export async function getAppointments(): Promise<AppointmentItem[]> {
  if (isPreviewMockToken()) return getLocalAppointments();
  if (!hasToken()) return getLocalAppointments();
  try {
    const response = await request<BackendAppointment[]>('/appointments');
    return response.map(mapAppointment);
  } catch (error) {
    console.error('[MiniApp] getAppointments failed', error);
    return getLocalAppointments();
  }
}

export async function createAppointment(payload: {
  visitDate: string;
  purpose: string;
  companionCount: number;
  teacherId: number;
}): Promise<void> {
  if (hasToken() && !isPreviewMockToken()) {
    await request('/appointments', {
      method: 'POST',
      data: {
        visit_date: payload.visitDate,
        purpose: payload.purpose,
        teacher_id: payload.teacherId,
        companions: Array.from({ length: payload.companionCount }, (_, index) => ({
          name: `同行人${index + 1}`,
        })),
      },
    });
    return;
  }

  const teacher = mockTeachers.find((item) => item.id === payload.teacherId);
  const current = getLocalAppointments();
  const next: AppointmentItem = {
    id: Date.now(),
    visitDate: payload.visitDate,
    purpose: payload.purpose,
    status: '待审核',
    companionCount: payload.companionCount,
    teacherId: payload.teacherId,
    teacherName: teacher?.name || '待分配',
    teacherTitle: teacher?.title || '',
  };
  Taro.setStorageSync(STORAGE_KEY_APPOINTMENTS, [next, ...current]);
}

export async function getTeacherAppointments(): Promise<AppointmentItem[]> {
  if (isPreviewMockToken()) {
    const teacherId = getPreviewProfile().teacherProfile?.id;
    return getLocalAppointments().filter((item) => !teacherId || item.teacherId === teacherId);
  }
  const response = await request<BackendAppointment[]>('/teachers/me/appointments');
  return response.map(mapAppointment);
}

export async function approveTeacherAppointment(id: number, remark = '老师审批通过'): Promise<void> {
  if (isPreviewMockToken()) {
    const nextAppointments = getLocalAppointments().map((item) =>
      item.id === id
        ? {
            ...item,
            status: '已通过',
            teacherComment: remark,
            teacherReviewedAt: new Date().toISOString(),
            rejectReason: '',
          }
        : item,
    );
    Taro.setStorageSync(STORAGE_KEY_APPOINTMENTS, nextAppointments);
    return;
  }

  await request(`/teachers/me/appointments/${id}/approve`, {
    method: 'PUT',
    data: {
      remark,
      qr_code_expire_days: 1,
    },
  });
}

export async function rejectTeacherAppointment(id: number, reason = '老师暂不同意本次返校申请'): Promise<void> {
  if (isPreviewMockToken()) {
    const nextAppointments = getLocalAppointments().map((item) =>
      item.id === id
        ? {
            ...item,
            status: '已拒绝',
            teacherComment: reason,
            teacherReviewedAt: new Date().toISOString(),
            rejectReason: reason,
          }
        : item,
    );
    Taro.setStorageSync(STORAGE_KEY_APPOINTMENTS, nextAppointments);
    return;
  }

  await request(`/teachers/me/appointments/${id}/reject`, {
    method: 'PUT',
    data: {
      reason,
    },
  });
}
