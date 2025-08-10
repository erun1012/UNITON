// User.js
// firebase 웹으로 설정한 상태.
// npx http-server .  명령어로 파일 내에 함수 이름과 일치하는 html 파일을 실행해
// 함수가 제대로 작동하는지 확인 가능. html F12 console 화면으로 확인.
// firebase 는 이가희 계정으로 되어있긴 함. 그러나 새롭게 만들어서 설정만 바꾸면
// 다른 위치로 옮길 수 있음.
// html 에서 코드 수정이 안되면 ctrl + shift + R 강제 새로고침으로 해결
// firestore database 에서 user 컬렉션에 user 정보들 저장.

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
  // 1. 중복 체크
  const q = query(collection(db, 'users'), where('userId', '==', user.userId));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    console.log(`❌ 사용자 ${user.userId}는 이미 존재합니다.`);
    throw new Error('이미 존재하는 아이디입니다.');
  }

  // 2. 중복 없으면 저장
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



/**
 * userId로 사용자 검색
 * @param {string} id - 회원가입 id (userId)
 * @returns {Promise<Object|null>} user 객체 또는 없으면 null 반환
 */


export async function getUserById(id) {
  const q = query(
    collection(db, 'users'),
    where('userId', '==', id)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    console.log(`사용자 ${id}를 찾을 수 없습니다.`);
    return null;
  }
  
  // userId는 유니크하다고 가정하고 첫번째 문서만 반환
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}