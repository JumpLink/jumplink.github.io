import { Component } from "@ribajs/core";
import { hasChildNodesTrim } from "@ribajs/utils/src/dom.js";

// Pixelarticons
import iconBookOpen from "../../../assets/icons/book-open.svg?url";
import iconCheck from "../../../assets/icons/check.svg?url";
import iconLight from "../../../assets/icons/light.svg?url";
import iconUser from "../../../assets/icons/user.svg?url";
import iconCode from "../../../assets/icons/code.svg?url";

import educations from "../../../content/educations.yml";
import projects from "../../../content/projects.yml";
import * as experience from "../../../content/experience-de.md";

export class JLProfileComponent extends Component {
  public static tagName = "jl-profile";

  protected autobind = true;

  static get observedAttributes(): string[] {
    return [];
  }

  public scope = {
    iconBookOpen,
    iconCheck,
    iconLight,
    iconUser,
    iconCode,
    educations,
    projects,
    experience: {
      html: experience.html,
      ...experience.attributes,
    },
  };

  protected connectedCallback() {
    super.connectedCallback();
    this.init(JLProfileComponent.observedAttributes);
    console.debug("connectedCallback", this.scope);
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
