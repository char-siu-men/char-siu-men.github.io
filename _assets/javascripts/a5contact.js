//= require_self
/**
 * grecaptchaのラッパークラス
 */
var grecaptchaModel = {
	corrected: false,
	init: function() {
		grecaptchaModel.corrected = false;
		if (typeof grecaptcha == 'undefined') {
			return;
		}
		var response = grecaptcha.getResponse();
		grecaptchaModel.corrected = (response.length > 0);
	},
	correctCallback: function() {
		grecaptchaModel.corrected = true;
		grecaptchaModel.onCorrectCaptcha();
	},
	onCorrectCaptcha: function() {
	}
};
reCaptchaCorrectCallback = function() {
	grecaptchaModel.correctCallback();
};
$(function() {
	'use strict';

	var useSignIn = false;
	var baseHref = location.href.replace(/#.*/, '');
	// 入力画面の次へボタン
	var $inputButton = $('.input_container form button');
	// 確認画面の送信ボタン
	var $confirmButton = $('.confirm_container form button');
	var containers = [
		{id: '.input_container', url:'#input', initFunc: initInput, title:'お問い合わせ'},
		{id: '.confirm_container', url:'#confirm', initFunc: initConfirm, title:'お問い合わせ内容確認'},
		{id: '.thanks_container', url:'#thanks', initFunc: null, title:'お問い合わせ承りました'}
	];
	var input = {};

	var firebaseConfig = {
	    apiKey: "AIzaSyDSf5IQpGTOY4ploswbC_hiRu3Ui5Oy0Z4",
	    authDomain: "altus-five-contact-fa5bc.firebaseapp.com",
	    databaseURL: "https://altus-five-contact-fa5bc.firebaseio.com",
	    storageBucket: "altus-five-contact-fa5bc.appspot.com",
	    messagingSenderId: "923242406897"
	};
	firebase.initializeApp(firebaseConfig);

	/**
	 * 画面の初期化処理
	 */
	function start() {
		if (location.hash.length > 0) {
			location.href = baseHref;
			return;
		}

		if (useSignIn) {
			// FirebaseUI config.
			var firebaseUiConfig = {
				'callbacks': {
					// Called when the user has been successfully signed in.
					'signInSuccess': function(user, credential, redirectUrl) {
						handleSignedInUser(user);
						// Do not redirect.
						return false;
					}
				},
				'signInSuccessUrl': baseHref,
				// Opens IDP Providers sign-in flow in a popup.
				'signInFlow': 'popup',
				'signInOptions': [
					{
						provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
						scopes: ['https://www.googleapis.com/auth/plus.login']
					},
					{
						provider: firebase.auth.FacebookAuthProvider.PROVIDER_ID,
						scopes :[
							'public_profile',
							'email',
							//'user_likes',
							'user_friends'
						]
					},
					firebase.auth.TwitterAuthProvider.PROVIDER_ID,
					firebase.auth.GithubAuthProvider.PROVIDER_ID,
					firebase.auth.EmailAuthProvider.PROVIDER_ID
				],
				// Terms of service url.
				'tosUrl': baseHref
			};
	    // Initialize the FirebaseUI Widget using Firebase.
	    var ui = new firebaseui.auth.AuthUI(firebase.auth());
	    // The start method will wait until the DOM is loaded.
	    ui.start('#firebaseui-auth-container', firebaseUiConfig);
			// </FirebaseUI>
		}

		//$inputButton.on('click', onClickInputNext);
		$confirmButton.on('click', onClickConfirmNext);
		$(window).on('popstate', onPopState);
		//$('form').on('submit', onClickInputNext);
		initInput();
		initConfirm();
	}

	/**
	 * 入力画面の初期化
	 */
	function initInput() {
    var $form = $('.input_container form');
		// バリデーションの設定
		$.extend($.validator.messages, {
			required: '必須項目です',
			email: '正しいメールアドレスを入力してください'
		});
		$form.validate({
			rules: {
				type: {required: true},
				name: {required: true},
				kana: {required: true},
			  tel:  {required: true},
			  email: {required: true, email: true},
			  content: {required: true},
        agree: {required: true},
        domain: {required: true, mysite: true},
			},
			messages: {
				agree: {
					required: 'ご同意お願いします'
				}
			},
		  errorPlacement: function(error, element) {
				if (element.attr('name') == 'type') {
					var $parent = $(element).closest('div');
					error.insertAfter($parent);
				} else if (element.attr('name') == 'agree') {
					var $parent = $(element).closest('label');
					error.insertAfter($parent);
				} else {
					error.insertAfter(element);
				}
		  },
			onsubmit: true,
			submitHandler: onInputSuccess
		});
	}

	/**
	 * 確認画面の初期化
	 */
	function initConfirm() {
		grecaptchaModel.init();
		$confirmButton.prop('disabled', !grecaptchaModel.corrected);
	}

	/**
	 * 入力画面で、「次へ」ボタンクリック時のイベント
	 */
	function onInputSuccess() {
		input = {
			type: $('input[name="type"]:checked').val(),
			company: $('#company').length > 0 ? $('#company').val(): '',
			name: $('#name').val(),
			kana: $('#kana').val(),
			tel: $('#tel').val(),
			email: $('#email').val(),
			content: $('#content').val(),
      domain: document.domain,
      referrer: document.referrer
		};
    if (! /\.altus5\./.test(document.domain)) {
      console.log('altus5以外のドメインでは使わないでください');
      return;
    }

		$('#confirm_type').text(input.type);
		$('#confirm_company').text(input.company);
		$('#confirm_name').text(input.name);
		$('#confirm_kana').text(input.kana);
		$('#confirm_tel').text(input.tel);
		$('#confirm_email').text(input.email);
		$('#confirm_content').html(safeNl2br(input.content));

		pushStateByContainer('.confirm_container');
		activeContainer('.confirm_container');

		$('body,html').animate({scrollTop: 0}, 0);
	}

	/**
	 * 確認画面で、「次へ」ボタンクリック時のイベント
	 */
	function onClickConfirmNext() {
		if (!grecaptchaModel.corrected) {
			return false;
		}

		var userKey = input.email.replace(/[.]/g, '_');
		var m = moment();
		var rightNow = m.format('YYYY-MM-DD-HH-mm-ss');

		var db = firebase.database();
		var contact = db.ref('/contact/'+userKey+'/'+rightNow);

		try {
			contact.set(input);
		} catch (e) {
			console.log(e);
			throw e;
		}

		pushStateByContainer('.thanks_container');
		activeContainer('.thanks_container');

		$('body,html').animate({scrollTop: 0}, 0);
		return false;
	}

	/**
	 * URLが変わったときのイベント
	 */
	function onPopState(event) {
		/*
    if (!event.originalEvent.state) {
			return;
		}
		*/
		var hash = location.hash;
		var containerId = '';
		$.each(containers, function(i, container) {
			if (container.url == hash) {
				containerId = container.id;
				return false;
			}
		});
		var container = getContainer(containerId);
		activeContainer(container.id);
  }

	/**
	 * containerId で pushState するユーティリティ.
	 * containers 配列を containerId で検索して、
	 * container の URL で pushState する
	 */
	function pushStateByContainer(containerId) {
		var container = getContainer(containerId);
		history.pushState(true, container.title, baseHref+container.url);
	}

	/**
	 * containerId で show/hide するユーティリティ.
	 */
	function activeContainer(containerId) {
		if (containerId == '') {
			containerId = '.input_container';
		}
		var that = getContainer(containerId);
		$.each(containers, function(i, container) {
			if (container.id == that.id) {
				$(container.id).show();
			} else {
				$(container.id).hide();
			}
		});
		if (that.initFunc != null) {
			that.initFunc();
		}
	}

	/**
	 * containerId で containers を探す
	 */
	function getContainer(containerId) {
		var that = null;
		$.each(containers, function(i, container) {
			if (container.id == containerId) {
				that = container;
				return false;
			}
		});
		if (that == null) {
			that = containers[0];
		}
		return that;
	}

	/**
	 * 改行を<br>に変換して表示する
	 */
	function safeNl2br(str) {
		var $safeText = $('<p></p>');
		$safeText.text(str);
		var html = $safeText.html();
	  return html.replace(/\r\n/g, '<br />').replace(/[\r\n]/g, '<br />');
	}

	/**
	 * キャプチャがOKになったときのイベントを上書き設定する
	 */
	grecaptchaModel.onCorrectCaptcha = function() {
		$confirmButton.prop('disabled', !grecaptchaModel.corrected);
	};

	start();
});
