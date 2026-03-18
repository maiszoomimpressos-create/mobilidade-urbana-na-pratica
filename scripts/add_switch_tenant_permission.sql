-- Adicionar permissão switch_tenant para alternar entre centrais
-- Execute no Supabase SQL Editor

-- 1. Inserir a nova permissão
INSERT INTO permissions (id, name, slug, description, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'Alternar Central', 'switch_tenant', 'Permite alternar entre centrais no app (para gestores multi-central e admins)', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- 2. Vincular ao role master
INSERT INTO role_permissions (id, "roleId", "permissionId", "createdAt")
SELECT 
  gen_random_uuid()::text,
  r.id,
  p.id,
  NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'master'
  AND p.slug = 'switch_tenant'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- 3. Vincular ao role admin_operacional
INSERT INTO role_permissions (id, "roleId", "permissionId", "createdAt")
SELECT 
  gen_random_uuid()::text,
  r.id,
  p.id,
  NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'admin_operacional'
  AND p.slug = 'switch_tenant'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- 4. Vincular ao role gestor (gestores podem ter múltiplas centrais)
INSERT INTO role_permissions (id, "roleId", "permissionId", "createdAt")
SELECT 
  gen_random_uuid()::text,
  r.id,
  p.id,
  NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'gestor'
  AND p.slug = 'switch_tenant'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Verificação
SELECT 'Permissão switch_tenant adicionada:' as info;
SELECT r.slug as role, p.slug as permission
FROM role_permissions rp
JOIN roles r ON rp."roleId" = r.id
JOIN permissions p ON rp."permissionId" = p.id
WHERE p.slug = 'switch_tenant'
ORDER BY r.slug;
