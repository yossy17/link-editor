// ==UserScript==
// @name                Link Editor
// @description         Customize link titles and behavior with a user-friendly interface. Add tooltips and control link opening in new tabs across websites.
// @version             1.1
// @author              Yos_sy
// @match               *://*/*
// @namespace           http://tampermonkey.net/
// @icon                https://freeiconshop.com/wp-content/uploads/edd/link-open-flat.png
// @license             MIT
// @run-at              document-end
// @grant               GM_addStyle
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
    pairDiv.className = `${UI_ID}__content__pair`;

    pairDiv.innerHTML = `
      <label>Title: <input type="text" class="${UI_ID}__content__pair__title" placeholder="Title" value="${title}"></label>
      <label>Selector: <input type="text" class="${UI_ID}__content__pair__selector" placeholder="Selector" value="${selector}"></label>
      <label>URLPattern: <input type="text" class="${UI_ID}__content__pair__urlPattern" placeholder="URLPattern" value="${urlPattern}"></label>
      <label><input type="checkbox" class="${UI_ID}__content__pair__onOffSwitchingBtn" ${isEnabled ? 'checked' : ''}>ON/OFF</label>
      <label class="${UI_ID}__content__pair__openInNewTabLabel ${isEnabled ? '' : 'disabled'}">
        <input type="checkbox" class="${UI_ID}__content__pair__openInNewTabBtn" ${openInNewTab ? 'checked' : ''} ${isEnabled ? '' : 'disabled'}>
        Open link in a new tab
      </label>
      <div class="${UI_ID}__content__pair__ctrlBtn">
        <button class="${UI_ID}__content__pair__ctrlBtn__moveUpBtn">▲</button>
        <button class="${UI_ID}__content__pair__ctrlBtn__moveDownBtn">▼</button>
        <button class="${UI_ID}__content__pair__ctrlBtn__removeBtn">🗑️</button>
      </div>
    `;

    // 入力とチェックボックスの変更を監視
    ['input', 'change'].forEach((eventType) => {
      pairDiv.addEventListener(eventType, (e) => {
        if (e.target.classList.contains(`${UI_ID}__content__pair__onOffSwitchingBtn`)) {
          const openInNewTabLabel = pairDiv.querySelector(
            `.${UI_ID}__content__pair__openInNewTabLabel`
          );
          const openInNewTabBtn = pairDiv.querySelector(
            `.${UI_ID}__content__pair__openInNewTabBtn`
          );
          openInNewTabLabel.classList.toggle('disabled', !e.target.checked);
          openInNewTabBtn.disabled = !e.target.checked;
        }
        updateSelectorTitlePairs();
        addTitleAndTargetToElements();
      });
    });

    // 削除ボタンのイベントリスナー
    pairDiv
      .querySelector(`.${UI_ID}__content__pair__ctrlBtn__removeBtn`)
      .addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this selector?')) {
          pairDiv.remove();
          updateSelectorTitlePairs();
        }
      });

    // 上下移動ボタンのイベントリスナー
    pairDiv
      .querySelector(`.${UI_ID}__content__pair__ctrlBtn__moveUpBtn`)
      .addEventListener('click', () => movePair(pairDiv, -1));
    pairDiv
      .querySelector(`.${UI_ID}__content__pair__ctrlBtn__moveDownBtn`)
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
    selectorTitlePairs = Array.from($$('.linkEditor__content__pair'))
      .map((pairElement) => ({
        title: $(`.${UI_ID}__content__pair__title`, pairElement).value.trim(),
        selector: $(`.${UI_ID}__content__pair__selector`, pairElement).value.trim(),
        isEnabled: $(`.${UI_ID}__content__pair__onOffSwitchingBtn`, pairElement).checked,
        urlPattern: $(`.${UI_ID}__content__pair__urlPattern`, pairElement).value.trim(),
        openInNewTab: $(`.${UI_ID}__content__pair__openInNewTabBtn`, pairElement).checked,
      }))
      .filter(({ selector }) => selector);

    saveSelectorTitlePairs();
    addTitleAndTargetToElements();

    if (settingsPanel) {
      $('#totalCount', settingsPanel).textContent = `Total: ${selectorTitlePairs.length}`;
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
    settingsDiv.className = UI_ID;

    settingsDiv.innerHTML = `
      <div class="${UI_ID}__header">
        <h3 class="${UI_ID}__header__title">⚙️Setting</h3>
        <span id="totalCount" class="${UI_ID}__header__totalCount">Total: ${selectorTitlePairs.length}</span>
        <button class="${UI_ID}__header__closeBtn">×</button>
      </div>
      <div class="${UI_ID}__content"></div>
      <button id="${UI_ID}__addBtn" class="${UI_ID}__addBtn">+</button>
    `;

    // スタイルを追加
    GM_addStyle(`
@import url("https://fonts.googleapis.com/css2?family=Roboto&display=swap");
.linkEditor {
  font-family: "Roboto", sans-serif !important;
  user-select: none !important;
  -moz-user-select: none !important;
  -webkit-user-select: none !important;
  -ms-user-select: none !important;
  width: 1000px;
  min-width: 300px !important;
  font-weight: 400 !important;
  font-size: 12px !important;
  font-style: normal !important;
  margin: 0 !important;
  padding: 0 15px 15px !important;
  background-color: #fff !important;
  color: #333 !important;
  position: fixed !important;
  top: 20px !important;
  left: 20px !important;
  border: 1px solid #ccc !important;
  border-radius: 8px !important;
  z-index: calc(infinity) !important;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.3),
    0 4px 6px -2px rgba(0, 0, 0, 0.15) !important;
  pointer-events: auto !important;
  resize: horizontal !important;
  overflow: auto !important;
}
.linkEditor__header {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  height: 65px !important;
  cursor: grab !important;
  border-bottom: 1px solid #c9c9c9 !important;
  resize: horizontal !important;
}
.linkEditor__header:active {
  cursor: grabbing !important;
}
.linkEditor__header__title {
  font-size: 18px !important;
  color: #333 !important;
}
.linkEditor__header__totalCount {
  font-size: 16px !important;
  color: #333 !important;
}
.linkEditor__header__closeBtn {
  font-size: 20px !important;
  cursor: pointer !important;
  color: #888 !important;
  transition: color 0.3s ease !important;
}
.linkEditor__header__closeBtn:hover {
  color: #555 !important;
}
.linkEditor__content {
  display: grid !important;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)) !important;
  gap: 15px !important;
  margin-block: 10px !important;
  min-width: 250px !important;
  height: 480px !important;
  overflow-y: auto !important;
  scroll-snap-type: y mandatory !important;
}
.linkEditor__content__pair {
  display: flex !important;
  justify-content: center !important;
  flex-direction: column !important;
  height: 230px !important;
  border: 1px solid #ccc !important;
  padding: 0 8px !important;
  border-radius: 4px !important;
  background-color: #f9f9f9 !important;
  scroll-snap-align: start !important;
}
.linkEditor__content__pair label {
  font-weight: bold !important;
  margin-bottom: 4px !important;
}
.linkEditor__content__pair label:nth-child(-n + 3) {
  display: flex !important;
  flex-flow: column !important;
}
.linkEditor__content__pair label:nth-child(n + 4) {
  display: flex !important;
  align-items: center !important;
}
.linkEditor__content__pair__openInNewTabLabel.disabled {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
}
.linkEditor__content__pair__openInNewTabLabel.disabled input {
  pointer-events: none !important;
  cursor: not-allowed !important;
}
.linkEditor__content__pair__title,
.linkEditor__content__pair__selector,
.linkEditor__content__pair__urlPattern {
  padding: 5px !important;
  border: 1px solid #ccc !important;
  border-radius: 5px !important;
}
.linkEditor__content__pair__ctrlBtn {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
}
.linkEditor__content__pair__ctrlBtn__removeBtn {
  margin-left: auto !important;
}
.linkEditor__content__pair__ctrlBtn__moveUpBtn {
  margin-right: 5px !important;
}
.linkEditor__content__pair__ctrlBtn__moveDownBtn {
  margin-left: 5px !important;
}
.linkEditor__content__pair__ctrlBtn__moveUpBtn,
.linkEditor__content__pair__ctrlBtn__moveDownBtn,
.linkEditor__content__pair__ctrlBtn__removeBtn {
  background-color: #f9f9f9 !important;
  padding: 6px 8px !important;
  border: 1px solid #ccc !important;
  border-radius: 8px !important;
  cursor: pointer !important;
}
.linkEditor__content__pair__ctrlBtn__moveUpBtn:hover,
.linkEditor__content__pair__ctrlBtn__moveDownBtn:hover,
.linkEditor__content__pair__ctrlBtn__removeBtn:hover {
  background-color: #f0f0f0 !important;
  color: #555 !important;
}
.linkEditor__addBtn {
  position: relative !important;
  bottom: 0 !important;
  padding: 8px 12px !important;
  background-color: #f0f0f0 !important;
  border: 1px solid #ddd !important;
  border-radius: 4px !important;
  cursor: pointer !important;
}
.linkEditor__addBtn:hover {
  background-color: #e0e0e0 !important;
} /*# sourceMappingURL=Setting_Panel.css.map */

    `);

    document.body.appendChild(settingsDiv);

    // イベントリスナー
    $(`.${UI_ID}__header__closeBtn`, settingsDiv).addEventListener('click', () => {
      settingsDiv.style.display = 'none';
    });

    $(`#${UI_ID}__addBtn`, settingsDiv).addEventListener('click', () => {
      const settingsContent = $(`.${UI_ID}__content`, settingsDiv);
      settingsContent.appendChild(createPairElement({ urlPattern: getCurrentURLPattern() }));
      updateSelectorTitlePairs();
    });

    setupDraggable(settingsDiv);

    return settingsDiv;
  }

  function updateSettingsContent() {
    // 設定内容を更新する
    if (!settingsPanel) return;

    const settingsContent = $(`.${UI_ID}__content`, settingsPanel);
    settingsContent.innerHTML = '';

    selectorTitlePairs.forEach((pair) => {
      settingsContent.appendChild(createPairElement(pair));
    });

    $('#totalCount', settingsPanel).textContent = `Total: ${selectorTitlePairs.length}`;
  }

  function setupDraggable(element) {
    // 要素をドラッグ可能にする
    let isDragging = false;
    let initialX,
      initialY,
      xOffset = 0,
      yOffset = 0;

    const dragStart = (e) => {
      if (e.target.closest(`.${UI_ID}__header`)) {
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

    $(`.${UI_ID}__header`, element).addEventListener('mousedown', dragStart);
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

  init(); // スクリプトの初期化を実行
})();
