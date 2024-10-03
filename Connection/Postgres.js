const { Pool } = require('pg');

// Create a new pool instance with connection details
const pool = new Pool({
  user: 'postgres',
  host: 'ewaybill.cvtmhfssoly8.ap-south-1.rds.amazonaws.com',
  database: 'EwayBill',
  password: 'postgres',
  port: 5432,
  ssl: {
    rejectUnauthorized: false, // Disabling SSL certificate validation (optional)
  },
});
async function checkConnection() {
    try {
        const client = await pool.connect();
        console.log("Connected to PostgreSQL successfully!");

        client.release();
    } catch (err) {
        console.error("Failed to connect to PostgreSQL", err);
    }
}

checkConnection();



// Function to insert data into the database




// const { Pool } = require('pg');

// const pool = new Pool({
//   user: 'postgres',
//   host: 'ewaybill.cvtmhfssoly8.ap-south-1.rds.amazonaws.com',
//   database: 'EwayBill',
//   password: 'postgres',
//   port: 5432,
//   ssl: {
//     rejectUnauthorized: false, 
//   },
// });


// // Function to check the connection
// async function checkConnection() {
//     try {
//         const client = await pool.connect();
//         console.log("Connected to PostgreSQL successfully!");

//         client.release();
//     } catch (err) {
//         console.error("Failed to connect to PostgreSQL", err);
//     }
// }

// checkConnection();

// module.exports = pool;
// const pool = new Pool({
//     user: 'postgres',
//     host: 'localhost',
//     database: 'postgres',
//     password: 'Akash#4321#',
//     port: 5432,
// });


// const { Pool } = require('pg');

// const pool = new Pool({
//     user: 'postgres',
//     host: '3.111.180.109',
//     database: 'postgres',
//     password: 'postgres',
//     port: 5432,
// });

module.exports = pool;