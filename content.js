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

const statusMsg = document.getElementById('status');
const webList = document.getElementById('webList');
const onBtn = document.getElementById('onBtn');
const offBtn = document.getElementById('offBtn');
const refresh = document.getElementById('refresh');

// Fetch block websites from api
function getBlockWebsites() {
    return (
        fetch('http://127.0.0.1:8000/api/user/blockwebsites')
        .then(response => response.json())
        .catch(err => {
            console.log(err);
        })
    );
}

// Set fallback default website lists
getBlockWebsites().then(function(result) {
    if(result) {
        chrome.storage.sync.set({ "blockWebsites": result.data });
    }
    else {
        const websites = [
            {website_link : "twitter.com", website_name: "Twitter"},
            {website_link : "www.facebook.com", website_name: "Facebook"},
            {website_link : "www.youtube.com", website_name: "YouTube"},
        ]
        chrome.storage.sync.set({ "blockWebsites": websites });
    }

})  

// getBlockWebsites().then(function(result) {
//     chrome.storage.sync.set({ "blockWebsites": result.data });
// })

// const websites = [
//     {link : "www.youtube.com", title: "YOUTUBE"},
//     {link : "www.facebook.com", title: "FACEBOOK"},
//     {link : "rateyourmusic.com", title: "RATE YOUR MUSIC"}
// ]

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

// Get all block websites and blocks if true
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