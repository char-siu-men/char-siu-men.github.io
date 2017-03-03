---
layout: post
title:  "WEBサイト間のシステム連携をOAuth認証で保護する | LaravelアプリでのOAuthサーバの組み込み方法"
date:   2017-03-03 22:00:00 +0900
categories: blog laravel
description: "WEBサイト間でのシステム連携をOAuth認証によって第三者の不正利用から防御する方法について、Laravel5.2以前で実装された既存システムへの適用方法で説明します。"
tags: ["Laravel", "OAuth"]
---

WEBサイト間でシステム連携を、WEB APIで実現する場合、第三者に勝手に利用されないように保護したい場合があると思います。  
対応策として、ネットワーク構成で防御する方法が真っ先に思い浮かびます。例えば、IPアドレスで制限する方法などです。その方法がとれるなら、簡単なので、そちらの方がよいでしょう。  

この記事では、インフラ構成はそのままで、OAuth認証を使って安全に連携する方法をについて説明します。

Laravel5.3以降の場合は、[laravel/passport](https://github.com/laravel/passport)が、公式パッケージとなったので、そちらを使ってください。
Laravel5.2以前は、プラグイン [lucadegasperi/oauth2-server-laravel](https://github.com/lucadegasperi/oauth2-server-laravel) を使います。
どちらも、[league/oauth2-server](https://oauth2.thephpleague.com/) が使われているので、内部は同じものです。

さて、laravel/passport については、これから、たくさんの記事が、出てくると思うので、そちらに、お任せして、
ここでは、Laravel5.2以前のLaravelを使っている"既存"システムに、OAuthサーバーを組み込む方法について、記載します。  

本記事は、こちらの記事を参考にしました。合わせて読んでみてください。  
* [Laravel5.2でOAuth2サーバを立てる](http://qiita.com/busyoumono99/items/1092fdc64d5a64d021d5)  
*  [lucadegasperi/oauth2-server-laravel](https://github.com/lucadegasperi/oauth2-server-laravel)  
* [RFCの日本語訳](http://openid-foundation-japan.github.io/rfc6749.ja.html#anchor4)  
* [IPAの解説](https://www.ipa.go.jp/security/awareness/vendor/programmingv2/contents/709.html)  
* [OAuth2 Grant Types and Need For Implicit Grant for JavaScript and Mobile Applications](http://wso2.com/library/articles/2014/12/article-oauth2-grant-types-and-need-for-implicit-grant-for-javascript-mobile-applications/)  

---

## OAuth2を使ったAPI実行の仕組み

oauth2-server-laravel の実装の前に、oauthでAPIを保護する仕組みについて、簡単に説明します。  
サーバー間での認証の場合は、それほど複雑な手続きは発生しません。  

### 前提
WEBサイトAと、WEBサイトBがあって、サイトBにあるAPIを、サイトAから利用したい場合を想定します。  
ユーザーが、サイトAに訪問したときに、Aのサーバーサイドでは、サイトBのアクセストークンを取得して、そのアクセストークンを使って、サイトBのAPIを実行することで、第三者の不正利用を防ぎます。

ユーザー認証がないので、おそらく、実装の手間としては、一番簡単なOAuth認証かと思います。  
手順は、API実行前にクライアントの認証を行うという、これだけです。  

**手順**
1. クライアント認証（アクセストークンの取得）    
1. API実行  

それぞれの手順について、もう少し説明します。

### 手順(1) クライアント認証（アクセストークンの取得）
サイトAのサーバーサイドから、サイトBのアクセストークン取得APIを実行します。  
client_id と client_secret をパラメータにして、認可されたクライアントであることを認証するわけですが、このパラメータが第三者の目に触れないように、サーバーサイドに実装します。
必要な設定値は次のとおりです。  

| パラメータ     | 値       |
| - | - |
| grant_type    | client_credentials |
| client_id     | (例) AQ9c2NUJN6N4zLETk9NP8P762vnHdMHM |
| client_secret | (例) We3Fkd6VMZ693msbLAWNDWdC4rPHwMy8 |
| scope         | なし     |

サーバー間の認証の場合、grant_type は、 client_credentials になります。  
client_id と client_secret は、パスワード生成器などを使って、40文字以内の文字列を作成してください。この値は、あらかじめ、oauth2用に作成されるテーブルに、事前登録します。登録手順は、後述します。  
scope は、この記事の説明では、1つの用途しかないので、scopeは、使いません。

**参考**  
grant_type について、他にどのようなタイプがあるか、興味のある人は、以下に参考となるURLを上げておきますので、読んでみてください。
* RFCの日本語訳  
これを読んでも、よくわかりませんが、いちおう。  
[http://openid-foundation-japan.github.io/rfc6749.ja.html#anchor4](http://openid-foundation-japan.github.io/rfc6749.ja.html#anchor4)
* IPAの解説  
少し、読みやすいです。  
[https://www.ipa.go.jp/security/awareness/vendor/programmingv2/contents/709.html](https://www.ipa.go.jp/security/awareness/vendor/programmingv2/contents/709.html)
* その他  
IPAの解説でも、どう使い分けるべきか微妙な場合は、以下の記事の「Authorization grant types」の説明を読むとよいかもしれません。  
それぞれの grant_type を、どういうシナリオのときに使うのかが載っています。  
[http://wso2.com/library/articles/2014/12/article-oauth2-grant-types-and-need-for-implicit-grant-for-javascript-mobile-applications/](http://wso2.com/library/articles/2014/12/article-oauth2-grant-types-and-need-for-implicit-grant-for-javascript-mobile-applications/)

### 手順(2) API実行
上記で取得したアクセストークンを使って、サイトBのAPIを実行します。
APIは、oauth2で保護されていて、oauth2-serverによって、アクセストークンのチェックが行われます。

---

## OAuth2サーバーの組み込み

OAuth2サーバーの組み込み方法を説明します。  

oauth2は、Authorization Server と Resource Server の2つに役割が分かれていて、
それぞれ、別々のアプリとして、実装を分離することもできます。  
この記事の説明では、同じアプリに実装します。

まずは、Authorization Server の実装です。

### プラグインのインストールと設定
Laravelのバージョンと、プラグインのバージョンの対応は、こちらのページを見て、正しいバージョンのものをインストールしてください。4系と5系で違うようです。
<https://github.com/lucadegasperi/oauth2-server-laravel/tree/master/docs#readme>  
以下は、laravel 5.2へのインストール手順です。

#### install
composerでプラグインを追加。
```
composer update
composer require lucadegasperi/oauth2-server-laravel:5.2.0
```

#### config/app.php の設定
次のように追加します。
```
'providers' => [
  ...
  LucaDegasperi\OAuth2Server\Storage\FluentStorageServiceProvider::class,
  LucaDegasperi\OAuth2Server\OAuth2ServerServiceProvider::class,
],

'aliases' => [
  ...
  'Authorizer' => LucaDegasperi\OAuth2Server\Facades\Authorizer::class,
],
```

#### app/Http/Kernel.php の設定
$middleware に次の行を追加。
```
\LucaDegasperi\OAuth2Server\Middleware\OAuthExceptionHandlerMiddleware::class,
```

$routeMiddleware に次のを追加。
```
'oauth' => \LucaDegasperi\OAuth2Server\Middleware\OAuthMiddleware::class,
'oauth-user' => \LucaDegasperi\OAuth2Server\Middleware\OAuthUserOwnerMiddleware::class,
'oauth-client' => \LucaDegasperi\OAuth2Server\Middleware\OAuthClientOwnerMiddleware::class,
'check-authorization-params' => \LucaDegasperi\OAuth2Server\Middleware\CheckAuthCodeRequestMiddleware::class,
```

もし、$middleware の配列に中に、 `App\Http\Middleware\VerifyCsrfToken` があったら、$middleware から削除して、$routeMiddleware に、次の行を追加。

```
'csrf' => App\Http\Middleware\VerifyCsrfToken::class,
```

VerifyCsrfToken については、他システムからRESTでアクセスされるとき、csrfのトークンチェックができないので、対象外にすることが目的です。  
$routeMiddleware にするのではなく、VerifyCsrfToken.php の中に、除外パターンを書く方法でも、大丈夫です。  
既存システムの構成に合わせて、変更してください。

#### マイグレーションと設定ファイルの出力

```
php artisan vendor:publish
php artisan migrate
```

マイグレーション中に"class not found"エラーが出る場合は、```composer dump-autoload```を実行し、その後に再実行してください。

14個のテーブルが作成されて、 config/oauth2.php が作成されます。

#### 設定ファイルの編集

システムの用途に合わせて、 config/oauth2.php を編集します。

前述のとおり、信頼されたシステム間での認証なので、client_credentials を実装します。

    'grant_types' => [
        'client_credentials' => [
            'class' => '\League\OAuth2\Server\Grant\ClientCredentialsGrant',
            'access_token_ttl' => 3600
        ]
    ],

スコープも、今回は、使わないので、設定は、デフォルトのままで OK です。

#### クライアント情報の事前登録

アクセス元のクライアント情報となる client_id と client_secret をDBに登録します。  
シーダークラスを作成して登録します。  
```
php artisan make:seeder OauthClientsTableSeeder
```

作成されたコードに、クライアント情報を埋め込みます。
```
<?php

use Illuminate\Database\Seeder;

class OauthClientsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('oauth_clients')->insert([
            'id' => 'AQ9c2NUJN6N4zLETk9NP8P762vnHdMHM',
            'secret' => 'We3Fkd6VMZ693msbLAWNDWdC4rPHwMy8',
            'name' => 'サイトAの認可',
        ]);
    }
}
```
この値は、サイトAを識別するためのものです。もし、サイトCにも、利用を許可する場合は、サイトCのクライアント情報も追加します。

シーダーを実行して、DBに登録します。
```
php artisan db:seed --class=OauthClientsTableSeeder
```

### アクセストークン取得のURLを routes に追加

app/Http/routes.phpに以下を追加します。例えば、こんな感じになります。
```
Route::group(['middleware' => ['web']], function () {
    ・・・
    Route::post('oauth/access_token', function() {
        return Response::json(Authorizer::issueAccessToken());
    });
});
```
routesの構成はアプリによって、さまざまなので、システムに合ったやり方で、実装してください。  
アクセストークンの取得を、POSTリクエストにした場合、通常は、CSRFの対象となるように構成されていると思います。しかし、他システムからはダイレクトなアクセスになるので、 VerifyCsrfToken が機能しないように設定してください。  
以下は、VerifyCsrfTokenに除外設定する場合の例です。
```
app\Http\Middleware\VerifyCsrfToken.php

app/Http/Kernel.php 

<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as BaseVerifier;

class VerifyCsrfToken extends BaseVerifier
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array
     */
    protected $except = [
        'oauth/access_token',
    ];
}
```

動作確認用のプログラムは、後述しますが、このAPIのレスポンス例は、次のようになります。
```
{
  "access_token": "O8kA3tFq8wmQHC9xNoJgluaLQGBEcQyidm8LKLWl",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

以上が、Authorization Server の役割です。


### エンドポイントの保護

ここから、Resource Server の役割です。  
第三者の不正利用からAPIを保護するための実装です。

```
Route::group(['middleware' => ['oauth']], function () {
    Route::get('api/v1/hoge', 'Api\ApiController@hoge');
});
```
ここも、routesの構成はアプリによって、さまざまなので、既存システムに合ったやり方で、実装してください。  
Kernel.php に実装した、'oauth' が middleware として設定されていれば OK です。

oauthで保護されるエンドポイントには、取得したアクセストークンを付与することで、チェックが行われます。  
アクセストークンの渡し方は、httpヘッダーに追加します。  
```
Authorization: Bearer RsT5OjbzRn430zqMLgV3Ia
```

もう1つ、oauth2-server のソースコードを読んでみたところ、クエリーパラメータでも渡せることがわかりました。その場合のパラメータ名は、 access_token です。（設定によって、変更可能です）  
例)  
https://example.com/api/v1/hoge?access_token=O8kA3tFq8wmQHC9xNoJgluaLQGBEcQyidm8LKLWl&param1=fuga&param2=piyo

動作確認のテスト用には、クエリーパラメータが楽ですね。  
ちなみに、httpヘッダーでしか認識しないようにも、設定できそうです。
やり方は、 oauth2-server のソースコードかドキュメントを確認してみてください。

### 動作確認

次のテスト用のプログラムを作成すると、とっかかりの動作確認ができます。  
サイトＡ相当が、 http://localhost/ でアクセスできるとして、
ドキュメントルートに、次の2つのテストプログラムを作成して配置してください。

テスト画面の表示用のプログラム  
（site_a_init.php）
```
<html>
<head>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>
<script>
var GET_ACCESS_TOKEN_URL = 'site_a_proxy_access_token.php';

function getAccessToken() {
  return $.ajax({
    url: GET_ACCESS_TOKEN_URL,
    type: 'PUT',
    data: $('#access_token').serialize(),
    dataType: 'json'
  });
}

function onSubmitAccessToken() {
  getAccessToken()
    .then(function(oauthResponse) {
      $('input[name="access_token"]').val(oauthResponse.access_token);
    }, function(err) {
      console.log('getAccessToken err!');
      console.log(err);
      console.log(err.responseText);
    });
  return false;
}

$(function() {
  $('#access_token').submit(onSubmitAccessToken);
});
</script>
</head>

<body>
<h2>[access token]</h2>
<form id="access_token" method="post" action="site_a_proxy_access_token.php">
  <input type="submit" value="取得">
</form>

<h2>[API]</h2>
<form id="site_b_api" method="get" action="http://192.168.33.10/api/v1/hoge">
access_token <input type="text" name="access_token" value=""><br />
API パラメータ 1 <input type="text" name="param1" value="hoge"><br />
API パラメータ 2 <input type="text" name="param2" value="fuga"><br />
<input type="submit" value="実行">
</form>

</body>
</html>
```

サイトBのアクセストークンを取得するプログラム  
（site_a_proxy_access_token.php）
```
<?php
define('SITE_B_ACCESS_TOKEN_URL', 'http://192.168.33.10/oauth/access_token');

$data = 'grant_type='     . 'client_credentials' .
        '&client_id='     . 'AQ9c2NUJN6N4zLETk9NP8P762vnHdMHM' .
        '&client_secret=' . 'We3Fkd6VMZ693msbLAWNDWdC4rPHwMy8';

$curl = curl_init(SITE_B_ACCESS_TOKEN_URL);
curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
$accessTokenResponse = json_decode(curl_exec($curl));
curl_close($curl);
?>
```

テスト画面を表示します。  
http://localhost/site_a_init.php

テストのやり方は、[access token] の「取得」ボタンを押すと、
アクセストークンが取得されて、[API]のところの access_token に反映されます。

次に、[API]の「実行」ボタンを押すと、APIが実行されます。  

間違ったアクセストークンが拒否されることを確認するには、
access_token に異なる値を入れてみてください。

---

以上、WEBサイト間のシステム連携をOAuth認証で保護する方法をご紹介しました。


