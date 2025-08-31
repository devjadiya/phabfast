'use server';

/**
 * @fileOverview This file defines a Genkit flow to detect the difficulty of a task based on its description.
 *
 * - detectTaskDifficulty - A function that accepts a task description and returns the detected difficulty.
 * - DetectTaskDifficultyInput - The input type for the detectTaskDifficulty function.
 * - DetectTaskDifficultyOutput - The return type for the detectTaskDifficulty function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { difficulties } from '@/lib/types';

const DetectTaskDifficultyInputSchema = z.object({
  description: z
    .string()
    .describe('The description of the task to detect the difficulty from.'),
});
export type DetectTaskDifficultyInput = z.infer<typeof DetectTaskDifficultyInputSchema>;

const DetectTaskDifficultyOutputSchema = z.object({
  difficulty: z
    .enum(difficulties)
    .describe('The detected difficulty of the task.'),
});
export type DetectTaskDifficultyOutput = z.infer<typeof DetectTaskDifficultyOutputSchema>;

export async function detectTaskDifficulty(input: DetectTaskDifficultyInput): Promise<DetectTaskDifficultyOutput> {
  return detectTaskDifficultyFlow(input);
}

const detectTaskDifficultyPrompt = ai.definePrompt({
  name: 'detectTaskDifficultyPrompt',
  input: {schema: DetectTaskDifficultyInputSchema},
  output: {schema: DetectTaskDifficultyOutputSchema},
  prompt: `You are an expert software development task analyst.

  Based on the task description, determine its difficulty. The options are: ${difficulties.join(', ')}.
  - "Easy" tasks are small, well-defined, and suitable for beginners.
  - "Medium" tasks require some existing knowledge of the codebase or technology.
  - "Hard" tasks are complex, may be poorly defined, or require significant expertise.
  
  Analyze the following description and classify the task's difficulty.

  Description: {{{description}}}
  `,
});

const detectTaskDifficultyFlow = ai.defineFlow(
  {
    name: 'detectTaskDifficultyFlow',
    inputSchema: DetectTaskDifficultyInputSchema,
    outputSchema: DetectTaskDifficultyOutputSchema,
  },
  async input => {
    const {output} = await detectTaskDifficultyPrompt(input);
    return output!;
  }
);
