import { Component, ScopeBase } from "@ribajs/core";
import { Modal } from "@ribajs/bs5";
import { getElementFromEvent, hasChildNodesTrim } from "@ribajs/utils";

// import template from "./bs5-modal.component.html?raw";

interface Scope extends ScopeBase {
  onHidden: Bs5ModalComponent["onHidden"];
  hide: Bs5ModalComponent["hide"];
  show: Bs5ModalComponent["show"];

  /**
   * E.g. primary, secondary, success, danger, warning, info, light, dark
   */
  color: string;

  /**
   * The title of the modal
   * @example "Modal title"
   */
  title: string;

  /**
   * The body of the modal
   * @example "Modal body text goes here."
   */
  body: string;

  /**
   * Includes a modal-backdrop element. Alternatively, specify static for
   * a backdrop which doesn't close the modal on click.
   *
   * @default true
   */
  backdrop: 'static' | boolean;

  /**
   * Closes the modal when escape key is pressed
   *
   * @default true
   */
  keyboard: boolean;

  /**
   * Puts the focus on the modal when initialized.
   *
   * @default true
   */
  focus: boolean;
}

/**
 * Use this component to show a modal without a bs5-notification-container
 */
export class Bs5ModalComponent extends Component {
  public static tagName = "bs5-modal";

  public _debug = false;
  protected autobind = true;

  protected modalService?: Modal;

  static get observedAttributes(): string[] {
    return [];
  }

  protected requiredAttributes(): string[] {
    return ["keyboard", "focus", "color", "title", "body"];
  }

  public scope: Scope = {
    onHidden: this.onHidden.bind(this),
    hide: this.hide.bind(this),
    show: this.show.bind(this),
    color: "primary",
    keyboard: true,
    focus: true,
    backdrop: true,

    title: "",
    body: "",
  };

  constructor() {
    super();
  }

  protected connectedCallback() {
    super.connectedCallback();
    this.init(Bs5ModalComponent.observedAttributes);
  }

  protected async afterBind() {
    this.initModal();
    await super.afterBind();
  }

  protected initModal() {
    const modalEl = this.firstElementChild as HTMLElement | null;
    if (modalEl) {
      this.modalService = new Modal(modalEl, {
        focus: this.scope.focus,
        keyboard: this.scope.keyboard,
        backdrop: this.scope.backdrop,
      });

      // Call onHidden on hidden event once
      modalEl.addEventListener(Modal.EVENT_HIDDEN, this.scope.onHidden, {
        once: true,
      });

      // show modal using the modal service
      // this.modalService.show();
    }
  }

  public hide() {
    this.modalService?.hide();
  }

  public show() {
    this.modalService?.show();
  }

  public onHidden(event: Event, el?: HTMLElement) {
    if (!el) {
      el = getElementFromEvent(event);
    }
    console.debug("onHidden", el);
  }

  protected async template() {
    // Only set the component template if there no childs already
    if (hasChildNodesTrim(this)) {
      return null;
    } else {
      const { default: template } = await import(
        "./bs5-modal.component.html?raw"
      )
      return template;
    }
  }
}
