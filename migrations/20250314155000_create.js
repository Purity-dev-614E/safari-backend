exports.up = function(knex) {
    return knex.schema
      // Users table
      .createTable('users', function(table) {
        table.increments('id').primary();
        table.string('auth_id').notNullable().unique();
        table.string('email').notNullable().unique();
        table.string('full_name');
        table.string('phone_number');
        table.enum('gender', ['male', 'female', 'other']);
        table.string('profile_picture');
        table.enum('role', ['admin', 'user', 'super admin']).defaultTo('user'); // Updated enum
        table.string('location');
        table.string('next_of_kin_name');
        table.string('next_of_kin_contact');
        table.timestamps(true, true);
      })
      
      // Groups table
      .createTable('groups', function(table) {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.timestamps(true, true);
      })
      
      // Users-Groups many-to-many relationship
      .createTable('users_groups', function(table) {
        table.increments('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
        table.integer('group_id').unsigned().references('id').inTable('groups').onDelete('CASCADE');
        table.unique(['user_id', 'group_id']);
        table.enum('role',['admin', 'user', 'super admin'])
        table.timestamps(true, true);
      })
      
      // Events table
      .createTable('events', function(table) {
        table.increments('id').primary();
        table.string('title').notNullable();
        table.text('description');
        table.dateTime('date').notNullable();
        table.string('location');
        table.integer('group_id').unsigned().references('id').inTable('groups').onDelete('CASCADE');
        table.timestamps(true, true);
      })
      
      // Attendance table
      .createTable('attendance', function(table) {
        table.increments('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
        table.integer('event_id').unsigned().references('id').inTable('events').onDelete('CASCADE');
        table.boolean('present').defaultTo(true);
        table.text('apology'); // If absent
        table.string('topic');
        table.text('aob'); // Any Other Business
        table.unique(['user_id', 'event_id']);
        table.timestamps(true, true);
      });
  };
  
  exports.down = function(knex) {
    return knex.schema
      .dropTableIfExists('attendance')
      .dropTableIfExists('events')
      .dropTableIfExists('users_groups')
      .dropTableIfExists('groups')
      .dropTableIfExists('users');
  };
  