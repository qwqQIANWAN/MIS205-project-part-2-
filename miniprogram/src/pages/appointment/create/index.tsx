import React, { useState } from 'react';
import { Input, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { createAppointment } from '@/services/api';
import styles from './index.module.scss';

function AppointmentCreatePage() {
  const [visitDate, setVisitDate] = useState('2026-06-30');
  const [purpose, setPurpose] = useState('返校参观并拜访老师');
  const [companionCount, setCompanionCount] = useState('1');

  const handleSubmit = async () => {
    try {
      await createAppointment({
        visitDate,
        purpose,
        companionCount: Number(companionCount || 0),
      });
      Taro.showToast({ title: '提交成功', icon: 'success' });
      setTimeout(() => {
        Taro.navigateBack();
      }, 500);
    } catch (error) {
      console.error('[AppointmentCreate] submit failed', error);
      Taro.showToast({ title: '提交失败', icon: 'none' });
    }
  };

  return (
    <View className={styles.container}>
      <View className={styles.panel}>
        <Text className={styles.label}>到校日期</Text>
        <Input className={styles.input} value={visitDate} onInput={(event) => setVisitDate(event.detail.value)} />
        <Text className={styles.label}>到校事由</Text>
        <Input className={styles.input} value={purpose} onInput={(event) => setPurpose(event.detail.value)} />
        <Text className={styles.label}>同行人数</Text>
        <Input className={styles.input} type='number' value={companionCount} onInput={(event) => setCompanionCount(event.detail.value)} />
        <View className={styles.submit} onClick={handleSubmit}>
          <Text className={styles.submitText}>提交预约</Text>
        </View>
      </View>
    </View>
  );
}

export default AppointmentCreatePage;
