import type {
  ActivityItem,
  AppointmentItem,
  ArticleItem,
  AssociationItem,
  TeacherItem,
  HomeData,
  InterviewItem,
  UserProfile,
} from '@/types';

export const mockProfile: UserProfile = {
  id: 1,
  realName: '张晓岚',
  nickname: '高三(2)班校友',
  phone: '13800000000',
  isAdmin: true,
  isTeacher: false,
  isRegistered: true,
  isVerified: true,
  alumniStatus: '已认证',
  className: '高三(2)班',
  graduationYear: '2020',
  currentUniversity: '华南师范大学',
  currentCollege: '教育信息技术学院',
  currentMajor: '教育技术学',
  verificationRemark: '资料齐全，审核通过',
  certificateImage: 'https://picsum.photos/id/338/750/500',
};

export const mockTeachers: TeacherItem[] = [
  {
    id: 1,
    name: '李国强',
    phone: '13900000001',
    subject: '数学',
    title: '年级主任',
    isActive: true,
  },
  {
    id: 2,
    name: '陈雅静',
    phone: '13900000002',
    subject: '英语',
    title: '班主任',
    isActive: true,
  },
  {
    id: 3,
    name: '周志远',
    phone: '13900000003',
    subject: '物理',
    title: '教研组长',
    isActive: true,
  },
];

export const mockAssociations: AssociationItem[] = [
  {
    id: 1,
    name: '广州校友会',
    city: '广州',
    address: '珠江新城校友之家',
    memberCount: 126,
    presidentName: '张校友',
    description: '聚焦行业联络、校友互助与返校交流活动。',
  },
  {
    id: 2,
    name: '深圳校友会',
    city: '深圳',
    address: '南山科技园',
    memberCount: 98,
    presidentName: '李校友',
    description: '服务粤港澳大湾区创新创业校友群体。',
  },
  {
    id: 3,
    name: '上海校友会',
    city: '上海',
    address: '世纪大道校友联络站',
    memberCount: 84,
    presidentName: '王校友',
    description: '联动金融、互联网与品牌行业校友资源。',
  },
];

export const mockActivities: ActivityItem[] = [
  {
    id: 101,
    title: '返校日暨校园开放周',
    coverImage: 'https://picsum.photos/id/3/750/500',
    location: '学校体育馆',
    startTime: '2026-06-15 09:00',
    endTime: '2026-06-15 17:00',
    currentParticipants: 136,
    maxParticipants: 200,
    status: '开放报名',
    summary: '参观校史馆、重点实验室，并参加校友论坛。',
  },
  {
    id: 102,
    title: '湾区职业发展沙龙',
    coverImage: 'https://picsum.photos/id/119/750/500',
    location: '广州校友之家',
    startTime: '2026-06-22 14:00',
    endTime: '2026-06-22 17:30',
    currentParticipants: 52,
    maxParticipants: 80,
    status: '开放报名',
    summary: '聚焦职业规划、模拟面试与校友导师分享。',
  },
  {
    id: 103,
    title: '创新项目路演夜',
    coverImage: 'https://picsum.photos/id/201/750/500',
    location: '深圳路演中心',
    startTime: '2026-07-05 19:00',
    endTime: '2026-07-05 21:30',
    currentParticipants: 41,
    maxParticipants: 60,
    status: '即将开始',
    summary: '面向校友创业者与投资人的项目展示活动。',
  },
];

export const mockArticles: ArticleItem[] = [
  {
    id: 201,
    title: '校友企业创新力年度榜单',
    summary: '学校发布年度创新榜单与代表案例。',
    url: 'https://example.com/articles/201',
    coverImage: 'https://picsum.photos/id/119/750/500',
    source: '学校公众号',
  },
  {
    id: 202,
    title: '返校预约服务升级通知',
    summary: '预约审核、二维码入校与同行人管理流程更加顺畅。',
    url: 'https://example.com/articles/202',
    coverImage: 'https://picsum.photos/id/160/750/500',
    source: '信息化中心',
  },
  {
    id: 203,
    title: '年度校友会工作回顾',
    summary: '回顾各地校友会在本年度的亮点与成果。',
    url: 'https://example.com/articles/203',
    coverImage: 'https://picsum.photos/id/787/750/500',
    source: '校友工作办公室',
  },
];

export const mockInterviews: InterviewItem[] = [
  {
    id: 301,
    title: '从实验室到独角兽',
    alumnusName: '陈晨',
    coverImage: 'https://picsum.photos/id/177/750/500',
    currentPosition: 'AI 创业公司联合创始人',
    summary: '讲述产品战略、初创团队搭建与校友支持的成长故事。',
  },
  {
    id: 302,
    title: '为乡村课堂而设计',
    alumnusName: '林晓',
    coverImage: 'https://picsum.photos/id/338/750/500',
    currentPosition: '公益项目负责人',
    summary: '分享设计思维在乡村教育实践项目中的应用。',
  },
];

export const mockAppointments: AppointmentItem[] = [
  {
    id: 401,
    visitDate: '2026-06-18',
    purpose: '参加校园开放周',
    status: '已通过',
    companionCount: 1,
    teacherId: 2,
    teacherName: '陈雅静',
    teacherTitle: '班主任',
    teacherComment: '欢迎返校交流，请按时到门卫处签到。',
  },
  {
    id: 402,
    visitDate: '2026-06-25',
    purpose: '返校交流并拜访老师',
    status: '待审核',
    companionCount: 0,
    teacherId: 1,
    teacherName: '李国强',
    teacherTitle: '年级主任',
  },
];

export const mockHomeData: HomeData = {
  profile: mockProfile,
  associations: mockAssociations,
  activities: mockActivities,
  articles: mockArticles,
  interviews: mockInterviews,
  appointments: mockAppointments,
};
