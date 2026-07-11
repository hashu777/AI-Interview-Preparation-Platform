import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  // Local-development fallback; production must provide DATABASE_URL explicitly.
  datasource: { url: process.env.DATABASE_URL ?? 'postgresql://placement:placement@localhost:5432/placement_mentor' },
});
