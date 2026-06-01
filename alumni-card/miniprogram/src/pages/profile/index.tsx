import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { getProfile, loginWithWechat, logout } from '@/services/api';
import type { UserProfile } from '@/types';
import { STORAGE_KEY_TOKEN } from '@/services/config';
import styles from './index.module.scss';

function getErrorMessage(error: unknown) {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const maybeError = error as { errMsg?: string; message?: string };
    return maybeError.errMsg || maybeError.message || '登录失败';
  }
  return '登录失败';
}

function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const loadProfile = () => {
    getProfile().then(setProfile).catch((error) => console.error('[Profile] load failed', error));
  };

  useEffect(loadProfile, []);
  useDidShow(loadProfile);

  const hasToken = Boolean(Taro.getStorageSync(STORAGE_KEY_TOKEN));

  const entries = useMemo(() => {
    const list = [
      { label: '我的校友卡', value: '查看注册信息与审核状态', url: '/pages/alumni-card/index' },
      { label: '返校预约', value: '填写返校申请并查看进度', url: '/pages/appointment/index' },
      { label: '文章资讯', value: '浏览学校动态与校友通知', url: '/pages/articles/index' },
      { label: '校友风采', value: '查看优秀校友故事', url: '/pages/interviews/index' },
    ];

    if (profile?.isTeacher) {
      list.unshift({
        label: '老师审批',
        value: '审批分配给我的返校预约',
        url: '/pages/teacher/review/index',
      });
    }

    return list;
  }, [profile?.isTeacher]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const nextProfile = await loginWithWechat();
      setProfile(nextProfile);
      Taro.showToast({ title: '登录成功', icon: 'success' });
    } catch (error) {
      console.error('[Profile] login failed', error);
      Taro.showToast({ title: getErrorMessage(error), icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    loadProfile();
    Taro.showToast({ title: '已退出登录', icon: 'success' });
  };

  return (
    <View className={styles.container}>
      <View className={styles.profileCard}>
        <Text className={styles.name}>{profile?.realName || '欢迎使用 sx校友卡'}</Text>
        <Text className={styles.meta}>
          {hasToken ? `${profile?.className || '资料待完善'} · ${profile?.graduationYear || '待补充'}届` : '登录后即可完成注册与资料审核'}
        </Text>
        <Text className={styles.meta}>当前状态：{profile?.alumniStatus || '未登录'}</Text>
        <View className={styles.badgeRow}>
          <Text className={styles.badge}>{profile?.isRegistered ? '已注册' : '待注册'}</Text>
          {profile?.isTeacher ? <Text className={styles.badge}>老师身份</Text> : null}
        </View>
      </View>

      {!hasToken ? (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>第一步：微信登录</Text>
          <Text className={styles.sectionDesc}>进入“我的”后先完成登录，后续才能注册姓名、手机号并提交校友资料。</Text>
          <View className={styles.primaryAction} onClick={loading ? undefined : handleLogin}>
            <Text className={styles.primaryActionText}>{loading ? '登录中...' : '立即登录'}</Text>
          </View>
        </View>
      ) : null}

      {hasToken && !profile?.isRegistered ? (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>第二步：完成注册</Text>
          <Text className={styles.sectionDesc}>注册只需填写姓名和手机号，注册后再补充就读高校、院系、专业与证件照片。</Text>
          <View className={styles.primaryAction} onClick={() => Taro.navigateTo({ url: '/pages/profile/register/index' })}>
            <Text className={styles.primaryActionText}>去注册</Text>
          </View>
        </View>
      ) : null}

      {hasToken && profile?.isRegistered && !profile?.isVerified ? (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>第三步：完善校友资料</Text>
          <Text className={styles.sectionDesc}>
            请补充高中班级、毕业届次、当前就读高校/院系/专业，并上传学生证或毕业证，等待管理员人工审核。
          </Text>
          <View className={styles.primaryAction} onClick={() => Taro.navigateTo({ url: '/pages/profile/complete/index' })}>
            <Text className={styles.primaryActionText}>{profile.alumniStatus === '待审核' ? '修改并重新提交' : '去完善资料'}</Text>
          </View>
        </View>
      ) : null}

      {hasToken && !profile?.isTeacher ? (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>老师身份绑定</Text>
          <Text className={styles.sectionDesc}>如果你是校内老师，可绑定老师身份后在小程序内审批返校预约。</Text>
          <View className={styles.secondaryAction} onClick={() => Taro.navigateTo({ url: '/pages/profile/teacher-bind/index' })}>
            <Text className={styles.secondaryActionText}>绑定老师身份</Text>
          </View>
        </View>
      ) : null}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>常用功能</Text>
        {entries.map((item) => (
          <View key={item.label} className={styles.item} onClick={() => Taro.navigateTo({ url: item.url })}>
            <Text className={styles.label}>{item.label}</Text>
            <Text className={styles.value}>{item.value}</Text>
          </View>
        ))}
      </View>

      {hasToken ? (
        <View className={styles.logoutAction} onClick={handleLogout}>
          <Text className={styles.logoutText}>退出当前账号</Text>
        </View>
      ) : null}
    </View>
  );
}

export default ProfilePage;
