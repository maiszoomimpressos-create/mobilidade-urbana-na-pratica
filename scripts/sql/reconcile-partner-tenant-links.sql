-- Diagnóstico e correção: parceiro ainda vê "já tem central" após excluir.
-- Rode no Supabase SQL Editor (produção).
--
-- 1) Ver central "abacate" e se está realmente inativa
SELECT id, name, slug, "isActive", "approvalStatus", "createdAt"
FROM tenants
WHERE slug = 'abacate' OR name ILIKE '%abacate%';

-- 2) Ver vínculos do seu usuário (troque o e-mail)
SELECT tu.id AS tenant_user_id,
       tu."isActive" AS vinculo_ativo,
       u.email,
       t.name AS central,
       t.slug,
       t."isActive" AS central_ativa,
       t."approvalStatus"
FROM tenant_users tu
JOIN tenants t ON t.id = tu."tenantId"
JOIN users u ON u.id = tu."userId"
WHERE u.email ILIKE 'maiszoomimpressos1@gmail.com'
   OR u.email ILIKE '%neodimar%';

-- 3) Consistência: se a central está INATIVA, o vínculo também deve estar inativo
--    (corrige exclusões feitas antes do código que atualizava tenant_users)
UPDATE tenant_users tu
SET "isActive" = false, "updatedAt" = NOW()
FROM tenants t
WHERE tu."tenantId" = t.id
  AND t."isActive" = false
  AND tu."isActive" = true;

-- 4) Opcional: desativar manualmente uma central pelo slug (depois rode o UPDATE acima de novo)
-- UPDATE tenants SET "isActive" = false, "updatedAt" = NOW() WHERE slug = 'abacate';
