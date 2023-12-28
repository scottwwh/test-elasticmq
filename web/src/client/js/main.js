
import { UserCard } from './../elements/UserCard.js';
import names from './names.js';
import { update } from './arc.js';

let users = [];

// Stringified version of D3 file
const data = {
    // "nodes":[{"id":1,"name":"A"},{"id":2,"name":"B"},{"id":3,"name":"C"},{"id":4,"name":"D"},{"id":5,"name":"E"},{"id":6,"name":"F"},{"id":7,"name":"G"},{"id":8,"name":"H"},{"id":9,"name":"I"},{"id":10,"name":"J"}],
    nodes: [],

    // TODO: Add weight property to represent higher frequency
    // "links":[{"source":1,"target":2},{"source":1,"target":5},{"source":1,"target":6},{"source":2,"target":3},{"source":2,"target":7},{"source":3,"target":4},{"source":8,"target":3},{"source":4,"target":5},{"source":4,"target":9},{"source":5,"target":10}]
    links: [],
};

async function init(e) {

    data.nodes = [];
    data.links = [];

    const users = initUsers();
    users.then(res => {

        // Update data for D3
        data.nodes = res.map((user, i) => {
            return {
                id: user.id,
                name: user.name,
                weight: 1,
            }
        });
        update(data);

        updateBadges();
    });

    document.querySelector('button.toggle-user-cards').addEventListener('click', e => {
        document.querySelector('.user-cards').classList.toggle('hide');
    });
    document.querySelector('button.add-user').addEventListener('click', addUser);
    document.querySelector('button.send-notification-random').addEventListener('click', sendNotificationsRandom);
    document.querySelector('button.clear-notifications').addEventListener('click', updateNotifications);
    document.querySelector('button.modify-notifications').addEventListener('click', e => {
        const els = [...document.querySelectorAll('user-card')];
        els.forEach(el => {
            el.classList.toggle(CLASS_HOT);
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
            // console.log('Notification for:', messageBody.id)
            updateBadgeNotification(messageBody.id);
        } else {
            // console.log('Unknown message type', messageBody);
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
    // TODO: Move this to server?
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
        .then(res => {
            // console.log('User created?', data);
            addUserCard(res.id, name);

            data.nodes.push({
                id: res.id,
                name,
                weight: 1,
            });

            update(data);
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
        // console.log('ID:', id);
        users.push(addUserCard(id));
    });

    return Promise.all(users);
}

function addUserCard(id, name) {
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
            
            // Initialize from server as base number for subsequent updates
            el.notifications = data.notifications;            

            // Update card with name - this seems a bit backwards for new users?
            el.setAttribute('name', data.name);

            return data;
        });
}

function generateNotificationData(users, total) {
    const notificationData = [];
    for (var i = 0; i < total; i++) {
        // Sender
        const from = Math.floor(Math.random() * users.length);

        // Recipient
        let to = Math.floor(Math.random() * users.length);
        while (to === from) {
            to = Math.floor(Math.random() * users.length);
        }

        notificationData.push({ from, to });
    }
    return notificationData;
}

function sendNotificationsRandom(e) {
    const button = e.currentTarget;
    button.disabled = true;

    if (users.length === 0) return;

    // Pre-clean since events/intervals on web component are still not perfect
    users.forEach(el => {
        el.classList.remove('sending', 'receiving', 'completed');
    });

    const intervalTotal = Math.floor(Math.random() * 40) + 10;
    console.log(`Send ${intervalTotal} notifications`);

    const notificationData = generateNotificationData(users, intervalTotal);
    console.log(notificationData);

    let intervalCount = 0;
    let interval = setInterval(e => {
        if (intervalCount == intervalTotal) {
            clearInterval(interval);

            button.disabled = false;

            // TODO: Add a transition to the SVG itself
            // setTimeout(() => {
            //     visualizationUpdate();
            // }, 100);
        } else {
            sendNotification(notificationData[intervalCount]);

            intervalCount++;
        }
    }, 100);
}

/**
 * Visualization utiis
 * @param {*} obj
 */
const notificationsHistory = [];

function visualizationAddLink(obj) {
    notificationsHistory.push(obj);
}

// TODO: Keep count of last message so client needn't recalculate everything
// TODO: Add debounced call to pre-generate graph for the next visit
function visualizationUpdate() {

    // Tried and true
    // data.links = notificationsHistory;
    console.log(`${notificationsHistory.length} notifications`)

    const notificationsMap = {};
    notificationsHistory.forEach(datum => {
        const id = `${datum.source}:${datum.target}`;
        const idReverse = `${datum.target}:${datum.source}`;

        // Treat messages between the same people going in
        // either direction as equivalent for now..
        let match = null;
        if (notificationsMap[id]) {
            match = id;
        } else if (notificationsMap[idReverse]) {
            match = idReverse;
        }

        // No communication found, create new object
        if (match === null) {
            notificationsMap[id] = {
                id,
                weight: 1,
                source: datum.source,
                target: datum.target,
            };
        } else {
            notificationsMap[match].weight += 0.5;
        }
    })

    // Convert object into array for D3
    data.links = Object.keys(notificationsMap).map(id => {
        return notificationsMap[id];
    })
    
    update(data);
}


const CLASS_HOT = 'client';

/**
 * Send notification (rather than taking an action that triggers a notification) via API
 * 
 * TODO: Adapt this so it works with either index (as it does now) or ID
 * TODO: Replace with POST
 * 
 * @param {*} index
 */
function sendNotification(contacts) {
    const elSender = users[contacts.from];

    // For some reason, this is required to prevent style="--url" from being set
    // even though sender's notifications are not being updated?
    elSender.classList.add(CLASS_HOT);

    const uuidSender = elSender.getAttribute('user-id');

    // Enables CSS for client-side notification count
    const elRecipient = users[contacts.to];
    elRecipient.classList.add('receiving');
    elRecipient.classList.add(CLASS_HOT);

    // TODO: Adapt to send UUIDs for sender/receiver
    const uuidRecipient = elRecipient.getAttribute('user-id');

    // TODO: Decouple sender/receiver transitions
    //
    // Trigger CSS transition
    elSender.dispatchEvent(new Event('notification-request'));

    // Update data for D3
    visualizationAddLink({ source: uuidSender, target: uuidRecipient });
    visualizationUpdate();
    
    fetch(`/api/notifications/${uuidSender}:${uuidRecipient}`)
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

// TODO: Distinguish between this and _clearNotifications_ which needs to exist
function updateNotifications(e) {
    console.log('Update notifications');

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

    // TODO: What is this hack for?
    els.forEach(el => {
        el.classList.remove('client');
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
    // console.log(el);

    if (el.classList.contains(CLASS_HOT)) {
        console.log('Client-side update')
        el.style = '';
        el.notifications++;

    } else {
        // Use for initialization, until new notifications are received via socket
        el.style = `--url: url('../cdn/${uuid}.svg?v=${new Date().getTime()}')`;
    }
    
    // TBD: How does this toggle work?
    // el.classList.toggle('updated');
}

window.addEventListener('DOMContentLoaded', init);
