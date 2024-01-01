import {LitElement, html, css} from 'https://unpkg.com/lit-element@2.2.1/lit-element.js?module';
import { UserCard } from './../elements/UserCard.js';
import API from './../js/API.js';

const CLASS_HOT = 'client';

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


export class UserCardList extends LitElement {
  static styles = css`

/*
:root {
  display: block;
  border: 1px solid orange;
}
*/

user-card {
  display: inline-block;
  padding: 0.5rem;
  margin: 0.5rem;
  background-color: var(--main-bg-color);
  border: 2px solid #aaa;
  border-radius: 1.5rem;
  width: 7rem;
  text-align: center;
  position: relative;
  opacity: 0.75;
}

user-card.sending {
  background: gold;
  border-color: orange;
}

user-card.sending.completed {
  transition: all 0.5s;
  background-color: #ddd;
  border-color: #aaa;
}

/* SVGs badges */
user-card:before {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  content: " ";
  background-repeat: no-repeat;
  background-image: var(--url);
  background-size: auto auto;
  width: 25px;
  height: 25px;
  transition: all 0.5s, background-color 0.25s;

  border-radius: 12.5px;
}

/* Pure CSS badges */
user-card.client:before {
  content: attr(notifications);
  background-color: maroon;
  background-image: none;

  color: #fff;
  font-family: Arial;
  font-size: 0.95rem;
  font-weight: bold;
  line-height: 1.6rem; /* Approximating the SVG */
  text-align: center;
  vertical-align: baseline;
}

user-card.updated:before {
  transform: rotateY(359deg);
}

user-card.client.receiving:before {
  background-color: red;
}

  `;

  static get properties() {
    return {
      users: {type: Array},
      userData: {type: Object},
      userMap: {type: Object},  
    }
  }

  constructor() {
    super();
    this.users = [];
    this.userData = {};
    this.userMap = {};
    this.usersInitialized = 0;
  }

  /*
  updated(changedProperties) {
    console.log('Changed properties:', changedProperties); // logs previous values
    console.log(this.users); // logs current value
  }
  */

  async addUser(id, data = null) {

    // New user has been added
    if (data) {

      // Allow time for template to be re-rendered, then show new user
      setTimeout(e => {
        const el = this.shadowRoot.querySelector(`user-card[id="${id}"]`);
        el.dispatchEvent(new Event('notification-request'));
      }, 50);

    // Loading existing users during init
    } else {
      data = await API.getUser(id);
    }

    this.userData[id] = data;
    this.updateUserData();

    return id;
  }

  updateUserData() {
    // Sort alphabetically by default (and possibly always)
    this.users = Object.values(this.userData).sort(sortByName);

    this.userMap = {};
    this.users.forEach((user, i) => {
      this.userMap[user.id] = i;
    });
  }

  // TODO: Handle
  removeUser(e) {
    // console.log('removeUser:', e);

    delete this.userData[e.target.data.id];
    this.updateUserData();    
  }

  // TODO: Handle
  clearNotifications(e) {
    console.log('clearNotifications:', e);
  }

  // Pre-clean since events/intervals on web component are still not perfect
  resetUserCards() {
    const els = this.shadowRoot.querySelectorAll("user-card");
    els.forEach(el => {
      el.classList.remove('sending', 'receiving', 'completed');
    });
  }

  showNotification(contacts) {
    const { source, target} = contacts;
    // console.log(source, target);

    // Dispatch event (will trigger CSS transition)
    const elSender = this.shadowRoot.querySelector(`user-card[id="${source}"]`);
    elSender.dispatchEvent(new Event('notification-request'));

    // Enable CSS to receive event via web socket
    const elRecipient = this.shadowRoot.querySelector(`user-card[id="${target}"]`);
    elRecipient.classList.add('receiving');
    elRecipient.classList.add(CLASS_HOT);
  }

  /**
   * Update badge notification based on JSON
   * 
   * @param {*} uuid
   * @returns
   */
  updateBadgeNotification(uuid) {
    const el = this.shadowRoot.querySelector(`[id="${uuid}"]`);
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

  // TODO: Add map to speed things up
  //
  // Reset elements
  clearBadgeNotifications(ids) {
    ids.forEach(uuid => {
      const el = this.shadowRoot.querySelector(`[id="${uuid}"]`);
      el.notifications = 0;
      el.classList.remove('client');
      el.style = ``;
    });
  }

  render() {
    return html`<p>These are the current users:</p>
      ${this.users.map(user => html`<user-card
        .data=${user}
        @user-remove="${this.removeUser}"
        @notification-clear="${this.clearNotifications}"
        id="${user.id}"></user-card>`
      )}`;
  }
}

customElements.define('user-card-list', UserCardList);