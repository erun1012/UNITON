import { collection, addDoc, getDocs, query, where, doc, getDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db } from './firebase-config.js';

// 알림을 저장하는 함수
export async function createNotification(userId, notificationData) {
  try {
    // 1. userId로 해당 유저 문서 찾기
    const q = query(collection(db, 'users'), where('userId', '==', userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.error(`❌ 사용자 ${userId}를 찾을 수 없습니다.`);
      return null;
    }

    const userDoc = snapshot.docs[0];

    // 2. 기존 알림들을 가져와서 다음 notificationId 계산
    const notesSnap = await getDocs(collection(db, 'users', userDoc.id, 'notes'));
    const existingNotifications = notesSnap.docs.map(doc => doc.data());
    
    // 기존 notificationId 중 가장 큰 숫자 찾기
    let maxNotificationId = 0;
    existingNotifications.forEach(note => {
      if (note.notificationId && typeof note.notificationId === 'number') {
        maxNotificationId = Math.max(maxNotificationId, note.notificationId);
      }
    });
    
    // 다음 notificationId는 최대값 + 1
    const nextNotificationId = maxNotificationId + 1;

    // 3. 알림 데이터 검증 및 기본값 설정
    const notification = {
      notificationId: nextNotificationId, // 1부터 순차적으로 카운팅
      title: notificationData.title || '',
      content: notificationData.content || '',
      sendAt: notificationData.sendAt || new Date(),
      sent: notificationData.sent || false,
      createAt: notificationData.createAt || new Date()
    };

    // 4. Firestore의 notes 하위 컬렉션에 저장
    const docRef = await addDoc(collection(db, 'users', userDoc.id, 'notes'), notification);
    
    console.log(`✅ 알림 저장 성공 - NotificationID: ${nextNotificationId}, DocID: ${docRef.id}`);
    return { id: docRef.id, ...notification };
  } catch (error) {
    console.error('❌ 알림 저장 실패:', error);
    throw error;
  }
}

// 특정 notificationId로 알림 하나 가져오기
export async function getNotification(userId, notificationId) {
  try {
    // 1. userId로 유저 문서 찾기
    const q = query(collection(db, 'users'), where('userId', '==', userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.error(`❌ 사용자 ${userId}를 찾을 수 없습니다.`);
      return null;
    }

    const userDoc = snapshot.docs[0];

    // 2. notes 하위 컬렉션에서 notificationId로 검색
    const notesSnap = await getDocs(collection(db, 'users', userDoc.id, 'notes'));
    const notification = notesSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .find(note => note.notificationId === notificationId);

    if (!notification) {
      console.error(`❌ 알림 ${notificationId}를 찾을 수 없습니다.`);
      return null;
    }

    console.log(`🔍 알림 ${notificationId} 조회 성공:`, notification);
    return notification;
  } catch (error) {
    console.error('❌ 알림 조회 실패:', error);
    return null;
  }
}

// 사용자의 모든 알림 가져오기
export async function getNotifications(userId) {
  try {
    // 1. userId로 유저 문서 찾기
    const q = query(collection(db, 'users'), where('userId', '==', userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.error(`❌ 사용자 ${userId}를 찾을 수 없습니다.`);
      return [];
    }

    const userDoc = snapshot.docs[0];

    // 2. 해당 유저의 notes 하위 컬렉션 모두 가져오기
    const notesSnap = await getDocs(collection(db, 'users', userDoc.id, 'notes'));
    const notifications = notesSnap.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));

    // 3. createAt 기준으로 최신순 정렬
    notifications.sort((a, b) => {
      const dateA = a.createAt?.toDate ? a.createAt.toDate() : new Date(a.createAt.seconds * 1000);
      const dateB = b.createAt?.toDate ? b.createAt.toDate() : new Date(b.createAt.seconds * 1000);
      return dateB - dateA; // 최신순
    });

    console.log(`📋 사용자 ${userId}의 알림 목록:`, notifications.length, '개');
    return notifications;
  } catch (error) {
    console.error('❌ 알림 목록 조회 실패:', error);
    return [];
  }
}

// 알림 수정하는 함수
export async function updateNotification(userId, notificationId, updatedData) {
  try {
    // 1. userId로 유저 문서 찾기
    const q = query(collection(db, 'users'), where('userId', '==', userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.error(`❌ 사용자 ${userId}를 찾을 수 없습니다.`);
      return false;
    }

    const userDoc = snapshot.docs[0];

    // 2. notificationId로 해당 알림 문서 찾기
    const notesSnap = await getDocs(collection(db, 'users', userDoc.id, 'notes'));
    const notificationDoc = notesSnap.docs.find(doc => 
      doc.data().notificationId === notificationId
    );

    if (!notificationDoc) {
      console.error(`❌ 알림 ${notificationId}를 찾을 수 없습니다.`);
      return false;
    }

    // 3. 업데이트할 데이터 준비
    const updateFields = { ...updatedData };
    updateFields.updatedAt = new Date(); // 수정 시간 추가

    // 4. 알림 문서 업데이트
    await updateDoc(doc(db, 'users', userDoc.id, 'notes', notificationDoc.id), updateFields);
    
    console.log(`✏️ 알림 ${notificationId} 수정 성공`);
    return true;
  } catch (error) {
    console.error('❌ 알림 수정 실패:', error);
    return false;
  }
}

// 알림 삭제하는 함수
export async function deleteNotification(userId, notificationId) {
  try {
    // 1. userId로 유저 문서 찾기
    const q = query(collection(db, 'users'), where('userId', '==', userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.error(`❌ 사용자 ${userId}를 찾을 수 없습니다.`);
      return false;
    }

    const userDoc = snapshot.docs[0];

    // 2. notificationId로 해당 알림 문서 찾기
    const notesSnap = await getDocs(collection(db, 'users', userDoc.id, 'notes'));
    const notificationDoc = notesSnap.docs.find(doc => 
      doc.data().notificationId === notificationId
    );

    if (!notificationDoc) {
      console.error(`❌ 알림 ${notificationId}를 찾을 수 없습니다.`);
      return false;
    }

    // 3. 알림 문서 삭제
    await deleteDoc(doc(db, 'users', userDoc.id, 'notes', notificationDoc.id));
    
    console.log(`🗑️ 알림 ${notificationId} 삭제 성공`);
    return true;
  } catch (error) {
    console.error('❌ 알림 삭제 실패:', error);
    return false;
  }
}