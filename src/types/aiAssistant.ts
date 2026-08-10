export type SuggestReplyTrigger = "on_open" | "on_message" | "always" | "manual";

export interface AiReplyPreset {
  label: string;
  enabled: boolean;
  content: string;
}

export interface AiAssistantSettings {
  suggestReplyEnabled: boolean;
  suggestReplyTrigger: SuggestReplyTrigger;
  presets: AiReplyPreset[];
}
