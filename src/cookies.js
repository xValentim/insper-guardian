// Description: This file is responsible for displaying the cookies information on the popup.html page.
document.addEventListener('DOMContentLoaded', function() {
  	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		
		var url = new URL(tabs[0].url);
		var domain = url.hostname;

		const totalCookies = document.getElementById('totalCookies');
		const firstPartyCookies = document.getElementById('firstPartyCookies');
		const thirdPartyCookies = document.getElementById('thirdPartyCookies');
		const sessionCookies = document.getElementById('sessionCookies');
		const persistentCookies = document.getElementById('persistentCookies');


		chrome.runtime.sendMessage({action: "getCookies", domain: domain}, function(response) {
			

			if (response) {
				console.log(response);
                totalCookies.textContent = response.totalCookies ;
				firstPartyCookies.textContent = response.firstPartyCookies ;
				thirdPartyCookies.textContent = response.thirdPartyCookies ;
				sessionCookies.textContent = response.sessionCookies ;
				persistentCookies.textContent = response.persistentCookies ;
				
            } else {
                totalCookies.textContent = 'Failed.';
				firstPartyCookies.textContent = 'Failed.';
				thirdPartyCookies.textContent = 'Failed.';
				sessionCookies.textContent = 'Failed.';
				persistentCookies.textContent = 'Failed.';
				
            }
      	});
    });
});