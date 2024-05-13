// Description: This file is responsible for the popup window that appears when the extension icon is clicked.
document.addEventListener('DOMContentLoaded', function() {
    const calculateButton = document.getElementById('calculateScore');

    const scoreDiv = document.getElementById('secScore');

    calculateButton.addEventListener('click', function() {
        scoreDiv.textContent = 'Calculating...';
        chrome.runtime.sendMessage({action: "calculateScore"}, function(response) {
            if (response && response.secScore) {
                scoreDiv.textContent = `Sec Score: ${response.secScore}`;
            } else {
                scoreDiv.textContent = 'Failed.';
            }
        });
    });
});