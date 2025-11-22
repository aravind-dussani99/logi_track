import bcrypt from 'bcryptjs';

// Helper script to generate password hashes for seed data
const password = process.argv[2] || 'password';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    process.exit(1);
  }
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  console.log('\nUse this hash in your seed.sql file');
});

