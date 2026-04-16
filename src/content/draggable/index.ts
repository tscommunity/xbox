import { App, createApp } from "vue";
import Draggable from "./Draggable.vue";
import { DraggableApp } from "../../interface";
import { matcher } from "glob-url";
import { draggable } from "../../utils/manipulate";

let app: App<Element> | null = null;
let container: HTMLDivElement | null = null;
function init() {
  if (app) {
    if (container?.classList.contains("hidden")) {
      container?.classList.remove("hidden");
    }

    window.dispatchEvent(new CustomEvent(DraggableApp.Events.RESUME_DRAGGABLE_APP));
    return;
  }

  container = document.createElement("div");
  container.id = DraggableApp.ROOT_ELEMENT_ID;
  document.body.appendChild(container);

  app = createApp(Draggable, { container });
  app.mount(container);
}

function hide() {
  if (container) {
    container.classList.add("hidden");
  }
}

function destroy() {
  if (!app) {
    return;
  }

  app.unmount();
  app = null;

  if (container) {
    container.remove();
    container = null;
  }
}

const undoDraggableFunctions: Function[] = [];

function undoDraggable() {
  while (undoDraggableFunctions.length > 0) {
    const undoDraggableFunction = undoDraggableFunctions.pop();
    undoDraggableFunction?.();
  }
}

function loadFromStorage() {
  chrome.storage.local.get([DraggableApp.STORAGE_KEY], (result) => {
    if (!result || !result[DraggableApp.STORAGE_KEY]) {
      return;
    }

    const xboxData = result[DraggableApp.STORAGE_KEY] as { Rules: { [key: string]: string[] } };
    const rules = xboxData.Rules;
    const keys = Object.keys(rules);

    // 查找匹配的 URL 模式
    const matchedKey = keys.find((key) => {
      // 尝试正则匹配
      try {
        if (location.href.match(key)) {
          return true;
        }
      } catch (e) {
        // 忽略正则错误
      }

      // 尝试 glob 匹配
      try {
        return matcher.match(location.href, key);
      } catch (e) {
        return false;
      }
    });

    if (matchedKey) {
      const selectors = rules[matchedKey];

      // 查找并处理匹配的元素
      selectors.forEach((selector) => {
        const elements = document.querySelectorAll<HTMLElement>(selector);
        elements.forEach((element) => {
          // 检查是否已经添加了该元素
          const undoDraggable = draggable(element, true);
          undoDraggableFunctions.push(undoDraggable);
        });
      });
    }
  });
}

(() => {
  loadFromStorage();

  // 监听来自 background 的消息
  chrome.runtime.onMessage.addListener((message: IMessage, sender, sendResponse) => {
    const { type } = message;
    if (type === DraggableApp.Events.OPEN_DRAGGABLE_APP) {
      undoDraggable();
      init();
    } else if (type === DraggableApp.Events.CLOSE_DRAGGABLE_APP) {
      destroy();
    }
  });

  // 监听来自 Vue 组件的自定义事件
  window.addEventListener(DraggableApp.Events.CLOSE_DRAGGABLE_APP, () => {
    destroy();
  });

  window.addEventListener(DraggableApp.Events.HIDE_DRAGGABLE_APP, () => {
    hide();
  });
})();
