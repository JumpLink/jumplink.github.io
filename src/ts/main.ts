import "@ribajs/types";
import '../scss/main.scss'
import { ready } from "@ribajs/utils/src/dom.js";

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
    const { default: locales } = await import("../content/locales.yml");

    const riba = new Riba();
    const model = {};
    const localesService = new LocalesStaticService(locales, undefined, false, true, true);
    
    // Register modules
    riba.module.register(coreModule.init());
    riba.module.register(extrasModule.init());
    riba.module.register(bs5Module.init());
    riba.module.register(i18nModule.init({ localesService }));

    riba.module.register(JLProfileModule.init());
    riba.bind(document.body, model);

    // FIXME: WORKAROUND: English translation not visible jl- navbar for some reason
    // I need to refactor the language handling anyway in Riba.js
    setTimeout(async () => {
        const activeLangcode = localesService.getLangcode();
        const availableLangcodes = await localesService.getAvailableLangcodes();
        const anyInactiveLangcode = availableLangcodes.find(langcode => langcode.code !== activeLangcode);
        if(activeLangcode === "en" && anyInactiveLangcode) {
            console.warn(`Set inactive langcode "${anyInactiveLangcode.code}" and back to active langcode "${activeLangcode}"`);
            localesService.setLangcode(anyInactiveLangcode.code);
            localesService.setLangcode(activeLangcode);
        }
    }, 100);
});
  