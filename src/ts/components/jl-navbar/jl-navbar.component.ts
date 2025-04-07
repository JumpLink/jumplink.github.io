import { Component } from "@ribajs/core";
import { Bs5SidebarComponent } from "@ribajs/bs5";
import { hasChildNodesTrim } from "@ribajs/utils/src/dom.js";
import { JLProfileComponent } from "../jl-profile/jl-profile.component.js";
import { JLPrintModalComponent } from "../jl-print-modal/jl-print-modal.component.js"
import { I18nService, type LocalesService } from "@ribajs/i18n";


import iconMenu from "../../../assets/icons/menu.svg?url";
import iconClose from "../../../assets/icons/close.svg?url";
import iconSun from "../../../assets/icons/sun.svg?url";
import iconMoon from "../../../assets/icons/moon.svg?url";
import iconPrint from "../../../assets/icons/print.svg?url";

export class JLNavbarComponent extends Component {
  public static tagName = "jl-navbar";

  protected autobind = true;

  protected profile: JLProfileComponent | null = null;
  protected sidebar: Bs5SidebarComponent | null = null;
  protected localesService?: LocalesService;

  static get observedAttributes(): string[] {
    return [];
  }

  public scope = {
    iconMenu,
    iconClose,
    iconSun,
    iconMoon,
    iconPrint,
    print: this.print.bind(this),
  };

  public print() {
    document.querySelector<JLPrintModalComponent>(JLPrintModalComponent.tagName.toLowerCase())?.show();
  }

  constructor() {
    super();
    this.setPageStyleByNavbar = this.setPageStyleByNavbar.bind(this);
  }

  protected connectedCallback() {
    super.connectedCallback();
    this.init(JLNavbarComponent.observedAttributes);
  }

  protected setPageStyleByNavbar() {
    this.profile = this.profile || this.closest<JLProfileComponent>(JLProfileComponent.tagName.toLowerCase());
    this.sidebar = this.sidebar || document.querySelector<Bs5SidebarComponent>(Bs5SidebarComponent.tagName.toLowerCase());
    const offset = this.clientHeight - 0.5;

    if(this.profile) {
      this.profile.style.paddingTop = `${offset}px`;
    }

    if(this.sidebar) {
      this.sidebar.style.top = `${offset}px`;
      this.sidebar.style.height = `calc(100vh - ${offset}px)`;
    }
  }

  protected addEventListeners() {
    window.addEventListener("resize", this.setPageStyleByNavbar);
  }

  protected removeEventListeners() {
    window.removeEventListener("resize", this.setPageStyleByNavbar);
  }

  protected async beforeBind() {
    await super.beforeBind();
    this.initLanguage();
  }

  protected async afterBind() {
    this.addEventListeners();
    await super.afterBind();
  }

  protected async afterAllBind() {
    this.setPageStyleByNavbar();
    await super.afterAllBind();
  }

  protected requiredAttributes(): string[] {
    return [];
  }

  protected initLanguage() {
    this.localesService ||= I18nService.options.localesService;
    this.localesService?.event.on(
      "changed",
      this.onLanguageChange,
      this
    );
  }

  protected onLanguageChange(langcode: string) {    
    window.requestAnimationFrame(() => {
      this.setPageStyleByNavbar();
    });
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
