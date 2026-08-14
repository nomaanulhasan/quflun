export interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxTags?: number;
  maxTagLength?: number;
  /** Existing tags to suggest as autocomplete */
  suggestions?: string[];
}

export interface TagsInputRef {
  /** Commits any pending text as a tag (call before form submit) */
  commitPending: () => void;
}
