import React, { useEffect, useState } from 'react';
import { Image, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { getHomeData } from '@/services/api';
import type { HomeData } from '@/types';
import styles from './index.module.scss';

const quickEntries = [
  { name: '我的校友卡', hint: '查看认证状态与电子校友卡', url: '/pages/alumni-card/index' },
  { name: '返校预约', hint: '提交返校申请并查看进度', url: '/pages/appointment/index' },
  { name: '文章资讯', hint: '查看学校动态与校友通知', url: '/pages/articles/index' },
  { name: '校友风采', hint: '浏览优秀校友故事', url: '/pages/interviews/index' },
];

function IndexPage() {
  const [homeData, setHomeData] = useState<HomeData | null>(null);

  useEffect(() => {
    getHomeData().then(setHomeData).catch((error) => {
      console.error('[Home] load failed', error);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    });
  }, []);

  const metrics = [
    { label: '已加入校友会', value: String(homeData?.associations.length || 0) },
    { label: '活动数量', value: String(homeData?.activities.length || 0) },
    { label: '我的返校记录', value: String(homeData?.appointments.length || 0) },
  ];

  return (
    <View className={styles.container}>
      <View className={styles.hero}>
        <Text className={styles.heroTitle}>sx校友卡</Text>
        <Text className={styles.heroDesc}>面向校友认证、返校预约、活动报名与校友会联络的一站式小程序。</Text>
        <View className={styles.metrics}>
          {metrics.map((item) => (
            <View key={item.label} className={styles.metricCard}>
              <Text className={styles.metricValue}>{item.value}</Text>
              <Text className={styles.metricLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>快捷入口</Text>
          <Text className={styles.sectionLink}>演示流程</Text>
        </View>
        <View className={styles.quickGrid}>
          {quickEntries.map((entry) => (
            <View key={entry.name} className={styles.quickItem} onClick={() => Taro.navigateTo({ url: entry.url })}>
              <Text className={styles.quickName}>{entry.name}</Text>
              <Text className={styles.quickHint}>{entry.hint}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>最新活动</Text>
          <Text className={styles.sectionLink} onClick={() => Taro.switchTab({ url: '/pages/activities/index' })}>查看全部</Text>
        </View>
        {(homeData?.activities || []).slice(0, 2).map((activity) => (
          <View key={activity.id} className={styles.activityCard} onClick={() => Taro.navigateTo({ url: `/pages/activities/detail/index?id=${activity.id}` })}>
            <Image className={styles.cover} src={activity.coverImage} mode='aspectFill' />
            <View className={styles.activityBody}>
              <Text className={styles.activityTitle}>{activity.title}</Text>
              <Text className={styles.activityMeta}>{activity.location} - {activity.startTime}</Text>
              <Text className={styles.activitySummary}>{activity.summary}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default IndexPage;
