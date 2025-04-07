import { Component } from "@ribajs/core";
import { hasChildNodesTrim } from "@ribajs/utils/src/dom.js";

import iconMobile from "../../../assets/icons/device-phone.svg?url";
import iconChat from "../../../assets/icons/message-text.svg?url";
import iconMail from "../../../assets/icons/mail.svg?url";
import socialMastodon from "../../../assets/icons/social-mastodon-0.svg?url";
import brandGithub from "../../../assets/icons/brand-github.svg?url";
 

export class JLContactComponent extends Component {
  public static tagName = "jl-contact";

  protected autobind = true;

  static get observedAttributes(): string[] {
    return [];
  }

  public scope = {
    iconMobile,
    iconChat,
    iconMail,
    socialMastodon,
    brandGithub,
  };

  protected connectedCallback() {
    super.connectedCallback();
    this.init(JLContactComponent.observedAttributes);
  }

  protected requiredAttributes(): string[] {
    return [];
  }

  protected async template() {
    // Only set the component template if there no childs already
    if (hasChildNodesTrim(this)) {
      return null;
    } else {
      const { default: template } = await import(
        "./jl-contact.component.pug"
      )
      return template(this.scope);
    }
  }
}
