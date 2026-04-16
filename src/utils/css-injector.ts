/**
 * 插入样式到指定容器中
 * @param container
 * @param cssContent
 */
export function injectCSS(container: HTMLElement, cssContent: string): HTMLStyleElement {
  // 检查是否已经注入过
  const existingStyle = container.querySelector("style[data-toc-styles]");
  if (existingStyle) {
    return existingStyle as HTMLStyleElement;
  }

  const styleElement = document.createElement("style");
  styleElement.setAttribute("data-toc-styles", "true");
  styleElement.textContent = cssContent;

  container.appendChild(styleElement);

  return styleElement;
}

/**
 * 移除容器中的样式元素
 * @param container 容器元素
 */
export function removeCSS(container: HTMLElement): void {
  const styleElement = container.querySelector("style[data-toc-styles]");
  if (styleElement) {
    styleElement.remove();
  }
}
