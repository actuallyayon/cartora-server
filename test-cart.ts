import 'dotenv/config';
import { connectDB } from './src/config/db';
import { User } from './src/modules/user/user.model';
import { addToCart } from './src/modules/cart/cart.service';

async function run() {
  await connectDB();
  const user = await User.findOne();
  if (!user) {
    console.log('No user found');
    process.exit(1);
  }
  
  try {
    const cart = await addToCart(String(user._id), {
      productId: '6a56406e6edbdea8449bc100',
      quantity: 1,
    });
    console.log('Success:', JSON.stringify(cart, null, 2));
  } catch (err: any) {
    console.error('Error:', err.message, err.stack);
  }
  process.exit(0);
}

run();