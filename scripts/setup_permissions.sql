-- Script para criar tabela de permissões extras e popular dados iniciais
-- Execute este script no Supabase SQL Editor

-- 1. Criar tabela de permissões extras por usuário (se não existir)
CREATE TABLE IF NOT EXISTS user_extra_permissions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "permissionId" TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('grant', 'revoke')),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "permissionId")
);

CREATE INDEX IF NOT EXISTS user_extra_permissions_userId_idx ON user_extra_permissions("userId");

-- 2. Inserir permissões base (se não existirem)
INSERT INTO permissions (id, name, slug, description, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'Gerenciar Centrais', 'manage_tenants', 'Criar, editar e desativar centrais', NOW(), NOW()),
  (gen_random_uuid()::text, 'Gerenciar Funcionalidades', 'manage_features', 'Atribuir funcionalidades às centrais', NOW(), NOW()),
  (gen_random_uuid()::text, 'Gerenciar Usuários', 'manage_users', 'Criar, editar e desativar usuários e admins', NOW(), NOW()),
  (gen_random_uuid()::text, 'Gerenciar Motoristas', 'manage_drivers', 'Aprovar, bloquear e gerenciar motoristas', NOW(), NOW()),
  (gen_random_uuid()::text, 'Gerenciar Financeiro', 'manage_billing', 'Acessar e gerenciar área financeira', NOW(), NOW()),
  (gen_random_uuid()::text, 'Ver Relatórios', 'view_reports', 'Visualizar relatórios e estatísticas', NOW(), NOW()),
  (gen_random_uuid()::text, 'Gerenciar Marca', 'manage_brand', 'Editar configurações da marca Mai Drive', NOW(), NOW()),
  (gen_random_uuid()::text, 'Gerenciar Roles', 'manage_roles', 'Criar e editar papéis de acesso', NOW(), NOW()),
  (gen_random_uuid()::text, 'Gerenciar Cidades', 'manage_cities', 'Adicionar e configurar cidades de cobertura', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- 3. Inserir roles base (se não existirem)
INSERT INTO roles (id, name, slug, description, "tenantId", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'Master Admin', 'master', 'Acesso total ao sistema', NULL, NOW(), NOW()),
  (gen_random_uuid()::text, 'Admin Operacional', 'admin_operacional', 'Gerencia centrais, motoristas e relatórios', NULL, NOW(), NOW()),
  (gen_random_uuid()::text, 'Admin Financeiro', 'admin_financeiro', 'Gerencia área financeira e relatórios', NULL, NOW(), NOW()),
  (gen_random_uuid()::text, 'Admin Suporte', 'admin_suporte', 'Visualização e suporte básico', NULL, NOW(), NOW()),
  (gen_random_uuid()::text, 'Gestor', 'gestor', 'Gestor de central específica', NULL, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- 4. Vincular permissões aos roles

-- Master: todas as permissões
INSERT INTO role_permissions (id, "roleId", "permissionId", "createdAt")
SELECT 
  gen_random_uuid()::text,
  r.id,
  p.id,
  NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'master'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Admin Operacional: centrais, motoristas, relatórios, cidades
INSERT INTO role_permissions (id, "roleId", "permissionId", "createdAt")
SELECT 
  gen_random_uuid()::text,
  r.id,
  p.id,
  NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'admin_operacional'
  AND p.slug IN ('manage_tenants', 'manage_drivers', 'view_reports', 'manage_cities')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Admin Financeiro: financeiro, relatórios
INSERT INTO role_permissions (id, "roleId", "permissionId", "createdAt")
SELECT 
  gen_random_uuid()::text,
  r.id,
  p.id,
  NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'admin_financeiro'
  AND p.slug IN ('manage_billing', 'view_reports')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Admin Suporte: apenas relatórios
INSERT INTO role_permissions (id, "roleId", "permissionId", "createdAt")
SELECT 
  gen_random_uuid()::text,
  r.id,
  p.id,
  NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'admin_suporte'
  AND p.slug IN ('view_reports')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Gestor: centrais (própria), motoristas (próprios), relatórios
INSERT INTO role_permissions (id, "roleId", "permissionId", "createdAt")
SELECT 
  gen_random_uuid()::text,
  r.id,
  p.id,
  NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'gestor'
  AND p.slug IN ('manage_tenants', 'manage_drivers', 'view_reports')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- 5. Verificação
SELECT 'Permissões cadastradas:' as info;
SELECT slug, name FROM permissions ORDER BY name;

SELECT 'Roles cadastrados:' as info;
SELECT slug, name FROM roles ORDER BY name;

SELECT 'Permissões por role:' as info;
SELECT r.slug as role, p.slug as permission
FROM role_permissions rp
JOIN roles r ON rp."roleId" = r.id
JOIN permissions p ON rp."permissionId" = p.id
ORDER BY r.slug, p.slug;
