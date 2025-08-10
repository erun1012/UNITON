import { collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db } from './firebase-config.js';

// 파일을 base64로 변환 (Storage 완전 우회)
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 이미지 압축 함수 (용량 제한 때문에)
function compressImage(file, maxWidth = 800, quality = 0.8) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 비율 유지하면서 크기 조정
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      // 이미지 그리기
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // 압축된 base64로 변환
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

export async function addQuiz(userId, quiz) {
  try {
    // 1. userId로 해당 유저 문서 찾기
    const q = query(collection(db, 'users'), where('userId', '==', userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.error(`❌ 사용자 ${userId}를 찾을 수 없습니다.`);
      return;
    }

    const userDoc = snapshot.docs[0];

    // 2. 이미지 압축 및 base64 변환
    console.log('🔄 이미지 압축 중...');
    const compressedImage = await compressImage(quiz.사진);
    
    // 3. Firestore에 직접 저장 (Storage 사용 안 함)
    console.log('🔄 Firestore에 저장 중...');
    await addDoc(collection(db, 'users', userDoc.id, 'quizzes'), {
      사진: compressedImage, // base64 문자열
      정답: quiz.정답,
      createdAt: new Date(),
      저장방식: 'firestore-base64' // 디버깅용
    });

    console.log(`✅ 사용자 ${userId}에 퀴즈 저장 성공 (Firestore 방식)`);
  } catch (error) {
    console.error('❌ 퀴즈 저장 실패:', error);
    throw error;
  }
}

export async function getAllQuizzes(userId) {
  try {
    // 1. userId로 유저 문서 찾기
    const q = query(collection(db, 'users'), where('userId', '==', userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.error(`❌ 사용자 ${userId}를 찾을 수 없습니다.`);
      return [];
    }

    const userDoc = snapshot.docs[0];

    // 2. 해당 유저의 quizzes 하위 컬렉션 읽기
    const quizzesSnap = await getDocs(collection(db, 'users', userDoc.id, 'quizzes'));
    const quizzes = quizzesSnap.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));

    console.log(`📋 사용자 ${userId}의 퀴즈 목록:`, quizzes.length, '개');
    return quizzes;
  } catch (error) {
    console.error('❌ 퀴즈 불러오기 실패:', error);
    return [];
  }
}