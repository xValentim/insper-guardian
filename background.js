const thirdPartyRequests = {};

const allCookieDetails = {};
const storageCountsByTabId = {};

const allPossibleHijacking = {};
const allHijackingSuspectByTab = {};


async function checkStorageForTab(tabId, sendResponse) {
    try {
        const results = await new Promise((resolve, reject) => {
            chrome.tabs.executeScript(tabId, {
                code: `({
                    localStorageCount: Object.keys(localStorage).length,
                    sessionStorageCount: Object.keys(sessionStorage).length
                })`
            }, (results) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError.message);
                } else {
                    resolve(results);
                }
            });
        });
        sendResponse({data: results[0]});
    } catch (error) {
        sendResponse({error: error});
    }
}
  
function calculateScore(tabId) {
	let score = 10;
	let discount = 0;

	discount += thirdPartyRequests[tabId] ? 2.5 : 0;
	discount += allHijackingSuspectByTab[tabId] ? 2.5 : 0;
	discount += allCookieDetails[tabId] ? 2.5 : 0;
	discount += allPossibleHijacking[tabId] ? 2.5 : 0;
	score -= discount;

	return score < 0 ? 0 : score;
}

// Thanks to André Brito Dev for the code
async function getCookies(tabId, domain) {
    return new Promise(resolve => {
        chrome.cookies.getAll({}, function(cookies) {
        const cookieDetails = {
            totalCookies: cookies.length,
            firstPartyCookies: 0,
            thirdPartyCookies: 0,
            sessionCookies: 0,
            persistentCookies: 0
        };

        cookies.forEach(cookie => {
			console.log("cookie domain: " + cookie.domain);
			console.log("domain: " + domain);

            if (cookie.domain === domain) {
				cookieDetails.firstPartyCookies++;
            } else {
            	cookieDetails.thirdPartyCookies++;
            }

            if ("session" in cookie && cookie.session) {
            	cookieDetails.sessionCookies++;
            } else {
            	cookieDetails.persistentCookies++;
            }
        });

		allCookieDetails[tabId] = cookieDetails;

        resolve(cookieDetails);
        });
    });
}

function extractBaseDomain(url) {
    let domainParts = url.split('.').reverse();

    if (domainParts.length >= 2) {
        let topLevelDomain = domainParts[0];  // Primeira parte após a inversão, TLD
        let secondLevelDomain = domainParts[1];  // Segunda parte após a inversão, SLD

        return `${secondLevelDomain}.${topLevelDomain}`;
    }

    return url;
}

function getDefaultPort(url) {
    if (url.port) return url.port;
    return url.protocol === "https:" ? 443 : 80;
}

function getTabId(details){
	return details.tabId;
}

function getUrl(details){
	return new URL(details.url);
}

// Third-party requests by tab ID
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        if (details.tabId < 0) return;

        const requestUrl = getUrl(details);
        const requestDomain = requestUrl.hostname;

        chrome.tabs.get(details.tabId, function(tab) {
            if (chrome.runtime.lastError) {
                return;
            }

            const tabUrl = new URL(tab.url);
            const tabDomain = tabUrl.hostname;

            if (extractBaseDomain(requestDomain) !== extractBaseDomain(tabDomain)) {
                thirdPartyRequests[details.tabId] = thirdPartyRequests[details.tabId] || new Set();
                thirdPartyRequests[details.tabId].add(requestDomain);
            }
        });
    },
    { urls: ["<all_urls>"] },  // Ouve todas as URLs
    []                         // Sem opções extras de filtragem
);

// Suspect behavior by tab ID
chrome.webRequest.onBeforeRequest.addListener(
	function(details) {

		const tabId = getTabId(details);
		
		if (tabId < 0) return; 
		
		const url = getUrl(details);

		const port = getDefaultPort(url);
		
		const hijackingPorts = ['8080', '8081', '8443', '8000'];

		if (typeof allHijackingSuspectByTab[tabId] === 'undefined') {
			allHijackingSuspectByTab[tabId] = false;
		}

		if (port === hijackingPorts[0] || port === hijackingPorts[1] || port === hijackingPorts[2] || port === hijackingPorts[3]) {
			allHijackingSuspectByTab[tabId] = true;
		} else {
			allHijackingSuspectByTab[tabId] = false;
		}
	},
	{urls: ["<all_urls>"]},
	["blocking"]
  );
  
// Handle messages from the popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

	if (msg.action === "thirdPartyRequests") {
		let output = [];
		if (thirdPartyRequests[msg.tabId]) {
			output = Array.from(thirdPartyRequests[msg.tabId]);
		}

		sendResponse(output);
	}

	if (msg.action === 'canvasFingerprintDetected') {
		chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
			const tabId = tabs[0].id;
			const countTab = tabs.length;
			if (!chrome.runtime.lastError && countTab > 0) {
				chrome.browserAction.setBadgeText({text: '!', tabId: tabId});
				chrome.browserAction.setBadgeBackgroundColor({color: '#007bff', tabId: tabId});
		  	}
		});
		sendResponse({status: 'Detection alert!'});
		return true; 
	}

	if (msg.action === "checkStorage") {

    	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

			if (tabs.length != 0) {
				checkStorageForTab(tabs[0].id, sendResponse);
			} else {
				sendResponse({error: "No active tab found"});
			}
    	
		});
    	return true;
	} 
	

	if (msg.action === "getCookies") {
		chrome.tabs.query({active: true, currentWindow: true}, async function(tabs) {
			if (tabs.length > 0) {
				try {
					const cookieDetails = await getCookies(tabs[0].id, msg.domain);
					sendResponse(cookieDetails);
				} catch (error) {
					sendResponse({error: "Failed to retrieve cookies"});
				}
			} else {
				sendResponse({error: "No active tab found"});
			}
		});
		return true;
	}

	if (msg.action === "checkPorts") {

		const tabId = msg.tabId;  

		if (typeof allHijackingSuspectByTab[tabId] === 'undefined') {
			allHijackingSuspectByTab[tabId] = false;
		}
		const possibleHijacking = allHijackingSuspectByTab[tabId]; 

		allPossibleHijacking[tabId] = possibleHijacking;
		
		sendResponse({suspect: possibleHijacking});
	}
	
	if (msg.action === "calculateScore") {
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		  if (tabs.length == 0) {
			  sendResponse({error: "No active tab found"});
			
		  } else {
			sendResponse({secScore: calculateScore(tabs[0].id)});
		  }
		});
		return true;
	}

});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (changeInfo.status === 'loading') {
	  gradeScore = 0; // Reset when a new page starts loading
	}
  });