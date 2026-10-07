import 'dotenv/config';

import { query } from './db.js';

try {

    const result =
        await query('SELECT NOW()');

    console.log(
        'Database connected:',
        result.rows[0]
    );

} catch (error) {

    console.error(
        'Database connection failed:',
        error
    );

} finally {

    process.exit(0);

}
