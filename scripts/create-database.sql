-- ============================================
-- Script SQL para criar banco de dados
-- Execute: psql -U postgres -f scripts/create-database.sql
-- ============================================

-- Criar banco de dados
CREATE DATABASE mobilidade_urbana;

-- Conectar ao banco criado
\c mobilidade_urbana

-- Criar extensões úteis (opcional)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verificar se foi criado
SELECT 'Banco mobilidade_urbana criado com sucesso!' AS status;

-- Listar bancos
\l

