import { Component } from "@ribajs/core";
import { hasChildNodesTrim } from "@ribajs/utils/src/dom.js";

import iconMenu from "@ribajs/iconset/dist/svg/icon_menu.svg";
import iconClose from "@ribajs/iconset/dist/svg/icon_close.svg";
import lightIcon from "@ribajs/iconset/dist/svg/icon_sun.svg";
import darkIcon from "@ribajs/iconset/dist/svg/icon_moon.svg";

export class JLProfileComponent extends Component {
  public static tagName = "rv-jl-profile";

  protected autobind = true;

  static get observedAttributes(): string[] {
    return [];
  }

  public scope = {
    iconMenu,
    iconClose,
    lightIcon,
    darkIcon
  };

  constructor() {
    super();
  }

  protected connectedCallback() {
    super.connectedCallback();
    this.init(JLProfileComponent.observedAttributes);
    console.debug("scope", this.scope)
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
        "./jl-profile.component.pug"
      )
      return template(this.scope);
    }
  }
}
