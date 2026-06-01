import React, { useState } from 'react';
import { Input, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { registerUser } from '@/services/api';
import styles from './index.module.scss';

function RegisterPage() {
  const [realName, setRealName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async () => {
    if (!realName.trim() || !phone.trim()) {
      Taro.showToast({ title: '请填写姓名和手机号', icon: 'none' });
      return;
    }

    try {
      await registerUser({
        realName: realName.trim(),
        phone: phone.trim(),
      });
      Taro.showToast({ title: '注册成功', icon: 'success' });
      setTimeout(() => {
        Taro.navigateBack();
      }, 500);
    } catch (error) {
      console.error('[Register] submit failed', error);
      Taro.showToast({ title: '注册失败', icon: 'none' });
    }
  };

  return (
    <View className={styles.container}>
      <View className={styles.panel}>
        <Text className={styles.title}>先完成基础注册</Text>
        <Text className={styles.desc}>注册只填写真实姓名与联系电话，后续再补充班级、当前就读高校与证件照片。</Text>

        <Text className={styles.label}>真实姓名</Text>
        <Input className={styles.input} value={realName} placeholder='请输入真实姓名' onInput={(event) => setRealName(event.detail.value)} />

        <Text className={styles.label}>手机号</Text>
        <Input className={styles.input} type='number' value={phone} placeholder='请输入手机号' onInput={(event) => setPhone(event.detail.value)} />

        <View className={styles.submit} onClick={handleSubmit}>
          <Text className={styles.submitText}>提交注册</Text>
        </View>
      </View>
    </View>
  );
}

export default RegisterPage;
