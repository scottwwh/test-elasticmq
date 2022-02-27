// import {html, render} from 'https://unpkg.com/lit-html?module';

// import {LitElement, html, css} from 'https://unpkg.com/lit-element/lit-element.js?module';
import {LitElement, html, css} from 'https://unpkg.com/lit-element@2.2.1/lit-element.js?module';


// import {customElement, property} from 'https://unpkg.com/lit-element@2.2.0/lib/decorators.js';
// https://unpkg.com/browse/lit-element@2.2.0/lib/

// console.log(customElement);

// @customElement('simple-greeting')
export class UserCard extends LitElement {
  static styles = css`p { color: blue }`;

  static get properties() {
    return {
      name: {type: String},
      id: {type: String},
      notifications: {
        type: String,
        reflect: true,
        converter: {
          toAttribute: value => {
            console.log('Convert value:', value);

            const max = 9;
            const num = parseInt(value);
            if (num === 0) {
              console.log('Return blank..');
              return '';
            } else if (num > 9) {
              return '..';
            } else {
              return value;
            }
          }
        }
      }
    };
  }

  constructor() {
    super();
    this.name = 'Anonymous';
    this.notifications = '';
  }

  attributeChangedCallback(name, oldval, newval) {
    console.log('attribute change: ', name, newval);
    super.attributeChangedCallback(name, oldval, newval);
  }

  render() {
    const names = this.name.split(' ');
    return html`<span>${names[0]}<br />${names[1]}</span>`;
  }
}

customElements.define('user-card', UserCard);