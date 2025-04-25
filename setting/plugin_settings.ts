export interface TypechoPluginSettings {
	Host: string;
	Token: string;
	User: {
		uid: string;
		url: string;
		screenName: string;
		mail: string;
	};
}
export const DEFAULT_SETTINGS: TypechoPluginSettings = {
	Host: "",
	Token: "",
	User: {
		uid: "",
		url: "",
		screenName: "",
		mail: "",
	},
};