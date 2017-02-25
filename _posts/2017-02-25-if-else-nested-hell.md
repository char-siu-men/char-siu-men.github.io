---
layout: post
title:  "if else nested hell を回避する3つの方法"
date:   2017-02-25 10:00:00 +0900
categories: blog programming
tags:
  - プログラミング
---

callback hell とか、最近では、Promise hell なんてのも、よく見聞きします。  

もっと、古いところでは、 if else の中に if-else が入れ子で入ってしまう、地獄がありました。  

今でも、プログラミング歴の浅い、学生のアルバイトの人たちから、ときどき、回避策を尋ねられることがあります。  

回避する3つのやり方をご紹介します。

地獄
```
if (a) {
  console.log('A 実行');

  if (b) {
    console.log('B 実行');

    if (c) {
      console.log('C 実行');
    }
    else {
      console.log('C 未実行');
    }
  }
  else {
    console.log('B 未実行');
  }
}
else {
  console.log('A 未実行');
}
```
3階層で入れ子になっています。  
この例だと、ifブロックが短いので、まだ見通せますが、実際のプログラムは、もっと、いろいろ処理があるので、入れ子になった if-else を実装していると、今、どこの if を実装しているのか、混乱することがあります。特に、他人が書いたコードだとイライラが募ります。  
これが、if-elseの入れ子地獄です。

## 早期リターン

関数化して、条件が偽のときに、即、リターンで、抜けるというやり方です。  
早期リターンは、インデントを浅く保つための、定番の実装テクニックです。  

```
abc();

function abc() {
  if (!a) {
    console.log('A 未実行');
    return;
  }
  console.log('A 実行');
  
  if (!b) {
    console.log('B 未実行');
    return;
  }
  console.log('B 実行');
  
  if (!c) {
    console.log('C 未実行');
    return;
  }
  console.log('C 実行');
}
```

## break でフローから離脱

ループ処理 の break で、フローから抜けるというやり方です。  
関数にするのが面倒だったり、その場所に実装した方が、わかりやすい場合などは、
do-while と break を使うことで、早期リターンと同じく、入れ子になりません。
```
do {
  if (!a) {
    console.log('A 未実行');
    break;
  }
  console.log('A 実行');
  
  if (!b) {
    console.log('B 未実行');
    break;
  }
  console.log('B 実行');
  
  if (!c) {
    console.log('C 未実行');
    break;
  }
  console.log('C 実行');
  
} while (false);

```

## Promise で実装

nodejs などは、Promiseで実装してもいいですね。  
上の2つに比べると、ちょっとコード量が多めですが。  
```
Promise.resolve()
  .then(function() {
    return new Promise(function(resolve, reject) {
      if (!a) {
        console.log('A 未実行');
        reject();
        return;
      }
      console.log('A 実行');
      resolve();
    })
  })
  .then(function(data) {
    return new Promise(function(resolve, reject) {
      if (!b) {
        console.log('B 未実行');
        reject();
        return;
      }
      console.log('B 実行');
      resolve();
    })
  })
  .then(function(data) {
    return new Promise(function(resolve, reject) {
      if (!c) {
        console.log('C 未実行');
        reject();
        return;
      }
      console.log('C 実行');
      resolve();
    })
  })
  ;

```

