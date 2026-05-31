export interface UserProfile {
  id: number;
  nickname: string;
  phone?: string;
  isAdmin?: boolean;
  isVerified: boolean;
  alumniStatus: '未认证' | '待审核' | '已认证';
  department: string;
  grade: string;
}

export interface AssociationItem {
  id: number;
  name: string;
  city: string;
  address: string;
  memberCount: number;
  presidentName: string;
  description: string;
}

export interface ActivityItem {
  id: number;
  title: string;
  coverImage: string;
  location: string;
  startTime: string;
  endTime: string;
  currentParticipants: number;
  maxParticipants: number;
  status: string;
  summary: string;
}

export interface ArticleItem {
  id: number;
  title: string;
  summary: string;
  url: string;
  coverImage: string;
  source: string;
}

export interface InterviewItem {
  id: number;
  title: string;
  alumnusName: string;
  coverImage: string;
  currentPosition: string;
  summary: string;
}

export interface AppointmentItem {
  id: number;
  visitDate: string;
  purpose: string;
  status: string;
  companionCount: number;
}

export interface HomeData {
  profile: UserProfile;
  associations: AssociationItem[];
  activities: ActivityItem[];
  articles: ArticleItem[];
  interviews: InterviewItem[];
  appointments: AppointmentItem[];
}
