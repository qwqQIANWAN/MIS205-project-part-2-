import React, { useEffect, useState } from 'react';
import { Image, Text, View } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { getActivityDetail } from '@/services/api';
import type { ActivityItem } from '@/types';
import styles from './index.module.scss';

function ActivityDetailPage() {
  const router = useRouter();
  const [detail, setDetail] = useState<ActivityItem | null>(null);

  useEffect(() => {
    getActivityDetail(Number(router.params.id || 0)).then(setDetail).catch((error) => console.error('[ActivityDetail] load failed', error));
  }, [router.params.id]);

  return (
    <View className={styles.container}>
      <Image className={styles.cover} src={detail?.coverImage} mode='aspectFill' />
      <View className={styles.content}>
        <Text className={styles.title}>{detail?.title}</Text>
        <Text className={styles.meta}>{detail?.location} - {detail?.startTime}</Text>
        <Text className={styles.meta}>报名人数：{detail?.currentParticipants}/{detail?.maxParticipants}</Text>
        <Text className={styles.summary}>{detail?.summary}</Text>
      </View>
      <View className={styles.actionBar} onClick={() => Taro.showToast({ title: '报名成功', icon: 'none' })}>
        <Text className={styles.actionText}>立即报名</Text>
      </View>
    </View>
  );
}

export default ActivityDetailPage;
