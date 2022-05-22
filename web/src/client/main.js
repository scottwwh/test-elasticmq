
import { UserCard } from './elements/UserCard.js';
import names from './names.js';

let users = [];

async function init(e) {

    // Not required atm, since users aren't yet visible until
    // they are created, which resets their notifications
    // updateBadges();
 
    // TBD: Replace with sockets/similar?
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
    document.querySelector('button.send-notification-random').disabled = false;

    const id = users.length;
    const max = users.length;
    const el = document.createElement('user-card');
    el.setAttribute('user-id', max);
    el.setAttribute('name', names.getRandom());

    users.push(el);
    document.querySelector('.user-cards').appendChild(el);

    const data = fetch(`/api/user/${id}`)
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
            console.log('User created?', data);
        });
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

    const data = fetch(`/api/notification/${id}`)
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

    for (var i = 0; i < users.length; i++) {
        const id = i;
        const data = fetch(`/cdn/${id}.txt`)
            .catch(err => console.error(err))
            .then(response => {
                if (!response.ok) {
                    throw Error("URL not found");
                } else {
                    return response.text();
                }
            })
            .then(data => {
                const el = document.querySelector(`[user-id="${id}"]`);
                if (data > 0 && data != el.notifications) {
                    // console.log('Found', data, 'notifications for user ID', id);
                    el.notifications = data;
                    el.classList.toggle('updated');
                }
            });
    }
}

window.addEventListener('DOMContentLoaded', init);
