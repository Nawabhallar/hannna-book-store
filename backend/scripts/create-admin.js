const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const User = require('../src/users/user.model');

async function run() {
  const argv = process.argv.slice(2);
  const username = argv[0] || 'admin';
  const password = argv[1] || 'admin';

  if (!process.env.DB_URL) {
    console.error('DB_URL not found in environment. Check backend/.env');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.DB_URL);
    console.log('Connected to MongoDB');

    let user = await User.findOne({ username });
    if (user) {
      if (user.role === 'admin') {
        console.log(`Admin user '${username}' already exists. Updating password.`);
        user.password = password; // pre-save hook will hash
        await user.save();
        console.log('Password updated.');
      } else {
        console.log(`User '${username}' exists but is not admin. Updating role to 'admin' and password.`);
        user.role = 'admin';
        user.password = password;
        await user.save();
        console.log('User upgraded to admin and password updated.');
      }
    } else {
      user = new User({ username, password, role: 'admin' });
      await user.save();
      console.log(`Admin user '${username}' created.`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Failed to create admin:', err);
    process.exit(1);
  }
}

run();
