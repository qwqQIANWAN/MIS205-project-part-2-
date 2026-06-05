export interface UserProfile {
  id: number;
  realName?: string;
  nickname: string;
  phone?: string;
  isAdmin?: boolean;
  isTeacher?: boolean;
  isRegistered: boolean;
  isVerified: boolean;
  alumniStatus: '未认证' | '待审核' | '已认证';
  className: string;
  graduationYear: string;
  currentUniversity: string;
  currentCollege: string;
  currentMajor: string;
  verificationRemark?: string;
  certificateImage?: string;
  teacherProfile?: TeacherItem;
}

export interface AssociationItem {
  id: number;
  name: string;
  city: string;
  address: string;
  memberCount: number;
  presidentName: string;
  description: string;
  coverImage?: string;
  province?: string;
  district?: string;
}

export interface AlumniDirectoryItem {
  id: number;
  userId: number;
  realName: string;
  avatarUrl?: string;
  className?: string;
  graduationYear?: string;
  currentUniversity?: string;
  currentCollege?: string;
  currentMajor?: string;
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
  category?: string;
  createdAt?: string;
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
  teacherId?: number;
  teacherName?: string;
  teacherTitle?: string;
  teacherComment?: string;
  teacherReviewedAt?: string;
  rejectReason?: string;
  qrCode?: string;
  realName?: string;
  companions?: CompanionItem[];
}

export interface HomeData {
  profile: UserProfile;
  associations: AssociationItem[];
  activities: ActivityItem[];
  articles: ArticleItem[];
  interviews: InterviewItem[];
  appointments: AppointmentItem[];
}

export interface TeacherItem {
  id: number;
  name: string;
  phone: string;
  subject?: string;
  title?: string;
  isActive?: boolean;
}

export interface CompanionItem {
  id?: number;
  name: string;
  idNumber?: string;
  phone?: string;
  relation?: string;
}

export interface RegisterPayload {
  realName: string;
  phone: string;
}

export interface VerificationPayload {
  studentId?: string;
  graduationYear: string;
  className: string;
  currentUniversity: string;
  currentCollege: string;
  currentMajor: string;
  certificateImage: string;
}
