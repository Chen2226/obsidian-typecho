import { Plugin, addIcon } from "obsidian";
import { settingTab } from "./setting/setting_tab";
import { PushModal } from "./view/push_modal";
import { CategoryView, VIEW_TYPE as ArticleViewType } from "./view/categories";
import {
	TypechoPluginSettings,
	DEFAULT_SETTINGS,
} from "./setting/plugin_settings";
import i18n from "./utils/i18n";
let settings: TypechoPluginSettings;

export default class TypechoPlugin extends Plugin {
	async onload() {
		console.log("loading plugin");
		addIcon(
			"typecho",
			`<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg t="1745386247342" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1491" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M517.04420574 882.47531656c-289.98573089 0-391.40007045-98.3302631-391.40007043-379.40894092 0-281.09368555 101.41433957-379.39393331 391.40007043-379.39393327 289.98573089 0 391.40007045 98.3002478 391.40007044 379.39393327 0 281.07867783-101.41433957 379.40143714-391.40007044 379.40143709zM306.28397227 386.32169964h421.50545924v-58.3648341H306.28397227v58.37233801z m0 145.92709302h301.07640006V473.8914624H306.28397227v58.36483409z m0 145.92709298h361.28717777v-58.37233793H306.2914761v58.37233793z" p-id="1492"></path></svg>`
		);

		await this.loadSettings();
		this.addSettingTab(new settingTab(this.app, this, settings));

		this.addRibbonIcon(
			"typecho",
			i18n.t("sync.title"),
			(evt: MouseEvent) => {
				new PushModal(this.app).open();
			}
		);

		this.registerView(ArticleViewType, (leaf) => new CategoryView(leaf));
		this.openPluginView();
	}

	onunload() {
		console.log("unloading plugin");
		this.app.workspace.getLeavesOfType(ArticleViewType);
	}

	async loadSettings() {
		settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(settings);
	}

	private async openPluginView() {
		const { workspace } = this.app;
		const newLeaf = workspace.getRightLeaf(false);
		if (newLeaf) {
			newLeaf.setViewState({
				type: ArticleViewType,
			});
		}
	}
}

export function getSettings() {
	return settings;
}
