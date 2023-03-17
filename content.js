const popupContainer = document.getElementById("popupContainer");
const loginContainer = document.getElementById("loginContainer");
const statusMsg = document.getElementById('status');
const webList = document.getElementById('webList');
const onBtn = document.getElementById('onBtn');
const offBtn = document.getElementById('offBtn');
const refresh = document.getElementById('refresh');
const search = document.getElementById('search');

const username = document.getElementById("username");
const password = document.getElementById("password");
const loginBtn = document.getElementById("login");
const logoutBtn = document.getElementById("logout");
const userProfile = document.getElementById("userProfile");

const generateSTYLES = () => {
    return `
    <style>@import url('https://fonts.googleapis.com/css2?family=Rubik&display=swap');
    body {
        background: #dedede;
        color: #050424;
        font-family: 'Rubik', sans-serif;
    }
    .block-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
    .title {
        text-transform: capitalize;
    }
    </style>`;
};

const generateHTML = (pageName) => {
    return `
    <div class='block-container'>
        <h1 class='title'>${pageName} IS CURRENTLY BLOCKED</h1>
        <h2>go back to work</h2>
    </div>
        `;
};

// Set user profile and display/hide login ui
chrome.storage.sync.get(["userSession"], function({userSession}) {
    console.log(userSession)
    if(userSession) {
        loginContainer.classList.add('hide');
        popupContainer.classList.remove('hide');

        userProfile.innerHTML = `
        <h3>${userSession?.firstname} ${userSession?.lastname}</h3>
        <p>${userSession?.email}</p>
    `;
    }
    else {
        loginContainer.classList.remove('hide');
        popupContainer.classList.add('hide');
    }
})

// Set block status message
chrome.storage.sync.get(["block"], function(result) {
    if(statusMsg != null) {
        statusMsg.innerHTML = `Website Blocker is ${result.block ? 'ON' : 'OFF'}`;
    }
    if(result.block) {
        onBtn.disabled = true
        offBtn.disabled = false
        onBtn.classList.add("hide-btn");
        offBtn.classList.remove("hide-btn");
    } else {
        onBtn.disabled = false
        offBtn.disabled = true
        onBtn.classList.remove("hide-btn");
        offBtn.classList.add("hide-btn");
    }
});

// Set block websites list
chrome.storage.sync.get(["blockWebsites"], function(result) {
    if(result.blockWebsites) {
        result.blockWebsites.forEach((web, idx) => {
            const list = document.createElement("li");
            const text = document.createTextNode(web.website_name);
            list.appendChild(text);
            webList.appendChild(list);
        })
    }
});

// Get all block websites and blocks them if true
chrome.storage.sync.get(["block"], function(result) {
    if(result.block) {
        chrome.storage.sync.get(["blockWebsites"], function(result) {
            if(result.blockWebsites) {
                result.blockWebsites.forEach((web, idx) => {
                    // Blocking all websites the user inputted if it's in the list
                    if(window.location.hostname == web.website_link) {
                        document.head.innerHTML = generateSTYLES();
                        document.body.innerHTML = generateHTML(web.website_name);
                    }
                })
            }
        });
    }
});

if(logoutBtn != null) {
    logoutBtn.addEventListener("click", () => {    
        chrome.storage.sync.set({ "userSession": null });
        chrome.storage.sync.set({ "blockWebsites": null });
        chrome.storage.sync.set({ "block": null });
        
        loginContainer.classList.remove('hide');
        popupContainer.classList.add('hide');
        
        alert("Logout Successful!")
        location.reload();
    })
}

if(loginBtn != null) {
    loginBtn.addEventListener("click", async () => {

        const res = await fetch('http://127.0.0.1:8000/api/user/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            "email": username.value,
            "password": password.value
        }),
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" }
        })
        const user = await res.json()

        if(user.success == true) {
            chrome.storage.sync.set({ "userSession": user.data });
            chrome.storage.sync.get(["userSession"], function({userSession}) {
                userProfile.innerHTML = `
                    <h3>${userSession.firstname} ${userSession.lastname}</h3>
                    <p>${userSession.email}</p>
                `;
            })
            loginContainer.classList.add('hide');
            popupContainer.classList.remove('hide');
            alert(user.message)
        }
        else if(user.success == false) {
            alert(user.message)
        }
        else {
            alert("No connection. Please try again later.")
        }
    })
}

if(search != null) {
    search.addEventListener("click", () => {
        chrome.storage.sync.get(["userSession"], function({ userSession }) {
            console.log("from search", userSession)
            // Fetch block websites from api
            function getBlockWebsites() {
                return (
                    fetch('http://127.0.0.1:8000/api/user/blockwebsites', {
                        method: 'GET',
                        headers: {
                          'Accept': 'application/json', 
                          'Content-Type': 'application/json',
                          'X-Requested-With': 'XMLHttpRequest',
                          'Authorization': 'Bearer ' + userSession?.token
                        }
                    })
                    .then((res) => res.json())
                    .catch((err) => {
                        alert(err);
                    })
                );
            }
            
            // Set fallback default website lists
            getBlockWebsites().then(function(result) {
                if(result.success) {
                    chrome.storage.sync.set({ "blockWebsites": result.data }).then(() => {
                        location.reload();
                    });
                    alert(result.message);
                }
                else{
                    alert("Try to re-login and update again. \nDefault website lists provided by Task SS Website Blocker will be set temporarily.");

                    const websites = [
                        {website_link : "twitter.com", website_name: "Twitter"},
                        {website_link : "www.facebook.com", website_name: "Facebook"},
                        {website_link : "www.youtube.com", website_name: "YouTube"},
                    ];

                    chrome.storage.sync.set({ "blockWebsites": websites }).then(() => {
                        location.reload();
                    });
                }
            })
        });
    });
}

// On Button set block variable to true
if(onBtn != null) {
    onBtn.addEventListener("click", () => {
        chrome.storage.sync.set({ "block": true }).then(() => {
            console.log("Value is set to " + true);
        });
        
        chrome.storage.sync.get(["block"], function(result) {
            statusMsg.innerHTML = "Website Blocker is ON";  
            // alert("Website Blocker is ON");
        });
    
        // Reload the page to activate blocker
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
        });
        
        onBtn.disabled = true;
        offBtn.disabled = false;
        onBtn.classList.add("hide-btn");
        offBtn.classList.remove("hide-btn");
    });
}

// Off Button set block variable to false
if(offBtn != null) {
    offBtn.addEventListener("click", () => {
        chrome.storage.sync.set({ "block": false }).then(() => {
            console.log("Value is set to " + false);
        });
    
        chrome.storage.sync.get(["block"], function(result) {
            statusMsg.innerHTML = "Website Blocker is OFF";
            // alert("Website Blocker is OFF");
        });
    
        // Reload the page to activate blocker
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
        });
        
        onBtn.disabled = false;
        offBtn.disabled = true;
        onBtn.classList.remove("hide-btn");
        offBtn.classList.add("hide-btn");
    });
}

if(refresh != null) {
    refresh.addEventListener("click", function() { location.reload(); });
}

// getBlockWebsites().then(function(result) {
//     chrome.storage.sync.set({ "blockWebsites": result.data });
// })

// const websites = [
//     {link : "www.youtube.com", title: "YOUTUBE"},
//     {link : "www.facebook.com", title: "FACEBOOK"},
//     {link : "rateyourmusic.com", title: "RATE YOUR MUSIC"}
// ]