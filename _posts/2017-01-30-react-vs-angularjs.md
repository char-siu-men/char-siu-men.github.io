---
layout: post
title:  "React vs AngularJS それぞれの利点と特徴"
date:   2017-01-30 18:11:44 +0900
categories: blog AngularJS React
tags:
  - プログラミング技術総覧
  - AngularJS
  - React
---
## React or Angular 2 ー どちらを使うべきか

筆者は普段バックエンド担当をしており、フロントエンドの世界に深い知見を持っておりません。しかし、JavaScript界隈の進化のスピードの速さには、日々驚かされます。フレームワークの数も今や膨大な数になっています。

その中でも選択肢に上がりやすいのがFacebook Inc.が開発している「React.js」、そしてGoogleが開発している「AngularJS」ではないかと思います。
これらのフレームワークの良さは、小規模なプロジェクトでよいので、開発を行ってみて初めて違いがわかるものだと思います。

なので、今回は両方のフレームワークで同じツールを作成し、実装過程と成果物を比較して、両者のフレームワークの良いところ・悪いところを検証したいと思います。

### 目標 - ToDoツールの実装

以下の機能を持つ、簡単なToDoツールを作成します。

* タスクの登録
* タクスの削除
* タスクの完了

![(図1)]({% asset_path blog/react-vs-angularjs/image1.jpg %})

まず最初に、それぞれのフレームワークの概要を記載します。

### Reactの概要

* Facebook Inc.が開発
* MVCでいうView部分のみをサポートしたフレームワーク
* Viewのみなので、他のJSフレームワークとの連携も可能
* JSXというJavaScriptの拡張文法を用いることができ、コード内にHTMLに似た記述ができる
* 仮想DOMと呼ばれるレンダリング機能がある。（詳しくはReactの章で記載）

### Angular 2の概要

* GoogleとMicrosoftが共同で開発（Microsoftの参画はAngular 2から）
	* AngularJS 1とAngular 2は互換性が低い
* コンポーネントベースである
* フルスタックフレームワークである
* Angular 2やAngular 1.xでは、TypeScriptでの記述が可能になった

## Angular 2でToDoツールを実装する
ちなみに、Angular4が2017年3月にリリース予定ですが、Angular 2と互換性があるということなので、Angular 2を勉強しておいて損は無いと思います。

### Angular 2はフルスタックフレームワーク
Angular 2はフルスタックフレームワークであり、開発に必要なものはすべて含まれています。例えば、Vue.jsではルーティングのためにVue Routerを使用しますが、Angular 2には標準でルーティング機能が備わっています。
また、ユニットテストや、KarmaやJasmineによるE2Eテストも非常に組み込みやすくなっています。

### Angular 2はTypeScriptで書ける

Angular 2の何よりの特徴は、TypeScriptで書くことを前提に設計されているところです。Microsoftの参画によりTypeScriptが採用されることになり、同言語の機能が使えるようになりました。
そのため、クラスや継承といった概念を使用しやすく、コードの品質を低いコストで保つことができます。

もちろんBabelなどを使用してES6やES5でも書けますが、Angular公式はあくまでTypeScriptを推奨しています。

#### コンポーネント指向

Angular 1ではMVCやMVW(Model-View-Whatever)というデザインパターンが採用されてきましたが、Angular 2からはコンポーネント指向で設計されるようになりました。
コンポーネントごとにプログラムを分けることができるので、わかりやすい設計を行うことができます。

![(図2)]({% asset_path blog/react-vs-angularjs/image2.jpg %})

例えば、今回作るToDoツールの場合は、上記のように3つのコンポーネントに分ける形で実装していきます。
この特徴のため、Angular 2はAngular 1よりも大きなアプリケーションの開発に向いていると言われています。

### Angular 2でToDoを作成する

今回作成するToDoツールの最終的なディレクトリ構造は以下のようになります。(最後にビルドされると、.jsファイル等が生成されます）

```
.
├── app
│   ├── app.component.ts
│   ├── app.html
│   ├── app.module.ts
│   ├── components
│   │   ├── content
│   │   │   ├── content.component.ts
│   │   │   └── content.html
│   │   ├── footer
│   │   │   ├── footer.component.ts
│   │   │   └── footer.html
│   │   └── header
│   │       ├── header.component.ts
│   │       └── header.html
│   ├── main.ts
│   ├── models
│   │   └── todo.model.ts
│   └── services
│       └── todo.service.ts
├── index.html
├── node_modules
├── package.json
├── systemjs.config.js
└── tsconfig.json
```

app以下にアプリケーションのコードを配置していきます。

* components
	* コンポーネントのパーツを配置していく
	* 今回は「header」、「content」、「footer」のように分けた
* models
	* モデルを配置する
* service
	* ロジックを書くサービス層

### インストール

以下のpackage.jsonを用意します。

nodeとnpmは必須なので下記を参考にインストールしてください。
nodeは4.x.x以上、npmは3.x.x以上が必須要件です。

[・npmjs.com 02 - Installing Node.js and updating npm _ npm Documentation](https://docs.npmjs.com/getting-started/installing-node)

```
{
  "name": "angular-quickstart",
  "version": "1.0.0",
  "description": "QuickStart package.json from the documentation, supplemented with testing support",
  "scripts": {
    "start": "tsc && concurrently \"tsc -w\" \"lite-server\" ",
    "lite": "lite-server",
    "tsc": "tsc",
    "tsc:w": "tsc -w"
  },
  "keywords": [],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "@angular/common": "~2.4.0",
    "@angular/compiler": "~2.4.0",
    "@angular/core": "~2.4.0",
    "@angular/forms": "~2.4.0",
    "@angular/http": "~2.4.0",
    "@angular/platform-browser": "~2.4.0",
    "@angular/platform-browser-dynamic": "~2.4.0",
    "@angular/router": "~3.4.0",

    "angular-in-memory-web-api": "~0.2.4",
    "systemjs": "0.19.40",
    "core-js": "^2.4.1",
    "rxjs": "5.0.1",
    "zone.js": "^0.7.4"
  },
  "devDependencies": {
    "concurrently": "^3.1.0",
    "lite-server": "^2.2.2",
    "typescript": "~2.0.10",

    "canonical-path": "0.0.2",
    "http-server": "^0.9.0",
    "lodash": "^4.16.4",
    "protractor": "~4.0.14",
    "rimraf": "^2.5.4",

    "@types/node": "^6.0.46",
    "@types/jasmine": "^2.5.36"
  },
  "repository": {}
}
```

特徴としてはTypeScriptで書き、lite-serverを使用しているところです。
lite-serverでローカルサーバを起動させつつ、ファイルの変更を監視することができます。
Package.jsonが準備できたらインストールを開始します。

```
$ npm install
```

開発中は以下コマンドでサーバを実行してください。

```
$ npm start
```

### コンポーネントとモジュール

Angular 2はコンポーネント指向だと先ほど説明しましたが、その基本は2つの要素から成ります。

* コンポーネント
* モジュール

#### コンポーネント

Angular 2のコンポーネントはメタデータとロジックを持ちます。

```
@Component({
  selector: 'my-app',
  template: '<h1>Hello!!</h1>',
})

export class AppComponent {}
```

上記コードでは`AppComponent`という名前でコンポーネントを定義しています。

`@Component`で指定された部分がメタデータです。ここにテンプレートであるHTMLなどを指定し、Viewを持ちます。そして`selector`で指定されたタグに、templateを表示します。

 @Componentで定義したテンプレートを、HTMLでレンダリングするためには以下のコードを記述します。

```
<body>
	<my-app></my-app>
</body>
```

上記コードは、`@Component`で指定したselectorをHTMLに定義しています。HTMLにselectorを指定すると、`@Component`のtemplateで定義したテンプレートがレンダリングされます。

#### モジュール

コンポーネントなどの実装をグループ化したものです。Angular 2も多数のモジュールから成り立っています。
ルールとして、webページを作成する際は、最低一つのモジュールを含む必要があります。(これをルートモジュールと呼びます。)

```
import { BrowserModule }  from '@angular/platform-browser';
import { NgModule }       from '@angular/core';
import { AppComponent }   from './app.component';

@NgModule({
  imports: [
    BrowserModule,
  ],
  declarations: [
    AppComponent,
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }

```

まずimportで必要なモジュールを取り込みます。BrowserModuleはWebページを表示するために使用するモジュールです。
@NgModuleというデコレータでメタデータを読み込んで、`AppModule`という名前をモジュールにつけています。今回は、だいたいの定義の仕方は、コンポーネントと変わりないですね。

@NgModuleでメタデータを定義します。引数の値は、下記のようになります。

* imports
	*モジュールが必要とする他のモジュールをimportします。
* declarations
	* モジュールが含むコンポーネントを指定します
* bootstrap
	* ブラウザからアクセスされた際に、初めに表示されるコンポーネントを指定します

### ToDoのルートコンポーネントとルートモジュールを用意する

まずは初めに読み込まれる`index.html`を用意します。

```

<!DOCTYPE html>
<html>
  <head>
    <title>Angular 2 ToDo</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <script src="node_modules/core-js/client/shim.min.js"></script>

    <script src="node_modules/zone.js/dist/zone.js"></script>
    <script src="node_modules/systemjs/dist/system.src.js"></script>

    <script src="systemjs.config.js"></script>
    <script>
      System.import('app').catch(function(err){ console.error(err); });
    </script>
  </head>

  <body>
    <my-app></my-app>
  </body>
</html>

```

scriptで必要なnode_moduleを読み込んでいる他に、System.jsを利用しています。Angular 2ではSystem.jsが採用されています。

System.jsを利用すると、大量の`<script>`タグを書かずに済み、読み込みの順番も気にせずに使用することができます。
また、開発環境でモジュールごとにファイルを分けることもできます。

```
System.import('app').catch(function(err){ console.error(err); });
```

先ほど説明したように、`<my-app>`というタグ内にコンポーネントが表示されます。

```
<body>
	<my-app></my-app>
</body>
```


#### ルートコンポーネント
まずはルートコンポーネント(app/app.component.ts)を用意します。

```
import {Component} from '@angular/core';

@Component({
  selector: 'my-app',
  templateUrl: 'app/app.html',
})

export class AppComponent {
}
```

`selector`には先ほどindex.htmlにあった`my-app`タグに、`templateUrl`で指定したapp/app.htmlが表示されます。

app/app.htmlの中身は以下のようになります。

```
<section class="container">
  <todo-header></todo-header>
  <todo-content [todos]="todos"></todo-content>
  <todo-footer [todos]="todos"></todo-footer>
</section>
```

`todo-header`、`todo-content`、`todo-footer`をそれぞれ指定します。各コンポーネントごとにviewを作成できるので、非常にスッキリとした見た目になります。
各コンポーネントについては後ほど説明します。

#### ルートモジュール(app/app.module.ts)
同様に、ルートモジュール(app/app.module.ts)を用意します。

```
import { BrowserModule }  from '@angular/platform-browser';
import { FormsModule }    from '@angular/forms';
import { NgModule }       from '@angular/core';
import { AppComponent }   from './app.component';
import { TodoService }    from './services/todo.service';
import {TodoHeaderComponent} from './components/header/header.component';
import {TodoContentComponent} from './components/content/content.component';
import {TodoFooterComponent} from './components/footer/footer.component';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule
  ],
  declarations: [
    AppComponent,
    TodoHeaderComponent,
    TodoContentComponent,
    TodoFooterComponent,
  ],
  providers: [
    TodoService,
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
```

`declarations`で各コンポーネントを読み込みます。その他、必要なモジュールもimportします。

##### Angular 2のDI

Angular 2ではサービスクラスを使用する際はDIを利用します。
ここでDIとはDependency Injectionの略であるため、「依存性の注入」？と直訳してしまいがちなのですが、この和訳ではよく意味が通りませんね。詳しく説明をしていきましょう。
今回のケースでDependency（依存性）とは、インスタンスがもつサービスクラスへの依存性を指しています。下記コードのTestComponentは、TodoSeriviceというサービスクラスを利用するコンポーネントとして定義されていますので、本質的にTodoSeriviceに依ったクラスです。

```
export class TestComponent {
  constructor(private service:TodoService) {}
}
```

ここで、利用するサービスクラスは事前に`providers`で設定されているものとします。

```
providers: [
	TodoService,
],
```

TestComponentクラスは、サービスを引数として外部から受け取ることでDIを実現しています。TestComponentの依存先であるTodoServiceクラスを、インスタンス生成の際に引数として渡すような設計とすることで、外から柔軟に「注入」できるようになっています。これが依存性の注入…というより、「依存先の注入」というのがより適切な訳語かもしれませんね。

なぜDIが推奨されるかというと、各クラス同士の依存性を緩和するためです。

たとえば、以下のTestComponentDependingクラスの設計は、TodoServiceクラスに強く依存している状態といえます。

```
class TestComponentDepending {
    service:TodoService = new TodoService();
}
```

一方、DIを利用したTestComponentクラスの場合、TodoServiceクラスを継承した別のクラスも引数として渡せます。よって、クラスの利用者がTestComponentクラスの中身を書き換えることなく、いろいろなサービスクラスを渡せるようになり、拡張性が高くなるのです。

#### app/services/todo.service.ts

ロジックの部分を決めるサービスクラスを定義していきます。

```
import {Injectable} from "@angular/core";
import {Todo} from "../models/todo.model";

const STORAGE_KEY = 'angular2-todo';


@Injectable()
export class TodoService {

  todos:Todo[] = [];

  constructor() {
  }

  add(title:string):void {
    let newTodo = new Todo(
      Math.floor(Math.random() * 100000), // ランダムにIDを発番する
      title,
      false
    );
    this.todos.push(newTodo);
  }

  remove(todo:Todo):void {
    const index = this.todos.indexOf(todo);
    this.todos.splice(index, 1);
  }

  toggleComplate(todo:Todo):void {
    this.todos.filter(t => t.id === todo.id)
      .map(t => t.isCompleted = !t.isCompleted);
  }

  getComplatedCount():number {
    return this.todos.filter(todo => todo.isCompleted).length;
  }
}

```

Todoモデルを読み込んで、タスクを追加する`add`、削除する`remove`、完了のフラグを管理する`toggleComplate`、完了の件数を数える`getComplatedCount`を追加します。


#### app/models/todo.model.ts

```
export class Todo {
  constructor(public id:number,
              public title:string,
              public isCompleted:boolean) {
  }
}
```

モデルについては必要な属性を定義するだけです。

#### header

最後にそれぞれのcomponentを作成していきます。それぞれコンポーネントごとにクラス定義し、テンプレートとなるhtmlを準備していきます。
まずはタスク追加フォームを定義するheaderを作成します。

* app/components/header/header.component.ts
* app/components/header/header.html

```
<header>
  <h1>Todos</h1>
  <form>
    <div>
      <label>新しいTodo：</label>
      <input name="title" [(ngModel)]="title">
    </div>
    <button  (click)="addTodo()">追加</button>
  </form>
</header>
```

テキストフォームの値をviewからバインディングするために、`(ngModel)`を使用します。`tittle`という名前で`header.component.ts`で取得できるようにします。

またタスクの追加ができるformのbutton要素にclickイベントを追加します。Angular 2では`(click)={method_name}`で設定できます。

ロジック部分は`TodoService`クラスを使用するため、ここでも`constructor`にてDIを利用して定義しています。

```
import {Component} from '@angular/core';
import {TodoService} from '../../services/todo.service';

@Component({
  selector: 'todo-header',
  templateUrl: 'app/components/header/header.html'
})

export class TodoHeaderComponent {

  title:string;

  constructor(private service:TodoService) {}

  addTodo() {
    if (this.title != null && this.title.trim().length) {
      this.service.add(this.title);
      this.title = null;
    }
  }
}
```

先ほどの`ngModel`の値をバインディングするために、`title:string`を設定します。そしてclickイベントで設定した`addTodo`を追加します。

```
title:string;
```

##### @Component

メタ要素を定義します。`templateUrl`でテンプレートとなるviewのパスを指定します。そしてそのテンプレートの中身を`selector`で表示するタグ名を設定します。

#### component

追加されたタスクの一覧を表示します。各タスクの削除、タスクの完了のチェックボックスなどもここに表示します。

* app/components/content/content.component.ts
* app/components/content/content.html

```
<ul class="list-group">
  <li class="list-group-item" *ngFor="let todo of todos; let i = index">
    <div class="row">
      <div class="col-xs-10">
        <label>
          <input type="checkbox"
                 (click)="toggleComplate(todo)"
                 [checked]="todo.isCompleted">
        </label>
        <span [class.complate]="todo.isCompleted">
          \{\{i + 1\}\}. \{\{todo.title\}\}
        </span>
      </div>
      <div class="col-xs-2">
         <button class="btn btn-link" (click)="deleteTodo(todo)">削除</button>
      </div>
    </div>
  </li>
  <li class="list-group-item text-danger" *ngIf="!todos.length">Todoがありません。</li>
</ul>
```

繰り返しには`ngFor`ディレクティブを使用します。`Ngfor`ディレクティブを利用すると、以下のローカル変数が自動的に使用することができます。
今回はindex変数を利用して、現在のindex番号を表示しています。

* index
	* 現在処理されているオブジェクトのオフセット番号
* last
	* 最後のオブジェクトのときにtrueを返す
* even
	* indexが偶数のときにtrueを返す
* todd
	* indexが奇数のときにtrueを返す


```
[checked]="todo.isCompleted"
```

タスクの完了フラグを変更するためにチェックボックスを使用します。チェックボックスでバインディングするためには`checked`を利用します。


```
import {Component, Input} from '@angular/core';
import {Todo} from "../../models/todo.model";
import {TodoService} from "../../services/todo.service";

@Component({
  selector: 'todo-content',
  templateUrl: 'app/components/content/content.html'
})

export class TodoContentComponent {
  @Input()
  todos:Todo[];

  constructor(private service:TodoService) { }

  ngOnInit(): void {
    this.todos = this.service.todos;
  }

  toggleComplate(todo:Todo) {
    this.service.toggleComplate(todo);
  }

  deleteTodo(todo:Todo) {
    this.service.remove(todo);
  }
}
```

基本的にはheaderと同じ作りになります。`@Component`でメタデータを定義して、クラスにviewのイベントで必要なメソッドを定義していきます。

##### @InputとngOnInit

viewとコンポーネントの間にはLifecycle Hooksという仕組みがあり、コンポーネントの生成や破棄されるタイミングでコールバックの関数を指定できます。
コンポーネントが持っているデータの更新や（今回の場合はtodos）、viewを更新した場合の変更を検知できます。

今回コンポーネントで定義されている`todos`はこのLifecycle Hooksを利用して実行できるようにしています。


```
@Input()
todos:Todo[];
```

```
ngOnInit(): void {
	this.todos = this.service.todos;
}
```

`ngOnInit()`を利用すると、@Input()でデータバインドされた入力値を初期化後に実行することができます。つまり`this.service.todos`で取得したtodosをすぐにviewに反映することができるのです。

そのほかの`Lifecycle Hooks`に関するメソッドも記載しておきます。

* ngOnChanges
	* @Input()でデータバインドされた入力値が変更するたびに実行されます。
* ngDoCheck
	* すべての変更を検出すると呼ばれます。
* ngOnDestroy
	* コンポーネントを削除する前に呼ばれます。


#### footer

最後にフッターを定義します。フッターにはタスクの合計数と、「完了」のチェックボックスにマークをつけた数を表示します。

* app/components/footer/footer.component.ts
* app/components/footer/footer.html 

```
<footer class="container">
  <p *ngIf="todos">Todo消化状況： \{\{getCompletedCount()\}\} / \{\{todos.length\}\}</p>
</footer>
```

`ngIf`ディレクティブを利用して、todosが存在する場合のみに表示するようにしています。


```
import {Component, Input} from '@angular/core';
import {TodoService} from '../../services/todo.service';
import {Todo} from "../../models/todo.model";

@Component({
  selector: 'todo-footer',
  templateUrl: 'app/components/footer/footer.html'
})
export class TodoFooterComponent {
  @Input()
  todos:Todo[];

  constructor(private service:TodoService) {}

  ngOnInit(): void {
    this.todos = this.service.todos;
  }

  getCompletedCount() {
    return this.service.getComplatedCount();
  }
}
```

基本的には今まで作成してきたコンポーネントとほぼ作りは同じです。
`ngOnInit`でtodosを取得して、`@Input()`を利用してviewとデータをバインディングさせている他、`@Component`でメタデータを定義しています。


#### ルートモジュール(app/app.module.ts)

すべてのコンポーネントを定義したあとに再びルートモジュールの定義を見てみましょう。

```
import { BrowserModule }  from '@angular/platform-browser';
import { FormsModule }    from '@angular/forms';
import { NgModule }       from '@angular/core';
import { AppComponent }   from './app.component';
import { TodoService }    from './services/todo.service';
import {TodoHeaderComponent} from './components/header/header.component';
import {TodoContentComponent} from './components/content/content.component';
import {TodoFooterComponent} from './components/footer/footer.component';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule
  ],
  declarations: [
    AppComponent,
    TodoHeaderComponent,
    TodoContentComponent,
    TodoFooterComponent,
  ],
  providers: [
    TodoService,
  ],
  bootstrap: [ AppComponent ]
})
```

作成したコンポーネントをメタデータとして、`declarations`で登録しているのがわかると思います。

```
<section class="container">
  <todo-header></todo-header>
  <todo-content [todos]="todos"></todo-content>
  <todo-footer [todos]="todos"></todo-footer>
</section>
```

`app/app.html`の中身も再び見てみましょう。それぞれのコンポーネントで設定されたタグが定義されています。
さら`content`や`footer`の`todos`はここに定義されています。


### Angular 2についてのまとめ

* コンポーネント指向なので各パーツごとに分けることができ、ソースコードを分割できる
	* 今回の場合は、header, content, footerに分けた
* `@input()`や各コールバックを利用して、viewとコンポーネントでの変数のバインディングが簡単にできる
* DIを利用しているのでそれぞれのクラスの依存度が少ない
* TypeScriptで書けるので、記述量少なく保守性の高いソースコードを書くことができる

## 参考

【βリリース記念】5分でわかる！Angular 2のススメ  
<https://html5experts.jp/canidoweb/18001/>  

他のフレームワークとの比較(vue.js)   
<https://jp.vuejs.org/v2/guide/comparison.html>  

VPSサーバーでWebサイト公開　備忘録　~Linux、MySQLからAJAXまで  
<http://wordpress.honobono-life.info/code/angular2%E3%81%AE%E3%82%B3%E3%83%B3%E3%83%9D%E3%83%BC%E3%83%8D%E3%83%B3%E3%83%88%E3%80%81bootstrap%E9%96%A2%E6%95%B0%E3%81%AE%E6%A6%82%E8%A6%81/>  

「Angular 2」の構成単位「コンポーネント」「モジュール」を使いこなそう  
<https://codezine.jp/article/detail/9700>  

SystemJS入門  
<http://minotaur.badwitch.io/getting-started-with-systemjs/>  

Dolpenの日記  
<http://dolpen.hatenablog.com/entry/2016/04/25/201343>  

Angular 2のLifecycle Hooksを理解する  
<http://blog.yuhiisk.com/archive/2016/05/02/angular2-lifecycle-hooks.html>  


