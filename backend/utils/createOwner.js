const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');

const setupOwner = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kirana_store';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const email = 'mykalanagarjun09@gmail.com';
    const mobile = '9121792433';
    const password = 'naga@012';

    let user = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { mobile }],
    });

    if (user) {
      user.name = 'Nagarjun';
      user.email = email.toLowerCase();
      user.mobile = mobile;
      user.password = password; // pre-save will hash it
      user.role = 'admin';
      await user.save();
      console.log('Updated existing user to Admin:', email);
    } else {
      user = await User.create({
        name: 'Nagarjun',
        email: email.toLowerCase(),
        mobile,
        password,
        role: 'admin',
        address: 'Telangana',
      });
      console.log('Created new Admin user:', email);
    }

    console.log('SUCCESS');
    process.exit(0);
  } catch (err) {
    console.error('Error setting up owner:', err.message);
    process.exit(1);
  }
};

setupOwner();
