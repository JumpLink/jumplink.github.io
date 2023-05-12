import "@ribajs/types";
import '../scss/main.scss'
import { ready } from "@ribajs/utils/src/dom.js";
import locales from "../content/locales.yml"

const mediaQueryList = window.matchMedia("print")
mediaQueryList.addEventListener('change', (event) => {
    if (event.matches) {
        console.log("print")
    } else {
        console.log("not print")
    }
}, {});

ready(async () => {
    const { coreModule, Riba } = await import("@ribajs/core");
    const { extrasModule } = await import("@ribajs/extras");
    const { bs5Module } = await import("@ribajs/bs5");
    const { JLProfileModule } = await import("./jl-profile.module.js");
    const { i18nModule, LocalesStaticService } = await import('@ribajs/i18n');

    const riba = new Riba();
    const model = {};
    const localesService = new LocalesStaticService(locales);
    
    // Register modules
    riba.module.register(coreModule.init());
    riba.module.register(extrasModule.init());
    riba.module.register(bs5Module.init());
    riba.module.register(i18nModule.init({ localesService }));

    riba.module.register(JLProfileModule.init());
    riba.bind(document.body, model);
});
  