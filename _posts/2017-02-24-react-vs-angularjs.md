---
layout: post
title:  "React vs AngularJS それぞれの利点と特徴（React編）"
date:   2017-02-24 10:11:44 +0900
categories: blog AngularJS React
tags:
  - プログラミング技術総覧
  - AngularJS
  - React
---

「AngularJS vs React」前回のAngular編では、Angular 2でToDoツールを作成していきました。今回は、Reactを用いて同様の機能を持ったToDoツールを作成することで、両者の特徴を明確にしたいと思います。

## Reactの特徴

### リアクティブプログラミング(Reactive programming)を志向

リアクティブプログラミングを志向していることが、Reactという名前の所以です。
リアクティブプログラミングについては、過去記事で解説していますので、ご参照ください。

[リアクティブプログラミングの概観と、各言語での実装について](https://www.altus5.co.jp/blog/reactive-programming/2016/11/17/reactive-programming/)

### JSXによる、仮想DOM(Virtual DOM)を用いた実装

最近のフロントフレームワークの多くでは、仮想DOMという技術が取り入れられ、主流になりつつあります。その仮想DOMを定着させたのがReactです。

Reactでは「コンポーネント」を生成し、UIを構築します。コンポーネントはインスタンス化して使用します。このコンポーネントのインスタンスのことをエレメントと呼びます。

```
var Hello = React.createClass({
  render() {
    return (
      <div><span>hello</span></div>
    )
  }
})
```

上記のコード中に、HTMLタグとしておなじみの`<div>`が入っていると思います。これは、実はReactで定義されているコンポーネントです。このHTMLタグ（のようなもの）をJSXと呼びます。
一般に、`<div>`などをDOM(Document Object Model)と総称しますよね。このことから、JSXは仮想DOMと呼ばれる概念に属します。


### Fluxによる実装

Fluxというアーキテクチャを理解しないとReactの良さを最大限に引き出すことができません。簡単に概要を記載します。

* クライアントサイドの設計パターン
* React同様、Facebookにより開発された
* データの流れが常に一方通行（MVCとは対極にある）
* オブザーバーパターンが根幹にある
* Action, View, Dispatcher, Storeという4部品に別れている

#### Fluxはオブザーバーパターン(Observer pattern)を実現

オブザーバーパターンはデザインパターンの一つです。Observerとは観察者という意味の単語で、ここではオブジェクト自身が観察者に通知する仕組みのことを端的に表しています。
オブザーバーパターンについては、下記記事でより詳しく説明を行っています。

[・リアクティブプログラミングの概観と、各言語での実装について](https://www.altus5.co.jp/blog/reactive-programming/2016/11/17/reactive-programming/)

#### Fluxではデータの流れが常に一方通行

![(図1)]({% asset_path blog/react-vs-angularjs/mvc.jpg %})

MVCモデルですと、データはControllerからModel、ModelからView、ModelからControllerというように、自由に行き交います。
そのためプロジェクトが大きくなっていくにつれて、ソースを追うのが大変になっていきます。

![(図2)]({% asset_path blog/react-vs-angularjs/flux.jpg %})

しかし、Fluxを使用した場合のデータは常に一方通行になるため、大型のプロジェクトでも管理しやすく、チーム開発も円滑になります。

#### Fluxの部品

Fluxの各部品の概要を記載します。Reactはこの中のViewを担当します。

* Action
	* UIをクリックしたり、HTTPリクエストが届いたときなどの非同期イベントが発生すると呼ばれる
	* 各イベントの動作を決定
		* Storeにそれをメッセージとして伝える
* Dispatcher
	* ActionからStoreへいくための橋渡し
	* facebook/fluxはこの機能のみを提供している
* Store
	* データをためる場所
	* MVCでいうならModel的な役割
* View
	* 今回はReact
	* 他のフレームワークでも代用可能

また今回はFluxとReactの概要を知るために、まずはfacebook/fluxを使用してみます。facebook/fluxは、名前の通りFacebook, Inc.が開発しており、今回は以下のメリットから導入しています。

軽量な設計のため、必然的に自分でコードを書く部分が多くなる  
よって、Fluxを学ぶのに適している  
導入が簡単

Fluxをサポートするフレームワークは他にもいくつかあり、有名どころではReduxなどがあります。

## ReactでToDoツールを実装する

ReactはフルスタックフレームワークであるAngular 2とはまったく異なり、MVC(Model-View-Controller)のViewのみを担当します。

今回作成するToDoツールの最終的なディレクトリ構造は以下のようになります。

```
├── index.html
├── package.json
├── src
│   ├── containers
│   │   └── AppContainer.js
│   ├── data
│   │   ├── Counter.js
│   │   ├── Todo.js
│   │   ├── TodoActionTypes.js
│   │   ├── TodoActions.js
│   │   ├── TodoDispatcher.js
│   │   ├── TodoDraftStore.js
│   │   └── TodoStore.js
│   ├── root.js
│   └── views
│       └── AppView.js
└── webpack.config.js
```

src以下にアプリケーションのソースコードを配置していきます。

### インストール

以下のpackage.jsonを用意します。今回はwebpackとBabelを使用して作業を進めていきます。

package.json
```
{
  "name": "flux todo",
  "version": "1.0.0",
  "description": "",
  "repository": "",
  "author": "xxxxx",
  "main": "bundle.js",
  "scripts": {
    "build": "webpack ./src/root.js ./bundle.js",
    "watch": "webpack ./src/root.js ./bundle.js --watch",
  },
  "dependencies": {
    "classnames": "^2.2.3",
    "flux": "3.1.2",
    "immutable": "^3.8.0",
    "react": "^15.0.2",
    "react-dom": "^15.0.1"
  },
  "devDependencies": {
    "babel-core": "^6.7.6",
    "babel-loader": "^6.2.4",
    "babel-plugin-syntax-async-functions": "^6.5.0",
    "babel-plugin-syntax-flow": "^6.5.0",
    "babel-plugin-syntax-jsx": "^6.5.0",
    "babel-plugin-syntax-object-rest-spread": "^6.5.0",
    "babel-plugin-syntax-trailing-function-commas": "^6.5.0",
    "babel-plugin-transform-flow-strip-types": "^6.5.0",
    "babel-plugin-transform-object-rest-spread": "^6.6.5",
    "babel-plugin-transform-react-jsx": "^6.7.5",
    "babel-plugin-transform-regenerator": "^6.5.2",
    "babel-plugin-transform-runtime": "^6.5.2",
    "babel-preset-es2015": "^6.5.0",
    "webpack": "^1.13.0"
  }
}
```

以下コマンドでインストールします。

```
$ npm install
```

ビルドするときは以下コマンドで実行します。

```
$ npm build
```

### インデックスファイルの作成(index.html)

初めはindex.htmlを作成します。webpackを使用してビルドしており、`bundle.js`が最終的に作成されます。index.html内ではそれを読み込んでいます。

index.html
```
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>ToDo</title>
  </head>
  <body>
    <section id="todoapp"></section>
    <script src="./bundle.js"></script>
  </body>
</html>
```

Reactが関連している記述は`section`というタグです。

```
<section id="todoapp"></section>
```

最終的に`id=todoapp`内にReactで設定した内容を表示します。ReactではJSXを使用するため、HTMLライクなコードをシンプルに書くことができます。JSXについては冒頭でも説明しましたが、後ほどまた登場します。

### 一番最初に読み込まれるjsファイルの作成(src/root.js)

package.jsonに、buildコマンドとして`webpack ./src/root.js ./bundle.js`と指定しています。そのためsrc/root.jsが最初に読み込まれるようになっています。

src/root.js
```
import AppContainer from './containers/AppContainer';
import React from 'react';
import ReactDOM from 'react-dom';

ReactDOM.render(<AppContainer />, document.getElementById('todoapp'));
```

ブラウザに表示するためには、`ReactDOM`を使用します。HTMLのIDを取得して、見つかったタグ内に表示させます。

また、`ReactDOM.render`の第一引数に`<AppContainer />`という見慣れないタグを指定していますね。
これは自作のコンポーネントである`src/containers/AppContainer.js`の中身をrenderメソッドで表示するためのものです。

### Containerの作成(/src/containers/AppContainer.js)

Store、Action、ViewなどをまとめるContainerを作成します。

/src/containers/AppContainer.js
```
import AppView from '../views/AppView';
import {Container} from 'flux/utils';
import TodoStore from '../data/TodoStore';
import TodoDraftStore from '../data/TodoDraftStore';
import TodoActions from '../data/TodoActions';

function getStores() {
  return [
    TodoStore,
    TodoDraftStore,
  ];
}

function getState() {
  return {
    todos: TodoStore.getState(),
    draft: TodoDraftStore.getState(),

    onAdd: TodoActions.addTodo,
    onDeleteTodo: TodoActions.deleteTodo,
    onToggleTodo: TodoActions.toggleTodo,
    onUpdateDraft: TodoActions.updateDraft,
  };
}

export default Container.createFunctional(AppView, getStores, getState);
```

facebook/fluxにはFlux Utilsというライブラリがあります。今回はContainerというReact Componentのラッパーを使用しています。

```
import {Container} from 'flux/utils';
,
,
,
export default Container.createFunctional(AppView, getStores, getState);
```

ContainerはStore(MVCにおけるModel的な役割を果たす部品)からデータを受け取ります。そのデータが更新されていればContainer配下のComponentに通知し、Componentは更新後のデータを反映して再描画します。
この設計により、データ変更の監視機能を、自分で実装する必要がなくなります。

```
function getStores() {
  return [
    TodoStore,
    TodoDraftStore,
  ];
}

function getState() {
  return {
    todos: TodoStore.getState(),
    draft: TodoDraftStore.getState(),

    onAdd: TodoActions.addTodo,
    onDeleteTodo: TodoActions.deleteTodo,
    onToggleTodo: TodoActions.toggleTodo,
    onUpdateDraft: TodoActions.updateDraft,
  };
}

export default Container.createFunctional(AppView, getStores, getState);
```

`getStores()`関数にContainerと連携するStoreを定義します。そして`getState()`に変更を検知したときに実行されるActionを定義していきます。

### Actionの作成（src/data/TodoActions.js）

* Action
	* UIをクリックしたり、HTTPリクエストが届いたときなどの非同期イベントが発生すると呼ばれる
	* 各イベントの動作を決定
		* Storeにそれをメッセージとして伝える

```
import TodoActionTypes from './TodoActionTypes';
import TodoDispatcher from './TodoDispatcher';

const Actions = {
  addTodo(text) {
    TodoDispatcher.dispatch({
      type: TodoActionTypes.ADD_TODO,
      text,
    });
  },

  deleteTodo(id) {
    TodoDispatcher.dispatch({
      type: TodoActionTypes.DELETE_TODO,
      id,
    });
  },

  toggleTodo(id) {
    TodoDispatcher.dispatch({
      type: TodoActionTypes.TOGGLE_TODO,
      id,
    });
  },

  updateDraft(text) {
    TodoDispatcher.dispatch({
      type: TodoActionTypes.UPDATE_DRAFT,
      text,
    });
  },
};

export default Actions;
```

ActionではStoreにデータを送るための処理を記述していきます。ActionはあくまでStoreにデータを送るだけなので、ロジックはStoreに委譲します。
またDispacher部分が今回facebook/fluxに処理を任せている部分になります。

```
addTodo(text) {
 TodoDispatcher.dispatch({
   type: TodoActionTypes.ADD_TODO,
   text,
 });
},
```

ActionではStoreに渡すべきtypeと、引数であるstateを渡します。各タイプについては、`src/data/TodoActionTypes.js`にenumのように定義しておくと、どのようなActionかが一目でわかり、管理しやすくなります。

src/data/TodoActionTypes.js
```
const ActionTypes = {
  ADD_TODO: 'ADD_TODO',
  DELETE_TODO: 'DELETE_TODO',
  TOGGLE_TODO: 'TOGGLE_TODO',
  UPDATE_DRAFT: 'UPDATE_DRAFT',
};

export default ActionTypes;
```

### Storeの作成(src/data/TodoStore.js)

* Store
	* データをためる場所
	* MVCでいうならModel的な役割

src/data/TodoStore.js
```
import Counter from './Counter';
import Immutable from 'immutable';
import {ReduceStore} from 'flux/utils';
import Todo from './Todo';
import TodoActionTypes from './TodoActionTypes';
import TodoDispatcher from './TodoDispatcher';

class TodoStore extends ReduceStore {
  constructor() {
    super(TodoDispatcher);
  }

  getInitialState() {
    return Immutable.OrderedMap();
  }

  reduce(state, action) {
    switch (action.type) {
      case TodoActionTypes.ADD_TODO:
        // Don't add todos with no text.
        if (!action.text) {
          return state;
        }
        const id = Counter.increment();
        return state.set(id, new Todo({
          id,
          text: action.text,
          complete: false,
        }));

      case TodoActionTypes.DELETE_TODO:
        return state.delete(action.id);

      case TodoActionTypes.TOGGLE_TODO:
        return state.update(
          action.id,
          todo => todo.set('complete', !todo.complete),
        );

      default:
        return state;
    }
  }
}


export default new TodoStore();
```

タスクのリストを管理するTodoStore.jsです。タスク一つひとつに関しては、`TodoDraftStore.js`で管理します。

```
  reduce(state, action) {
    switch (action.type) {
      case TodoActionTypes.ADD_TODO:
        ,,,
      case TodoActionTypes.DELETE_TODO:
        ,,,
      case TodoActionTypes.TOGGLE_TODO:
        ,,,
      default:
        return state;
    }
  }
```

先ほどのActionで指定していたtypeなどはStore内のreduceメソッドで受取ます。switch文で分岐して各実装を定義していきます。

#### ReduceStoreクラスの継承

Storeクラスを作る際に`ReduceStore`というクラスを継承しています。

```
class TodoStore extends ReduceStore {
```

ReduceStoreは、facebook/flux 2.1.0から加わった、Flux Utilsに含まれるライブラリの一つです。
ReduceStoreは、自身の状態の変更をContainerに自動で反映することができます。
（2.1.0以前はevent emitterを使用して、プログラマが自分で通知のソースコードを書いていました）

src/data/TodoActions.js
```
export default Container.createFunctional(AppView, getStores, getState);
```

先ほどTodoActions.jsで関連付けしているので、これで変更の通知機能をFluxに任せることができます。


### src/data/TodoDispatcher.js

* Dispatcher
	* ActionからStoreへいくための橋渡し
	* facebook/fluxはこの機能のみ提供している

src/data/TodoDispatcher.js
```
import {Dispatcher} from 'flux';

export default new Dispatcher();
```

facebook/fluxを読み込んでいるだけです。このクラスにDispacher部分の処理を丸投げします。

### ユーザが入力中かどうかの判定（src/data/TodoDraftStore.js）

入力中のToDoを管理するTodoDraftStore.jsについても見ていきます。

```
import {ReduceStore} from 'flux/utils';
import TodoActionTypes from './TodoActionTypes';
import TodoDispatcher from './TodoDispatcher';

class TodoDraftStore extends ReduceStore {
  constructor() {
    super(TodoDispatcher);
  }

  getInitialState() {
    return '';
  }

  reduce(state, action) {
    switch (action.type) {
      case TodoActionTypes.ADD_TODO:
        return '';

      case TodoActionTypes.UPDATE_DRAFT:
        return action.text;

      default:
        return state;
    }
  }
}

export default new TodoDraftStore();
```

`src/data/TodoStore.js`とほぼ同じ作りになっています。こちらもReduceStoreを継承して実装します。
Actionを作成し、Dispatcherが用意できれば同じようなStoreは簡単に作成することができます。


### ToDoオブジェクトの作成(src/data/Todo.js)

ToDoリストそのものを表すオブジェクトを作成します。属性を定義したクラスを用意するだけです。

src/data/Todo.js
```
import Immutable from 'immutable';

const Todo = Immutable.Record({
  id: '',
  complete: false,
  text: '',
});

export default Todo;
```

今回は、Reactと直接の関連はありませんが、immutable.jsを使用しています。

immutable.jsはFacebook, Inc.が開発したJavaScriptのライブラリで、immutableなコレクションを提供してくれます(listやmapを簡単に扱えることが利点）。
`Immutable.Record`を使用すると、JavaScriptでimmutableなクラスが作成できます。

### Viewの作成(src/views/AppView.js)

* View
	* 主にreactがviewの役目になる
	* 他のフレームワークでも代用可能

```
import React from 'react';

function AppView(props) {
  return (
    <div>
      <Header {...props} />
      <Main {...props} />
      <Footer {...props} />
    </div>
  );
}

const ENTER_KEY_CODE = 13;
function Header(props) {

  const addTodo = () => props.onAdd(props.draft);
  const onKeyDown = (event) => {
    if (event.keyCode === ENTER_KEY_CODE) {
      props.onAdd(props.draft);
    }
  }
  const onChange = (event) => props.onUpdateDraft(event.target.value);
  return (
    <header id="header">
      <h1>todos</h1>
      <input
        id="new-todo"
        placeholder="What needs to be done?"
        value={props.draft}
        onKeyDown={onKeyDown}
        onChange={onChange}
      />
    </header>
  );
}

function Main(props) {
  if (props.todos.size === 0) {
    return null;
  }
  return (
    <section id="main">
      <ul id="todo-list">
        {[...props.todos.values()].reverse().map(todo => (
          <li key={todo.id}>
            <div className="view">
              <input
                className="toggle"
                type="checkbox"
                checked={todo.complete}
                onChange={() => props.onToggleTodo(todo.id)}
              />
              <label>{todo.text}</label>
              <button
                className="destroy"
                onClick={() => props.onDeleteTodo(todo.id)}
              >削除</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Footer(props) {
  if (props.todos.size === 0) {
    return null;
  }

  const remaining = props.todos.filter(todo => !todo.complete).size;
  const phrase = remaining === 1 ? ' item left' : ' items left';

  return (
    <footer id="footer">
      <span id="todo-count">
        <strong>
          {remaining}
        </strong>
        {phrase}
      </span>
    </footer>
  );
}

export default AppView;
```

最後にReactのViewの部分について解説します。少し長くなりますが、段階に分けて説明します。

#### AppView関数

```
function AppView(props) {
  return (
    <div>
      <Header {...props} />
      <Main {...props} />
      <Footer {...props} />
    </div>
  );
}
```

コンポーネントを読み込んでいる部分です。各コンポーネントにはpropsという引数を与えています。

##### propsとstate

Reactにはデータを管理する変数が2つあり、非常に混乱しやすいです。ほとんど同じように利用できるのですが、これらには明確な使い分けがあります。

* props
	* 親コンポーネントから渡されたプロパティ
	* propsはimmutableであるべき
* state
	* そのコンポーネントが持っているプロパティ
		* コンポーネントからコンポーネントへは渡されない
	* stateは可変であるべき

src/containers/AppContainer.js
```
export default Container.createFunctional(AppView, getStores, getState);
```

こちらで定義された`AppView`は、`AppContainer`内でStore(getStores)やAction(getState)などと一緒に登録されています。こうすることによって、Store内のプロパティがpropsで受け取れるようになっています。

なので、今回の`AppContainer.js`で定義されたpropsの場合は以下のように値やメソッドが使用できます。

```
props.todos

props.onAdd(props.draft);
```

##### ...props (Spread Attributes)

このドットが続く記法を使用すると、変数の中身を展開して引数としてそのまま渡すことができます。これはSpread AttributesというJSXの記法です。

```
const props = { foo: "foo", bar: "bar" };

// 通常通りの記法
return <Child foo={props.foo} bar={props.bar} />
// Spread Attributesを使用
return <Child {...props} />
```

#### タスクを登録するテキストフォーム(Header)の作成

タスクを登録するフォームのコンポーネントを作成します。

```
const ENTER_KEY_CODE = 13;
function Header(props) {

  const addTodo = () => props.onAdd(props.draft);
  const onKeyDown = (event) => {
    if (event.keyCode === ENTER_KEY_CODE) {
      props.onAdd(props.draft);
    }
  }
  const onChange = (event) => props.onUpdateDraft(event.target.value);
  return (
    <header id="header">
      <h1>todos</h1>
      <input
        id="new-todo"
        placeholder="What needs to be done?"
        value={props.draft}
        onKeyDown={onKeyDown}
        onChange={onChange}
      />
    </header>
  );
}
```

AppViewsからStoreのpropsが渡されています。propsにはコンテナで登録したStoreのプロパティやメソッドを使用したり、値を取得できたります。

```
return (
	<header id="header">
	  <h1>todos</h1>
	  <input
	    id="new-todo"
	    placeholder="What needs to be done?"
	    value={props.draft}
	    onKeyDown={onKeyDown}
	    onChange={onChange}
	  />
	</header>
);
```

冒頭でも説明しましたが、これがJSXです。一見するとHTMLタグのようですが、すべてJSXの記法です。
またコンポーネントは必ず一つのJSXを返すことがルールになっています。

JSXこそがReactの最大の特徴といっても過言ではありません。javascriptとHTML(擬似)を分離せずに記述できるようになっています。そうすることによって、jQueryなどによるDOM操作の煩わしさを排除することができます。

```
const onChange = (event) => props.onUpdateDraft(event.target.value);
```

`onChange`などのイベントはpropsから取得しており、名前をつけてイベントとして渡しているだけになります。
View内にロジックを書く必要がなく、領分がはっきりと分かれているのがわかると思います。

```
const addTodo = () => props.onAdd(props.draft);

const onKeyDown = (event) => {
if (event.keyCode === ENTER_KEY_CODE) {
    props.onAdd(props.draft);
  }
}

const onChange = (event) => props.onUpdateDraft(event.target.value);
```

タスクの登録はheaderコンポーネントで行います。ここで入力中のToDoを管理するTodoDraftStore(props.draft)が使用されています。

src/data/TodoStore.js
```
return state.set(id, new Todo({
  id,
  text: action.text,
  complete: false,
}));
```

`props.onAdd`のロジックは`src/data/TodoStore.js`に記載されています。`props.draft`で入力中であったFormの文章をStateに登録しています。
先ほど記述したように`state`の値は可変です。stateの値は即座にViewに反映されるので、画面に追加されたToDoが表示されます。


#### タスクの一覧を表示するパーツ(Main)の作成

Main関数は、タスクを一覧表示するリスト機能を担います。

```
function Main(props) {
  if (props.todos.size === 0) {
    return null;
  }
  return (
    <section id="main">
      <ul id="todo-list">
        {[...props.todos.values()].reverse().map(todo => (
          <li key={todo.id}>
            <div className="view">
              <input
                className="toggle"
                type="checkbox"
                checked={todo.complete}
                onChange={() => props.onToggleTodo(todo.id)}
              />
              <label>{todo.text}</label>
              <button
                className="destroy"
                onClick={() => props.onDeleteTodo(todo.id)}
              >削除</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

JSXで一つ注意しなければならないのは、タグに`class=`が使用できない点です。これはJSXでは`className=`と書かなければなりません。なぜならclassはJavaScriptの予約語であるためです。

```
{[...props.todos.values()].reverse().map(todo =>
```

`props.todos`でループで回したあとは、`todo.id`や`todo.text`のように自然に値を取り出すことができます。


#### 未完了タスクの総数を表示するパーツ(Footer)の作成

Footer関数は、未完了タスクの総数を表示するといった機能を担います。

```
function Footer(props) {
  if (props.todos.size === 0) {
    return null;
  }

  const remaining = props.todos.filter(todo => !todo.complete).size;
  const phrase = remaining === 1 ? ' item left' : ' items left';

  return (
    <footer id="footer">
      <span id="todo-count">
        <strong>
          {remaining}
        </strong>
        {phrase}
      </span>
    </footer>
  );
}

```

こちらは特に迷うようなところはないでしょう。propsからtodosを取得して、計数して表示させているだけです。

#### 再びAppView

```
function AppView(props) {
  return (
    <div>
      <Header {...props} />
      <Main {...props} />
      <Footer {...props} />
    </div>
  );
}
```

そして一番上のAppViewに戻ってみると、すべてのコンポーネントをJSXで記載してreturnしていることがわかると思います。

```
export default Container.createFunctional(AppView, getStores, getState);
```

あとは`src/containers/AppContainer.js`でコンテナに登録し、

src/root.js
```
import AppContainer from './containers/AppContainer';
import React from 'react';
import ReactDOM from 'react-dom';

ReactDOM.render(<AppContainer />, document.getElementById('todoapp'));
```

root.jsにReactDOM.renderを定義します。


```
<section id="todoapp"></section>
```

そしてHTMLタグに表示させるように、`id=todoapp`を設置すれば完了です。

### Reactについてのまとめ

* JSXが使用できるので、DOM操作で混乱することが少ない
* 値を変更したときの監視はFluxなどに任せることができるのでコード量が少ない
* Action→Dispatcher→Store→Viewとデータの流れが決まっているので、あとでソースを読んだときにわかりやすい
* Fluxのフレームワークの種類も豊富なので、違うものを使用すればもっと楽に開発できる

## AngularJSとReact、それぞれの比較

###コンポーネント指向フレームワークとしての差異

Angularは、Angular 2以降コンポーネント指向になりました。このことにより、どちらも基本的にはコンポーネントごとにパーツを作るようになりました。

#### Angular 2

Angular 2は@NgModule内でコンポーネントを定義しています。

app/app.module.ts
```
declarations: [
	AppComponent,
	TodoHeaderComponent,
	TodoContentComponent,
	TodoFooterComponent,
],
```

#### React

ReactはAppViewでコンポーネントを定義しています。

src/views/AppView.js
```
function AppView(props) {
  return (
    <div>
      <Header {...props} />
      <Main {...props} />
      <Footer {...props} />
    </div>
  );
}
```

Angularがコンポーネント志向を採用したことで、Angular 1のときよりは差が縮まったと思います。ただ設計が同じでもReactはJSXを使用しているため、やはり記法に大きな違いがあります。

### Flux上のReact、フルスタックフレームワークのAngular 2

ReactはFluxと密接な関係にあるため、アーキテクチャに関する学習コストがかかります。一方、あくまでViewのためのフレームワークですので、小規模な導入も可能です。
Reactと併用できるFluxのフレームワークは多数あり、組み合わせによってはまったく違う開発が出来そうです。そのことから、適材を選びやすいという印象を受けました。

一方でAngular 2はフルスタックフレームワークです。途中からライブラリを変更するなどは難しいと思います。Angular2を選んだ場合は、もしも他のAltJsを使用したいと思っても、TypeScriptと密接に関連性があるため変更は容易ではありません。また、ルーティング機能などのライブラリもAngular2に含まれているため、使いづらい部分があってもバージョンアップを待つか、自分で独自に拡張するしかありません。他のライブラリへの移行は難しいと思います。そういったことから、部分的に導入できるReactに対して、Angularは最初から全てを学ばないといけないのが難点だなと感じました。

ただ、一度身につけてしまえばAngularの方が楽なのかなと思いました。ReactはFlux, ReactRouter, JSX/ES2015など周辺ツールが多いので、取捨選択が大変です。

### Viewの差異
#### ReactのView

今回のコードでは、`src/views/AppView.js`内のHeaderコンポーネントに記載されています。

src/views/AppView.js
```
const ENTER_KEY_CODE = 13;
function Header(props) {

  const addTodo = () => props.onAdd(props.draft);
  const onKeyDown = (event) => {
    if (event.keyCode === ENTER_KEY_CODE) {
      props.onAdd(props.draft);
    }
  }
  const onChange = (event) => props.onUpdateDraft(event.target.value);
  return (
    <header id="header">
      <h1>todos</h1>
      <input
        id="new-todo"
        placeholder="What needs to be done?"
        value={props.draft}
        onKeyDown={onKeyDown}
        onChange={onChange}
      />
    </header>
  );
}
```

#### Angular2のView

Angular 2がHTMLファイルに記載するのに対し、ReactはJSXを使用しているので、この点が大きく違います。

app/components/header/header.component.ts
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

header.html
```
<header class="well">
  <h1>Todos</h1>
  <form class="form-inline">
    <div class="form-group">
      <label>新しいTodo：</label>
      <input class="form-control" name="title" [(ngModel)]="title">
    </div>
    <button class="btn btn-primary" (click)="addTodo()">追加</button>
  </form>
</header>
```

JSXのもっとも良い点は、めちゃくちゃになりがちなjQueryなどのDOM操作を一掃できるところだと思います。JSXに置き換えることよって、JSと連動したタグはすべて管理できますし、ReactのViewを見ればタグの仕様はすべてわかります。

ただし、デザイナーやエンジニア（コーダーなど）とJSXの知識を共有しておかなければなりません。自分一人しか知識を持っていない状態では作業しづらいのが難点です。

Angular 2の場合は、従来のようなテンプレート方式を採用しているので、

デザイナーがデザインを作成する
コーダーがHTMLコードを書く
フロントエンジニアがAngularのコードを書く

という流れがやりやすいと思いました。

最後に、個人的な感想として、JSXは「ものすごく好き嫌いが分かれる」と直観しました。明確なメリットがないと、会社によっては導入が難しいかもしれません。
