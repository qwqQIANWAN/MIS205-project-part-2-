import React, { useEffect, useState } from 'react';
import { Text, View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { getAppointments } from '@/services/api';
import type { AppointmentItem } from '@/types';
import styles from './index.module.scss';

function AppointmentPage() {
  const [items, setItems] = useState<AppointmentItem[]>([]);

  const load = () => {
    getAppointments().then(setItems).catch((error) => console.error('[Appointment] load failed', error));
  };

  useEffect(load, []);
  useDidShow(load);

  return (
    <View className={styles.container}>
      {items.map((item) => (
        <View key={item.id} className={styles.card}>
          <Text className={styles.title}>{item.visitDate}</Text>
          <Text className={styles.meta}>到校事由：{item.purpose}</Text>
          <Text className={styles.meta}>参访老师：{item.teacherName || '待分配'}</Text>
          <Text className={styles.meta}>同行人数：{item.companionCount}</Text>
          {item.teacherComment ? <Text className={styles.meta}>审批意见：{item.teacherComment}</Text> : null}
          {item.rejectReason ? <Text className={styles.meta}>拒绝原因：{item.rejectReason}</Text> : null}
          <Text className={styles.status}>{item.status}</Text>
        </View>
      ))}
      <View className={styles.actionBar} onClick={() => Taro.navigateTo({ url: '/pages/appointment/create/index' })}>
        <Text className={styles.actionText}>新建预约</Text>
      </View>
    </View>
  );
}

export default AppointmentPage;
