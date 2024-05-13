// Description: This script is responsible for displaying the third-party requests made by the current tab.
document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.runtime.sendMessage({action: 'thirdPartyRequests', tabId: tabs[0].id}, (response) => {
            const allInstance = document.getElementById('allInstance');
            const more = document.getElementById('more');
            const less = document.getElementById('less');

            // Adiciona domínios à lista e exibe os primeiros 7
            response.forEach((domain, index) => {
                const li = document.createElement('li');
                li.textContent = domain;
                li.style.display = index < 7 ? 'block' : 'none'; 
                allInstance.appendChild(li);
            });

            // Mostra ou esconde elementos da lista
            const toggleDisplay = (display, limit) => {
                Array.from(allInstance.children).forEach((item, index) => {
                    item.style.display = index < limit ? 'block' : display;
                });
                more.style.display = display === 'none' ? 'block' : 'none';
                less.style.display = display === 'block' ? 'none' : 'block';
            };

            if (response.length > 7) {
                more.style.display = 'block';
                more.addEventListener('click', () => toggleDisplay('block', response.length));
                less.addEventListener('click', () => toggleDisplay('none', 7));
            }
        });
    });
});

  