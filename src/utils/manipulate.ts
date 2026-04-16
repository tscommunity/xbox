// 重载签名
export function draggable(
  element: HTMLElement,
  fixedSize: boolean,
  dragHandle: HTMLElement,
): Function;
export function draggable(
  element: HTMLElement,
  fixedSize: boolean,
  dragHandleSelector: string,
): Function;
export function draggable(
  element: HTMLElement,
  fixedSize: boolean,
  allowDragFromChildren?: boolean,
): Function;

// 实现
export function draggable(
  element: HTMLElement,
  fixedSize = true,
  param?: boolean | HTMLElement | string,
): Function {
  // 解析参数
  let allowDragFromChildren = true;
  let dragHandleElement: HTMLElement | null = null;

  if (typeof param === "boolean") {
    allowDragFromChildren = param;
  } else if (param instanceof HTMLElement) {
    dragHandleElement = param;
  } else if (typeof param === "string") {
    dragHandleElement = element.querySelector(param);
  }

  let isDragging = false;
  let startX: number;
  let startY: number;
  let initialLeft: number;
  let initialTop: number;

  const inlineStyles = {
    width: element.style.width,
    height: element.style.height,
  };

  // 保存原始样式
  const computedStyle = getComputedStyle(element);
  const originalStyles = {
    position: computedStyle.position,
    whiteSpace: computedStyle.whiteSpace,
    width: computedStyle.width,
    height: computedStyle.height,
    left: computedStyle.left,
    top: computedStyle.top,
    right: computedStyle.right,
    bottom: computedStyle.bottom,
    margin: computedStyle.margin,
    zIndex: computedStyle.zIndex,
    cursor: computedStyle.cursor,
  };

  if (fixedSize) {
    element.style.width = originalStyles.width;
    element.style.height = originalStyles.height;
  }

  console.log(inlineStyles);
  console.log(originalStyles);

  const handleMouseDown = (e: MouseEvent) => {
    // 如果指定了拖动手柄，只有点击手柄时才允许拖动
    if (dragHandleElement && !dragHandleElement.contains(e.target as Node)) {
      return;
    }

    // 如果不允许从子元素拖动，只有点击元素本身时才允许
    if (!allowDragFromChildren && e.target !== element) {
      return;
    }

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;

    const rect = element.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;

    // 设置为 fixed 定位
    element.style.position = "fixed";
    element.style.whiteSpace = "nowrap";
    element.style.left = `${initialLeft}px`;
    element.style.top = `${initialTop}px`;
    element.style.margin = "0";
    element.style.zIndex = "1";

    // 只在拖动手柄上设置 grabbing 光标
    if (dragHandleElement) {
      dragHandleElement.style.cursor = "grabbing";
    } else {
      element.style.cursor = "grabbing";
    }

    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) {
      return;
    }

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    element.style.left = `${initialLeft + deltaX}px`;
    element.style.top = `${initialTop + deltaY}px`;
  };

  const handleMouseUp = () => {
    if (isDragging) {
      // 拖动结束后恢复为 grab 光标,表示元素仍可拖动
      if (dragHandleElement) {
        dragHandleElement.style.cursor = "grab";
      } else {
        element.style.cursor = "grab";
      }
    }

    isDragging = false;
  };

  // 设置初始光标为 grab,表示元素可拖动
  if (dragHandleElement) {
    dragHandleElement.style.cursor = "grab";
  } else {
    element.style.cursor = "grab";
  }

  element.addEventListener("mousedown", handleMouseDown);
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);

  // 返回一个函数用于取消拖动并还原
  return function undoDraggable() {
    // 移除所有事件监听器,确保元素不再可拖动
    element.removeEventListener("mousedown", handleMouseDown);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    // 恢复原始样式
    if (fixedSize) {
      element.style.width = inlineStyles.width;
      element.style.height = inlineStyles.height;
    }

    element.style.position = originalStyles.position;
    element.style.whiteSpace = originalStyles.whiteSpace;
    element.style.left = originalStyles.left;
    element.style.top = originalStyles.top;
    element.style.right = originalStyles.right;
    element.style.bottom = originalStyles.bottom;
    element.style.margin = originalStyles.margin;
    element.style.zIndex = originalStyles.zIndex;
    element.style.cursor = originalStyles.cursor;
  };
}
