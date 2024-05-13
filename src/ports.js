// Description: This script is injected into the current tab to check for suspect port usage.
document.addEventListener('DOMContentLoaded', function() {
    chrome.runtime.sendMessage({action: "checkPorts"}, function(response) {

        const possibleHijackingDiv = document.getElementById('possibleHijacking');

        if (!response) {
            console.error('No response from background script');
            possibleHijackingDiv.textContent = 'No response from background script.';

        } else if (response.error) {
            console.error('Error:', response ? response.error : "Error in detecting port usage.");
            possibleHijackingDiv.textContent = 'Error in detecting port usage.';
        
        } else if (response.suspect) {

            const content = "Suspect behavior detected. This website may be attempting to hijack ports.";

            const newContentH1 = document.createElement('h1');

            newContentH1.textContent = content;

            possibleHijackingDiv.appendChild(newContentH1);
        
        } else {

            possibleHijackingDiv.textContent = 'Ok... No suspect port usage detected.';
        
        }
    });
}); 