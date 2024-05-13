document.addEventListener('DOMContentLoaded', function() {
    chrome.runtime.sendMessage({action: "checkStorage"}, function(response) {
		const localStorage = document.getElementById("localStorage");
		const sessionStorage = document.getElementById("sessionStorage");

		if (response.error) {
			console.error('Error:', response.error);
			localStorage.textContent = 'Error checking storage';
			sessionStorage.textContent = 'Error checking storage';
		} else {

			localStorage.textContent = 'Local Storage: ' + response.data.localStorageCount;
			sessionStorage.textContent = 'Session Storage: ' + response.data.sessionStorageCount;
		}
    });
});