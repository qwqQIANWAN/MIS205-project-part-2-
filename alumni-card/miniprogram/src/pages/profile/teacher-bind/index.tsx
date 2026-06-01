import React, { useState } from 'react';
import { Input, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { bindTeacherIdentity } from '@/services/api';
import styles from './index.module.scss';

function getErrorMessage(error: unknown) {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const maybeError = error as { errMsg?: string; message?: string };
    return maybeError.errMsg || maybeError.message || '绑定失败';
  }
  return '绑定失败';
}

function TeacherBindPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      Taro.showToast({ title: '请填写姓名和手机号', icon: 'none' });
      return;
    }

    try {
      await bindTeacherIdentity({
        name: name.trim(),
        phone: phone.trim(),
      });
      Taro.showToast({ title: '绑定成功', icon: 'success' });
      setTimeout(() => {
        Taro.navigateBack();
      }, 500);
    } catch (error) {
      console.error('[TeacherBind] submit failed', error);
      Taro.showToast({ title: getErrorMessage(error), icon: 'none' });
    }
  };

  return (
    <View className={styles.container}>
      <View className={styles.panel}>
        <Text className={styles.title}>绑定老师审批身份</Text>
        <Text className={styles.desc}>请填写与你在后台老师档案中一致的姓名和手机号，绑定后即可在小程序内处理返校预约。</Text>

        <Text className={styles.label}>老师姓名</Text>
        <Input className={styles.input} value={name} placeholder='请输入老师姓名' onInput={(event) => setName(event.detail.value)} />

        <Text className={styles.label}>手机号</Text>
        <Input className={styles.input} type='number' value={phone} placeholder='请输入手机号' onInput={(event) => setPhone(event.detail.value)} />

        <View className={styles.submit} onClick={handleSubmit}>
          <Text className={styles.submitText}>确认绑定</Text>
        </View>
      </View>
    </View>
  );
}

export default TeacherBindPage;
