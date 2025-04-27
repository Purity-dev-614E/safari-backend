// filepath: c:\Users\USER\Desktop\SAFARI BACKEND FINAL\migrations\<timestamp>_recreate_attendance_table.js
exports.up = function(knex) {
  return knex.schema.createTable('attendance', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('event_id').references('id').inTable('events').onDelete('CASCADE');
    table.boolean('present').defaultTo(true);
    table.text('apology'); // If absent
    table.string('topic');
    table.text('aob'); // Any Other Business
    table.unique(['user_id', 'event_id']);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('attendance');
};