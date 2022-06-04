
import { UserCard } from './elements/UserCard.js';
import names from './names.js';

let users = [];

async function init(e) {

    const initUsers = addUsers();
    initUsers.then(data => {
        // console.log('Loaded all users');
        updateBadges();
    });

    document.querySelector('button.add-user').addEventListener('click', addUser);
    document.querySelector('button.send-notification-random').addEventListener('click', sendNotificationsRandom);

    await initWebSocket();
}


//-- Web sockets --//


async function initWebSocket() {
    const ws = await connectToServer();

    ws.onmessage = (webSocketMessage) => {
        const messageBody = JSON.parse(webSocketMessage.data);
        if (messageBody.type === 'notification') {
            updateBadgeNotification(messageBody.id);
        } else {
            console.log('Unknown message type', messageBody);
        }
    };

    // TODO: Determine if there are any cases where I want to send messages rather than call an API?
    // document.body.onmousemove = (evt) => {
    //     const messageBody = { x: evt.clientX, y: evt.clientY };
    //     ws.send(JSON.stringify(messageBody));
    // };
}

async function connectToServer() {
    const ws = new WebSocket('ws://localhost:7071/ws');
    return new Promise((resolve, reject) => {
        const timer = setInterval(() => {
            if(ws.readyState === 1) {
                clearInterval(timer)
                resolve(ws);
            }
        }, 10);
    });
}


//--- WEB COMPONENTS ---//


/**
 * Create user
 * @param {*} e 
 */
function addUser(e) {
    const name = names.getRandom();

    fetch(`/api/user/`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    name
                }
            )
        })
        .catch(err => console.error(err))
        .then(response => {
            if (!response.ok) {
                throw Error("URL not found");
            } else {
                return response.json();
            }
        })
        .then(data => {
            console.log('User created?', data);
            addUserCard(data.id, name);
        });
}

/**
 * Retrieve current users to generate cards
 */ 
async function addUsers() {
    const data = await fetch(`/api/user/`)
        .catch(err => console.error(err))
        .then(response => {
            if (!response.ok) {
                throw Error("URL not found");
            } else {
                return response.json();
            }
        });

    const users = [];
    data.forEach(id => {
        users.push(addUserCard(id));
    });

    return Promise.all(users);
}

function addUserCard(id) {
    document.querySelector('button.send-notification-random').disabled = false;

    const el = document.createElement('user-card');
    el.setAttribute('user-id', id);

    users.push(el);
    document.querySelector('.user-cards').appendChild(el);

    return fetch(`/api/user/${id}`)
        .catch(err => console.error(err))
        .then(response => {
            if (!response.ok) {
                throw Error("URL not found");
            } else {
                return response.json();
            }
        })
        .then(data => {
            // Update card with name - this seems a bit backwards for new users?
            el.setAttribute('name', data.name);
        });
}

function sendNotificationsRandom(e) {
    const button = e.currentTarget;
    button.disabled = true;

    if (users.length === 0) return;

    // Pre-clean since events/intervals on web component are still not perfect
    users.forEach(el => {
        el.classList.remove('active', 'notified');
    });

    const intervalTotal = Math.floor(Math.random() * 80) + 20;
    // console.log(`Send ${intervalTotal} notifications`);

    let intervalCount = 0;
    let interval = setInterval(e => {
        if (intervalCount == intervalTotal) {
            clearInterval(interval);

            button.disabled = false;
        } else {
            const i = Math.floor(Math.random() * users.length);
            sendNotification(i);

            intervalCount++;
        }
    }, 100);
}

/**
 * Send notification (rather than taking an action that triggers a notification) via API
 * 
 * TODO: Adapt this so it works with either index (as it does now) or ID
 * TODO: Replace with POST
 * 
 * @param {*} index
 */
function sendNotification(index) {
    const el = users[index];

    // Trigger CSS transition
    el.dispatchEvent(new Event('notification-request'));

    const uuid = el.getAttribute('user-id');
    fetch(`/api/notification/${uuid}`)
        .catch(err => console.error(err))
        .then(response => {
            if (!response.ok) {
                throw Error("URL not found");
            } else {
                return response.text();
            }
        })
        .then(data => {
            console.log('Notification sent:', data);
        });
}

/**
 * Update notification badges for the first time
 * @returns 
 */
function updateBadges() {
    // console.log('Udpate badges for', users.length, 'users');
    if (users.length === 0) return ;

    const updates = [];
    for (var i = 0; i < users.length; i++) {
        const uuid = users[i].getAttribute('user-id');
        const data = updateBadgeNotification(uuid);
        updates.push(data);
    }

    // TODO: What should response be?
    Promise.all(updates).then(response => {
        // console.log('Completed all updates:', response);
    });
}

/**
 * Update badge notification based on JSON
 * 
 * TODO: Replace this with an image generator in ProcessorApp, which _should_ render all of this moot
 * 
 * @param {*} uuid 
 * @returns 
 */
function updateBadgeNotification(uuid) {
    return fetch(`/cdn/${uuid}.json`)
        .catch(err => console.error(err))
        .then(response => {
            if (!response.ok) {
                throw Error("URL not found");
            } else {
                // What happens when JSON is invalid?
                return response.json();
            }
        })
        .then(data => {
            const el = document.querySelector(`[user-id="${data.id}"]`);

            // TODO: Replace this with ? notation for if-set
            const notifications = data.notifications;
            if (notifications > 0 && notifications != el.notifications) {
                el.notifications = data.notifications;
                el.classList.toggle('updated');
            }
        });
}

window.addEventListener('DOMContentLoaded', init);
