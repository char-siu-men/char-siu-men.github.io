---
layout: app/_layouts/post.html.ejs
title:  "非公開サイトをLet's EncryptなDockerコンテナでお手軽にSSL化する方法 | 開発環境のスピード構築のために"
date:   2017-05-29 22:00:00 +0900
categories: blog docker
description: "アクセスを限定した非公開サイトを運用していて、それをLet's EncryptでSSL化したいけど、コマゴマ面倒くさいという方に、お手軽にできるレシピをご紹介します。"
tags: 
  - "環境構築"
  - "Let's Encrypt"
  - "Docker"
---

アクセスを限定した非公開サイトを運用していて、それをLet's EncryptでSSL化したいけど、コマゴマ面倒くさいという方に、お手軽にできるレシピをご紹介します。  
非公開サイトをSSL化したいと思っている人が、どれほどいるのかわかりませんが、例えば、  
* 自宅サーバーをベーシック認証でユーザー限定で運用をしているのだが、なんとなく気持ちが悪いのでSSL化したい  
* モバイルの確認のためにステージング環境をIPアドレスの制限付きで公開しているが、独自CAのSSLで、いつも警告が出るので、警告の出ないSSLにしたい  

こんな状況下なら、使えるレシピになるかもしれません。  
少なくとも、私は、これで、Let's Encryptを使ってます。  

## Let's Encrypt について

無料で正規のSSLが作成できると言ったら、Let's Encrypt です。  
2016年4月に正式なサービスが開始されて、もう1年以上になります。  

Let's Encryptが、どんな仕組みで、証明書を作成するのか、大雑把に説明すると、  
証明書を作成するサーバーに、Let's Encrypt のクライアントソフトウェア（certbot）をインストールして、
certbot と、Let's Encrypt の認証局とが、双方向から通信して、検証するという仕組みです。  
まずは、certbotがキーペアを作成し、つぎに、認証局がワンタイムトークンを発行してcertbotに渡して、
certbotは、そのトークンにキーペアで署名して、認証局に署名付きトークンを通知して、
認証局は、その妥当性を検証するという流れです。

認証方法には、大きく2つあります。
* サイト内の公知の URI に、認証用のファイルを設置する  
* DNSレコードに認証用のレコードを追加する  

最初の方は、WEBサイトが認証局からhttpでアクセス可能な状態であることが前提です。  
公知の URI というのは、/.well-known/acme-challenge のパスで、例えば、example.com なら、
http://example.com/.well-known/acme-challenge/トークン というパスに、署名付きのデータを書き込んで
配置しておいて、認証局がそのファイルを取得して、値を検証するという方式です。
certbot自身が一時的にWEBサーバーになることもできるし、既設のWEBサーバーを使う方法も可能です。

2つ目の方は、certbotが、DNSのtxtレコードにデータを書き込んで、認証局はDNSのレコードを読んで、検証するという方式です。

非公開サイトの場合は、認証局からもアクセスできないため、2つ目のDNSを使った方法を選択することになります。

Let's Encryptは、無料でSSLが使えてありがたいのですが、証明書の有効期限が、90日と短いので、
そのサイトを長期運用する場合には、証明書の更新が自動化されていることが、必須となります。

※大雑把で間違った説明があるかもしれませんので、正しくは、[Let's Encryptのポータルサイト](https://letsencrypt.jp/)を参照してください。

## certbotとdehydratedを内包したDockerコンテナ

2016年4月時点の certbot では、まだ、DNS方式の認証処理が、実装されていません。  
certbot には、認証局とのやり取りをする前後で、独自の処理を施せる  hook script という仕組みが用意されているのですが、
その仕組みを利用して、DNS方式をスクリプト化したのが、[dehydrated](https://github.com/lukas2511/dehydrated)になります。

certbotをインストールしたり、dehydratedをインストールしたり、それらの使い方を知るために、
さらに、検索して、そのための手順が書かれた記事を渡り歩いて・・・、たぶん1日では終わりませんね。

そこで、Docker が使えることが前提になりますが、コマンド1発で、証明書が作成できるDockerコンテナをご紹介します。
<https://hub.docker.com/r/willfarrell/letsencrypt/>

このコンテナには、certbotと、dehydratedが入っていて、DNSにAPIでアクセスして自動化しています。
使えるDNSは、Route53と、CloudFlareです。

### CloudFlareを使った証明書作成方法

APIを使うために、CloudFlareのアカウント情報をテキストファイルに用意します。  
letsencrypt.env として保存してください。
```
# defaults to `staging`, use `production` when ready.
LE_ENV=production
#LE_ENV=staging

# CloudFlare
PROVIDER=cloudflare
LEXICON_CLOUDFLARE_USERNAME=アカウント（ログイン時のメールアドレス）
LEXICON_CLOUDFLARE_TOKEN=Global API Key（※）
```
※ログインしたら、My Settingsのページに Global API Key があります。

docker run で実行します。
```
docker run \
  --env-file letsencrypt.env \
  -v /etc/ssl:/etc/ssl \
  willfarrell/letsencrypt \
  dehydrated \
    --accept-terms \
    --cron \
    --domain example.com \
    --out /etc/ssl \
    --hook dehydrated-dns \
    --challenge dns-01
```
これで、/etc/ssl に証明書が作成されました。

### Route53を使った証明書作成方法

AWSのアカウント情報をテキストファイルに用意します。  
letsencrypt.env として保存してください。
```
# defaults to `staging`, use `production` when ready.
LE_ENV=production
#LE_ENV=staging

# AWS
PROVIDER=route53
LEXICON_ROUTE53_ACCESS_KEY=アクセスキー
LEXICON_ROUTE53_ACCESS_SECRET=アクセスシークレットキー
```
そして、Route53の場合は、APIのアクセス権限として、以下の権限を設定してください。
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "route53:ListHostedZonesByName"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "route53:ChangeResourceRecordSets"
            ],
            "Resource": [
                "arn:aws:route53:::hostedzone/${HOSTED_ZONE_ID}"
            ]
        }
    ]
}
```

docker run は、CloudFlare用と同じです。

### nginxへの設定例

/etc/ssl に証明書を作成して、nginxにその設定するなら、次のような設定になります。
```
server {
  listen 443 ssl;
  ssl on;

  ・・・

  ssl_certificate /etc/ssl/fullchain.pem;
  ssl_certificate_key /etc/ssl/privkey.pem;

  ・・・
}
```

### 証明書の更新

上述した docker run のコマンドを再実行すると、証明書が更新されます。  
30日以内の再実行は、証明書の更新は行われず、認証局に無駄な負荷をかけないようになっているようです。  
逆に言うと、デイリーで cron に設定しても、大丈夫です。

ただし、証明書が新しくなった場合は、それを使っているWEBサーバーは、再起動しないといけません。  
私の場合は、docker run のコマンドとWEBサーバーの再起動をセットにしたスクリプトを用意して、cronに設定しています。


## あとがき

dockerを使うと、いろんなものをインストールしなくてよいので、私は、とても好きなんですよね。  
何かと、dockerコンテナ化したくなります。  

それから、記事を書いていて思いついたんですが、上記で紹介したdockerコンテナを使うと、証明書が作成されるディレクトリを、ドメイン毎に、別々のボリュームでマウントすると、1つのサーバーで、楽に、複数のドメインの証明書を管理できます。
そのサーバーで、nginxでリバースプロキシーしたら、社内の開発用サーバーを無理なくSSL化できそうです。

よろしければ、お試しくださいませ。