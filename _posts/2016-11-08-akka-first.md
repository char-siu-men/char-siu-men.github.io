---
layout: post
title:  "並行処理時代を切り拓くActorモデル Akka"
date:   2016-11-08 15:11:44 +0000
categories: blog akka
---

## 並行処理の弱点を解消するActorモデル
並行処理が持つ「デッドロックが発生しうる」「スレッド管理が大変」といった弱点からエンジニアを解放すると言われているのがActorモデルです。  
Actorモデルはもともと、AIのためのアーキテクチャとして開発された数学的モデルです。  
その歴史は古く、1973年に最初の論文が登場しました。  
（参考： http://dl.acm.org/citation.cfm?id=1624804 ）  
モデルの構築にあたって、Actorモデルを動作させる並列コンピュータに幾つかの仮定を置いています：  

> * 数百・数千のマイクロプロセッサからなる
> * 個々にローカルメモリを持つ
> * 高性能通信ネットワークで通信を行う

これらの仮定は、マルチコア環境が誕生し、大規模サービスの基盤として用いられるようになった昨今、現実のものになりつつあります。  

## AkkaのActorモデルを導入してコードを書いてみよう

Akkaは、Actorモデルに基づいて並行処理が書ける、Java又はScalaで動作するライブラリです。  
以下に、Akkaの公式サイトに記述されているサンプルコードを示します。  

```
import akka.actor.Actor
import akka.actor.Props
import akka.event.Logging
 
class MyActor extends Actor {
  val log = Logging(context.system, this)
 
  def receive = {
    case "test" => log.info("received test")
    case _      => log.info("received unknown message")
  }
}
```
(参考：http://doc.akka.io/docs/akka/snapshot/scala/actors.html)  
    
サンプルコードでは、「MyActor」クラス、及び「receive」というメソッドを定義しています。  
Actorモデルのプログラミングにおいてはこのようなactorを複数生成し、相互にメッセージをやり取りすることで動作します。  

* それぞれのactorはメールボックスとアドレスを持つ
* actorの動作は非同期的（返答を待たずに次の処理に移る）

上記のコードで定義したactorの仕事は、「test」というメッセージを受け取ったら「"received test"」という文字列、それ以外のメッセージを受け取ったら「"received unknown message"」という文字列をイベントストリームに流すというものです。  
メッセージの送り手となるactorをもう一人定義すれば、このプログラムを完全なものとして動作させることが出来ます。  

## Actorモデルでできること
Actorモデルで構築されたシステムの有名な成功例は、スウェーデンの通信機器メーカー・エリクソン社の通信システムです。
これはIoTの事例としても興味深いものです。  
（参考：
https://www.ericsson.com/research-blog/internet-of-things/edge-computing-in-iot/）

このシステムはErlangという、アクターモデルをサポートした並行処理指向のプログラミング言語で記述されています。  
Akkaはもともと、Erlangに影響を受けて開発されました。
Akkaの強みとしては、子actorを定義しメッセージを一斉送信出来ることなどが挙げられます。
大規模な計算が必要なサービスに不可欠な並行計算の技術。まずはこんな形で触れてみてはいかがでしょうか。

## 弊社の取り組み
弊社では、クローラーの開発と保守を行っています。  
最近は、Javascriptでレンダリングされるサイトも増えてきて、
httpcllientのような、シンプルにhtmlだけを取得するやり方では、
欲しい情報が取得できないケースも、少なくありません。  
そういう場合には、phantomjs などを使って、ブラウザでページをレンダリングさせることになりますが、
ブラウザなので負荷が高く、複数サーバーに分散する処理のところに、
Akka Actor を利用して、並列化の実装をしました。  

