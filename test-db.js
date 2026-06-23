// test-db.js — Quick connection test for the Supabase PostgreSQL database.
// Run with: node --env-file=.env test-db.js
// (Node v20.6+ supports --env-file natively — no dotenv needed)

import sql from './db.js';

console.log('🔌 Testando conexão com o banco de dados...\n');

try {
  // 1. Basic connectivity
  const [{ now }] = await sql`SELECT NOW() AS now`;
  console.log('✅ Conectado com sucesso!');
  console.log(`   Horário do servidor: ${now}\n`);

  // 2. List tables created by migrate.js
  const tables = await sql`
    SELECT tablename
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;

  if (tables.length === 0) {
    console.log('⚠️  Nenhuma tabela encontrada no schema público.');
    console.log('   → Execute: npm run migrate\n');
  } else {
    console.log(`📋 Tabelas encontradas (${tables.length}):`);
    tables.forEach(t => console.log(`   • ${t.tablename}`));
    console.log();
  }

  // 3. Quick smoke-test on categorias (seeded by migrate)
  const cats = await sql`SELECT id, nome, cor FROM categorias LIMIT 5`;
  if (cats.length > 0) {
    console.log(`🌱 Categorias semeadas (${cats.length} encontradas):`);
    cats.forEach(c => console.log(`   • ${c.nome}  ${c.cor}`));
    console.log();
  }

  console.log('🎉 Tudo certo! A conexão está funcionando.\n');
} catch (err) {
  console.error('❌ Falha na conexão:\n');
  console.error(err.message ?? err);
  process.exit(1);
} finally {
  await sql.end();
}
