<style scoped lang="scss">
:deep(.n-card) {
  position: fixed;
  top: 10px;
  left: 10px;
  width: 350px;
  max-height: 520px;
  font-family: Arial, sans-serif;
  font-size: 14px;
}

:deep(.n-card-header) {
  cursor: move;
  user-select: none;
}

:deep(.n-card__content) {
  padding: 10px;
  max-height: 400px;
  overflow-y: auto;
}

.empty-msg {
  padding: 20px;
  text-align: center;
  color: #999;
}

.element-row {
  padding: 4px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &.visible {
    background-color: #e0ffe0;
  }

  &.hidden {
    background-color: #ffe0e0;
  }
}

.selector-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-family: monospace;
}

.selector-type {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  margin-left: 5px;

  &.css {
    background-color: #4caf50;
    color: white;
  }

  &.xpath {
    background-color: #ff9800;
    color: white;
  }
}

.domain-hint {
  margin-left: 15px;
}

:deep(.n-input-wrapper) {
  textarea {
    word-wrap: break-word;
    word-break: break-all !important;
  }
}
</style>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { NCard, NButton, NSpace, NInput, NSwitch, NPopover, NCheckbox } from "naive-ui";
import { draggable } from "../../utils/manipulate";
import { DraggableApp } from "../../interface";
import { finder } from "@medv/finder";
import { getXPath } from "../../utils/dom-utils";
import { matcher } from "glob-url";

interface Props {
  container?: HTMLElement;
  isvisible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  container: undefined,
  isvisible: true,
});

interface SelectedElement {
  element: HTMLElement;
  selector: string;
  remember: boolean;
  hidden: boolean;
  originalDisplay: string;
  undoDraggable: Function;
}

const remember = ref(true);
const previousUrlPattern = ref(location.href);
const urlPattern = ref(location.href);
const toggleSelect = ref(false);
const selectedElements = ref<SelectedElement[]>([]);
const highlightOverlay = ref<HTMLDivElement | null>(null);
const isVisible = ref(props.isvisible);
const currentHighlightElement = ref<HTMLElement | null>(null); // 跟踪当前高亮的元素
const storageKey = "XBOX_DRAGGABLE_APP";

// 保存数据到 Chrome Storage
function saveToStorage() {
  const rules: { [key: string]: string[] } = {};

  // 获取当前 URL 模式对应的选择器
  const currentUrlPattern = urlPattern.value;
  const selectors = selectedElements.value
    .filter((item) => item.remember)
    .map((item) => item.selector);

  if (selectors.length > 0) {
    rules[currentUrlPattern] = selectors;
  }

  chrome.storage.local.set({
    [storageKey]: { Rules: rules },
  });
}

// 从 Chrome Storage 加载数据
function loadFromStorage() {
  chrome.storage.local.get([storageKey], (result) => {
    if (!result || !result[storageKey]) {
      return;
    }

    const xboxData = result[storageKey] as { Rules: { [key: string]: string[] } };
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
        return matcher.match(key, location.href);
      } catch (e) {
        return false;
      }
    });

    if (matchedKey) {
      urlPattern.value = matchedKey;
      previousUrlPattern.value = matchedKey;
      const selectors = rules[matchedKey];

      // 查找并处理匹配的元素
      selectors.forEach((selector) => {
        const elements = document.querySelectorAll<HTMLElement>(selector);
        elements.forEach((element) => {
          // 检查是否已经添加了该元素
          const alreadyAdded = selectedElements.value.some((item) => item.element === element);

          if (!alreadyAdded) {
            const undoDrag = draggable(element, true);
            selectedElements.value.push({
              element: element,
              selector: selector,
              hidden: false,
              remember: true,
              originalDisplay: getComputedStyle(element).display,
              undoDraggable: undoDrag,
            });
          }
        });
      });
    } else {
      urlPattern.value = location.href;
    }
  });
}

// 删除存储中的记录
function removeFromStorage(urlPatternKey: string) {
  chrome.storage.local.get([storageKey], (result) => {
    if (!result || !result[storageKey]) {
      return;
    }

    const xboxData = result[storageKey] as { Rules: { [key: string]: string[] } };
    const rules = xboxData.Rules;

    if (rules[urlPatternKey]) {
      delete rules[urlPatternKey];

      chrome.storage.local.set({
        [storageKey]: { Rules: rules },
      });
    }
  });
}

// 更新存储中的选择器列表
function updateStorageSelectors() {
  const currentUrlPattern = urlPattern.value;
  const selectors = selectedElements.value
    .filter((item) => item.remember)
    .map((item) => item.selector);

  chrome.storage.local.get([storageKey], (result) => {
    let rules: { [key: string]: string[] } = {};

    if (result && result[storageKey]) {
      const xboxData = result[storageKey] as { Rules: { [key: string]: string[] } };
      rules = xboxData.Rules;
    }

    if (selectors.length > 0) {
      rules[currentUrlPattern] = selectors;
    } else {
      delete rules[currentUrlPattern];
    }

    chrome.storage.local.set({
      [storageKey]: { Rules: rules },
    });
  });
}

// 创建高亮遮罩层
function createHighlightOverlay() {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.pointerEvents = "none";
  overlay.style.zIndex = "999998";
  overlay.style.display = "none";
  overlay.style.backgroundColor = "rgba(255, 0, 0, 0.2)";
  overlay.style.border = "2px solid rgba(255, 0, 0, 0.5)";
  document.body.appendChild(overlay);
  return overlay;
}

// 更新高亮遮罩位置
function updateHighlight(element: HTMLElement) {
  if (!highlightOverlay.value) return;
  const rect = element.getBoundingClientRect();
  highlightOverlay.value.style.left = rect.left + "px";
  highlightOverlay.value.style.top = rect.top + "px";
  highlightOverlay.value.style.width = rect.width + "px";
  highlightOverlay.value.style.height = rect.height + "px";
  highlightOverlay.value.style.display = "block";
}

// 隐藏高亮遮罩
function hideHighlight() {
  if (highlightOverlay.value) {
    highlightOverlay.value.style.display = "none";
  }
}

// 高亮指定元素（用于列表行悬停）
function highlightElement(element: HTMLElement) {
  if (!element) return;
  currentHighlightElement.value = element;
  updateHighlight(element);
}

// 处理鼠标离开行（使用 mouseout 而非 mouseleave）
function handleRowMouseOut(e: MouseEvent) {
  const row = e.currentTarget as HTMLElement;
  // 检查是否真的离开了该行（而不是移动到子元素）
  if (!row.contains(e.relatedTarget as Node)) {
    currentHighlightElement.value = null;
    hideHighlight();
  }
}

// 判断选择器类型
function isXPath(selector: string): boolean {
  return selector.startsWith("/");
}

// 获取元素的CSS选择器 - 使用 @medv/finder 生成唯一选择器
function getSelector(element: HTMLElement): string {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  // HTML和BODY特殊处理
  if (element.tagName.toLowerCase() === "html") {
    return "html";
  }
  if (element.tagName.toLowerCase() === "body") {
    return "body";
  }

  try {
    // 使用 @medv/finder 生成唯一的 CSS 选择器
    return finder(element, {
      root: document.body,
      idName: () => true,
      className: () => true,
      tagName: () => true,
      attr: () => false,
      seedMinLength: 1,
      optimizedMinLength: 1,
      maxNumberOfPathChecks: 1000,
    });
  } catch (error) {
    console.error("Failed to generate selector, fallback to XPath:", error);
    // 降级方案：返回 XPath
    return getXPath(element);
  }
}

// 切换元素显示/隐藏
function toggleElementVisibility(item: SelectedElement) {
  if (item.hidden) {
    item.element.style.display = item.originalDisplay;
    item.hidden = false;
  } else {
    item.originalDisplay = getComputedStyle(item.element).display;
    item.element.style.display = "none";
    item.hidden = true;
  }

  // 更新存储
  updateStorageSelectors();
}

// 删除元素
function deleteElement(item: SelectedElement, index: number) {
  if (item.hidden) {
    item.element.style.display = item.originalDisplay;
  }
  item.undoDraggable();
  selectedElements.value.splice(index, 1);

  // 如果删除的是当前高亮的元素，清除高亮
  if (currentHighlightElement.value === item.element) {
    currentHighlightElement.value = null;
    hideHighlight();
  }

  // 更新存储
  updateStorageSelectors();
}

// 鼠标移动事件 - 高亮元素
function handleMouseOver(e: MouseEvent) {
  if (!isVisible.value || !toggleSelect.value) {
    return;
  }
  const target = e.target as HTMLElement;

  // 检查是否在面板内部
  if (
    target.id === DraggableApp.ROOT_ELEMENT_ID ||
    target.closest(`#${DraggableApp.ROOT_ELEMENT_ID}`)
  ) {
    // 如果当前没有列表行高亮，才隐藏
    if (!currentHighlightElement.value) {
      hideHighlight();
    }
    return;
  }

  // 如果当前有列表行高亮，不处理页面元素的 mouseover
  if (currentHighlightElement.value) {
    return;
  }

  // 检查是否已经选择了该元素或其父元素
  const isAlreadySelected = selectedElements.value.some((item) => {
    return target === item.element || item.element.contains(target);
  });

  if (isAlreadySelected) {
    hideHighlight();
    return;
  }

  if (target && target !== document.body && target !== document.documentElement) {
    updateHighlight(target);
  }
}

// 鼠标离开文档
function handleMouseOut(e: MouseEvent) {
  // 如果当前有列表行高亮，不处理
  if (currentHighlightElement.value) {
    return;
  }

  if (!e.relatedTarget) {
    hideHighlight();
  }
}

// 点击事件 - 选择元素
function handleClick(e: MouseEvent) {
  if (!isVisible.value || !toggleSelect.value) {
    return;
  }

  const target = e.target as HTMLElement;

  // 检查是否点击在面板内部（包括所有子元素）
  if (
    target.id === DraggableApp.ROOT_ELEMENT_ID ||
    target.closest(`#${DraggableApp.ROOT_ELEMENT_ID}`)
  ) {
    return;
  }

  // 检查是否已经选择了该元素或其父元素
  const isAlreadySelected = selectedElements.value.some((item) => {
    return target === item.element || item.element.contains(target);
  });

  if (isAlreadySelected) {
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  const selector = getSelector(target);
  const existingIndex = selectedElements.value.findIndex((item) => item.selector === selector);

  if (existingIndex === -1) {
    const undoDrag = draggable(target, true);
    selectedElements.value.push({
      element: target,
      selector: selector,
      hidden: false,
      remember: remember.value, // 使用全局 remember 状态
      originalDisplay: getComputedStyle(target).display,
      undoDraggable: undoDrag,
    });

    // 自动保存到存储
    if (remember.value) {
      updateStorageSelectors();
    }
  }
}

function addMouseEventListeners() {
  document.addEventListener("mouseover", handleMouseOver);
  document.addEventListener("mouseout", handleMouseOut);
  document.addEventListener("click", handleClick);
}

function removeMouseEventListeners() {
  document.removeEventListener("mouseover", handleMouseOver);
  document.removeEventListener("mouseout", handleMouseOut);
  document.removeEventListener("click", handleClick);
}

function addResumeEventListener() {
  window.addEventListener(DraggableApp.Events.RESUME_DRAGGABLE_APP, resume);
}

function removeResumeEventListener() {
  window.removeEventListener(DraggableApp.Events.RESUME_DRAGGABLE_APP, resume);
}

function removeHighlightOverlay() {
  if (highlightOverlay.value) {
    highlightOverlay.value.remove();
    highlightOverlay.value = null;
  }
}

function hide() {
  isVisible.value = false;
  removeMouseEventListeners();

  // 保存当前状态
  if (remember.value) {
    updateStorageSelectors();
  } else {
    // 如果全局 remember 未选中，删除当前 URL 模式的记录
    removeFromStorage(urlPattern.value);
  }

  window.dispatchEvent(new CustomEvent(DraggableApp.Events.HIDE_DRAGGABLE_APP));
}

function resume() {
  isVisible.value = true;
  // 确保高亮遮罩处于隐藏状态（因为 resume 时鼠标不一定在可高亮的元素上）
  hideHighlight();
  addMouseEventListeners();
}

const showErrorMessage = ref(false);
const urlPatternInvalidMessage = ref("");
function saveConfig() {
  const currentUrlPattern = urlPattern.value;
  // 检查是否与之前的 URL 模式相同
  if (currentUrlPattern === previousUrlPattern.value) {
    // 相同则不进行保存操作
    return;
  }

  // 验证 URL 模式是否匹配当前页面
  let isValid = false;

  // 尝试正则匹配
  try {
    if (location.href.match(currentUrlPattern)) {
      isValid = true;
    }
  } catch (e) {
    // 忽略正则错误
  }

  // 尝试 glob 匹配
  if (!isValid) {
    try {
      isValid = matcher.match(currentUrlPattern, location.href);
    } catch (e) {
      // 忽略错误
    }
  }

  // 如果 URL 模式不匹配当前页面，提示用户
  if (!isValid) {
    showErrorMessage.value = true;
    urlPatternInvalidMessage.value = `URL pattern "${currentUrlPattern}" does not match the current page.`;
    return;
  }

  // 删除旧 URL 模式的记录（如果存在）
  if (previousUrlPattern.value) {
    removeFromStorage(previousUrlPattern.value);
  }

  // 保存新 URL 模式的配置
  if (remember.value) {
    updateStorageSelectors();
  }

  // 更新 previousUrlPattern
  previousUrlPattern.value = currentUrlPattern;
}

// 监听 remember 变化
watch(remember, (newVal, oldVal) => {
  if (oldVal !== undefined) {
    // 避免初始化时触发
    if (!newVal && oldVal) {
      // 从选中变为未选中：删除当前 URL 模式的所有记录
      removeFromStorage(urlPattern.value);
      // 取消所有元素的 remember 状态
      selectedElements.value.forEach((item) => {
        item.remember = false;
      });
    } else if (newVal && !oldVal) {
      // 从未选中变为选中：保存所有选中的元素
      updateStorageSelectors();
    }
  }
});

// 监听 selectedElements 中每个元素的 remember 变化
watch(
  () => selectedElements.value.map((item) => item.remember),
  () => {
    // 当任何元素的 remember 状态改变时，更新存储
    updateStorageSelectors();
  },
  { deep: true },
);

let undoDraggable: Function | null = null;

onMounted(() => {
  highlightOverlay.value = createHighlightOverlay();

  // 在组件挂载后启用拖动功能
  if (props.container) {
    undoDraggable = draggable(props.container, false, ".n-card-header");
  }

  addMouseEventListeners();
  addResumeEventListener();

  // 加载存储的数据
  loadFromStorage();
});

onUnmounted(() => {
  removeMouseEventListeners();
  removeResumeEventListener();
  removeHighlightOverlay();

  // 恢复所有元素
  selectedElements.value.forEach((item) => {
    if (item.hidden) {
      item.element.style.display = item.originalDisplay;
    }
    item.undoDraggable();
  });

  // 清理容器拖动功能
  if (undoDraggable) {
    undoDraggable();
    undoDraggable = null;
  }
});
</script>

<template>
  <n-card title="Draggable Element Selector" :bordered="false" closable size="small" @close="hide">
    <n-space vertical>
      <div>
        <n-space style="justify-content: space-between">
          <n-checkbox
            v-model:checked="remember"
            title="Remember the following URL pattern and auto make elements draggable after page loaded."
          >
            Remember by default.
          </n-checkbox>
          <n-popover trigger="manual" :show="showErrorMessage">
            <template #trigger>
              <n-button @click="saveConfig" size="tiny" secondary type="primary">Save</n-button>
            </template>
            <div>{{ urlPatternInvalidMessage }}</div>
          </n-popover>
        </n-space>
        <n-popover trigger="hover">
          <template #trigger>
            <n-input
              v-model:value="urlPattern"
              type="textarea"
              :resizable="false"
              placeholder="Enter site or file url to remember"
            />
          </template>
          <div>
            <div>Enter site or file url to remember</div>
            <ul class="domain-hint">
              <li>http://example.com</li>
              <li>http://*abc.com</li>
              <li>file:///D:/demo.html</li>
            </ul>
          </div>
        </n-popover>
      </div>
      <div>
        <n-switch v-model:value="toggleSelect" :round="false">
          <template #checked>Turn Off Selector</template>
          <template #unchecked>Turn On Selector</template>
        </n-switch>
      </div>
      <div v-if="toggleSelect && selectedElements.length === 0" class="empty-msg">
        Click on elements to select them
      </div>
      <n-space vertical style="max-height: 392px; overflow-y: auto">
        <n-space style="justify-content: space-between">
          <div>Draggable Element</div>
          <div>Operations</div>
        </n-space>
        <div
          v-for="(item, index) in selectedElements"
          :key="item.selector + '-' + index"
          :class="['element-row', item.hidden ? 'hidden' : 'visible']"
          @mouseover="highlightElement(item.element)"
          @mouseout="handleRowMouseOut"
        >
          <div class="selector-text">
            <span :class="['selector-type', isXPath(item.selector) ? 'xpath' : 'css']">
              {{ isXPath(item.selector) ? "XPath" : "CSS" }}
            </span>
            {{ item.selector }}
          </div>
          <div>
            <n-space :size="8" style="justify-content: space-between">
              <n-checkbox
                v-model:checked="item.remember"
                :title="item.remember ? 'Uncheck to cancel remember it' : 'Check to remember it'"
              ></n-checkbox>
              <n-button
                text
                :title="item.hidden ? 'Show element' : 'Hide element'"
                @click.stop="toggleElementVisibility(item)"
              >
                {{ item.hidden ? "👁️" : "🚫" }}
              </n-button>
              <n-button
                text
                title="Remove from list and restore element"
                @click.stop="deleteElement(item, index)"
              >
                ❌
              </n-button>
            </n-space>
          </div>
        </div>
      </n-space>
    </n-space>
  </n-card>
</template>
