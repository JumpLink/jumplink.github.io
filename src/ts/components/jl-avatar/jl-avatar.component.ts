import { Component } from "@ribajs/core";
import { hasChildNodesTrim } from "@ribajs/utils/src/dom.js";

import imageSrc from "../../../assets/avatar.jpg?url";

export class JLAvatarComponent extends Component {
  public static tagName = "jl-avatar";

  protected autobind = true;

  static get observedAttributes(): string[] {
    return [];
  }

  public scope = {
    imageSrc,
  };

  protected connectedCallback() {
    super.connectedCallback();
    this.init(JLAvatarComponent.observedAttributes);
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
        "./jl-avatar.component.pug"
      )
      return template(this.scope);
    }
  }
}
