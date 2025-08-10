// User.js
import { db } from './firebase-config.js';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  doc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 새 사용자 추가
export async function addUser(user) {
  const userData = {
    userId: user.userId,
    userPw: user.userPw,
    createdAt: serverTimestamp()
  };
  await addDoc(collection(db, 'users'), userData);
  console.log(`✅ 사용자 ${user.userId} 등록 완료`);
}

// 로그인
export async function loginUser(userId, userPw) {
  const q = query(
    collection(db, 'users'),
    where('userId', '==', userId),
    where('userPw', '==', userPw)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    console.log('❌ 로그인 실패: 사용자를 찾을 수 없습니다.');
    return null;
  }
  console.log(`✅ 사용자 ${userId} 로그인 성공`);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
