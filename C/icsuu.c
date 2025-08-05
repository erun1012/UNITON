#include <stdio.h>
#include <string.h>
#include <stdlib.h>

//구조체 선언
struct stu {
    char name[10];
    int id;
    float key;
};

//구조체 초기화
struct stu st_a[20] = {{"Sophia",20220001,153.1},{"Olivia",20220010,158.5},{"Riley",20220002,163},{"Emma",20220015,160.3},{"Ava",20220009,155.6},
                    {"Isabella",20220014,168.8},{"Aria",20220020,150.2},{"Amelia",20220005,162.5},{"Mia",20220016,170.2},{"Liam",20220008,180.9},
                    {"Noah",20220012,174.9},{"Jackson",20220004,191.1},{"Aiden",20220018,188.8},{"Elijah",20220017,169.7},{"Grayson",20220003,174.2},
                    {"Lucas",20220013,188.7},{"Oliver",20220007,170.5},{"Caden",20220019,173.3},{"Mateo",20220011,169.9},{"David",20220006,188.8}};

//이름 비교 함수
int compare_name (const void *p, const void *q) {
    const struct stu *a =p;
    const struct stu *b =q;
    return strcmp(a->name,b->name);

}

//id 비교 함수
int compare_id (const void *p, const void *q) {
    const struct stu *a =p;
    const struct stu *b =q;
    if ((a->id) > (b->id)) return 1;
    else if ((a->id) < (b->id)) return -1;
    else return 0;
}

//키 비교 함수
int compare_key(const void *p,const void *q) {
    const struct stu *a =p;
    const struct stu *b =q;

    if ((a->key)>(b->key)) return -1;
    else if ((a->key)<(b->key)) return 1;
    else return 0;

}

//case 1 출력
void output_1 (struct stu st_a[20]){
    qsort(st_a,20,sizeof(struct stu),compare_name);
    printf("이름       아이디      키\n");
    for(int i=0;i<20;i++){
        printf("%-10s %-10d %-10.1f\n",st_a[i].name,st_a[i].id,st_a[i].key);
    }
}

//case 2 출력
void output_2 (struct stu st_a[20]){
    qsort(st_a,20,sizeof(struct stu),compare_id);
    printf("이름       아이디      키\n");
    for(int i=0;i<20;i++){
        printf("%-10s %-10d %-10.1f\n",st_a[i].name,st_a[i].id,st_a[i].key);
    }
}

//case 3 출력
void output_3 (struct stu st_a[20]){
    qsort(st_a,20,sizeof(struct stu),compare_key);
    printf("이름       아이디      키\n");
    for(int i=0;i<20;i++){
        printf("%-10s %-10d %-10.1f\n",st_a[i].name,st_a[i].id,st_a[i].key);
    }
}

//case 4 출력
void output_4 (struct stu st_a[],const char *txt){

    for(int i=0;i<20;i++){
        if(strcmp(txt,st_a[i].name)==0){
            printf("이름       아이디      키\n");
            printf("%-10s %-10d %-10.1f\n",txt,st_a[i].id,st_a[i].key);
            break;
        }
    }
}

//main
int main() {
    int num;
    //기존 데이터 값 변화 방지 초기화
    while (1) {
        struct stu st_a[20] = {{"Sophia",20220001,153.1},{"Olivia",20220010,158.5},{"Riley",20220002,163},{"Emma",20220015,160.3},{"Ava",20220009,155.6},
                   {"Isabella",20220014,168.8},{"Aria",20220020,150.2},{"Amelia",20220005,162.5},{"Mia",20220016,170.2},{"Liam",20220008,180.9},
                   {"Noah",20220012,174.9},{"Jackson",20220004,191.1},{"Aiden",20220018,188.8},{"Elijah",20220017,169.7},{"Grayson",20220003,174.2},
                   {"Lucas",20220013,188.7},{"Oliver",20220007,170.5},{"Caden",20220019,173.3},{"Mateo",20220011,169.9},{"David",20220006,188.8}};


        printf("1. 이름 오름차순 출력    2. 아이디 오름차순\n3. 키 내림차순 출력      4. 이름 검색\n5. 종료\n");
        printf("번호를 선택하세요 :  ");
        scanf(" %d",&num);

        //5 입력 시 while문 break
        if(num==5){
            printf("프로그램을 종료합니다.");
            break;
        }

        //1~4 분류
        switch (num)
        {
            case 1:
                output_1(st_a);
            printf("\n");
            break;
            case 2:
                output_2(st_a);
            printf("\n");
            break;
            case 3:
                output_3(st_a);
            printf("\n");
            break;
            case 4:
                printf("이름을 입력하세요 : ");
            char txt[10];
            scanf("%s",txt);
            output_4(st_a,txt);
            printf("\n");
            break;
        }

    }
}
