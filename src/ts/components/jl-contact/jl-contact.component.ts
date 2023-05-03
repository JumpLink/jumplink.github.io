import { Component } from "@ribajs/core";
import { hasChildNodesTrim } from "@ribajs/utils/src/dom.js";

import iconMobile from "../../../assets/icons/device-phone.svg?url";
import iconMail from "../../../assets/icons/mail.svg?url";
import socialMastodon from "@ribajs/iconset/dist/svg/social_mastodon.svg?url";
import socialGithub from "../../../assets/icons/social-github.svg?url";


export class JLContactComponent extends Component {
  public static tagName = "jl-contact";

  protected autobind = true;

  static get observedAttributes(): string[] {
    return [];
  }

  public scope = {
    iconMobile,
    iconMail,
    socialMastodon,
    socialGithub,
  };

  protected connectedCallback() {
    super.connectedCallback();
    this.init(JLContactComponent.observedAttributes);
  }

  protected async afterBind() {
    await super.afterBind();
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
