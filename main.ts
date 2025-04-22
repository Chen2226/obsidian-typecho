import { Plugin } from "obsidian";
import { SettingTab } from "./setting/settingTab";
import { PushModal } from "./view/pushModal";
import {
	TypechoPluginSettings,
	DEFAULT_SETTINGS,
} from "./setting/pluginSettings";

let settings: TypechoPluginSettings;
export default class TypechoPlugin extends Plugin {
	async onload() {
		console.log("loading plugin");
		await this.loadSettings();
		this.addSettingTab(new SettingTab(this.app, this, settings));

		const ribbonIconEl = this.addRibbonIcon(
			"book-copy",
			"同步到Typecho",
			(evt: MouseEvent) => {
				new PushModal(this.app).open();
			}
		);
		ribbonIconEl.addClass("my-plugin-ribbon-class");
	}

	onunload() {
		console.log("unloading plugin");
	}

	async loadSettings() {
		settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(settings);
	}
}

export function getSettings() {
	return settings;
}
