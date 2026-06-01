import React, { useEffect, useState } from 'react';
import { Text, View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { approveTeacherAppointment, getTeacherAppointments, rejectTeacherAppointment } from '@/services/api';
import type { AppointmentItem } from '@/types';
import styles from './index.module.scss';

function TeacherReviewPage() {
  const [items, setItems] = useState<AppointmentItem[]>([]);

  const load = () => {
    getTeacherAppointments().then(setItems).catch((error) => {
      console.error('[TeacherReview] load failed', error);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    });
  };

  useEffect(load, []);
  useDidShow(load);

  const handleApprove = async (id: number) => {
    try {
      await approveTeacherAppointment(id);
      Taro.showToast({ title: '已通过', icon: 'success' });
      load();
    } catch (error) {
      console.error('[TeacherReview] approve failed', error);
      Taro.showToast({ title: '审批失败', icon: 'none' });
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectTeacherAppointment(id);
      Taro.showToast({ title: '已拒绝', icon: 'success' });
      load();
    } catch (error) {
      console.error('[TeacherReview] reject failed', error);
      Taro.showToast({ title: '审批失败', icon: 'none' });
    }
  };

  return (
    <View className={styles.container}>
      {items.map((item) => (
        <View key={item.id} className={styles.card}>
          <Text className={styles.title}>{item.realName || '返校校友'} · {item.visitDate}</Text>
          <Text className={styles.meta}>到校事由：{item.purpose}</Text>
          <Text className={styles.meta}>同行人数：{item.companionCount}</Text>
          {item.companions?.length ? <Text className={styles.meta}>同行信息：{item.companions.map((companion) => companion.name).join('、')}</Text> : null}
          <Text className={styles.status}>{item.status}</Text>
          {item.status === '待审核' ? (
            <View className={styles.actionRow}>
              <View className={styles.approve} onClick={() => handleApprove(item.id)}>
                <Text className={styles.approveText}>通过</Text>
              </View>
              <View className={styles.reject} onClick={() => handleReject(item.id)}>
                <Text className={styles.rejectText}>拒绝</Text>
              </View>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

export default TeacherReviewPage;
