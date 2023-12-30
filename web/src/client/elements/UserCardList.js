import {LitElement, html, css} from 'https://unpkg.com/lit-element@2.2.1/lit-element.js?module';
import { UserCard } from './../elements/UserCard.js';

export class UserCardList extends LitElement {
  static styles = css``;

  static get properties() {
    return {
      users: {type: Array},
    };
  }

  constructor() {
    super();
    this.users = [];
  }

  // updated(changedProperties) {
  //   console.log('Changed properties:', changedProperties); // logs previous values
  //   console.log(this.users); // logs current value
  // }

  render() {
    return html`<p>These are the current users:</p>
    <ul>
    ${this.users.map((user) =>
      html`<li>${user}</li>`
    )}
    </ul>`;
  }
}

customElements.define('user-card-list', UserCardList);