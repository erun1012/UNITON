import { db } from './firebase-config.js';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  doc, 
  serverTimestamp,
  Timestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/**
 * 사용자 이름(name)으로 사용자 문서 ID 조회
 * @param {string} userName - users 컬렉션의 name 필드 값
 * @returns {Promise<string|null>} 문서 ID 또는 null
 */
async function getUserDocIdByName(userName) {
  const q = query(collection(db, 'users'), where('name', '==', userName));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].id;
}

/**
 * 푸시 토큰 저장/업데이트 (Upsert)
 * @param {Object} tokenData
 * @param {string} tokenData.userId - 사용자 ID (name 필드 값)
 * @param {string} tokenData.token - FCM 푸시 토큰
 * @param {string} tokenData.platform - 플랫폼 (android, ios, web)
 * @returns {Promise<boolean>} 성공 여부
 */
export async function upsertDeviceToken({ userId, token, platform }) {
  try {
    // 사용자 문서 ID 조회
    const userDocId = await getUserDocIdByName(userId);
    if (!userDocId) {
      console.error(`❌ 사용자 ${userId}를 찾을 수 없습니다.`);
      return false;
    }

    // 같은 사용자+플랫폼 토큰 있는지 검색
    const q = query(
      collection(db, 'deviceTokens'),
      where('userId', '==', userDocId),
      where('platform', '==', platform)
    );
    const existingTokens = await getDocs(q);

    if (!existingTokens.empty) {
      // 기존 토큰 있으면 업데이트
      const existingDoc = existingTokens.docs[0];
      await updateDoc(doc(db, 'deviceTokens', existingDoc.id), {
        token,
        updatedAt: serverTimestamp(),
        isActive: true,
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 30*24*60*60*1000)) // 30일 후
      });
    } else {
      // 새 토큰 생성
      await addDoc(collection(db, 'deviceTokens'), {
        userId: userDocId,
        token,
        platform,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 30*24*60*60*1000))
      });
    }

    return true;
  } catch (error) {
    console.error('토큰 저장/업데이트 실패:', error);
    return false;
  }
}

/**
 * 활성화된 유효 토큰 조회
 * @param {string} userId - 사용자 ID (name 필드 값)
 * @returns {Promise<Array<{token: string, platform: string, updatedAt: any}>>} 토큰 리스트
 */
export async function getActiveTokensByUserId(userId) {
  try {
    // 사용자 문서 ID 조회
    const userDocId = await getUserDocIdByName(userId);
    if (!userDocId) {
      console.error(`❌ 사용자 ${userId}를 찾을 수 없습니다.`);
      return [];
    }

    const q = query(
      collection(db, 'deviceTokens'),
      where('userId', '==', userDocId),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];

    const now = new Date();
    const validTokens = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const expiresAt = data.expiresAt?.toDate();
      const isExpired = expiresAt && expiresAt < now;

      if (!isExpired) {
        validTokens.push({
          token: data.token,
          platform: data.platform,
          updatedAt: data.updatedAt
        });
      } else {
        // 만료 토큰 비활성화
        await updateDoc(doc(db, 'deviceTokens', docSnap.id), {
          isActive: false,
          deactivatedAt: serverTimestamp()
        });
      }
    }

    return validTokens;
  } catch (error) {
    console.error('활성 토큰 조회 실패:', error);
    return [];
  }
}
