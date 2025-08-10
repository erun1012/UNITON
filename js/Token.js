// push-tokens.js
import { collection, query, where, getDocs, addDoc, updateDoc, doc } 
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db } from './firebase-config.js';

/**
 * userId 하위 tokens 컬렉션에 token 문서 생성 또는 업데이트
 * @param {Object} param0 
 * @param {string} param0.userId - 사용자 ID
 * @param {string} param0.token - 디바이스 푸시 토큰
 * @param {string} param0.platform - 플랫폼 (android, ios, web 등)
 */
export async function upsertDeviceToken({ userId, token, platform }) {
  if (!userId || !token) throw new Error("userId와 token은 필수입니다.");

  const tokenDocRef = doc(db, "users", userId, "tokens", token);

  const tokenData = {
    token,
    platform,
    active: true,
    updatedAt: new Date(),
  };

  try {
    await setDoc(tokenDocRef, tokenData, { merge: true }); // merge: 기존 데이터 유지하며 업데이트
    return true;
  } catch (error) {
    console.error("토큰 저장 오류:", error);
    return false;
  }
}

/**
 * 특정 userId의 active=true 상태인 토큰들 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Array<string>>} 활성화된 토큰 문자열 배열 반환
 */
export async function getActiveTokensByUserId(userId) {
  if (!userId) throw new Error("userId는 필수입니다.");

  const tokensColRef = collection(db, "users", userId, "tokens");
  const activeTokensQuery = query(tokensColRef, where("active", "==", true));

  try {
    const querySnapshot = await getDocs(activeTokensQuery);
    const tokens = [];
    querySnapshot.forEach(doc => {
      tokens.push(doc.data().token);
    });
    return tokens;
  } catch (error) {
    console.error("활성 토큰 조회 오류:", error);
    return [];
  }
}
