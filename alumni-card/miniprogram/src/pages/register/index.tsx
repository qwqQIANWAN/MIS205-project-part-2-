import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { getProfile, loginWithWechat, logout } from '@/services/api';
import { STORAGE_KEY_TOKEN } from '@/services/config';
import type { UserProfile } from '@/types';
import styles from './index.module.scss';

function getErrorMessage(error: unknown) {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const maybeError = error as { errMsg?: string; message?: string };
    return maybeError.errMsg || maybeError.message || '登录失败';
  }
  return '登录失败';
}

function RegisterPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const loadProfile = () => {
    getProfile().then(setProfile).catch((error) => console.error('[Register] load failed', error));
  };

  useEffect(loadProfile, []);
  useDidShow(loadProfile);

  const hasToken = Boolean(Taro.getStorageSync(STORAGE_KEY_TOKEN));
  const step = useMemo(() => {
    if (!hasToken) return 1;
    if (!profile?.isRegistered) return 2;
    if (!profile?.isVerified) return 3;
    return 4;
  }, [hasToken, profile?.isRegistered, profile?.isVerified]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const nextProfile = await loginWithWechat();
      setProfile(nextProfile);
      Taro.showToast({ title: '登录成功', icon: 'success' });
    } catch (error) {
      Taro.showToast({ title: getErrorMessage(error), icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className={styles.container}>
      <View className={styles.hero}>
        <Text className={styles.heroTitle}>注册与身份认证</Text>
        <Text className={styles.heroDesc}>按步骤完成微信登录、手机号注册、校友认证和老师身份绑定。</Text>
      </View>

      <View className={styles.stepCard}>
        <Text className={styles.stepTitle}>当前进度</Text>
        <Text className={styles.stepValue}>第 {step} 步 / 4 步</Text>
        <Text className={styles.stepDesc}>状态：{profile?.alumniStatus || (hasToken ? '待注册' : '未登录')}</Text>
      </View>

      {!hasToken ? (
        <View className={styles.actionCard}>
          <Text className={styles.cardTitle}>第一步：微信登录</Text>
          <Text className={styles.cardDesc}>获取当前微信身份后，才能创建你的校友卡账号。</Text>
          <View className={styles.primaryAction} onClick={loading ? undefined : handleLogin}>
            <Text className={styles.primaryActionText}>{loading ? '登录中...' : '立即微信登录'}</Text>
          </View>
        </View>
      ) : null}

      {hasToken && !profile?.isRegistered ? (
        <View className={styles.actionCard}>
          <Text className={styles.cardTitle}>第二步：填写注册信息</Text>
          <Text className={styles.cardDesc}>补充真实姓名和手机号，用于创建个人账号。</Text>
          <View className={styles.secondaryAction} onClick={() => Taro.navigateTo({ url: '/pages/profile/register/index' })}>
            <Text className={styles.secondaryActionText}>去注册</Text>
          </View>
        </View>
      ) : null}

      {hasToken && profile?.isRegistered && !profile?.isVerified ? (
        <View className={styles.actionCard}>
          <Text className={styles.cardTitle}>第三步：提交校友认证</Text>
          <Text className={styles.cardDesc}>补充班级、毕业届次、当前高校信息并上传证件照片。</Text>
          <View className={styles.secondaryAction} onClick={() => Taro.navigateTo({ url: '/pages/profile/complete/index' })}>
            <Text className={styles.secondaryActionText}>
              {profile.alumniStatus === '待审核' ? '继续查看 / 修改' : '去完善资料'}
            </Text>
          </View>
        </View>
      ) : null}

      {hasToken ? (
        <View className={styles.actionCard}>
          <Text className={styles.cardTitle}>第四步：老师身份绑定</Text>
          <Text className={styles.cardDesc}>校内老师可绑定老师档案，在手机端审批学生返校预约。</Text>
          <View className={styles.secondaryAction} onClick={() => Taro.navigateTo({ url: '/pages/profile/teacher-bind/index' })}>
            <Text className={styles.secondaryActionText}>{profile?.isTeacher ? '查看老师身份' : '绑定老师身份'}</Text>
          </View>
        </View>
      ) : null}

      {hasToken ? (
        <View className={styles.logoutAction} onClick={() => {
          logout();
          loadProfile();
          Taro.showToast({ title: '已退出登录', icon: 'success' });
        }}>
          <Text className={styles.logoutText}>退出当前账号</Text>
        </View>
      ) : null}
    </View>
  );
}

export default RegisterPage;
