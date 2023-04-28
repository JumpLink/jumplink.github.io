import { Component } from "@ribajs/core";
import { hasChildNodesTrim } from "@ribajs/utils/src/dom.js";

import type { Skill } from "../../types/skill.js";

import skills from "../../../content/skills.yml";

export class JLSkillsComponent extends Component {
  public static tagName = "jl-skills";

  protected autobind = true;

  static get observedAttributes(): string[] {
    return [];
  }

  public scope = {
    skills: skills as Skill[],
  };

  protected connectedCallback() {
    super.connectedCallback();
    this.init(JLSkillsComponent.observedAttributes);
    console.debug("connectedCallback", this.scope);
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
        "./jl-skills.component.pug"
      )
      return template(this.scope);
    }
  }
}
