import Taro from '@tarojs/taro';
import { mockActivities, mockAppointments, mockArticles, mockAssociations, mockHomeData, mockInterviews, mockProfile } from '@/data/mock';
import type { ActivityItem, AppointmentItem, ArticleItem, AssociationItem, HomeData, InterviewItem, UserProfile } from '@/types';
import { STORAGE_KEY_APPOINTMENTS, STORAGE_KEY_TOKEN } from './config';
import { request } from './http';

interface PaginatedResult<T> {
  items?: T[];
}

interface BackendAssociation {
  id: number;
  name: string;
  province?: string | null;
  city?: string | null;
  address?: string | null;
  member_count?: number | null;
  president_name?: string | null;
  contact_name?: string | null;
  description?: string | null;
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

interface BackendAlumniInfo {
  department?: string | null;
  grade?: string | null;
  verification_status?: string | null;
}

interface BackendProfile {
  id: number;
  nickname?: string | null;
  phone?: string | null;
  is_admin?: boolean;
  alumni_info?: BackendAlumniInfo | null;
}

interface BackendAppointment {
  id: number;
  visit_date: string;
  purpose?: string | null;
  status?: string | null;
  companion_count?: number | null;
}

function hasToken() {
  return Boolean(Taro.getStorageSync(STORAGE_KEY_TOKEN));
}

function formatStatusLabel(status?: string | null) {
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

function getLocalAppointments(): AppointmentItem[] {
  const local = Taro.getStorageSync<AppointmentItem[]>(STORAGE_KEY_APPOINTMENTS);
  return local && local.length ? local : mockAppointments;
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
  };
}

function mapActivity(item: BackendActivity): ActivityItem {
  return {
    id: item.id,
    title: item.title,
    coverImage: item.cover_image || '',
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
    coverImage: item.cover_image || '',
    source: item.source || '官方公众号',
  };
}

function mapInterview(item: BackendInterview): InterviewItem {
  const summaryParts = [item.department, item.grade, item.current_position].filter(Boolean);
  return {
    id: item.id,
    title: item.title,
    alumnusName: item.alumnus_name,
    coverImage: item.cover_image || item.alumnus_avatar || '',
    currentPosition: item.current_position || '校友故事',
    summary: summaryParts.join(' - ') || '精选校友人物专访',
  };
}

function mapProfile(profile: BackendProfile): UserProfile {
  const verificationStatus = profile.alumni_info?.verification_status?.toLowerCase();
  return {
    id: profile.id,
    nickname: profile.nickname || '校友用户',
    phone: profile.phone || '',
    isAdmin: Boolean(profile.is_admin),
    isVerified: verificationStatus === 'approved',
    alumniStatus: verificationStatus === 'approved' ? '已认证' : verificationStatus === 'pending' ? '待审核' : '未认证',
    department: profile.alumni_info?.department || '资料待完善',
    grade: profile.alumni_info?.grade || '待补充',
  };
}

function mapAppointment(item: BackendAppointment): AppointmentItem {
  return {
    id: item.id,
    visitDate: item.visit_date,
    purpose: item.purpose || '返校访问',
    status: formatStatusLabel(item.status),
    companionCount: item.companion_count || 0,
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

export async function getAssociations(): Promise<AssociationItem[]> {
  if (!hasToken()) return mockAssociations;
  try {
    const response = await request<PaginatedResult<BackendAssociation>>('/associations');
    return response.items?.map(mapAssociation) || mockAssociations;
  } catch (error) {
    console.error('[MiniApp] getAssociations failed', error);
    return mockAssociations;
  }
}

export async function getActivities(): Promise<ActivityItem[]> {
  if (!hasToken()) return mockActivities;
  try {
    const response = await request<PaginatedResult<BackendActivity>>('/activities');
    return response.items?.map(mapActivity) || mockActivities;
  } catch (error) {
    console.error('[MiniApp] getActivities failed', error);
    return mockActivities;
  }
}

export async function getActivityDetail(id: number): Promise<ActivityItem> {
  if (!hasToken()) {
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
  if (!hasToken()) return mockArticles;
  try {
    const response = await request<PaginatedResult<BackendArticle>>('/articles');
    return response.items?.map(mapArticle) || mockArticles;
  } catch (error) {
    console.error('[MiniApp] getArticles failed', error);
    return mockArticles;
  }
}

export async function getInterviews(): Promise<InterviewItem[]> {
  if (!hasToken()) return mockInterviews;
  try {
    const response = await request<PaginatedResult<BackendInterview>>('/interviews/');
    return response.items?.map(mapInterview) || mockInterviews;
  } catch (error) {
    console.error('[MiniApp] getInterviews failed', error);
    return mockInterviews;
  }
}

export async function getProfile(): Promise<UserProfile> {
  if (!hasToken()) return mockProfile;
  try {
    const response = await request<BackendProfile>('/auth/profile');
    return mapProfile(response);
  } catch (error) {
    console.error('[MiniApp] getProfile failed', error);
    return mockProfile;
  }
}

export async function getAppointments(): Promise<AppointmentItem[]> {
  if (!hasToken()) return getLocalAppointments();
  try {
    const response = await request<BackendAppointment[]>('/appointments');
    return response.map(mapAppointment);
  } catch (error) {
    console.error('[MiniApp] getAppointments failed', error);
    return getLocalAppointments();
  }
}

export async function createAppointment(payload: { visitDate: string; purpose: string; companionCount: number }): Promise<void> {
  if (hasToken()) {
    await request('/appointments', {
      method: 'POST',
      data: {
        visit_date: payload.visitDate,
        purpose: payload.purpose,
        companions: Array.from({ length: payload.companionCount }, (_, index) => ({
          name: `同行人${index + 1}`,
        })),
      },
    });
    return;
  }

  const current = getLocalAppointments();
  const next: AppointmentItem = {
    id: Date.now(),
    visitDate: payload.visitDate,
    purpose: payload.purpose,
    status: '待审核',
    companionCount: payload.companionCount,
  };
  Taro.setStorageSync(STORAGE_KEY_APPOINTMENTS, [next, ...current]);
}
