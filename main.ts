import { Plugin, addIcon } from "obsidian";
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
		addIcon("typecho", `<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg t="1745386247342" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1491" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M517.04420574 882.47531656c-289.98573089 0-391.40007045-98.3302631-391.40007043-379.40894092 0-281.09368555 101.41433957-379.39393331 391.40007043-379.39393327 289.98573089 0 391.40007045 98.3002478 391.40007044 379.39393327 0 281.07867783-101.41433957 379.40143714-391.40007044 379.40143709zM306.28397227 386.32169964h421.50545924v-58.3648341H306.28397227v58.37233801z m0 145.92709302h301.07640006V473.8914624H306.28397227v58.36483409z m0 145.92709298h361.28717777v-58.37233793H306.2914761v58.37233793z" p-id="1492"></path></svg>`);

		await this.loadSettings();
		this.addSettingTab(new SettingTab(this.app, this, settings));

		this.addRibbonIcon("typecho", "同步到Typecho", (evt: MouseEvent) => {
			new PushModal(this.app).open();
		});
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
