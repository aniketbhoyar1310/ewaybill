const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'eWayBillSystem',
    password: 'H@rgun2001',
    port: 5432,
});

module.exports = pool;
