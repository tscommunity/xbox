export function sendMessageToActiveTab<IMessage>(message: IMessage) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0]!.id!, message);
  });
}

export async function broadcastMessage<IMessage>(message: IMessage) {
  return await chrome.runtime.sendMessage(message);
}
