export interface TypechoPluginSettings {
	Host: string;
	Token: string;
	User: {
		uid: string;
		url: string;
		screenName: string;
		mail: string;
	};
	enablePasteUpload: boolean;
	removeMetadata: boolean;
	slugMapping: Record<string, string>;
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
	enablePasteUpload: false,
	removeMetadata: false,
	slugMapping: {},
};