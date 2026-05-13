# Work Tracker / Life Analytics

Mobile-first React + Vite приложение для личного учета смен, аналитики нагрузки и псевдо-AI оценки усталости.

## Stack

- React + Vite + JavaScript
- Tailwind CSS
- Framer Motion
- Recharts
- Supabase
- PWA через `vite-plugin-pwa`
- Deploy-ready для Vercel

## Запуск

```bash
npm install
npm run dev
```

## Supabase

1. Создайте проект Supabase.
2. Выполните SQL из `supabase/schema.sql` в SQL Editor.
3. Скопируйте `.env.example` в `.env`.
4. Заполните:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Приложение рассчитано на одного пользователя и не использует auth, login/signup или роли. Если Supabase не настроен или сеть недоступна, данные временно сохраняются в `localStorage`; очередь изменений синхронизируется при восстановлении сети.

## Build

```bash
npm run build
npm run preview
```

## Vercel

Добавьте `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` в Environment Variables проекта Vercel. Команда сборки: `npm run build`, output directory: `dist`.
