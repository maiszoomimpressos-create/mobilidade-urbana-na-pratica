# Uso do Supabase no Projeto

O projeto está configurado para usar o **Supabase Client** com suas chaves API.

## Variáveis no `.env`

Adicione ao seu `.env` (com seus valores reais):

```env
NEXT_PUBLIC_SUPABASE_URL="https://thuisonoxhInfjctfidq.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua-chave-anon"
SUPABASE_SERVICE_ROLE_KEY="sua-chave-service-role"
```

## Onde usar cada cliente

| Cliente | Uso | Onde |
|--------|-----|------|
| `createClient()` | Browser, respeita RLS | Componentes client (`'use client'`) |
| `createSupabaseServerClient()` | Server, com sessão do usuário | Server Components, Route Handlers |
| `createSupabaseAdminClient()` | Admin, bypass RLS | API routes, Server Actions (upload, etc.) |

## Exemplos

### Upload de imagem (Storage) – API Route

```ts
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(`${userId}/${file.name}`, file, { upsert: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ path: data.path })
}
```

### Componente client – Storage

```ts
'use client'
import { createClient } from '@/lib/supabase'

export function UploadButton() {
  const supabase = createClient()

  async function handleUpload(file: File) {
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(file.name, file)
    // ...
  }
}
```

### Realtime (subscriptions)

```ts
const supabase = createClient()
const channel = supabase
  .channel('cidades')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'cities' }, (payload) => {
    console.log('Mudança:', payload)
  })
  .subscribe()
```

## Segurança

- **anon key**: Pode ir no frontend. Respeita RLS.
- **service_role key**: Apenas no servidor. Nunca exponha no browser.

Se a `service_role` foi exposta (ex.: em chat), rotacione em:  
Supabase Dashboard → Settings → API → Regenerate `service_role` key.
