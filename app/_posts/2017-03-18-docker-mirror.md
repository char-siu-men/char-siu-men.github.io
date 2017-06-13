---
layout: app/_layouts/post.html.ejs
title:  "社内の開発環境でDockerイメージをミラーリングする方法 | 開発環境のスピード構築"
date:   2017-03-18 22:00:00 +0900
categories: blog docker
description: "社内LANの中に、Docker用のプロキシーを配置して、docker pull の実行時間を、最適化する方法をご紹介します。"
tags: 
  - "環境構築"
  - "Docker"
---

社内LANの中に、Docker用のプロキシーを配置して、
docker pull の実行時間を、最適化する方法をご紹介します。

docker-registry を使って、 Docker Hub のミラーリングを行います。  
次の組み合わせで、動作確認しています。
* docker-registry 2.1
* 設置先サーバー: centos7

docker-registry を配置するサーバーは、 proxy.altus5.local に配置するものとします。

この説明でのディレクトリの構成は、このようなになります。
```
/opt
  /certs             ・・・SSLの証明書
    ca.pem
    ca-key.pem
    server.pem
    server-key.pem
  /cfssl
    /conf            ・・・SSLの証明書を作成するための設定ファイル
      ca-config.json
      server.json
  /docker-registry   ・・・Docker Registry を実行する場所
    /data              ・・・キャッシュしたイメージの保存場所
      config.yml         ・・・Docker Registryの設定ファイル
    
```

この記事は、以下を参考にしました。  
* https://blog.docker.com/2015/10/registry-proxy-cache-docker-open-source/
* https://docs.docker.com/registry/recipes/mirror/
* http://docs.docker.jp/registry/recipes/mirror.html  

## docker-registry の設定

docker-registry の config.yml を取り出して、cacheプロキシー用に、編集します。
```
# mkdir -p /opt/docker-registry/data
# cd /opt/docker-registry

# docker run -it --rm --entrypoint cat registry:2.1 /etc/docker/registry/config.yml > ./data/config.yml
```

設定のポイントは、次の2点。
* http/tls にサーバー証明書のパスをセット（証明書は後で、このパスに作成します）
* proxy の設定を追加

編集後は、こんな感じになります。  
```
version: 0.1
log:
  fields:
    service: registry
storage:
  cache:
    blobdescriptor: inmemory
  filesystem:
    rootdirectory: /var/lib/registry
http:
  addr: :5000
  tls:
    certificate: /certs/proxy.altus5.local.pem
    key: /certs/proxy.altus5.local-key.pem
  headers:
    X-Content-Type-Options: [nosniff]
health:
  storagedriver:
    enabled: true
    interval: 10s
    threshold: 3
proxy:
  remoteurl: https://registry-1.docker.io

```

## SSL証明書の作成

docker-registry を、SSLにするために、独自CAで証明書を作成します。  
次のコンテナを使うと、素早く作成できます。あわせて、使ってみてください。  
https://hub.docker.com/r/altus5/cfssl/

まずは、設定ファイルのサンプルを取り出します。  
```
# mkdir -p /opt/cfssl/conf
# cd /opt/cfssl
# docker run --rm -it \
  -v $(pwd):/srv/cfssl \
  altus5/cfssl:0.5.2 \
  cp -r /opt/cfssl/conf /srv/cfssl/
```
/opt/cfssl/conf が作成されました。  
それぞれ、ご自身の環境にあわせて、書き換えてください。

* 独自CAの証明書の設定（/opt/cfssl/conf/ca-csr.json）  
こちらは、ご自分の組織に書き換えるとよいと思います。

* サーバー証明書の設定（/opt/cfssl/conf/server.json）  
CNは、上記のものと同じにしておいて、  
hosts のところには、docker-registry を設置するサーバーのホスト名を設定します。  
```
{
  "CN": "altus5.local",
  "hosts": [
    "proxy.altus5.local"
  ],
  "key": {
    "algo": "rsa",
    "size": 2048
  }
}
```

そして、証明書を作成します。  
```
docker run --rm -it \
  -v /opt/certs:/etc/cfssl \
  -v /opt/cfssl/conf:/opt/cfssl/conf \
  altus5/cfssl:0.5.2 \
  gen_server_cert.sh
```
/opt/certs に証明書が作成されました。

## docker-registry を起動する
docker-composeで起動します。  
docker-compose.ymlを次のように作成します。  
vi /opt/docker-registry/docker-compose.yml
```
version: '2'
services:
  registry:
    restart: always
    image: registry:2.1
    ports:
      - 5000:5000
    volumes:
      - /opt/docker-registry/data:/var/lib/registry
      - /opt/docker-registry/data/config.yml:/etc/docker/registry/config.yml
      - /opt/certs:/certs
```
docker-compose で起動します。
```
cd /opt/docker-registry
docker-compose up -d
```
`docker-compose logs` でエラーがないことを、 確認します。

## クライアント側の設定

任意のクライアント端末で行います。  
dockerクライアントがプロキシーを向くための設定です。  
vagrantでvmを起動している場合は、vmの中で行ってください。  

### 独自CAの証明書インストール

証明書を取得します。
```
scp hoge@proxy.altus5.local:/opt/certs/ca.pem .
```

独自CAの証明書のインストールは、それぞれの環境に合わせて、行ってください。  
ここでは、centos7の場合について、説明します。
```
sudo cp ca.pem /usr/share/pki/ca-trust-source/anchors/altus5.local.ca.pem
sudo update-ca-trust extract
```

テストします。  
```
curl -I https://proxy.altus5.local:5000/v2/
```
`HTTP/1.1 200 OK` が表示されれば、OKです。もしも、`curl: (60) SSL certificate problem: unable to get local issuer certificate` と表示されたら、独自CAの証明書のインストールが間違っています。

### dockerデーモンの起動オプション設定

dockerデーモンの起動オプションを設定します。  
vi /etc/sysconfig/docker
```
OPTIONS='--selinux-enabled --log-driver=journald --signature-verification=false --registry-mirror=https://proxy.altus5.local:5000 --disable-legacy-registry=true'
```
OPTIONS に --registry-mirror と --disable-legacy-registry のオプションを、上記のとおり、追加設定します。  
設定後、再起動します。
```
sudo systemctl restart docker
```

テストします。  
先に、 docker-registry の方のログを流します。  
```
cd /opt/docker-registry
docker-compose logs -f
```
クライアント側で、pullしてみます。
```
sudo docker pull busybox:latest
```

クライアント側で、Pull complete と表示されて、 docker-registry の方のログにも、
エラーなく、ログが流れていれば、OKです。

## どれくらい早くなった？

キャッシュ効果を測定してみました。

**初回**  
```
[root@hoge ~]# time docker pull centos:7
Trying to pull repository docker.io/library/centos ...
7: Pulling from docker.io/library/centos
785fe1d06b2d: Pull complete
Digest: sha256:d2c264f34e1a9b415a7ed28df92050acd8b46e827dedf90db61ba75761f6e000

real    2m56.171s
user    0m0.049s
sys     0m0.041s
```
**削除してから、再取得**  
```
[root@hoge ~]# time docker rmi centos:7
[root@hoge ~]# time docker pull centos:7
Trying to pull repository docker.io/library/centos ...
7: Pulling from docker.io/library/centos
785fe1d06b2d: Pull complete
Digest: sha256:d2c264f34e1a9b415a7ed28df92050acd8b46e827dedf90db61ba75761f6e000

real    0m16.212s
user    0m0.029s
sys     0m0.026s
```

初回は、当然、遅いですが、一度、プロキシーにキャッシュされると、早くなることがわかります。  
この実験では、 2m56.171s -> 0m16.212s と 2分40秒も節約されました。

たかだか、2分40秒ですが、環境構築中は、なんども、これをやるので、イライラが減って、ありがたいですね。


