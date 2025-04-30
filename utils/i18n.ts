import i18next from "i18next";
import { getLanguage } from "obsidian";

const resources = {
	en: { translation: require("../locales/en.json") },
	zh: { translation: require("../locales/zh.json") },
};

i18next.init({
	lng: getLanguage(),
	fallbackLng: "en",
	resources,
	interpolation: {
		escapeValue: false
	},
	keySeparator: "."
});

export default i18next;
