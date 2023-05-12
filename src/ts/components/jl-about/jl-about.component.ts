import { Component } from "@ribajs/core";
import { hasChildNodesTrim } from "@ribajs/utils";
import { I18nService, LocalesService } from "@ribajs/i18n";

import * as aboutMeDE from "../../../content/about-me-de.md";
import * as aboutMeEN from "../../../content/about-me-en.md";

export class JLAboutComponent extends Component {
  public static tagName = "jl-about";

  protected autobind = true;

  protected localesService?: LocalesService;

  static get observedAttributes(): string[] {
    return [];
  }

  public scope = {
    html: "",
    title: "",
  };

  protected connectedCallback() {
    super.connectedCallback();
    this.init(JLAboutComponent.observedAttributes);
  }

  protected requiredAttributes(): string[] {
    return [];
  }

  protected async beforeBind() {
    await super.beforeBind();
    this.initLanguage();
  }

  protected initLanguage() {
    this.localesService = I18nService.options.localesService;
    this.localesService?.event.on(
      "changed",
      this.onLanguageChange,
      this
    );
    const langcode = this.localesService?.getLangcode();
    if (this.localesService.ready && langcode) {
      this.onLanguageChange(langcode)
    }
  }

  protected onLanguageChange(langcode: string) {
    if (langcode === "en") {
      this.scope.html = aboutMeEN.html;
      this.scope.title = aboutMeEN.attributes.title as string;
    } else if (langcode === "de") {
      this.scope.html = aboutMeDE.html;
      this.scope.title = aboutMeDE.attributes.title as string;
    } else {
      console.warn(`[JLAboutComponent] Language ${langcode} is not supported`);
    }
  }

  protected async template() {
    // Only set the component template if there no childs already
    if (hasChildNodesTrim(this)) {
      return null;
    } else {
      const { default: template } = await import(
        "./jl-about.component.pug"
      )
      return template(this.scope);
    }
  }
}
