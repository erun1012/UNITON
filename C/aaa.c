#include <stdio.h>

int main() {
    int x;
    scanf("%d",&x);
int cnt=0;

    while(x>1){
        if(x%3==0){
            x/=3;
            cnt++;
        }else if(x%2==0){
            x/=2;
            cnt++;
        }else x-=1;
        
    }

    printf("%d",cnt);

}
