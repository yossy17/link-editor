// ==UserScript==
// @name                Link Editor
// @description         Customize link titles and behavior with a user-friendly interface. Add tooltips and control link opening in new tabs across websites.
// @version             2.0
// @author              Yos_sy
// @match               *://*/*
// @namespace           http://tampermonkey.net/
// @icon                https://freeiconshop.com/wp-content/uploads/edd/link-open-flat.png
// @license             MIT
// @run-at              document-end
// @require             https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/js/all.min.js
// @resource            TAILWIND_CSS https://raw.githubusercontent.com/yossy17/link-editor/master/dist/tailwind.css
// @grant               GM_addStyle
// @grant               GM_getResourceText
// @grant               GM_registerMenuCommand
// @grant               GM_setValue
// @grant               GM_getValue
// ==/UserScript==

(function () {
  'use strict';

  // 定数
  const STORAGE_KEY = 'linkEditorSelectorTitlePairs';
  const UI_ID = 'linkEditor';
  const SHORTCUT_KEY = {
    ctrlKey: true,
    shiftKey: false,
    altKey: true,
    keyCode: '0',
  }; // 設定パネルを開くショートカットキー

  // グローバル状態
  let selectorTitlePairs = []; // セレクタとタイトルのペアを保存する配列
  let settingsPanel = null; // 設定パネルのDOM要素

  // ユーティリティ関数
  const $ = (selector, context = document) => context.querySelector(selector); // 単一要素の取得
  const $$ = (selector, context = document) => context.querySelectorAll(selector); // 複数要素の取得

  // ストレージ関数
  function loadSelectorTitlePairs() {
    // ローカルストレージからデータを読み込む
    const storedData = GM_getValue(STORAGE_KEY, []);
    selectorTitlePairs = Array.isArray(storedData) ? storedData : [];
  }

  function saveSelectorTitlePairs() {
    // ローカルストレージにデータを保存する
    GM_setValue(STORAGE_KEY, selectorTitlePairs);
  }

  // コア機能
  function addTitleAndTargetToElements() {
    // 要素にtitle属性と関連する<a>タグにtarget属性を追加する
    selectorTitlePairs.forEach(({ selector, isEnabled, urlPattern, openInNewTab }) => {
      if (matchesCurrentURL(urlPattern)) {
        $$(selector).forEach((element) => {
          const innerText = element.textContent.trim();

          // title 属性の付与/削除
          if (innerText) {
            isEnabled ? element.setAttribute('title', innerText) : element.removeAttribute('title');
          }

          // 対象がリンク要素の場合そのままtarget blank を付与
          if (element.tagName.toLowerCase() === 'a') {
            isEnabled && openInNewTab
              ? element.setAttribute('target', '_blank')
              : element.removeAttribute('target');
          }

          // 子要素に含まれるリンク要素を探し、その要素にも付与
          const childATags = element.querySelectorAll('a');
          childATags.forEach((relatedATag) => {
            if (relatedATag) {
              isEnabled && openInNewTab
                ? relatedATag.setAttribute('target', '_blank')
                : relatedATag.removeAttribute('target');
            }
          });
        });
      }
    });
  }

  function observeDOMChanges() {
    // DOM変更を監視し、新しい要素に対して処理を適用する
    const observer = new MutationObserver((mutations) => {
      if (
        mutations.some(
          (mutation) => mutation.type === 'childList' && mutation.addedNodes.length > 0
        )
      ) {
        addTitleAndTargetToElements();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // UI関数
  function createPairElement({
    title = '',
    selector = '',
    isEnabled = true,
    urlPattern = getCurrentURLPattern(),
    openInNewTab = false,
  } = {}) {
    // セレクタとタイトルのペアを表す要素を作成する
    const pairDiv = document.createElement('div');
    pairDiv.id = `${UI_ID}__pair`;
    pairDiv.className =
      '!flex !h-80 !flex-col !gap-y-2 !rounded-md !bg-white !p-4 !pt-8 !shadow-md';

    pairDiv.innerHTML = `
      <div class="!flex !flex-col !gap-y-4">
        <div
          class="!relative !flex !flex-col before:!absolute before:!bottom-0 before:!left-1/2 before:!inline-block before:!h-0.5 before:!w-0 before:!-translate-x-1/2 before:!bg-[#eec968] before:!duration-300 focus-within:before:!w-full hover:before:!w-full"
        >
          <input
            id="${UI_ID}__title"
            class="peer !h-full !w-full !border-0 !border-b-2 !border-solid !border-[#e0e0e0] !pb-1 !pl-1 !pt-2 !outline-0 placeholder:opacity-0 placeholder:!duration-300 focus:placeholder:!opacity-100"
            type="text"
            placeholder="Example"
            value="${title}"
          />
          <label
            class="!pointer-events-none !absolute !top-1/2 !-translate-y-1/2 !text-gray-500 !duration-300 peer-focus:!top-0 peer-[&:not(:placeholder-shown)]:!top-0"
          >
            Title
          </label>
        </div>

        <div
          class="!relative !flex !flex-col before:!absolute before:!bottom-0 before:!left-1/2 before:!inline-block before:!h-0.5 before:!w-0 before:!-translate-x-1/2 before:!bg-[#eec968] before:!duration-300 focus-within:before:!w-full hover:before:!w-full"
        >
          <input
            id="${UI_ID}__selector"
            class="peer !h-full !w-full !border-0 !border-b-2 !border-solid !border-[#e0e0e0] !pb-1 !pl-1 !pt-2 !outline-0 placeholder:opacity-0 placeholder:!duration-300 focus:placeholder:!opacity-100"
            type="text"
            placeholder="main .example > h4"
            value="${selector}"
          />
          <label
            class="!pointer-events-none !absolute !top-1/2 !-translate-y-1/2 !text-gray-500 !duration-300 peer-focus:!top-0 peer-[&:not(:placeholder-shown)]:!top-0"
          >
            Selector
          </label>
        </div>

        <div
          class="!relative !flex !flex-col before:!absolute before:!bottom-0 before:!left-1/2 before:!inline-block before:!h-0.5 before:!w-0 before:!-translate-x-1/2 before:!bg-[#eec968] before:!duration-300 focus-within:before:!w-full hover:before:!w-full"
        >
          <input
            id="${UI_ID}__urlPattern"
            class="peer !h-full !w-full !border-0 !border-b-2 !border-solid !border-[#e0e0e0] !pb-1 !pl-1 !pt-2 !outline-0 placeholder:opacity-0 placeholder:!duration-300 focus:placeholder:!opacity-100"
            type="text"
            placeholder="https://example.com/*"
            value="${urlPattern}"
          />
          <label
            class="!pointer-events-none !absolute !top-1/2 !-translate-y-1/2 !text-gray-500 !duration-300 peer-focus:!top-0 peer-[&:not(:placeholder-shown)]:!top-0"
          >
            URLPattern
          </label>
        </div>
      </div>

      <div class="!my-auto !flex !flex-col">
        <label class="!flex !gap-x-1 !accent-[#eec968] cursor-pointer">
          <input id="${UI_ID}__onOffToggleBtn" type="checkbox" ${isEnabled ? 'checked' : ''} />
          <span>ON/OFF</span>
        </label>
        <label id="${UI_ID}__openInNewTab" class="!flex !gap-x-1 !accent-[#eec968] cursor-pointer ${isEnabled ? '' : 'cursor-not-allowed !opacity-50'}">
          <input id="${UI_ID}__openInNewTabBtn" type="checkbox" ${openInNewTab ? 'checked' : ''} ${isEnabled ? '' : 'disabled'} />
          <span>Open in new tab</span>
        </label>
      </div>

      <div class="!flex !items-center">
        <div class="!flex !gap-x-1">
          <button id="${UI_ID}__moveUpBtn">
            <i class="fa-regular fa-square-caret-up !size-6"></i>
          </button>
          <button id="${UI_ID}__moveDownBtn">
            <i class="fa-regular fa-square-caret-down !size-6"></i>
          </button>
        </div>
        <div class="!ml-auto !flex !gap-x-1">
          <button id="${UI_ID}__delBtn">
            <i class="fa-regular fa-trash-can !size-6"></i>
          </button>
        </div>
      </div>
    `;

    // 入力とチェックボックスの変更を監視
    ['input', 'change'].forEach((eventType) => {
      pairDiv.addEventListener(eventType, (e) => {
        if (e.target.id === `${UI_ID}__onOffToggleBtn`) {
          const openInNewTab = pairDiv.querySelector(`#${UI_ID}__openInNewTab`);
          const openInNewTabBtn = pairDiv.querySelector(`#${UI_ID}__openInNewTabBtn`);

          const isChecked = e.target.checked;
          openInNewTab.classList.toggle('cursor-not-allowed', !isChecked);
          openInNewTab.classList.toggle('!opacity-50', !isChecked);
          openInNewTabBtn.classList.toggle('cursor-not-allowed', !isChecked);
          openInNewTabBtn.disabled = !isChecked;
        }
        updateSelectorTitlePairs();
        addTitleAndTargetToElements();
      });
    });

    // 削除ボタンのイベントリスナー
    pairDiv.querySelector(`#${UI_ID}__delBtn`).addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this selector?')) {
        pairDiv.remove();
        updateSelectorTitlePairs();
      }
    });

    // 上下移動ボタンのイベントリスナー
    pairDiv
      .querySelector(`#${UI_ID}__moveUpBtn`)
      .addEventListener('click', () => movePair(pairDiv, -1));
    pairDiv
      .querySelector(`#${UI_ID}__moveDownBtn`)
      .addEventListener('click', () => movePair(pairDiv, 1));

    return pairDiv;
  }

  function movePair(pairDiv, direction) {
    // ペア要素を上下に移動する
    const parent = pairDiv.parentNode;
    const index = Array.from(parent.children).indexOf(pairDiv);
    const newIndex = index + direction;

    if (newIndex >= 0 && newIndex < parent.children.length) {
      parent.insertBefore(pairDiv, parent.children[newIndex + (direction > 0 ? 1 : 0)]);
      updateSelectorTitlePairs();
    }
  }

  function updateSelectorTitlePairs() {
    // セレクタとタイトルのペアを更新する
    selectorTitlePairs = Array.from($$(`#${UI_ID}__pair`))
      .map((pairElement) => ({
        title: $(`#${UI_ID}__title`, pairElement).value.trim(),
        selector: $(`#${UI_ID}__selector`, pairElement).value.trim(),
        urlPattern: $(`#${UI_ID}__urlPattern`, pairElement).value.trim(),
        isEnabled: $(`#${UI_ID}__onOffToggleBtn`, pairElement).checked,
        openInNewTab: $(`#${UI_ID}__openInNewTabBtn`, pairElement).checked,
      }))
      .filter(({ selector }) => selector);

    saveSelectorTitlePairs();
    addTitleAndTargetToElements();

    if (settingsPanel) {
      $(`#${UI_ID}__totalCount`, settingsPanel).textContent = `Total: ${selectorTitlePairs.length}`;
    }
  }

  function getCurrentURLPattern() {
    // 現在のURLパターンを取得する（ドメイン + ワイルドカード）
    return `${window.location.origin}/*`;
  }

  function matchesCurrentURL(urlPattern) {
    // 現在のURLがパターンにマッチするかチェックする
    try {
      return new RegExp(urlPattern).test(window.location.href);
    } catch (error) {
      console.error('URL matching error:', error);
      return false;
    }
  }

  function openSettingsUI() {
    // 設定UIを開く
    if (settingsPanel) {
      settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
    } else {
      settingsPanel = createSettingsUI();
      updateSettingsContent();
    }
  }

  function createSettingsUI() {
    // 設定UIを作成する
    const settingsDiv = document.createElement('div');
    settingsDiv.id = UI_ID;

    settingsDiv.innerHTML = `
      <div
        id="${UI_ID}__header"
        class="!flex !h-16 cursor-grab !items-center !justify-between active:cursor-grabbing"
      >
        <div class="!flex !items-center !gap-x-1 !text-xl">
          <i class="fa-solid fa-gear" style="color: #b4acbc"></i>
          <h3>Setting</h3>
        </div>

        <span id="${UI_ID}__totalCount" class="!text-gray-500">Total: ${selectorTitlePairs.length}</span>

        <button id="${UI_ID}__closeBtn"><i class="fa-solid fa-xmark !size-6"></i></button>
      </div>

        <div
          id="${UI_ID}__main"
          class="!my-4 !grid !h-[24rem] !min-w-64 !grid-cols-[repeat(auto-fill,minmax(theme(spacing.64),1fr))] !gap-4 !overflow-y-auto !text-base"
        ></div>

      <div class="!flex !h-8 !items-center !justify-between">
        <button id="${UI_ID}__addBtn">
          <i class="fa-solid fa-plus !size-6"></i>
        </button>

        <div class="!flex !items-center">
          <i class="fa-regular fa-copyright !size-4"></i>
          <p id="${UI_ID}__logo" class="!text-base">
            <span>Yo</span><span class="!-tracking-[0.375rem]">s_s</span
            ><span class="!ml-[0.375rem]">y</span>
          </p>
        </div>
      </div>
    `;

    // スタイルを追加
    const tailwindCss = GM_getResourceText('TAILWIND_CSS');
    GM_addStyle(tailwindCss);

    document.body.appendChild(settingsDiv);

    // イベントリスナー
    $(`#${UI_ID}__closeBtn`, settingsDiv).addEventListener('click', () => {
      settingsDiv.style.display = 'none';
    });

    $(`#${UI_ID}__addBtn`, settingsDiv).addEventListener('click', () => {
      const settingsContent = $(`#${UI_ID}__main`, settingsDiv);
      settingsContent.appendChild(createPairElement({ urlPattern: getCurrentURLPattern() }));
      updateSelectorTitlePairs();
    });

    setupDraggable(settingsDiv);

    return settingsDiv;
  }

  function updateSettingsContent() {
    // 設定内容を更新する
    if (!settingsPanel) return;

    const settingsContent = $(`#${UI_ID}__main`, settingsPanel);
    settingsContent.innerHTML = '';

    selectorTitlePairs.forEach((pair) => {
      settingsContent.appendChild(createPairElement(pair));
    });

    $(`#${UI_ID}__totalCount`, settingsPanel).textContent = `Total: ${selectorTitlePairs.length}`;
  }

  function setupDraggable(element) {
    // 要素をドラッグ可能にする
    let isDragging = false;
    let initialX,
      initialY,
      xOffset = 0,
      yOffset = 0;

    const dragStart = (e) => {
      if (e.target.closest(`#${UI_ID}__header`)) {
        isDragging = true;
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
      }
    };

    const dragEnd = () => (isDragging = false);

    const drag = (e) => {
      if (isDragging) {
        e.preventDefault();
        xOffset = e.clientX - initialX;
        yOffset = e.clientY - initialY;
        element.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0)`;
      }
    };

    $(`#${UI_ID}__header`, element).addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
  }

  // 初期化
  function init() {
    loadSelectorTitlePairs(); // ストレージからデータを読み込む
    observeDOMChanges(); // DOM変更の監視を開始
    addTitleAndTargetToElements(); // 初期要素に属性を追加
    GM_registerMenuCommand('⚙️Open Setting', openSettingsUI); // メニューコマンドを登録
    document.addEventListener('keydown', function (e) {
      const ctrlMatches = !SHORTCUT_KEY.ctrlKey || e.ctrlKey;
      const shiftMatches = !SHORTCUT_KEY.shiftKey || e.shiftKey;
      const altMatches = !SHORTCUT_KEY.altKey || e.altKey;
      const keyMatches = e.key === SHORTCUT_KEY.keyCode;

      if (ctrlMatches && shiftMatches && altMatches && keyMatches) {
        openSettingsUI();
      }
    });
  }

  init();
})();
