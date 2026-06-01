import React, { useEffect, useState } from 'react';
import { Text, View } from '@tarojs/components';
import { getInterviews } from '@/services/api';
import type { InterviewItem } from '@/types';
import styles from './index.module.scss';

function InterviewsPage() {
  const [items, setItems] = useState<InterviewItem[]>([]);

  useEffect(() => {
    getInterviews().then(setItems).catch((error) => console.error('[Interviews] load failed', error));
  }, []);

  return (
    <View className={styles.container}>
      {items.map((item) => (
        <View key={item.id} className={styles.card}>
          <Text className={styles.title}>{item.title}</Text>
          <Text className={styles.meta}>{item.alumnusName} - {item.currentPosition}</Text>
          <Text className={styles.summary}>{item.summary}</Text>
        </View>
      ))}
    </View>
  );
}

export default InterviewsPage;
