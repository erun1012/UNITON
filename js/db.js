//User function

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
  // 1. 중복 체크 (name 필드로 체크)
  const q = query(collection(db, 'users'), where('name', '==', user.name));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    console.log(`❌ 사용자 ${user.name}는 이미 존재합니다.`);
    throw new Error('이미 존재하는 아이디입니다.');
  }

  // 2. 중복 없으면 저장
  const userData = {
    email: user.email,
    password: user.password,
    name: user.name,          // 사용자 아이디
    role: user.role,          // 보호자 or 이용자
    phone: user.phone,        // 전화번호
  };

  await addDoc(collection(db, 'users'), userData);
  console.log(`✅ 사용자 ${user.name} 등록 완료`);
}

// 로그인
export async function loginUser(name, password) {
  const q = query(
    collection(db, 'users'),
    where('name', '==', name),
    where('password', '==', password)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    console.log('❌ 로그인 실패: 사용자를 찾을 수 없습니다.');
    return null;
  }
  console.log(`✅ 사용자 ${name} 로그인 성공`);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}



/**
 * name(사용자 아이디)으로 사용자 검색
 * @param {string} id - 회원가입 id (name)
 * @returns {Promise<Object|null>} user 객체 또는 없으면 null 반환
 */


export async function getUserById(id) {
  const q = query(
    collection(db, 'users'),
    where('name', '==', id)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    console.log(`사용자 ${id}를 찾을 수 없습니다.`);
    return null;
  }
  
  // name은 유니크하다고 가정하고 첫번째 문서만 반환
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}





//Quiz function
import { collection, addDoc, getDocs, query, where, doc, getDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
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
    // 1. userId로 해당 유저 문서 찾기 (name 필드로 검색)
    const q = query(collection(db, 'users'), where('name', '==', userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.error(`❌ 사용자 ${userId}를 찾을 수 없습니다.`);
      return;
    }

    const userDoc = snapshot.docs[0];

    // 2. 이미지 압축 및 base64 변환
    console.log('🔄 이미지 압축 중...');
    const compressedImage = await compressImage(quiz.imgFile);
    
    // 3. Firestore에 직접 저장 (Storage 사용 안 함)
    console.log('🔄 Firestore에 저장 중...');
    const docRef = await addDoc(collection(db, 'users', userDoc.id, 'quizzes'), {
      userId: quiz.userId,       // 어떤 사용자의 퀴즈인지
      quizzId: quiz.quizzId,     // 퀴즈의 고유 ID
      imgFile: compressedImage,  // base64 문자열로 변환된 이미지
      answer: quiz.answer,       // 퀴즈 정답
      createdAt: new Date(),
      저장방식: 'firestore-base64' // 디버깅용
    });

    console.log(`✅ 사용자 ${userId}에 퀴즈 저장 성공 (Firestore 방식)`);
    return docRef.id; // 생성된 문서 ID 반환
  } catch (error) {
    console.error('❌ 퀴즈 저장 실패:', error);
    throw error;
  }
}

export async function getAllQuizzes(userId) {
  try {
    // 1. userId로 유저 문서 찾기 (name 필드로 검색)
    const q = query(collection(db, 'users'), where('name', '==', userId));
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

// 특정 ID의 퀴즈 하나만 가져오기 (랜덤)
export async function getQuizById(userId, quizId) {
    try {
    // 1. userId로 유저 문서 찾기 (name 필드로 검색)
    const q = query(collection(db, 'users'), where('name', '==', userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.error(`❌ 사용자 ${userId}를 찾을 수 없습니다.`);
      return null;
    }

    const userDoc = snapshot.docs[0];

    // 2. 해당 유저의 quizzes 하위 컬렉션 모두 가져오기
    const quizzesSnap = await getDocs(collection(db, 'users', userDoc.id, 'quizzes'));
    const quizzes = quizzesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (quizzes.length === 0) {
      console.warn('⚠️ 퀴즈가 없습니다.');
      return null;
    }

    // 3. 랜덤 인덱스 생성 후 퀴즈 반환
    const randomIndex = Math.floor(Math.random() * quizzes.length);
    const randomQuiz = quizzes[randomIndex];

    console.log(`🎲 랜덤 퀴즈 반환:`, randomQuiz);
    return randomQuiz;

  } catch (error) {
    console.error('❌ 랜덤 퀴즈 조회 실패:', error);
    return null;
  }
}

// 퀴즈 삭제
export async function deleteQuiz(userId, quizId) {
  try {
    // 1. userId로 유저 문서 찾기 (name 필드로 검색)
    const q = query(collection(db, 'users'), where('name', '==', userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.error(`❌ 사용자 ${userId}를 찾을 수 없습니다.`);
      return false;
    }

    const userDoc = snapshot.docs[0];

    // 2. 퀴즈 문서 삭제
    await deleteDoc(doc(db, 'users', userDoc.id, 'quizzes', quizId));
    
    console.log(`🗑️ 퀴즈 ${quizId} 삭제 성공`);
    return true;
  } catch (error) {
    console.error('❌ 퀴즈 삭제 실패:', error);
    return false;
  }
}

// 퀴즈 수정
export async function editQuiz(userId, quizId, updatedData) {
  try {
    // 1. userId로 유저 문서 찾기 (name 필드로 검색)
    const q = query(collection(db, 'users'), where('name', '==', userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.error(`❌ 사용자 ${userId}를 찾을 수 없습니다.`);
      return false;
    }

    const userDoc = snapshot.docs[0];

    // 2. 업데이트할 데이터 준비
    const updateFields = { ...updatedData };
    
    // 만약 새로운 이미지 파일이 있다면 압축 처리
    if (updatedData.imgFile && updatedData.imgFile instanceof File) {
      console.log('🔄 새 이미지 압축 중...');
      updateFields.imgFile = await compressImage(updatedData.imgFile);
    }
    
    // 수정 시간 추가
    updateFields.updatedAt = new Date();

    // 3. 퀴즈 문서 업데이트
    await updateDoc(doc(db, 'users', userDoc.id, 'quizzes', quizId), updateFields);
    
    console.log(`✏️ 퀴즈 ${quizId} 수정 성공`);
    return true;
  } catch (error) {
    console.error('❌ 퀴즈 수정 실패:', error);
    return false;
  }
}


//Token function
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



//Notification function
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
