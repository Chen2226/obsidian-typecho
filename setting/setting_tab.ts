import plugin from "../main";
import { App, PluginSettingTab, Setting } from "obsidian";
import { TypechoPluginSettings } from "./plugin_settings";
import { HttpUtils } from "../utils/request";
import i18n from "../utils/i18n";

export class settingTab extends PluginSettingTab {
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
			.setDesc(`Typecho${i18n.t("field.domainName")}`)
			.addText((text) =>
				text
					.setPlaceholder(`${i18n.t("field.domainName")}/index.php/api`)
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
			.setDesc("ApiToken")
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
		let userList: any[] = [];
		if (this.settings.Host && this.settings.Token) {
			this.initTab(containerEl);
			await HttpUtils.get("/userList").then(async (res: any) => {
				userList = res.data;
				await this.plugin.saveSettings();
			});
		}
		if (userList.length > 0) {
			new Setting(containerEl)
				.setName("User")
				.setDesc(i18n.t("field.typechoUser"))
				.addDropdown((dropdown) => {
					for (let i = 0; i < userList.length; i++) {
						dropdown.addOption(
							userList[i].uid,
							userList[i].screenName
						);
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
}
