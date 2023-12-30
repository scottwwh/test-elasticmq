
import { UserCard } from './../elements/UserCard.js';
import { UserCardList } from './../elements/UserCardList.js';
import { update } from './arc.js';
import API from './API.js';
import Cache from './Cache.js';

let users = [];
let cache = null;
let userCardList = null;
const userMap = {};


// TODO: Integrate this
function sortByName(a, b) {
    if (a.name < b.name) {
        return -1;
    }

    if (a.name > b.name) {
        return 1;
    }

    return 0;
}
  
function generateUserMap() {
    cache.data.nodes.forEach((user, i) => {
        userMap[user.id] = i;
    });
}

async function init(e) {

    cache = new Cache();

    const userData = initUsers();
    userData.then(async res => {

        // Update data for D3
        cache.data.nodes = res.map((user, i) => {
            return {
                id: user.id,
                name: user.name,
                weight: 1,
            }
        });
        generateUserMap();

        updateBadges();

        const notificationData = await API.getNotifications();
        notificationsHistory = notificationData.notifications;
        visualizationUpdate();
    });
    
    userCardList = document.createElement('user-card-list');
    const elCards = document.querySelector('.user-cards');
    elCards.appendChild(userCardList);

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
    fetch(`/api/users/`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
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
            const user = res.data;
            // console.log('User created?', user);

            addUserCard(user.id);

            cache.data.nodes.push(user);

            // Update map
            generateUserMap();

            update(cache.data);

            console.log(cache.data);
        });
}

function removeUser(e) {
    const id = e.target.getAttribute('user-id');

    fetch(`/api/users/${id}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
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
            console.log('Response:', res);
            if (res.status === 'ACK') {
                document.querySelector('.user-cards').removeChild(e.target);

                // Regenerate original list
                users = [...document.querySelectorAll('user-card')];

                try {
                    // TODO: Verify that deleting this node also deletes any associated links?
                    Notifications.clearNotificationsAndUpdateData(id, true);
            
                    // Update viz
                    update(cache.data);

                    console.log(cache.data);
                } catch (err) {
                    console.log('Error deleting user:', err);            
                }            
            }
        });
}

/**
 * Retrieve current users to generate cards
 */ 
async function initUsers() {
    const data = await API.getUsers();
    const users = [];
    data.forEach(id => {
        // Old
        users.push(addUserCard(id));

        // New
        cache.data.users.push(id);

        // Must be set explicitly to trigger an update, requestUpdate() does nothing
        userCardList.data = cache.data.users;
    });

    return Promise.all(users);
}

// This is almost entirely useless, because we've already made the request in addUser() ??
function addUserCard(id) {
    document.querySelector('button.send-notification-random').disabled = false;

    const el = document.createElement('user-card');
    el.setAttribute('user-id', id);
    el.addEventListener('notification-clear', clearNotifications);
    el.addEventListener('user-remove', removeUser);

    users.push(el);
    document.querySelector('.user-cards').appendChild(el);

    // TODO: Remove this entirely (we're already getting initial payload at init or when adding users
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

    // console.log(`${notificationsHistory.length} notifications`)

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
    cache.data.links = Object.keys(notificationsMap).map(id => {
        return notificationsMap[id];
    });
    
    update(cache.data);
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
    cache.data.nodes[userMap[uuidSender]].weight += 0.025;

    // Enables CSS for client-side notification count
    const elRecipient = users[contacts.to];
    elRecipient.classList.add('receiving');
    elRecipient.classList.add(CLASS_HOT);

    // TODO: Adapt to send UUIDs for sender/receiver
    const uuidRecipient = elRecipient.getAttribute('user-id');
    cache.data.nodes[userMap[uuidRecipient]].weight += 0.025;

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
    if (ids.length === 0) {
        console.log('No users, exiting..');
        return;
    }

    fetch(`/api/notifications/${ids}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
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
            console.log('Notifications cleared?', data, els);
        });
    

    Notifications.clearNotificationsAndUpdateData(ids);
    
    // Update viz
    update(cache.data);


    // Reset element
    els.forEach(el => {
        el.notifications = 0;
        el.classList.remove('client');
        el.style = ``;
    })
}


// TODO: Centralize data and notification objects?
class Notifications {

    static clearNotificationsAndUpdateData(ids, removeUser = false) {

        ids = Array.isArray(ids) ? ids : [ids] ;
        console.log('Delete notifications for IDs:', ids, removeUser);

        if (ids.length === 1) {
            const id = ids[0];
            
            if (removeUser) {
                notificationsHistory = notificationsHistory.filter(notification => {
                    return (notification.target !== id && notification.source !== id);
                });
    
                cache.data.links = cache.data.links.filter(link => {
                    return (link.target !== id && link.source !== id);
                });

                const index = userMap[id];
                console.log(`Remove user ${cache.data.nodes[index].name} from index`, index);

                cache.data.nodes.splice(index, 1);

                delete userMap[id];
                generateUserMap();
            } else {
                cache.data.nodes[userMap[id]].weight = 1;

                notificationsHistory = notificationsHistory.filter(notification => {
                    return (notification.target !== id);
                });

                // TODO: Confirm whether the following are derived data
                // and so redundant?
                cache.data.links = cache.data.links.filter(link => {
                    return (link.target !== id);
                });
            }
        } else {
            cache.data.links = [];
            cache.data.nodes.forEach(node => {
                node.weight = 1;
            });
    
            notificationsHistory = [];
        }
    }
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
        el.style = `--url: url('../../cdn/${uuid}.svg?v=${new Date().getTime()}')`;
    }
    
    // Flip the badge
    el.classList.toggle('updated');
}

window.addEventListener('DOMContentLoaded', init);
