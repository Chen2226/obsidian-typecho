import { Notice, Plugin } from "obsidian";
import { SettingTab } from "./setting/SettingTab";
import {
	TypechoPluginSettings,
	DEFAULT_SETTINGS,
} from "./setting/PluginSettings";

let settings: TypechoPluginSettings;
export default class TypechoPlugin extends Plugin {
	async onload() {
		console.log("loading plugin");
		await this.loadSettings();
		this.addSettingTab(new SettingTab(this.app, this, settings));

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"book-copy",
			"同步到Typecho",
			(evt: MouseEvent) => {
				new Notice("This is a notice!");
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
