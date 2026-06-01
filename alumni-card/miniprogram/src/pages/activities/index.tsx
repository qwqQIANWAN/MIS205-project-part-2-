import React, { useEffect, useState } from 'react';
import { Image, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { getActivities } from '@/services/api';
import type { ActivityItem } from '@/types';
import styles from './index.module.scss';

function ActivitiesPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);

  useEffect(() => {
    getActivities().then(setItems).catch((error) => console.error('[Activities] load failed', error));
  }, []);

  return (
    <View className={styles.container}>
      {items.map((item) => (
        <View key={item.id} className={styles.card} onClick={() => Taro.navigateTo({ url: `/pages/activities/detail/index?id=${item.id}` })}>
          <Image className={styles.cover} src={item.coverImage} mode='aspectFill' />
          <Text className={styles.title}>{item.title}</Text>
          <Text className={styles.meta}>{item.location} - {item.startTime}</Text>
          <Text className={styles.summary}>{item.summary}</Text>
          <View className={styles.footer}>
            <Text className={styles.status}>{item.status}</Text>
            <Text className={styles.meta}>{item.currentParticipants}/{item.maxParticipants} 人</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export default ActivitiesPage;
