/**
 * Create table: chat_conversations
 * One row per message for a conversation, grouped by userId and sessionId
 */

module.exports = async function up(knex) {
  const has = await knex.schema.hasTable('chat_conversations');
  if (has) return;

  await knex.schema.createTable('chat_conversations', (table) => {
    table.increments('id').primary();
    table.string('user_id').notNullable().index();
    table.string('session_id').notNullable().index();
    table.enum('role', ['user', 'bot']).notNullable();
    table.text('message').notNullable();
    table.json('intent').nullable();
    table.json('entities').nullable();
    table.json('metadata').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

module.exports.down = async function down(knex) {
  const has = await knex.schema.hasTable('chat_conversations');
  if (has) {
    await knex.schema.dropTable('chat_conversations');
  }
};




