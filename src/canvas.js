// Sobrescrevendo métodos de CanvasRenderingContext2D para detectar chamadas suspeitas
const overrideMethod = (methodName) => {
  const originalMethod = CanvasRenderingContext2D.prototype[methodName];
  CanvasRenderingContext2D.prototype[methodName] = function() {
    alert('Canvas fingerprinting attempt detected!');
    chrome.runtime.sendMessage({action: 'canvasFingerprintDetected'});
    return originalMethod.apply(this, arguments);
  };
};

overrideMethod('toDataURL');
overrideMethod('getImageData');

// Exibindo o status de detecção na tela após o carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const statusDisplay = document.getElementById('status');
    if (tabs.length > 0 && tabs[0].id != null) {
      chrome.browserAction.getBadgeText({tabId: tabs[0].id}, (result) => {
        statusDisplay.textContent = result ? 'Canvas fingerprinting detected!' : 'No canvas fingerprinting detected.';
      });
    } else {
      statusDisplay.textContent = 'No active tab detected.';
    }
  });
});

