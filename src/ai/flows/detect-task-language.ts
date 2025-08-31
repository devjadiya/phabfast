'use server';

/**
 * @fileOverview This file defines a Genkit flow to detect the programming language of a task based on its description.
 *
 * - detectTaskLanguage - A function that accepts a task description and returns the detected language.
 * - DetectTaskLanguageInput - The input type for the detectTaskLanguage function.
 * - DetectTaskLanguageOutput - The return type for the detectTaskLanguage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { languages } from '@/lib/types';

const DetectTaskLanguageInputSchema = z.object({
  description: z
    .string()
    .describe('The description of the task to detect the language from.'),
});
export type DetectTaskLanguageInput = z.infer<typeof DetectTaskLanguageInputSchema>;

const DetectTaskLanguageOutputSchema = z.object({
  language: z
    .enum([...languages, "Unknown"])
    .describe('The detected programming language of the task. e.g. Python, JavaScript, PHP, Lua, etc.'),
  confidence: z.number().min(0).max(1).describe("A confidence score between 0 and 1 for the language detection. 1 is most confident.")
});
export type DetectTaskLanguageOutput = z.infer<typeof DetectTaskLanguageOutputSchema>;

export async function detectTaskLanguage(input: DetectTaskLanguageInput): Promise<DetectTaskLanguageOutput> {
  return detectTaskLanguageFlow(input);
}

const detectTaskLanguagePrompt = ai.definePrompt({
  name: 'detectTaskLanguagePrompt',
  input: {schema: DetectTaskLanguageInputSchema},
  output: {schema: DetectTaskLanguageOutputSchema},
  prompt: `You are an expert software development language detection agent.

  Given a task title and description, you will determine the primary programming language used in the task from the following list: ${languages.join(', ')}.
  If no specific language is mentioned or can be inferred, respond with "Other".
  
  You must also provide a confidence score between 0.0 and 1.0 for your prediction.

  Description: {{{description}}}
  `,
});

const detectTaskLanguageFlow = ai.defineFlow(
  {
    name: 'detectTaskLanguageFlow',
    inputSchema: DetectTaskLanguageInputSchema,
    outputSchema: DetectTaskLanguageOutputSchema,
  },
  async input => {
    try {
        const {output} = await detectTaskLanguagePrompt(input);
        return output!;
    } catch (e) {
        console.error("Error in language detection flow: ", e);
        return { language: "Unknown", confidence: 0 };
    }
  }
);
