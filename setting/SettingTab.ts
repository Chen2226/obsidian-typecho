import plugin from "../main";
import { App, PluginSettingTab, Setting } from "obsidian";
import { TypechoPluginSettings } from "./pluginSettings";
import { HttpUtils } from "../utils/request";

export class SettingTab extends PluginSettingTab {
	plugin: plugin;
	settings: TypechoPluginSettings;

	constructor(app: App, plugin: plugin, settings: TypechoPluginSettings) {
		super(app, plugin);
		this.plugin = plugin;
		this.settings = settings;
	}

	async display() {
		const { containerEl } = this;

		this.initTab(containerEl);
		await this.refreshUserList(containerEl);
	}

	private async initTab(containerEl: HTMLElement): Promise<void> {
		containerEl.empty();

		new Setting(containerEl)
			.setName("Host")
			.setDesc("Typecho域名")
			.addText((text) =>
				text
					.setPlaceholder(
						"域名/index.php/api，或者配置了伪静态，请自行检查"
					)
					.setValue(this.settings.Host)
					.onChange(async (value) => {
						this.settings.Host = value;
						await this.plugin.saveSettings();
					})
			)
			.then((setting) => {
				setting.controlEl.addEventListener("change", async () => {
					await this.refreshUserList(containerEl);
				});
			});
		new Setting(containerEl)
			.setName("Token")
			.setDesc("插件设置的ApiToken")
			.addText((text) =>
				text
					.setPlaceholder("ApiToken")
					.setValue(this.settings.Token)
					.onChange(async (value) => {
						this.settings.Token = value;
						await this.plugin.saveSettings();
					})
			)
			.then((setting) => {
				setting.controlEl.addEventListener("change", async () => {
					await this.refreshUserList(containerEl);
				});
			});
	}

	private async refreshUserList(containerEl: HTMLElement): Promise<void> {
		let userList: string | any[] = [];
		if (this.settings.Host && this.settings.Token) {
			this.initTab(containerEl);
			await HttpUtils.get("/userList").then(async (res: any) => {
				userList = res.data;
				await this.plugin.saveSettings();
			});
		}
		new Setting(containerEl)
			.setName("User")
			.setDesc("Typecho用户,操作时使用的用户")
			.addDropdown((dropdown) => {
				for (let i = 0; i < userList.length; i++) {
					dropdown.addOption(userList[i].uid, userList[i].screenName);
				}
				dropdown.setValue(this.settings.User.uid);
				dropdown.onChange(async (value) => {
					for (let i = 0; i < userList.length; i++) {
						if (userList[i].uid == value) {
							this.settings.User = userList[i];
							await this.plugin.saveSettings();
							break;
						}
					}
				});
			});
	}
}
