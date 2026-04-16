console.info("content is running");

(() => {
  chrome.runtime.onMessage.addListener((message: IMessage) => {});
})();
