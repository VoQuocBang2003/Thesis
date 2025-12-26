exports.up = function(knex) {
  return knex.schema.createTable('gaming_products', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('description');
    table.decimal('price', 15, 2).notNullable();
    table.string('category').notNullable(); // gamingPCs, consoles, controllers, games, accessories
    table.string('platform'); // PC, PlayStation, Xbox, Nintendo, Multi-platform
    table.json('specs'); // JSON object for specifications
    table.string('resolution'); // 1080p, 1440p, 4K
    table.json('targetGames'); // Array of target game types
    table.integer('stock').defaultTo(0);
    table.decimal('rating', 3, 2).defaultTo(0);
    table.integer('ratingCount').defaultTo(0);
    table.string('image');
    table.json('features'); // Array of features
    table.json('compatibility'); // Array of compatible platforms
    table.string('type'); // For accessories: Gaming Headset, Gaming Keyboard, etc.
    table.string('genre'); // For games: RPG, FPS, etc.
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('gaming_products');
};







