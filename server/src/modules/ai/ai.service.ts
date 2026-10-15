import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { z } from 'zod';

const PassportInfoSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  passportNumber: z.string(),
  birthDate: z.string(),
  citizenship: z.string(),
});

type PassportInfo = z.infer<typeof PassportInfoSchema>;

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }

  async extractPassportInfo(text: string): Promise<PassportInfo> {
    const response = await this.openai.responses.create({
      model: 'gpt-4o-mini',
      input: `
        Extract passport information from the following OCR text.

        Return only the following fields in JSON format:
        - firstName
        - lastName
        - passportNumber
        - birthDate
        - citizenship

        OCR text:
        ${text}
      `,
    });

    const cleared: string = response.output_text
      .replace(/^```json\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed: unknown = JSON.parse(cleared);

    return PassportInfoSchema.parse(parsed);
  }
}
