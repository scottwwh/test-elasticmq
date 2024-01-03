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

  toggleStyle() {
    const els = [...this.shadowRoot.querySelectorAll('user-card')];
    els.forEach(el => {
        el.toggleStyle();
    });
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

    // Inject reactive property to drive notification badge
    data.client = false;
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

  // Triggered via main.js to avoid any race conditions, since both classes share data
  removeUser(id) {
    delete this.userData[id];
    this.updateUserData();
  }

  // Triggered via main.js to avoid race conditions
  clearNotifications(id = null) {
    if (id) {
      this.userData[id].client = false;
      this.userData[id].notifications = 0;
      this.userData[id] = Object.assign({}, this.userData[id]);
    } else {
      const data = {};
      Object.keys(this.userData).forEach(userId => {
        const user = this.userData[userId];
        user.notifications = 0;
        user.client = false;
        data[userId] = user;
      });
      this.userData = structuredClone(data);
    }
    this.updateUserData();
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

    // TODO: Defer this until notification is actually received?
    //
    // Enable CSS to receive event via web socket
    const elRecipient = this.shadowRoot.querySelector(`user-card[id="${target}"]`);
    elRecipient.classList.add('receiving');
    elRecipient.classList.add(CLASS_HOT);

    this.userData[target].client = true;
    this.userData[target] = Object.assign({}, this.userData[target]);
    this.updateUserData();
  }

  /**
   * Update badge notification based on JSON
   * 
   * @param {*} uuid
   * @returns
   */
  updateBadgeNotification(uuid, live = false) {
    const el = this.shadowRoot.querySelector(`[id="${uuid}"]`);
    // console.log('update badge for:', uuid);

    if (live) {
        // console.log('Client-side update')
        el.style = '';

        this.userData[uuid].notifications++;
        this.userData[uuid] = Object.assign({}, this.userData[uuid]);
        this.updateUserData();

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
      el.classList.remove(CLASS_HOT);
      el.style = ``;
    });
  }

  render() {
    return html`<p>These are the current users:</p>
      ${this.users.map(user => html`<user-card
        .data=${user}
        id="${user.id}"></user-card>`
      )}`;
  }
}

customElements.define('user-card-list', UserCardList);