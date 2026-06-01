import React, { useEffect, useMemo, useState } from 'react';
import { Input, Picker, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { createAppointment, getTeachers } from '@/services/api';
import type { TeacherItem } from '@/types';
import styles from './index.module.scss';

function AppointmentCreatePage() {
  const [visitDate, setVisitDate] = useState('2026-06-30');
  const [purpose, setPurpose] = useState('返校参观并拜访老师');
  const [companionCount, setCompanionCount] = useState('1');
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [teacherIndex, setTeacherIndex] = useState(0);

  useEffect(() => {
    getTeachers().then(setTeachers).catch((error) => console.error('[AppointmentCreate] teachers failed', error));
  }, []);

  const selectedTeacher = useMemo(() => teachers[teacherIndex], [teacherIndex, teachers]);

  const handleSubmit = async () => {
    if (!selectedTeacher) {
      Taro.showToast({ title: '请选择参访老师', icon: 'none' });
      return;
    }

    try {
      await createAppointment({
        visitDate,
        purpose,
        companionCount: Number(companionCount || 0),
        teacherId: selectedTeacher.id,
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
        <Text className={styles.label}>参访老师</Text>
        <Picker
          mode='selector'
          range={teachers}
          rangeKey='name'
          onChange={(event) => setTeacherIndex(Number(event.detail.value))}
        >
          <View className={styles.input}>
            <Text>{selectedTeacher ? `${selectedTeacher.name} ${selectedTeacher.title || ''}` : '请选择老师'}</Text>
          </View>
        </Picker>
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
