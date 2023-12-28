
import { UserCard } from './../elements/UserCard.js';
import names from './names.js';
import { update } from './arc.js';

let users = [];

// Stringified version of D3 file
const data = {
    // { id, name, weight }
    nodes: [],

    // { source, target, weight }
    links: [],
};

const userMap = {};

async function init(e) {

    data.nodes = [];
    data.links = [];

    const users = initUsers();
    users.then(res => {

        // Update data for D3
        data.nodes = res.map((user, i) => {
            userMap[user.id] = i;
            return {
                id: user.id,
                name: user.name,
                weight: 1,
            }
        });

        updateBadges();

        // Load initial visualization data
        fetch(`/api/notifications/`)
            .catch(err => console.error(err))
            .then(response => {
                if (!response.ok) {
                    throw Error("URL not found");
                } else {
                    return response.json();
                }
            })
            .then(data => {

                notificationsHistory = data.notifications;

                // TODO: Figure out why this leads to mouseover not working until an update?
                visualizationUpdate();
            });
    });

    const elCards = document.querySelector('.user-cards');
    elCards.addEventListener('transitionend', e => {
        // Avoid bubbling events from user-card elements
        if (!e.target.classList.contains('user-cards'))
            return;

        if (!elCards.classList.contains('hide')) {
            elCards.classList.add('hide');
        }
    });
    document.querySelector('button.toggle-user-cards').addEventListener('click', e => {
        if (elCards.classList.contains('hide')) {
            elCards.classList.remove('hide', 'fade-out');
        } else {
            elCards.classList.add('fade-out');
        }
    });
    document.querySelector('button.add-user').addEventListener('click', addUser);
    document.querySelector('button.send-notification-random').addEventListener('click', sendNotificationsRandom);
    document.querySelector('button.clear-notifications').addEventListener('click', clearNotifications);
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
            // console.log('Notification:', messageBody);
            updateBadgeNotification(messageBody.id);
        } else {
            console.log('Unknown message type', messageBody);
        }
    };
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

            // Update map
            userMap[res.id] = data.nodes.length - 1;

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
    el.addEventListener('notification-clear', clearNotifications);

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

// TODO: Rename to sendMessageRandom because that is what we're doing
function sendNotificationsRandom(e) {
    const button = e.currentTarget;
    button.disabled = true;

    if (users.length === 0) return;

    // Pre-clean since events/intervals on web component are still not perfect
    users.forEach(el => {
        el.classList.remove('sending', 'receiving', 'completed');
    });

    const intervalTotal = Math.floor(Math.random() * 40) + 10;
    // console.log(`Send ${intervalTotal} notifications`);

    const notificationData = generateNotificationData(users, intervalTotal);
    // console.log(notificationData);

    let intervalCount = 0;
    let interval = setInterval(e => {
        if (intervalCount == intervalTotal) {
            clearInterval(interval);

            button.disabled = false;
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
let notificationsHistory = [];

function visualizationAddLink(obj) {
    notificationsHistory.push(obj);
}

// TODO: Keep count of last message so client needn't recalculate everything
// TODO: Add debounced call to pre-generate graph for the next visit
function visualizationUpdate() {

    console.log(`${notificationsHistory.length} notifications`)

    const notificationsMap = {};
    notificationsHistory.forEach(datum => {
        // console.log(datum);
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
    });
    
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
// TODO: Rename to sendMessage
function sendNotification(contacts) {
    const elSender = users[contacts.from];

    const uuidSender = elSender.getAttribute('user-id');
    data.nodes[userMap[uuidSender]].weight += 0.025;

    // Enables CSS for client-side notification count
    const elRecipient = users[contacts.to];
    elRecipient.classList.add('receiving');
    elRecipient.classList.add(CLASS_HOT);

    // TODO: Adapt to send UUIDs for sender/receiver
    const uuidRecipient = elRecipient.getAttribute('user-id');
    data.nodes[userMap[uuidRecipient]].weight += 0.025;

    // TODO: Decouple sender/receiver transitions
    //
    // Trigger CSS transition
    elSender.dispatchEvent(new Event('notification-request'));

    const payload = {
        id: null,
        source: uuidSender,
        target: uuidRecipient,
        content: `Foo bar ${Math.random() * 1000}`
    };

    // Update data for D3
    visualizationAddLink({ source: uuidSender, target: uuidRecipient });
    visualizationUpdate();
    
    fetch(`/api/users/${uuidSender}/messages`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
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
function clearNotifications(e) {
    console.log('Clear notifications');

    // Glob all requests if request comes from outside of a user card
    const USER_CARD = 'user-card';
    const els = (e.currentTarget.nodeName.toLowerCase() === USER_CARD) ? [e.currentTarget] : [...document.querySelectorAll('user-card')] ;
    const ids = els.map(el => el.getAttribute('user-id'));
    const notifications = 0;

    fetch(`/api/notifications/${ids}`, {
            method: 'DELETE',
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

    // Clear notifications where ID is the target
    if (ids.length === 1) {
        const id = ids[0];

        notificationsHistory = notificationsHistory.filter(notification => {
            return (notification.target !== id);
        });

        // TODO: Confirm whether the following are derive data
        // and so redundant?
        data.links = data.links.filter(link => {
            return (link.target !== id);
        });

        data.nodes[userMap[id]].weight = 1;
    } else {
        data.links = [];

        data.nodes.forEach(node => {
            node.weight = 1;
        });

        notificationsHistory = [];
    }

    // Update viz
    update(data);

    // Reset element
    els.forEach(el => {
        el.notifications = 0;
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
    
    // Flip the badge
    el.classList.toggle('updated');
}

window.addEventListener('DOMContentLoaded', init);
