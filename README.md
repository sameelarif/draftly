# Draftly

Draftly is designed to assist users in writing text content using provided sources as context to generate auto-completions. It leverages Groq's API for text generation and Supabase for file storage and management. The application is designed for students, researchers, copywriters, and anyone who needs to generate text content efficiently.

## Features

- **Text Completion**: Generate text suggestions in real-time as you type, using OpenAI's API.
- **User Authentication**: Secure user authentication with Clerk.
- **Document Upload**: Upload and manage sources, providing context for autocomplete generation.

## Installation

To get started with Draftly, follow these steps:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/sameelarif/draftly.git
   cd draftly
   ```

2. **Install dependencies**:

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory and add the following variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Run the development server**:

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**:
   Visit [http://localhost:3000](http://localhost:3000) to see the application in action.

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

You also need to set up a Supabase project and add the necessary environment variables to the `.env` file.

Only one table is used in the database:

- `source`
  | id | user_id | label | content | created_at |
  | --- | --- | --- | --- | --- |
  | int8 | text | text | text | timestamptz |

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
