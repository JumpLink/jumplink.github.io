import { Component } from "@ribajs/core";
import { hasChildNodesTrim } from "@ribajs/utils";
import { I18nService, LocalesService } from "@ribajs/i18n";

import type { Interests } from '../../types/index.js'

import interests from "../../../content/interests.yml"

export class JLInterestsComponent extends Component {
  public static tagName = "jl-interests";

  protected autobind = true;

  protected localesService?: LocalesService;

  static get observedAttributes(): string[] {
    return [];
  }

  public scope = {
    interests: [] as string[],
    title: "",
  };

  protected connectedCallback() {
    super.connectedCallback();
    this.init(JLInterestsComponent.observedAttributes);
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
      this.scope.interests = (interests as Interests).en.list;
      this.scope.title = (interests as Interests).en.title;
    } else if (langcode === "de") {
      this.scope.interests = (interests as Interests).de.list;
      this.scope.title = (interests as Interests).de.title;
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
        "./jl-interests.component.pug"
      )
      return template(this.scope);
    }
  }
}
