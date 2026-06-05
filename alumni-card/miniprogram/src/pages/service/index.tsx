import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { getProfile } from '@/services/api';
import type { UserProfile } from '@/types';
import styles from './index.module.scss';

function ServicePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const load = () => {
    getProfile().then(setProfile).catch((error) => console.error('[Service] load failed', error));
  };

  useEffect(load, []);
  useDidShow(load);

  const services = useMemo(
    () => [
      {
        title: '返校预约',
        desc: '填写到校时间、来访事由和参访老师，跟踪老师审批结果。',
        url: '/pages/appointment/index',
      },
      {
        title: '活动报名',
        desc: '查看校友返校日、讲座和联谊活动安排。',
        url: '/pages/activities/index',
      },
      {
        title: '公众号文章',
        desc: '查看后台维护的公众号文章与通知摘要。',
        url: '/pages/articles/index',
      },
      {
        title: '校友风采',
        desc: '浏览优秀校友故事与成长经历。',
        url: '/pages/interviews/index',
      },
    ],
    [],
  );

  return (
    <View className={styles.container}>
      <View className={styles.hero}>
        <Text className={styles.heroTitle}>常用校园服务</Text>
        <Text className={styles.heroDesc}>
          {profile?.isTeacher
            ? '你已拥有老师身份，可在下方查看待审批返校申请。'
            : '从这里进入返校预约、活动报名、资讯与校友风采等常用服务。'}
        </Text>
      </View>

      {profile?.isTeacher ? (
        <View className={styles.teacherBanner} onClick={() => Taro.navigateTo({ url: '/pages/teacher/review/index' })}>
          <Text className={styles.teacherTitle}>老师审批入口</Text>
          <Text className={styles.teacherDesc}>学生预约会自动流转到这里，由拜访老师在手机上审批。</Text>
        </View>
      ) : null}

      <View className={styles.grid}>
        {services.map((item) => (
          <View key={item.title} className={styles.card} onClick={() => Taro.navigateTo({ url: item.url })}>
            <Text className={styles.cardTitle}>{item.title}</Text>
            <Text className={styles.cardDesc}>{item.desc}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default ServicePage;
