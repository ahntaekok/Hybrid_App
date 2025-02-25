import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Alert, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Constants from 'expo-constants';
import { WebView } from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Expo Push Token 요청 함수
const registerForPushNotifications = async () => {
  try {
    // 안드로이드 전용 알림 채널 설정 (iOS는 필요 없음)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      //알림 설정 유무 안내
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('푸시 알림 권한이 거부됨');
      return;
    }

    // Expo Push Token 가져오기
    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync();
    console.log('Expo Push Token:', expoPushToken);

    // 백엔드 서버로 Push Token 전송
    await fetch('https://raonpick.com/register_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: expoPushToken }),
    });

    return expoPushToken;
  } catch (error) {
    console.error('Expo Push Token 등록 실패:', error);
  }
};

export default function App() {
  const webviewRef = useRef(null); // WebView 참조
  const canGoBackRef = useRef(false); // 뒤로 가기 가능 여부 저장
  const [expoPushToken, setExpoPushToken] = useState('');

  useEffect(() => {
    // 푸시 알림 토큰 등록
    const enablePortrait = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
    };
    enablePortrait();

    // 푸시 알림 토큰 등록
    registerForPushNotifications().then(token => {
      if (token) setExpoPushToken(token);
    });

    // 뒤로 가기 버튼 핸들러
    const backAction = () => {
      if (canGoBackRef.current) {
        webviewRef.current.goBack();
        return true;
      }

      Alert.alert('앱을 종료하시겠습니까?', '', [
        { text: '취소', style: 'cancel' },
        { text: '종료', onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('백그라운드에서 받은 알림:', response);
    });

    return () => {
      backHandler.remove();
      ScreenOrientation.unlockAsync();
      subscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.safeArea}>
      <WebView
        ref={webviewRef}
        style={styles.container}
        source={{ uri: 'https://raonpick.com/' }} // 웹앱 URL
        onNavigationStateChange={(navState) => {
          canGoBackRef.current = navState.canGoBack; // 이전 페이지 여부 업데이트
        }}
        allowsBackForwardNavigationGestures={true} // 제스처 활성화
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    marginTop: Constants.statusBarHeight
  },
});