var debugMode = false;

var url, tab, currentDomain;
var origProfileTable = "";

var profilesStoreName = chrome.extension.inIncognitoContext ? 'profiles-incognito' : 'profiles';

//CONSOLE LOG CONTROLLER //
function debugLog(logData){
	if(debugMode == true){
		console.log(logData);
	}
}

// BEGIN DOMAIN FUNCTIONS //
function getHostName(url) {
    var match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
    if (match != null && match.length > 2 && typeof match[2] === 'string' && match[2].length > 0) {
		debugLog(match[2]);
    return match[2];
    }
    else {
        return null;
    }
}
function getDomain(url) {
    var hostName = getHostName(url);
    var domain = url;
    
    if (hostName != null) {
        var parts = hostName.split('.').reverse();
        
        if (parts != null && parts.length > 1) {
            domain = parts[1] + '.' + parts[0];
                
            if (hostName.toLowerCase().indexOf('.co.uk') != -1 && parts.length > 2) {
              domain = parts[2] + '.' + domain;
            }
        }
    }
    debugLog(domain);
    return domain;
}
// END DOMAIN FUNCTIONS //


// BEGIN PROFILE FUNCTIONS //
function addProfileListeners(){
	var classname = document.getElementsByClassName("changeProfile");

	for (var i = 0; i < classname.length; i++) {
		classname[i].addEventListener('click', changeProfile, false);
	}
	
	var classname = document.getElementsByClassName("editProfile");

	for (var i = 0; i < classname.length; i++) {
		classname[i].addEventListener('click', editProfile, false);
	}
	var classname = document.getElementsByClassName("removeProfile");

	for (var i = 0; i < classname.length; i++) {
		classname[i].addEventListener('click', removeProfile, false);
	}
	document.querySelector('#profileCreate_button').addEventListener('click', newProfile, false);
}
function editProfile(event){
	var target = event.target;
	var oldProfileName = target.getAttribute('data-profileName');
	debugLog("Clicked");
	$(target).html("save");
	$(target).parent().parent().parent().find('.changeProfile').hide();
	$(target).parent().parent().parent().find('.profileLabel').hide();
	$(target).parent().parent().parent().find('input').show();
	target.removeEventListener('click', editProfile, false);
	target.addEventListener('click', saveProfileName, false);
	//$(target).parent().parent().parent().find('input').text(target.getAttribute('data-profileName'));
	
	
	
	
}
function saveProfileName(event){
	var target = event.target;
	
	
	chrome.storage.local.get(profilesStoreName, function(items){
		var currentDomain = $('#domain_label').html();
		var currentProfile = $('#profile_label').html();
		var profile = {};
		var domainProfile = {};
		
		if(jQuery.isEmptyObject(items) || jQuery.isEmptyObject(items[profilesStoreName]) || jQuery.isEmptyObject(items[profilesStoreName][currentDomain])){
			domainProfile = JSON.parse('{"currentProfile":"Profile 1", "profileData":{"Profile 1": {}}}');
			if(!jQuery.isEmptyObject(items[profilesStoreName])){
				profile = JSON.parse(JSON.stringify(items[profilesStoreName]));
			}
			profile[currentDomain] = domainProfile;
	
		}
		else{
			profile = items[profilesStoreName];
			debugLog(JSON.stringify(profile));
			domainProfile = profile[currentDomain];
		}
		if (target.getAttribute('data-profileName') !== $(target).parent().parent().parent().find('input').text()) {
			var temp = JSON.parse(JSON.stringify(profile));
			var newProfileName = $(target).parent().parent().parent().find('input').val();
			delete profile[currentDomain]['profileData'][target.getAttribute('data-profileName')];
			profile[currentDomain]['profileData'][newProfileName] = temp[currentDomain]['profileData'][target.getAttribute('data-profileName')];
			if(profile[currentDomain]['currentProfile'] == target.getAttribute('data-profileName')){
				profile[currentDomain]['currentProfile'] = newProfileName;
			}
		chrome.storage.local.set({ [profilesStoreName]: profile }, function(){
			loadProfiles();
		});
		}
		
		
		//console.log(JSON.stringify(profile));
	});
}
function removeProfile(event){
	var target = event.target.getAttribute('data-profileName');
	chrome.storage.local.get(profilesStoreName, function(items){
		var currentDomain = $('#domain_label').html();
		var currentProfile = $('#profile_label').html();
		var profile = items[profilesStoreName];
		
		delete profile[currentDomain]['profileData'][target];
		
		var newProfile = Object.keys(profile[currentDomain]['profileData'])[0];
		var passedVar = {'target':{'innerHTML':newProfile},'saveData':false};
		
		if(currentProfile == target){
			profile[currentDomain]['currentProfile'] = newProfile;
		}
		
		chrome.storage.local.set({ [profilesStoreName]: profile }, function(){
			if(currentProfile == target){changeProfile(passedVar);}
			loadProfiles();
		});
		//console.log(JSON.stringify(profile));
	});
}
function resetDomain(){
	chrome.storage.local.get(profilesStoreName, function(items){
		var currentDomain = $('#domain_label').html();
		var profile = items[profilesStoreName];
		
		delete profile[currentDomain];
		
		chrome.storage.local.set({ [profilesStoreName]: profile }, function(){
			loadProfiles();
		});
	});
}
function loadProfiles(){
	if(origProfileTable == ""){
		origProfileTable = $('#profileTable').html();
	}
	else{
		$('#profileTable').html(origProfileTable);
	}
	chrome.storage.local.get(profilesStoreName, function(items){
		var domain = $('#domain_label').html();
		var profile;
		
		if(jQuery.isEmptyObject(items) || jQuery.isEmptyObject(items[profilesStoreName]) || jQuery.isEmptyObject(items[profilesStoreName][currentDomain])){
			profile = JSON.parse('{"currentProfile":"Profile 1", "profileData":{"Profile 1": {}}}');
		}
		else{
			profile = items[profilesStoreName][domain];
		}
		$('#profile_label').html(profile['currentProfile']);
		//$('#storage_label').html(JSON.stringify(profile['profileData']));
		
		for (var profileData in profile['profileData']){
			if (typeof profile['profileData'][profileData] !== 'function') {
				var tableRef = document.getElementById('profileTable').getElementsByTagName('tbody')[0];
				// Insert a row in the table at row index 0
				var newRow   = tableRef.insertRow(tableRef.rows.length - 1);
				// Insert a cell in the row at index 0
				var newCell  = newRow.insertCell(0);
				// Append a text node to the cell
				
				var textbox = document.createElement('input');
				textbox.setAttribute("hidden", "true");
				textbox.type = "textbox";
				textbox.setAttribute("value", profileData);
				
				var a  = document.createElement('a');
				
				var linkText  = document.createTextNode(profileData);
				
				if($('#profile_label').html() != profileData){
					a.appendChild(linkText);
					a.href = "#";
					a.className = "changeProfile";
					
					newCell.appendChild(a);
				}
				else{
					var span = document.createElement('a');
					span.className = "profileLabel";
					span.appendChild(linkText);
					
					newCell.appendChild(span);
				}
				
				newCell.appendChild(textbox);
				
				
				var newCell2  = newRow.insertCell(1);
				newCell2.className = "no-wrap";
				var a2 = document.createElement('a');
				var link2Text  = document.createTextNode("edit");
				
				a2.appendChild(link2Text);
				a2.href = "#";
				a2.setAttribute('data-profileName', profileData);
				a2.className = "editProfile";
				
				var a3 = document.createElement('a');
				var link3Text  = document.createTextNode("remove");
				
				a3.appendChild(link3Text);
				a3.href = "#";
				a3.setAttribute('data-profileName', profileData);
				a3.className = "removeProfile";
				
				var cellSpan = document.createElement('span');
				cellSpan.appendChild(a2);
				cellSpan.appendChild(document.createTextNode(" "));
				cellSpan.appendChild(a3);
				cellSpan.className = "smallText";
				
				newCell2.appendChild(cellSpan);
			}
		}
		var tableRef = document.getElementById('profileTable').getElementsByTagName('tbody')[0];
		if(tableRef.rows.length < 4){
			tableRef.getElementsByClassName('removeProfile')[0].parentNode.removeChild(tableRef.getElementsByClassName('removeProfile')[0]);
		}
		addProfileListeners();
		//console.log(JSON.stringify(profile));
		loadDomainCookieStore();
	});
}
function newProfile(){
	chrome.storage.local.get(profilesStoreName, function(items){
		var currentDomain = $('#domain_label').html();
		var newProfileName = $('#profileName_input').val();
		var profile = {};
		var domainProfile = {};
		
		if(jQuery.isEmptyObject(items) || jQuery.isEmptyObject(items[profilesStoreName]) || jQuery.isEmptyObject(items[profilesStoreName][currentDomain])){
			domainProfile = JSON.parse('{"currentProfile":"Profile 1", "profileData":{"Profile 1": {}}}');
		}
		else{
			domainProfile = items[profilesStoreName][currentDomain];
			profile = items[profilesStoreName];
		}
		
		domainProfile['profileData'][newProfileName] = "";
		profile[currentDomain] = domainProfile;
		
		
		$('#profile_label').html(profile['currentProfile']);
		//$('#storage_label').html(JSON.stringify(profile));
		
		if(newProfileName != "")
		{
			chrome.storage.local.set({ [profilesStoreName]: profile }, function(){
				loadProfiles();
			});
		}

		return;
	});
}
function extrapolateUrlFromCookie(cookie) {
    var prefix = cookie.secure ? "https://" : "http://";
    if (cookie.domain.charAt(0) == ".")
        prefix += "www";

    return prefix + cookie.domain + cookie.path;
}
function changeProfile(event){
	var target = event.target;
	var saveData = event.saveData;
	var currentDomain = $('#domain_label').html();
	chrome.cookies.getAll({domain: currentDomain}, function(cookies) {
		var currentProfile = $('#profile_label').html();
		
		chrome.storage.local.get(profilesStoreName, function(items){
			var currentDomain = $('#domain_label').html();
			var oldProfileData = cookies;
			var newProfileData = items[profilesStoreName][currentDomain]['profileData'][target.innerHTML];
			
			var profile = items[profilesStoreName];
			var domainProfiles = profile[currentDomain]['profileData'];
			
			domainProfiles[currentProfile] = oldProfileData;
			profile[currentDomain]['currentProfile'] = target.innerHTML;
			profile[currentDomain]['profileData'] = domainProfiles;
			
			
			for(var i=0; i<cookies.length;i++) {
				chrome.cookies.remove({url: extrapolateUrlFromCookie(cookies[i]), name: cookies[i].name});
			}
			
			if(newProfileData.length > 0){for (var i=0; i<newProfileData.length;i++){
				newProfileData[i]['url'] = "http" + (newProfileData[i]['secure'] ? "s" : "") + "://" + newProfileData[i]['domain'].replace(/^\./, "");
				debugLog(newProfileData[i]['domain']);
				delete newProfileData[i]['hostOnly'];
				delete newProfileData[i]['session'];
				debugLog(JSON.stringify(newProfileData[i]));
				chrome.cookies.set(newProfileData[i]);
			}}
			
			
			
			if (typeof saveData === 'undefined' || saveData == true) {
				chrome.storage.local.set({ [profilesStoreName]: profile }, function(){
					loadProfiles();
				});
			}
			
			
			//$('#storage_label').text(JSON.stringify(newProfileData));
			
			chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
				var code = 'window.location.reload();';
				
				// manifest v2
				// chrome.tabs.executeScript(arrayOfTabs[0].id, {code: code});

				// manifest v3
				chrome.scripting.executeScript({
					target: {tabId: arrayOfTabs[0].id},
					func: ()=>{window.location.reload();}
				});
			});
		});
		
	});
	//$('#message_label').text("Profile Change Button clicked " + target.innerHTML);
}
// END PROFILE FUNCTIONS //



// BEGIN COOKIE FUNCTIONS //
function loadDomainCookieStore(){
	var currentDomain = $('#domain_label').html();
	chrome.cookies.getAll({domain: currentDomain}, function(cookies) {
		//$('#cookie_label').text(JSON.stringify(cookies));
	});
}
// END COOKIE FUNCTIONS //





function domainLoaded(){ //CODE TO EXECUTE WHEN DOMAIN HAS BEEN LOADED
	document.getElementById('domain_label').innerHTML = currentDomain;
	$('#profileCreate_button').data('domain', currentDomain);
}

function init(){ //POP-UP OPENED, INITIALIZE
	chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs) {
		tab = tabs[0];
		url = tab.url;
		currentDomain = getDomain(url);
		domainLoaded();
	});
	document.querySelector('#profileCreate_button').addEventListener('click', newProfile, false);
	loadProfiles();
}

document.addEventListener('DOMContentLoaded', function() {
  init();
  document.querySelector('#profileCreate_button').addEventListener('click', newProfile);
  //document.body.addEventListener('click', focusFilter);
  //document.querySelector('#remove_button').addEventListener('click', removeAll);
  //document.querySelector('#import_button').addEventListener('click', importCookies);
  //document.querySelector('#filter_div input').addEventListener(
  //    'input', reloadCookieTable);
  //document.querySelector('#filter_div button').addEventListener(
  //    'click', resetFilter); 
});
