
import { UserCard } from './elements/UserCard.js';
import names from './names.js';

let users = [];

async function init(e) {

    // Not required atm, since users aren't yet visible until
    // they are created, which resets their notifications
    updateBadges();

    await addUsers();
 
    // TODO: Replace with sockets/similar
    setInterval(updateBadges, 10000);

    document.querySelector('button.add-user').addEventListener('click', addUser);
    document.querySelector('button.send-notification-random').addEventListener('click', sendNotificationsRandom);

    await initWebSocket();
}

async function initWebSocket() {
    const ws = await connectToServer();

    ws.onmessage = (webSocketMessage) => {
        const messageBody = JSON.parse(webSocketMessage.data);
        console.log('Received message:', messageBody);

        if (messageBody.status === 'Still running') {
            document.querySelector('.counter span').textContent = messageBody.number;
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


function addUser(e) {
    // const id = users.length;
    const name = names.getRandom();

    // addUserCard(id);

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

    data.forEach(id => {
        addUserCard(id);
    });
}

function addUserCard(id) {
    document.querySelector('button.send-notification-random').disabled = false;

    const el = document.createElement('user-card');
    el.setAttribute('user-id', id);

    users.push(el);
    document.querySelector('.user-cards').appendChild(el);

    if (name) {
        el.setAttribute('name', name);
    } else {
        // Set name async
        fetch(`/api/user/${id}`)
            .catch(err => console.error(err))
            .then(response => {
                if (!response.ok) {
                    throw Error("URL not found");
                } else {
                    return response.json();
                }
            })
            .then(data => {
                el.setAttribute('name', data.name);
            });
    }
}

function sendNotificationsRandom(e) {
    const button = e.currentTarget;
    button.disabled = true;

    // const total = Math.floor(Max.random() * users.length) + 1;
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

function sendNotification(id) {
    const el = users[id];

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
            // This whole thing should probably use a POST and receive a GUID
            console.log('Notification sent:', data);
        });
}

function updateBadges() {
    // TODO: Filter users whose .notifications property has changed
    console.log('Udpate badges for', users.length, 'users');
    if (users.length === 0) return ;

    const updates = [];
    for (var i = 0; i < users.length; i++) {
        // const id = i;
        const uuid = users[i].getAttribute('user-id');
        const data = fetch(`/cdn/${uuid}.json`)
            .catch(err => console.error(err))
            .then(response => {
                if (!response.ok) {
                    throw Error("URL not found");
                } else {
                    return response.json();
                }
            })
            .then(data => {
                const el = document.querySelector(`[user-id="${data.id}"]`);
                const notifications = data.notifications;
                if (notifications > 0 && notifications != el.notifications) {
                    // console.log('Found', data, 'notifications for user ID', data.id);
                    el.notifications = data.notifications;
                    el.classList.toggle('updated');
                } else {
                    // console.log('No updates');
                }
            });
        updates.push(data);
    }

    // TODO: What should response be?
    Promise.all(updates).then(response => {
        // console.log('Completed all updates:', response);
    });
}

window.addEventListener('DOMContentLoaded', init);
