import { Component } from "@ribajs/core";
import { hasChildNodesTrim } from "@ribajs/utils/src/dom.js";

import avatar01 from "../../../assets/avatar_01.jpg?url";
import avatar02 from "../../../assets/avatar_02.jpg?url";
import avatar03 from "../../../assets/avatar_03.jpg?url";

export class JLAvatarComponent extends Component {
  public static tagName = "jl-avatar";

  static get observedAttributes(): string[] {
    return [];
  }

  public scope = {
    images: [avatar01, avatar02, avatar03],
    activeIndex: 0,
    toggleIndex: this.toggleIndex,
  };

  constructor() {
    super();
    this.scope.activeIndex = this.getRandomNumberInRange(0, this.scope.images.length - 1);
  }

  public toggleIndex() {
    this.scope.activeIndex++;
    if(this.scope.activeIndex > this.scope.images.length - 1) {
      this.scope.activeIndex = 0;
    }
  }

  protected connectedCallback() {
    super.connectedCallback();
    this.init(JLAvatarComponent.observedAttributes);
  }

  protected getRandomNumberInRange(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
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
