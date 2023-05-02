import { Component } from "@ribajs/core";
import { hasChildNodesTrim } from "@ribajs/utils/src/dom.js";
import { JLNavbarComponent } from '../jl-navbar/jl-navbar.component.js'

import iconPens from "@ribajs/iconset/dist/svg/icon_pens.svg?url";
import iconProfile from "@ribajs/iconset/dist/svg/icon_profile.svg?url";

import educations from "../../../content/educations.yml";
import projects from "../../../content/projects.yml";
import * as aboutMe from "../../../content/about-me-de.md";
import * as skills from "../../../content/skills-de.md";

export class JLProfileComponent extends Component {
  public static tagName = "jl-profile";

  protected autobind = true;

  static get observedAttributes(): string[] {
    return [];
  }

  protected navbar: JLNavbarComponent | null = null;

  public scope = {
    iconPens,
    iconProfile,
    educations,
    projects,
    aboutMe: {
      html: aboutMe.html,
      attributes: aboutMe.attributes,
    },
    skills: {
      html: skills.html,
      attributes: skills.attributes,
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
