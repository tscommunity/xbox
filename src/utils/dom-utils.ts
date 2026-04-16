export function getXPath(element: HTMLElement): string {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  // HTML和BODY特殊处理
  if (element.tagName.toLowerCase() === "html") {
    return "/html";
  }
  if (element.tagName.toLowerCase() === "body") {
    return "/html/body";
  }

  const parts: string[] = [];
  let currentElement: HTMLElement | null = element;

  while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
    let index = 0;
    let sibling: Element | null = currentElement;

    // 计算同级元素中的位置
    while (sibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === currentElement.tagName) {
        index++;
      }
      sibling = sibling.previousElementSibling;
    }

    const tagName = currentElement.tagName.toLowerCase();
    const pathIndex = index > 1 ? `[${index}]` : "";
    parts.unshift(`${tagName}${pathIndex}`);

    currentElement = currentElement.parentElement;

    // 安全限制
    if (parts.length > 20) {
      break;
    }
  }

  return "/" + parts.join("/");
}
