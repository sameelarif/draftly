import { z } from "zod";

export const AutoCompleteSchema = z.object({
  suggestion: z
    .string()
    .describe(
      "The suggestion to complete the text. Only provide the new text to append to the original text. For example, if the original text is 'I like to eat' and the suggestion is 'cake', you should put 'cake' here, not 'I like to eat cake'. If there is no need for a suggestion, for example if a paragraph just ended and doesn't need more information, then this field should be an empty string."
    ),
});

export interface GenerationRequest {
  text: string;
}
