import { Component } from "@ribajs/core";
import { hasChildNodesTrim } from "@ribajs/utils/src/dom.js";
import { JLProfileComponent } from "../jl-profile/jl-profile.component.js";

import iconMenu from "../../../assets/icons/menu.svg?url";
import iconClose from "../../../assets/icons/close.svg?url";
import iconSun from "../../../assets/icons/sun.svg?url";
import iconMoon from "../../../assets/icons/moon.svg?url";

export class JLNavbarComponent extends Component {
  public static tagName = "jl-navbar";

  protected autobind = true;

  protected profile: JLProfileComponent | null = null; 

  static get observedAttributes(): string[] {
    return [];
  }

  public scope = {
    iconMenu,
    iconClose,
    iconSun,
    iconMoon,
  };

  constructor() {
    super();
    this.setPageStyleByNavbar = this.setPageStyleByNavbar.bind(this);
  }

  protected connectedCallback() {
    super.connectedCallback();
    this.init(JLNavbarComponent.observedAttributes);
  }

  protected setPageStyleByNavbar() {
    this.profile = this.profile || this.closest<JLProfileComponent>(JLProfileComponent.tagName);
    if(this.profile) {
      this.profile.style.paddingTop = `${this.clientHeight}px`;
      console.debug(`setPageStyleByNavbar ${JLProfileComponent.tagName} padding-top: ${this.profile.style.paddingTop}`);
    }
    
  }

  protected addEventListeners() {
    window.addEventListener("resize", this.setPageStyleByNavbar);
  }

  protected removeEventListeners() {
    window.removeEventListener("resize", this.setPageStyleByNavbar);
  }

  protected async afterBind() {
    await super.afterBind();
    this.setPageStyleByNavbar();
    this.addEventListeners();
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
        "./jl-navbar.component.pug"
      )
      return template(this.scope);
    }
  }
}
