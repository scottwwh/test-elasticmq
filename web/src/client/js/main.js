
import { UserCard } from './../elements/UserCard.js';
import names from './names.js';

let users = [];

async function init(e) {

    const users = initUsers();
    users.then(data => {
        // console.log('Loaded all users');
        updateBadges();
    });

    document.querySelector('button.add-user').addEventListener('click', addUser);
    document.querySelector('button.send-notification-random').addEventListener('click', sendNotificationsRandom);
    document.querySelector('button.clear-notifications').addEventListener('click', updateNotifications);
    document.querySelector('button.modify-notifications').addEventListener('click', e => {
        const els = [...document.querySelectorAll('user-card')];
        els.forEach(el => {
            el.classList.toggle('supah');
        });
    });

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

    fetch(`/api/users/`, {
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
async function initUsers() {
    const data = await fetch(`/api/users/`)
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

function addUserCard(id, name) {
    if (!id) {
        console.log(id, name, 'ID is undefined, something went wrong on the server..')
        return;
    }

    document.querySelector('button.send-notification-random').disabled = false;

    const el = document.createElement('user-card');
    el.setAttribute('user-id', id);
    el.addEventListener('notification-update', updateNotifications);

    users.push(el);
    document.querySelector('.user-cards').appendChild(el);

    return fetch(`/api/users/${id}`)
        .catch(err => console.error(err))
        .then(response => {
            // console.log('User data:', response);
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

    // TODO: Figure out if this can glitch based on JSON not being loaded yet?
    //
    // This should be triggered once the image and JSON are fully loaded, I believe?
    el.classList.add('supah');

    // Trigger CSS transition
    el.dispatchEvent(new Event('notification-request'));

    const uuid = el.getAttribute('user-id');
    fetch(`/api/notifications/${uuid}`)
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

function updateNotifications(e) {
    // Glob all requests if request comes from outside of a user card
    const USER_CARD = 'user-card';
    const els = (e.currentTarget.nodeName.toLowerCase() === USER_CARD) ? [e.currentTarget] : [...document.querySelectorAll('user-card')] ;
    const ids = els.map(el => el.getAttribute('user-id'));
    const notifications = 0;

    fetch(`/api/notifications/${ids}`, {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    notifications
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
            console.log('Notifications updated?', data, els);
        });

    els.forEach(el => {
        // TODO: Fix this, cuz it does not work!
        // el.notifications = notifications;

        // Hack
        el.style = ``;
    })
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
 * @param {*} uuid
 * @returns
 */
function updateBadgeNotification(uuid) {
    const el = document.querySelector(`[user-id="${uuid}"]`);
    if (el.classList.contains('supah')) {
        // console.log('yoyoyo');
        el.notifications++;

    } else {
        // console.log('hi?');
        
        // Use of initialization only!
        // This is actually quite stupid given that the CSS works perfectly for socket updates
        el.style = `--url: url('../cdn/${uuid}.svg?v=${new Date().getTime()}')`;

        // // This should be triggered once the image and JSON are fully loaded, I believe?
        // el.classList.add('supah');
    }

    // TODO: Implement high/low count to determine whether a user has already hit 10
    // and thus should display an animation
    //
    // const notifications = data.notifications;
    // if (notifications > 0 && notifications != el.notifications) {
    //     el.notifications = data.notifications;

        // el.notifications++;
        // el.notifications = 6;

        el.classList.toggle('updated');
    // }
}

window.addEventListener('DOMContentLoaded', init);
