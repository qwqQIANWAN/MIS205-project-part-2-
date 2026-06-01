import React, { useEffect, useState } from 'react';
import { Text, View } from '@tarojs/components';
import { getAssociations } from '@/services/api';
import type { AssociationItem } from '@/types';
import styles from './index.module.scss';

function AssociationsPage() {
  const [items, setItems] = useState<AssociationItem[]>([]);

  useEffect(() => {
    getAssociations().then(setItems).catch((error) => console.error('[Associations] load failed', error));
  }, []);

  return (
    <View className={styles.container}>
      <View className={styles.searchBox}>
        <Text className={styles.searchTitle}>重点城市校友会</Text>
        <Text className={styles.searchHint}>当前版本展示校友会名单、联系人信息与组织简介，便于课程演示。</Text>
      </View>
      {items.map((item) => (
        <View key={item.id} className={styles.card}>
          <View className={styles.nameRow}>
            <Text className={styles.name}>{item.name}</Text>
            <Text className={styles.badge}>{item.memberCount} 人</Text>
          </View>
          <Text className={styles.meta}>{item.city} - {item.address}</Text>
          <Text className={styles.meta}>会长：{item.presidentName}</Text>
          <Text className={styles.desc}>{item.description}</Text>
        </View>
      ))}
    </View>
  );
}

export default AssociationsPage;
