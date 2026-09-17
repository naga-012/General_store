const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const Setting = require('../models/Setting');

const categoriesData = [
  {
    name: 'Dals, Grains & Flours (పప్పులు, బియ్యం & పిండ్లు)',
    image: 'https://images.unsplash.com/photo-1599818816941-b0db355d2ff1?w=600&auto=format&fit=crop&q=80',
    description: 'Rice, Atta, Maida, Rava, Poha, All Dal Varieties, Chana, Rajma, Sugar, Salt & Jaggery at Telangana Wholesale Prices',
  },
  {
    name: 'Spices, Masalas & Cooking (మసాలాలు & పోపు దినుసులు)',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80',
    description: 'Turmeric, Chilli powder, Coriander powder, Garam masala, Cumin, Mustard, Pepper, Ginger-Garlic paste, Sambar & Biryani masala',
  },
  {
    name: 'Dairy, Eggs & Bakery (పాలు, పెరుగు, గుడ్లు & బ్రెడ్)',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
    description: 'Fresh Milk, Thick Curd, Farm Eggs & Daily Soft Bread',
  },
  {
    name: 'Snacks, Biscuits & Drinks (స్నాక్స్, బిస్కెట్లు & కూల్ డ్రింక్స్)',
    image: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=600&auto=format&fit=crop&q=80',
    description: 'Biscuits, Cookies, Lay\'s Chips, Telangana Mixture, Thums Up, Sprite & Fruit Juices',
  },
  {
    name: 'Personal Care & Hygiene (వ్యక్తిగత సంరక్షణ & సబ్బులు)',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80',
    description: 'Bath Soap, Shampoo, Conditioner, Toothpaste, Toothbrush, Face Wash, Hair Oil, Shaving, Deodorant & Hand Wash',
  },
  {
    name: 'Cleaning & Home Care (క్లీనింగ్ & వాషింగ్)',
    image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&auto=format&fit=crop&q=80',
    description: 'Detergent Powder, Dishwash Liquid, Floor Cleaner, Toilet Cleaner, Bleaching Powder & Scrubbers',
  },
  {
    name: 'Stationery & Study (స్టేషనరీ వస్తువులు)',
    image: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=600&auto=format&fit=crop&q=80',
    description: 'Pens, Pencils, Notebooks, Erasers, Sharpeners & Markers for School and Home',
  },
  {
    name: 'Household & Lighting (పూజ & గృహోపకరణాలు)',
    image: 'https://images.unsplash.com/photo-1603555501671-8f96b3fce8b4?w=600&auto=format&fit=crop&q=80',
    description: 'Mosquito Repellents, Matchboxes, Kitchen Lighters & Household Candles',
  },
];

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kirana_store';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for Seeding...');

    // Clear existing collections
    await Promise.all([
      User.deleteMany(),
      Category.deleteMany(),
      Product.deleteMany(),
      Order.deleteMany(),
      Notification.deleteMany(),
      Setting.deleteMany(),
    ]);
    console.log('Cleared existing data.');

    // Seed Admin and Demo Customer
    const adminUser = await User.create({
      name: 'Manikanta Store Manager',
      email: 'admin@kirana.com',
      mobile: '9876543210',
      password: 'admin123',
      role: 'admin',
      address: 'Shop No. 4, Main Commercial Street, Clock Tower Road, Hyderabad, Telangana 500001',
    });

    const demoCustomer = await User.create({
      name: 'Ravi Teja',
      email: 'customer@example.com',
      mobile: '9812345678',
      password: 'customer123',
      role: 'customer',
      address: 'Plot No. 42, Raghavendra Nagar Colony, Hyderabad, Telangana 500038',
    });

    console.log('Admin and Customer accounts created:');
    console.log('  Customer: customer@example.com / customer123 (Mobile: 9812345678)');

    // Seed Categories
    const createdCategories = await Category.insertMany(categoriesData);
    console.log(`Seeded ${createdCategories.length} categories.`);

    const catMap = {};
    createdCategories.forEach((c) => {
      catMap[c.name] = c._id;
    });

    const productsData = [
      // ==========================================
      // 1. Dals, Grains & Flours
      // ==========================================
      {
        name: 'Sona Masoori Rice (రైస్ / సోనా మసూరి బియ్యం)',
        category: catMap['Dals, Grains & Flours (పప్పులు, బియ్యం & పిండ్లు)'],
        description: 'Aged premium Telangana Sona Masoori raw rice, lightweight, aromatic, and easy to digest for daily meals.',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
        brand: 'BBL Royal',
        tags: ['rice', 'sona masoori', 'telangana', 'staple'],
        isFeatured: true,
        variants: [
          { unit: '5kg', price: 290, stock: 40, isDefault: true },
          { unit: '10kg', price: 570, stock: 35, isDefault: false },
          { unit: '25kg Bag', price: 1380, stock: 25, isDefault: false },
        ],
      },
      {
        name: 'India Gate Basmati Rice / Biryani Rice (బిర్యానీ బియ్యం)',
        category: catMap['Dals, Grains & Flours (పప్పులు, బియ్యం & పిండ్లు)'],
        description: 'Extra long grain aged Basmati Rice, ideal for Hyderabadi Dum Biryani and Pulao.',
        image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=600&auto=format&fit=crop&q=80',
        brand: 'India Gate',
        tags: ['basmati', 'rice', 'biryani'],
        isFeatured: true,
        variants: [
          { unit: '1kg', price: 130, stock: 50, isDefault: true },
          { unit: '5kg', price: 620, stock: 30, isDefault: false },
        ],
      },
      {
        name: 'Aashirvaad Superior MP Sharbati Whole Wheat Flour / Atta (గోధుమ పిండి)',
        category: catMap['Dals, Grains & Flours (పప్పులు, బియ్యం & పిండ్లు)'],
        description: '100% pure whole wheat stone-ground chakki fresh atta for extra soft rotis and phulkas.',
        image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80',
        brand: 'Aashirvaad',
        tags: ['wheat flour', 'atta', 'aashirvaad', 'chakki'],
        isFeatured: true,
        variants: [
          { unit: '1kg', price: 55, stock: 45, isDefault: false },
          { unit: '5kg', price: 245, stock: 40, isDefault: true },
          { unit: '10kg', price: 470, stock: 25, isDefault: false },
        ],
      },
      {
        name: 'Refined Wheat Flour / Maida (మైదా పిండి)',
        category: catMap['Dals, Grains & Flours (పప్పులు, బియ్యం & పిండ్లు)'],
        description: 'Super fine premium Maida for samosas, puris, parathas, and bakery items.',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
        brand: 'Popular',
        tags: ['maida', 'flour', 'baking'],
        variants: [
          { unit: '500g', price: 26, stock: 50, isDefault: false },
          { unit: '1kg', price: 48, stock: 60, isDefault: true },
        ],
      },
      {
        name: 'Bombay Rava / Upma Sooji (బొంబాయి రవ్వ / ఉప్మా రవ్వ)',
        category: catMap['Dals, Grains & Flours (పప్పులు, బియ్యం & పిండ్లు)'],
        description: 'Roasted granulated wheat semolina for delicious Upma, Kesari Bath, and Rava Dosa.',
        image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
        brand: 'Sri Lalitha',
        tags: ['rava', 'sooji', 'upma'],
        variants: [
          { unit: '500g', price: 30, stock: 45, isDefault: false },
          { unit: '1kg', price: 55, stock: 50, isDefault: true },
        ],
      },
      {
        name: 'Thick Poha / Beaten Rice / Atukulu (దొడ్డు అటుకులు)',
        category: catMap['Dals, Grains & Flours (పప్పులు, బియ్యం & పిండ్లు)'],
        description: 'Crispy thick flattened rice for tasty breakfast Atukula Upma / Poha and snacks.',
        image: 'https://images.unsplash.com/photo-1599818816941-b0db355d2ff1?w=600&auto=format&fit=crop&q=80',
        brand: 'Laxmi',
        tags: ['poha', 'atukulu', 'breakfast'],
        variants: [
          { unit: '500g', price: 32, stock: 40, isDefault: false },
          { unit: '1kg', price: 60, stock: 45, isDefault: true },
        ],
      },
      {
        name: 'Premium Toor Dal / Kandi Pappu (కందిపప్పు)',
        category: catMap['Dals, Grains & Flours (పప్పులు, బియ్యం & పిండ్లు)'],
        description: 'Unpolished golden yellow Toor dal, rich in protein, perfect for authentic Andhra & Telangana Pappu and Sambar.',
        image: 'https://images.unsplash.com/photo-1585992639967-33630f576e25?w=600&auto=format&fit=crop&q=80',
        brand: 'Farmer Special',
        tags: ['dal', 'toor dal', 'kandi pappu'],
        isFeatured: true,
        variants: [
          { unit: '500g', price: 82, stock: 60, isDefault: false },
          { unit: '1kg', price: 160, stock: 80, isDefault: true },
          { unit: '2kg', price: 315, stock: 40, isDefault: false },
        ],
      },
      {
        name: 'Yellow Moong Dal / Pesara Pappu (పెసరపప్పు)',
        category: catMap['Dals, Grains & Flours (పప్పులు, బియ్యం & పిండ్లు)'],
        description: 'Easily digestible split yellow moong dal, quick cooking for dal tadka and khichdi.',
        image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80',
        brand: 'Natural Kirana',
        tags: ['moong dal', 'pesara pappu'],
        variants: [
          { unit: '500g', price: 65, stock: 50, isDefault: false },
          { unit: '1kg', price: 125, stock: 65, isDefault: true },
        ],
      },
      {
        name: 'Whole Urad Dal Gundu / Minapa Pappu (మినప గుండ్లు)',
        category: catMap['Dals, Grains & Flours (పప్పులు, బియ్యం & పిండ్లు)'],
        description: 'Double polished clean white whole urad dal for fluffy idli and crispy golden dosa batter.',
        image: 'https://images.unsplash.com/photo-1599818816941-b0db355d2ff1?w=600&auto=format&fit=crop&q=80',
        brand: 'Sri Krishna',
        tags: ['urad dal', 'minapa pappu', 'idli', 'dosa'],
        variants: [
          { unit: '500g', price: 75, stock: 40, isDefault: false },
          { unit: '1kg', price: 145, stock: 60, isDefault: true },
        ],
      },
      {
        name: 'Chana Dal / Bengal Gram / Senaga Pappu (శనగపప్పు)',
        category: catMap['Dals, Grains & Flours (పప్పులు, బియ్యం & పిండ్లు)'],
        description: 'Nutritious unpolished chana dal for daily curries, dal fry, and tadka tempering.',
        image: 'https://images.unsplash.com/photo-1599818816941-b0db355d2ff1?w=600&auto=format&fit=crop&q=80',
        brand: 'Farmer Special',
        tags: ['chana dal', 'senaga pappu'],
        variants: [
          { unit: '500g', price: 48, stock: 50, isDefault: false },
          { unit: '1kg', price: 92, stock: 70, isDefault: true },
        ],
      },
      {
        name: 'Red Masoor Dal / Split Orange Lentils (ఎర్ర కందిపప్పు)',
        category: catMap['Dals, Grains & Flours (పప్పులు, బియ్యం & పిండ్లు)'],
        description: 'Quick boiling split red masoor dal for creamy everyday curries and soups.',
        image: 'https://images.unsplash.com/photo-1585992639967-33630f576e25?w=600&auto=format&fit=crop&q=80',
        brand: 'Telangana Fresh',
        tags: ['masoor dal', 'lentils'],
        variants: [
          { unit: '500g', price: 52, stock: 40, isDefault: false },
          { unit: '1kg', price: 98, stock: 50, isDefault: true },
        ],
      },
      {
        name: 'Brown Kala Chana / Nalla Senagalu (నల్ల శనగలు)',
        category: catMap['Dals, Grains & Flours (పప్పులు, బియ్యం & పిండ్లు)'],
        description: 'Fiber-rich desi brown chickpeas for wholesome curry, sundal, and sprouted salads.',
        image: 'https://images.unsplash.com/photo-1599818816941-b0db355d2ff1?w=600&auto=format&fit=crop&q=80',
        brand: 'Farmer Special',
        tags: ['kala chana', 'chickpeas', 'senagalu'],
        variants: [
          { unit: '500g', price: 42, stock: 40, isDefault: false },
          { unit: '1kg', price: 80, stock: 50, isDefault: true },
        ],
      },
      {
        name: 'Kabuli Chana / White Chickpeas (కాబూలీ శనగలు)',
        category: catMap['Dals, Grains & Flours (పప్పులు, బియ్యం & పిండ్లు)'],
        description: 'Large grain premium white chickpeas for Punjabi Chole and Hyderabad curry.',
        image: 'https://images.unsplash.com/photo-1599818816941-b0db355d2ff1?w=600&auto=format&fit=crop&q=80',
        brand: 'Royal',
        tags: ['kabuli chana', 'chole'],
        variants: [
          { unit: '500g', price: 78, stock: 35, isDefault: false },
          { unit: '1kg', price: 150, stock: 45, isDefault: true },
        ],
      },
      {
        name: 'Chitra Rajma / Red Kidney Beans (చిత్ర రాజ్మా)',
        category: catMap['Dals, Grains & Flours (పప్పులు, బియ్యం & పిండ్లు)'],
        description: 'Tender specked Rajma beans, cooks soft for rich creamy restaurant-style Rajma Masala.',
        image: 'https://images.unsplash.com/photo-1585992639967-33630f576e25?w=600&auto=format&fit=crop&q=80',
        brand: 'Himalayan Select',
        tags: ['rajma', 'beans'],
        variants: [
          { unit: '500g', price: 75, stock: 30, isDefault: false },
          { unit: '1kg', price: 145, stock: 40, isDefault: true },
        ],
      },
      {
        name: 'Madhur Pure & Hygienic Refined Sugar (పంచదార)',
        category: catMap['Dals, Grains & Flours (పప్పులు, బియ్యం & పిండ్లు)'],
        description: 'Sulphur-free sparkling white crystal sugar for chai, coffee, and traditional sweets.',
        image: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=600&auto=format&fit=crop&q=80',
        brand: 'Madhur',
        tags: ['sugar', 'sweet'],
        variants: [
          { unit: '1kg', price: 48, stock: 70, isDefault: true },
          { unit: '5kg', price: 235, stock: 35, isDefault: false },
        ],
      },
      {
        name: 'Tata Vacuum Evaporated Iodized Salt (టాటా ఉప్పు)',
        category: catMap['Dals, Grains & Flours (పప్పులు, బియ్యం & పిండ్లు)'],
        description: 'India\'s most trusted vacuum-evaporated iodized cooking salt.',
        image: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=600&auto=format&fit=crop&q=80',
        brand: 'Tata Salt',
        tags: ['salt', 'tata', 'iodized'],
        variants: [
          { unit: '1kg', price: 28, stock: 90, isDefault: true },
        ],
      },
      {
        name: 'Pure Natural Cane Jaggery / Bellam (స్వచ్ఛమైన బెల్లం)',
        category: catMap['Dals, Grains & Flours (పప్పులు, బియ్యం & పిండ్లు)'],
        description: 'Unbleached natural golden brown jaggery blocks, sweet, rich in iron, for payasam and daily use.',
        image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80',
        brand: 'Anakapalli Gold',
        tags: ['jaggery', 'bellam', 'sweet'],
        variants: [
          { unit: '500g', price: 38, stock: 40, isDefault: false },
          { unit: '1kg', price: 72, stock: 55, isDefault: true },
        ],
      },

      // ==========================================
      // 2. Spices, Masalas & Cooking
      // ==========================================
      {
        name: 'Nizamabad Salem Turmeric Powder / Pasupu (పసుపు పొడి)',
        category: catMap['Spices, Masalas & Cooking (మసాలాలు & పోపు దినుసులు)'],
        description: '100% pure bright yellow turmeric with high natural curcumin content from Nizamabad.',
        image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80',
        brand: 'Priya / Farm Fresh',
        tags: ['turmeric', 'pasupu', 'spice'],
        variants: [
          { unit: '100g', price: 25, stock: 50, isDefault: false },
          { unit: '250g', price: 58, stock: 60, isDefault: true },
          { unit: '500g', price: 110, stock: 40, isDefault: false },
        ],
      },
      {
        name: 'Warangal Guntur Teja Mirchi Podi / Red Chilli Powder (కారం పొడి)',
        category: catMap['Spices, Masalas & Cooking (మసాలాలు & పోపు దినుసులు)'],
        description: 'Authentic fiery red chilli powder with rich color and punchy spice for Telangana curries.',
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80',
        brand: 'Priya / Telangana Special',
        tags: ['chilli', 'mirchi', 'karam', 'spice'],
        isFeatured: true,
        variants: [
          { unit: '250g', price: 75, stock: 60, isDefault: true },
          { unit: '500g', price: 145, stock: 70, isDefault: false },
          { unit: '1kg', price: 280, stock: 50, isDefault: false },
        ],
      },
      {
        name: 'Roasted Coriander Powder / Dhaniya Podi (ధనియాల పొడి)',
        category: catMap['Spices, Masalas & Cooking (మసాలాలు & పోపు దినుసులు)'],
        description: 'Slow roasted aromatic whole coriander seed powder for gravies and fry curries.',
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80',
        brand: 'Everest',
        tags: ['dhaniya', 'coriander', 'powder'],
        variants: [
          { unit: '100g', price: 28, stock: 50, isDefault: false },
          { unit: '250g', price: 65, stock: 55, isDefault: true },
        ],
      },
      {
        name: 'Everest Super Garam Masala (గరం మసాలా)',
        category: catMap['Spices, Masalas & Cooking (మసాలాలు & పోపు దినుసులు)'],
        description: 'Finely blended authentic Indian spices to enrich veg and non-veg curries with royal aroma.',
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80',
        brand: 'Everest',
        tags: ['garam masala', 'spice', 'everest'],
        variants: [
          { unit: '50g', price: 42, stock: 45, isDefault: false },
          { unit: '100g', price: 80, stock: 60, isDefault: true },
        ],
      },
      {
        name: 'Cumin Seeds / Jeera (జీలకర్ర)',
        category: catMap['Spices, Masalas & Cooking (మసాలాలు & పోపు దినుసులు)'],
        description: 'Strong, fragrant whole cumin seeds for tempering, digestion, and tadka.',
        image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80',
        brand: 'Shree Gold',
        tags: ['cumin', 'jeera', 'tadka'],
        variants: [
          { unit: '100g', price: 45, stock: 50, isDefault: false },
          { unit: '250g', price: 105, stock: 60, isDefault: true },
          { unit: '500g', price: 200, stock: 40, isDefault: false },
        ],
      },
      {
        name: 'Mustard Seeds / Rai / Avalu (ఆవాలు)',
        category: catMap['Spices, Masalas & Cooking (మసాలాలు & పోపు దినుసులు)'],
        description: 'Small black aromatic mustard seeds for traditional popu and pickle tempering.',
        image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80',
        brand: 'Shree Gold',
        tags: ['mustard', 'avalu', 'tadka'],
        variants: [
          { unit: '100g', price: 16, stock: 55, isDefault: false },
          { unit: '250g', price: 38, stock: 65, isDefault: true },
          { unit: '500g', price: 72, stock: 40, isDefault: false },
        ],
      },
      {
        name: 'Whole Black Pepper / Miriyalu (మిరియాలు)',
        category: catMap['Spices, Masalas & Cooking (మసాలాలు & పోపు దినుసులు)'],
        description: 'Malabar bold whole black peppercorns for rasam, pongal, and seasoning.',
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80',
        brand: 'Spice Club',
        tags: ['pepper', 'miriyalu'],
        variants: [
          { unit: '100g', price: 95, stock: 45, isDefault: true },
          { unit: '250g', price: 230, stock: 35, isDefault: false },
        ],
      },
      {
        name: 'Fresh Ginger-Garlic Paste / Allam Vellulli (అల్లం వెల్లుల్లి పేస్ట్)',
        category: catMap['Spices, Masalas & Cooking (మసాలాలు & పోపు దినుసులు)'],
        description: 'Thick, preservative-free freshly ground ginger and garlic paste for curries and biryanis.',
        image: 'https://images.unsplash.com/photo-1589927986086-3d10fb556977?w=600&auto=format&fit=crop&q=80',
        brand: 'Mother\'s Recipe / Priya',
        tags: ['ginger garlic paste', 'allam vellulli'],
        variants: [
          { unit: '200g Pouch', price: 38, stock: 60, isDefault: true },
          { unit: '500g Jar', price: 85, stock: 50, isDefault: false },
        ],
      },
      {
        name: 'MTR Telangana Sambar Powder (సాంబార్ పొడి)',
        category: catMap['Spices, Masalas & Cooking (మసాలాలు & పోపు దినుసులు)'],
        description: 'Authentic South Indian roasted spice blend for fragrant, lip-smacking vegetable sambar.',
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80',
        brand: 'MTR',
        tags: ['sambar powder', 'mtr'],
        variants: [
          { unit: '100g', price: 42, stock: 45, isDefault: true },
          { unit: '200g', price: 80, stock: 40, isDefault: false },
        ],
      },
      {
        name: 'Everest Shahi Biryani Masala (బిర్యానీ మసాలా)',
        category: catMap['Spices, Masalas & Cooking (మసాలాలు & పోపు దినుసులు)'],
        description: 'Exquisite aromatic whole spice blend crafted for legendary Hyderabadi Biryani.',
        image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
        brand: 'Everest',
        tags: ['biryani masala', 'hyderabad', 'everest'],
        variants: [
          { unit: '50g', price: 45, stock: 40, isDefault: false },
          { unit: '100g', price: 85, stock: 55, isDefault: true },
        ],
      },

      // ==========================================
      // 3. Dairy, Eggs & Bakery
      // ==========================================
      {
        name: 'Heritage Toned Fresh Milk / Paalu (హెరిటేజ్ పాలు)',
        category: catMap['Dairy, Eggs & Bakery (పాలు, పెరుగు, గుడ్లు & బ్రెడ్)'],
        description: 'Daily fresh pasteurized homogenized toned milk rich in calcium and protein.',
        image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
        brand: 'Heritage',
        tags: ['milk', 'dairy', 'heritage'],
        isFeatured: true,
        variants: [
          { unit: '500ml Pouch', price: 30, stock: 70, isDefault: true },
          { unit: '1 Litre Pouch', price: 58, stock: 50, isDefault: false },
        ],
      },
      {
        name: 'Heritage Fresh Thick Curd / Perugu (పెరుగు)',
        category: catMap['Dairy, Eggs & Bakery (పాలు, పెరుగు, గుడ్లు & బ్రెడ్)'],
        description: 'Creamy, thick traditional set dahi / curd prepared with high quality milk.',
        image: 'https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=600&auto=format&fit=crop&q=80',
        brand: 'Heritage',
        tags: ['curd', 'dahi', 'perugu'],
        variants: [
          { unit: '500g Pouch', price: 35, stock: 60, isDefault: true },
          { unit: '1kg Tub', price: 70, stock: 40, isDefault: false },
        ],
      },
      {
        name: 'Farm Fresh White Table Eggs / Guddu (కోడి గుడ్లు)',
        category: catMap['Dairy, Eggs & Bakery (పాలు, పెరుగు, గుడ్లు & బ్రెడ్)'],
        description: 'Daily fresh sanitized farm eggs, rich source of natural protein.',
        image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=600&auto=format&fit=crop&q=80',
        brand: 'Farm Fresh',
        tags: ['eggs', 'protein', 'poultry'],
        isFeatured: true,
        variants: [
          { unit: 'Pack of 6', price: 38, stock: 40, isDefault: true },
          { unit: 'Pack of 12', price: 75, stock: 35, isDefault: false },
          { unit: '30 Eggs Crate', price: 180, stock: 25, isDefault: false },
        ],
      },
      {
        name: 'Britannia Daily Fresh White Bread (బ్రెడ్)',
        category: catMap['Dairy, Eggs & Bakery (పాలు, పెరుగు, గుడ్లు & బ్రెడ్)'],
        description: 'Soft and oven-fresh enriched white sandwich bread slices for toast and sandwiches.',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
        brand: 'Britannia',
        tags: ['bread', 'bakery', 'breakfast'],
        variants: [
          { unit: '400g Pack', price: 40, stock: 45, isDefault: true },
        ],
      },

      // ==========================================
      // 4. Snacks, Biscuits & Drinks
      // ==========================================
      {
        name: 'Parle-G Original Gluco Biscuits (పార్లే-జి బిస్కెట్లు)',
        category: catMap['Snacks, Biscuits & Drinks (స్నాక్స్, బిస్కెట్లు & కూల్ డ్రింక్స్)'],
        description: 'India\'s favourite energy glucose biscuits, best accompaniment for hot tea.',
        image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80',
        brand: 'Parle',
        tags: ['biscuits', 'parle-g', 'tea'],
        variants: [
          { unit: '250g Pack', price: 25, stock: 75, isDefault: true },
          { unit: '800g Value Pack', price: 75, stock: 40, isDefault: false },
        ],
      },
      {
        name: 'Britannia Good Day Butter Cookies (గుడ్ డే కుకీస్)',
        category: catMap['Snacks, Biscuits & Drinks (స్నాక్స్, బిస్కెట్లు & కూల్ డ్రింక్స్)'],
        description: 'Rich buttery crunchy cookies with signature smile designs.',
        image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&auto=format&fit=crop&q=80',
        brand: 'Britannia',
        tags: ['cookies', 'good day', 'butter'],
        variants: [
          { unit: '120g Pack', price: 25, stock: 60, isDefault: true },
          { unit: '300g Super Saver', price: 60, stock: 45, isDefault: false },
        ],
      },
      {
        name: 'Lay\'s India\'s Magic Masala Potato Chips (లేస్ చిప్స్)',
        category: catMap['Snacks, Biscuits & Drinks (స్నాక్స్, బిస్కెట్లు & కూల్ డ్రింక్స్)'],
        description: 'Crispy ridged potato chips seasoned with authentic Indian spicy masala mix.',
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80',
        brand: 'Lay\'s',
        tags: ['chips', 'lays', 'snacks'],
        isFeatured: true,
        variants: [
          { unit: '50g Pack', price: 20, stock: 80, isDefault: true },
          { unit: '90g Party Pack', price: 40, stock: 50, isDefault: false },
        ],
      },
      {
        name: 'Telangana Special Hot Spicy Mixture (మిక్స్చర్ / కారప్పూస)',
        category: catMap['Snacks, Biscuits & Drinks (స్నాక్స్, బిస్కెట్లు & కూల్ డ్రింక్స్)'],
        description: 'Crunchy hot mixture with sev, roasted peanuts, curry leaves, and garlic seasoning.',
        image: 'https://images.unsplash.com/photo-1599818816941-b0db355d2ff1?w=600&auto=format&fit=crop&q=80',
        brand: 'Manikanta Sweets & Bakery',
        tags: ['mixture', 'namkeen', 'snack'],
        variants: [
          { unit: '250g Pouch', price: 65, stock: 50, isDefault: true },
          { unit: '500g Pouch', price: 120, stock: 40, isDefault: false },
        ],
      },
      {
        name: 'Thums Up Charged Soft Drink (థమ్స్ అప్ కూల్ డ్రింక్)',
        category: catMap['Snacks, Biscuits & Drinks (స్నాక్స్, బిస్కెట్లు & కూల్ డ్రింక్స్)'],
        description: 'Taste the Thunder! Strong fizz cola soft drink loved across Telangana.',
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
        brand: 'Thums Up',
        tags: ['soft drink', 'thums up', 'cold drink'],
        isFeatured: true,
        variants: [
          { unit: '750ml Bottle', price: 40, stock: 60, isDefault: true },
          { unit: '2 Litre Family Bottle', price: 95, stock: 40, isDefault: false },
        ],
      },
      {
        name: 'Maaza Real Mango Pulp Juice (మాజా మామిడి పండ్ల రసం)',
        category: catMap['Snacks, Biscuits & Drinks (స్నాక్స్, బిస్కెట్లు & కూల్ డ్రింక్స్)'],
        description: 'Delicious thick Alphonso mango pulp beverage for refreshing hydration.',
        image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600&auto=format&fit=crop&q=80',
        brand: 'Maaza',
        tags: ['fruit juice', 'mango', 'maaza'],
        variants: [
          { unit: '600ml Bottle', price: 38, stock: 50, isDefault: true },
          { unit: '1.2 Litre Bottle', price: 75, stock: 35, isDefault: false },
        ],
      },

      // ==========================================
      // 5. Personal Care & Hygiene
      // ==========================================
      {
        name: 'Dettol Original Germ Protection Bath Soap (డెట్టాల్ సబ్బు)',
        category: catMap['Personal Care & Hygiene (వ్యక్తిగత సంరక్షణ & సబ్బులు)'],
        description: 'Trusted 100% germ defense bath soap keeping skin fresh, healthy and clean.',
        image: 'https://images.unsplash.com/photo-1607006314646-fd7517c2f1f0?w=600&auto=format&fit=crop&q=80',
        brand: 'Dettol',
        tags: ['soap', 'bath soap', 'dettol'],
        variants: [
          { unit: '100g Bar', price: 36, stock: 80, isDefault: false },
          { unit: 'Pack of 4 (4x100g)', price: 135, stock: 55, isDefault: true },
        ],
      },
      {
        name: 'Clinic Plus Strong & Long Shampoo (క్లినిక్ ప్లస్ షాంపూ)',
        category: catMap['Personal Care & Hygiene (వ్యక్తిగత సంరక్షణ & సబ్బులు)'],
        description: 'Milk protein enriched daily hair shampoo for strong, shiny and silky hair.',
        image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80',
        brand: 'Clinic Plus',
        tags: ['shampoo', 'hair care'],
        variants: [
          { unit: '175ml Bottle', price: 95, stock: 50, isDefault: true },
          { unit: '340ml Bottle', price: 185, stock: 35, isDefault: false },
        ],
      },
      {
        name: 'Dove Daily Shine Hair Conditioner (డవ్ కండిషనర్)',
        category: catMap['Personal Care & Hygiene (వ్యక్తిగత సంరక్షణ & సబ్బులు)'],
        description: 'Micro-moisture serum conditioner for smooth, frizz-free, manageable hair.',
        image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&auto=format&fit=crop&q=80',
        brand: 'Dove',
        tags: ['conditioner', 'hair care', 'dove'],
        variants: [
          { unit: '175ml Tube', price: 165, stock: 35, isDefault: true },
        ],
      },
      {
        name: 'Colgate Strong Teeth Calcium Toothpaste (కోల్గేట్ టూత్ పేస్ట్)',
        category: catMap['Personal Care & Hygiene (వ్యక్తిగత సంరక్షణ & సబ్బులు)'],
        description: 'With Amino Shakti formula to strengthen teeth and protect against cavities.',
        image: 'https://images.unsplash.com/photo-1559591937-e1032b535492?w=600&auto=format&fit=crop&q=80',
        brand: 'Colgate',
        tags: ['toothpaste', 'colgate', 'dental'],
        variants: [
          { unit: '150g Tube', price: 65, stock: 70, isDefault: true },
          { unit: '300g Saver Pack', price: 125, stock: 45, isDefault: false },
        ],
      },
      {
        name: 'Oral-B Cavity Defense Toothbrush (టూత్ బ్రష్)',
        category: catMap['Personal Care & Hygiene (వ్యక్తిగత సంరక్షణ & సబ్బులు)'],
        description: 'Multi-angle bristles that clean deep between teeth and massage gums.',
        image: 'https://images.unsplash.com/photo-1522844990619-4951c40f7eda?w=600&auto=format&fit=crop&q=80',
        brand: 'Oral-B',
        tags: ['toothbrush', 'dental'],
        variants: [
          { unit: 'Single Pack', price: 30, stock: 65, isDefault: false },
          { unit: 'Pack of 3', price: 80, stock: 50, isDefault: true },
        ],
      },
      {
        name: 'Himalaya Purifying Neem Face Wash (హిమాలయ ఫేస్ వాష్)',
        category: catMap['Personal Care & Hygiene (వ్యక్తిగత సంరక్షణ & సబ్బులు)'],
        description: 'Soap-free herbal formulation that removes excess oil and prevents pimples.',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80',
        brand: 'Himalaya',
        tags: ['face wash', 'skin care', 'himalaya'],
        variants: [
          { unit: '100ml Tube', price: 85, stock: 45, isDefault: true },
          { unit: '200ml Bottle', price: 160, stock: 35, isDefault: false },
        ],
      },
      {
        name: 'Parachute 100% Pure Coconut Hair Oil (పారాచూట్ కొబ్బరి నూనె)',
        category: catMap['Personal Care & Hygiene (వ్యక్తిగత సంరక్షణ & సబ్బులు)'],
        description: 'Made from sun-dried coconuts, deep root nourishing pure hair oil.',
        image: 'https://images.unsplash.com/photo-1608248597359-00f72f23b7b2?w=600&auto=format&fit=crop&q=80',
        brand: 'Parachute',
        tags: ['hair oil', 'coconut oil', 'parachute'],
        variants: [
          { unit: '200ml Bottle', price: 75, stock: 60, isDefault: true },
          { unit: '500ml Bottle', price: 175, stock: 45, isDefault: false },
        ],
      },
      {
        name: 'Gillette Classic Shaving Foam & Vector Razor Combo (షేవింగ్ ఫోమ్ & రేజర్)',
        category: catMap['Personal Care & Hygiene (వ్యక్తిగత సంరక్షణ & సబ్బులు)'],
        description: 'Extra rich creamy lather for a clean, smooth, irritation-free glide shaving experience.',
        image: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=600&auto=format&fit=crop&q=80',
        brand: 'Gillette',
        tags: ['shaving', 'razor', 'foam', 'gillette'],
        variants: [
          { unit: 'Vector Razor + 2 Blades', price: 99, stock: 40, isDefault: false },
          { unit: 'Foam 200g Can', price: 140, stock: 45, isDefault: true },
        ],
      },
      {
        name: 'Fogg Marco Long Lasting No Gas Deodorant (ఫాగ్ డెయోడరెంట్)',
        category: catMap['Personal Care & Hygiene (వ్యక్తిగత సంరక్షణ & సబ్బులు)'],
        description: '100% perfume liquid body spray providing all-day fresh fragrance without gas.',
        image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&auto=format&fit=crop&q=80',
        brand: 'Fogg',
        tags: ['deodorant', 'body spray', 'fogg'],
        variants: [
          { unit: '120ml Can', price: 195, stock: 40, isDefault: true },
        ],
      },
      {
        name: 'Lifebuoy Total Germ Protection Liquid Hand Wash (లిక్విడ్ హ్యాండ్ వాష్)',
        category: catMap['Personal Care & Hygiene (వ్యక్తిగత సంరక్షణ & సబ్బులు)'],
        description: 'Fast active formula that kills 99.9% germs in just 10 seconds.',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
        brand: 'Lifebuoy',
        tags: ['hand wash', 'hygiene'],
        variants: [
          { unit: '200ml Pump Bottle', price: 85, stock: 50, isDefault: true },
          { unit: '750ml Refill Pouch', price: 135, stock: 40, isDefault: false },
        ],
      },

      // ==========================================
      // 6. Cleaning & Home Care
      // ==========================================
      {
        name: 'Surf Excel Easy Wash Detergent Powder (సర్ఫ్ ఎక్సెల్ సర్ఫు పొడి)',
        category: catMap['Cleaning & Home Care (క్లీనింగ్ & వాషింగ్)'],
        description: 'Superior stain removal formula for bright, clean, fragrance-filled laundry.',
        image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&auto=format&fit=crop&q=80',
        brand: 'Surf Excel',
        tags: ['detergent', 'washing powder', 'surf excel'],
        isFeatured: true,
        variants: [
          { unit: '1kg Pouch', price: 145, stock: 65, isDefault: true },
          { unit: '3kg Saver Pack', price: 410, stock: 35, isDefault: false },
        ],
      },
      {
        name: 'Vim Lemon Dishwash Liquid Gel (విమ్ డిష్ వాష్ లిక్విడ్)',
        category: catMap['Cleaning & Home Care (క్లీనింగ్ & వాషింగ్)'],
        description: 'Concentrated power of 100 lemons to cut through tough grease on vessels instantly.',
        image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&auto=format&fit=crop&q=80',
        brand: 'Vim',
        tags: ['dishwash', 'vim', 'cleaning'],
        variants: [
          { unit: '250ml Bottle', price: 55, stock: 60, isDefault: true },
          { unit: '750ml Refill Pouch', price: 140, stock: 45, isDefault: false },
        ],
      },
      {
        name: 'Lizol Citrus Disinfectant Surface Floor Cleaner (లైజాల్ ఫ్లోర్ క్లీనర్)',
        category: catMap['Cleaning & Home Care (క్లీనింగ్ & వాషింగ్)'],
        description: 'Kills 99.9% germs, leaves long-lasting pleasant citrus fragrance on tiles and floors.',
        image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&auto=format&fit=crop&q=80',
        brand: 'Lizol',
        tags: ['floor cleaner', 'lizol', 'disinfectant'],
        variants: [
          { unit: '500ml Bottle', price: 98, stock: 55, isDefault: true },
          { unit: '1 Litre Bottle', price: 185, stock: 40, isDefault: false },
        ],
      },
      {
        name: 'Harpic Power Plus 10X Max Clean Toilet Cleaner (హార్పిక్ టాయిలెట్ క్లీనర్)',
        category: catMap['Cleaning & Home Care (క్లీనింగ్ & వాషింగ్)'],
        description: 'Deep cleaning thick blue liquid that removes tough stains, limescale and odors.',
        image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&auto=format&fit=crop&q=80',
        brand: 'Harpic',
        tags: ['toilet cleaner', 'harpic'],
        variants: [
          { unit: '500ml Bottle', price: 92, stock: 55, isDefault: true },
          { unit: '1 Litre Bottle', price: 175, stock: 40, isDefault: false },
        ],
      },
      {
        name: 'Disinfectant Bleaching Powder / Chlorine (బ్లీచింగ్ పౌడర్)',
        category: catMap['Cleaning & Home Care (క్లీనింగ్ & వాషింగ్)'],
        description: 'High chlorine disinfectant bleaching powder for drain sanitation and water purification.',
        image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&auto=format&fit=crop&q=80',
        brand: 'Clean Pro',
        tags: ['bleaching powder', 'disinfectant'],
        variants: [
          { unit: '500g Pack', price: 35, stock: 40, isDefault: false },
          { unit: '1kg Pack', price: 65, stock: 50, isDefault: true },
        ],
      },
      {
        name: 'Scotch-Brite Heavy Duty Scrub Pad & Sponge (స్క్రబ్బర్లు)',
        category: catMap['Cleaning & Home Care (క్లీనింగ్ & వాషింగ్)'],
        description: 'Durable nylon fibers that clean burned stains on pots, pans, and everyday utensils.',
        image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&auto=format&fit=crop&q=80',
        brand: 'Scotch-Brite',
        tags: ['scrubber', 'sponge', 'scotch-brite'],
        variants: [
          { unit: 'Pack of 3 Scrub Pads', price: 45, stock: 65, isDefault: true },
          { unit: 'Sponge Wipe (Pack of 3)', price: 85, stock: 35, isDefault: false },
        ],
      },

      // ==========================================
      // 7. Stationery & Study
      // ==========================================
      {
        name: 'Reynolds 045 Fine Carbure Ball Pens (రెనాల్డ్స్ పెన్నులు)',
        category: catMap['Stationery & Study (స్టేషనరీ వస్తువులు)'],
        description: 'Classic laser-smooth blue ballpoint pens for non-smudge everyday school and office writing.',
        image: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=600&auto=format&fit=crop&q=80',
        brand: 'Reynolds',
        tags: ['pens', 'ball pen', 'stationery'],
        variants: [
          { unit: 'Pack of 5 Pens (Blue)', price: 45, stock: 60, isDefault: true },
          { unit: 'Pack of 10 Box', price: 85, stock: 40, isDefault: false },
        ],
      },
      {
        name: 'Apsara Platinum Extra Dark Pencils (అప్సర పెన్సిల్స్)',
        category: catMap['Stationery & Study (స్టేషనరీ వస్తువులు)'],
        description: 'Smooth and dark writing lead pencils with free eraser and point sharpener included.',
        image: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=600&auto=format&fit=crop&q=80',
        brand: 'Apsara',
        tags: ['pencils', 'apsara', 'stationery'],
        variants: [
          { unit: 'Pack of 10 Pencils', price: 55, stock: 55, isDefault: true },
        ],
      },
      {
        name: 'Classmate Long Ruled Notebook 192 Pages (క్లాస్‌మేట్ నోట్ బుక్)',
        category: catMap['Stationery & Study (స్టేషనరీ వస్తువులు)'],
        description: 'Eco-friendly smooth bright white pages with durable binding for students.',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
        brand: 'Classmate',
        tags: ['notebook', 'classmate', 'study'],
        variants: [
          { unit: '1 Book (192 pgs)', price: 55, stock: 60, isDefault: true },
          { unit: 'Pack of 3 Books', price: 155, stock: 35, isDefault: false },
        ],
      },
      {
        name: 'Apsara Non-Dust Erasers (అప్సర రబ్బర్లు / ఎరేజర్లు)',
        category: catMap['Stationery & Study (స్టేషనరీ వస్తువులు)'],
        description: 'Clean wiping non-dust erasers that do not tear the paper.',
        image: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=600&auto=format&fit=crop&q=80',
        brand: 'Apsara',
        tags: ['eraser', 'stationery'],
        variants: [
          { unit: 'Pack of 5 Erasers', price: 25, stock: 70, isDefault: true },
        ],
      },
      {
        name: 'Apsara Long Point Pencil Sharpeners (షార్పనర్లు)',
        category: catMap['Stationery & Study (స్టేషనరీ వస్తువులు)'],
        description: 'Scientifically angled anti-rust blades for razor-sharp pencil tips.',
        image: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=600&auto=format&fit=crop&q=80',
        brand: 'Apsara',
        tags: ['sharpener', 'stationery'],
        variants: [
          { unit: 'Pack of 5 Sharpeners', price: 25, stock: 70, isDefault: true },
        ],
      },
      {
        name: 'Camlin Whiteboard & Permanent Markers (మార్కర్ పెన్నులు)',
        category: catMap['Stationery & Study (స్టేషనరీ వస్తువులు)'],
        description: 'Bright vivid ink markers for whiteboards, chart papers, and carton labelling.',
        image: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=600&auto=format&fit=crop&q=80',
        brand: 'Camlin',
        tags: ['markers', 'camlin', 'stationery'],
        variants: [
          { unit: 'Single Marker (Black)', price: 30, stock: 50, isDefault: false },
          { unit: 'Pack of 4 Assorted Colors', price: 110, stock: 40, isDefault: true },
        ],
      },

      // ==========================================
      // 8. Household & Lighting
      // ==========================================
      {
        name: 'Good Knight Gold Flash Mosquito Repellent Machine + Refill (దోమల లిక్విడ్)',
        category: catMap['Household & Lighting (పూజ & గృహోపకరణాలు)'],
        description: 'Advanced mosquito vaporization technology for malaria & dengue protection all night.',
        image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&auto=format&fit=crop&q=80',
        brand: 'Good Knight',
        tags: ['mosquito', 'repellent', 'good knight'],
        variants: [
          { unit: 'Refill 45ml Only', price: 78, stock: 65, isDefault: false },
          { unit: 'Machine + 45ml Refill Pack', price: 115, stock: 50, isDefault: true },
        ],
      },
      {
        name: 'Homelites Extra Long Safety Matchboxes (అగ్గిపెట్టెలు)',
        category: catMap['Household & Lighting (పూజ & గృహోపకరణాలు)'],
        description: 'Karborized sticks that light up in one strike without flying sparks.',
        image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&auto=format&fit=crop&q=80',
        brand: 'Homelites',
        tags: ['matches', 'matchbox', 'pooja'],
        variants: [
          { unit: 'Bundle of 10 Matchboxes', price: 20, stock: 90, isDefault: true },
        ],
      },
      {
        name: 'Stainless Steel Kitchen Gas Lighter (కిచెన్ గ్యాస్ లైటర్)',
        category: catMap['Household & Lighting (పూజ & గృహోపకరణాలు)'],
        description: 'Heavy duty unbreakable stainless steel piezo spark gas stove lighter.',
        image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80',
        brand: 'Crystal',
        tags: ['lighter', 'gas lighter', 'kitchen'],
        variants: [
          { unit: '1 Steel Lighter', price: 65, stock: 45, isDefault: true },
        ],
      },
      {
        name: 'Pure White Household Wax Candles (మైనపు కొవ్వొత్తులు)',
        category: catMap['Household & Lighting (పూజ & గృహోపకరణాలు)'],
        description: 'Smokeless dripless pure paraffin wax candles for emergency lighting and prayer.',
        image: 'https://images.unsplash.com/photo-1603555501671-8f96b3fce8b4?w=600&auto=format&fit=crop&q=80',
        brand: 'Glow Bright',
        tags: ['candles', 'lighting', 'emergency'],
        variants: [
          { unit: 'Pack of 6 Long Candles', price: 35, stock: 60, isDefault: true },
          { unit: 'Pack of 12 Candles', price: 65, stock: 45, isDefault: false },
        ],
      },
    ];

    await Product.insertMany(productsData);
    console.log(`Seeded ${productsData.length} Manikanta Supermarket products across all requested categories.`);

    // Initialize Store Settings
    await Setting.create({
      shopName: 'Manikanta Supermarket',
      tagline: 'Your Trusted Neighborhood Supermarket - Groceries, Dairy, Staples, Care & Essentials',
      phone: '+91 95730 45430',
      whatsapp: '+91 95730 45430',
      email: 'contact@manikantasupermarket.com',
      address: 'Domalakunta, near govt school, Telangana',
      openingTime: '07:00 AM',
      closingTime: '10:00 PM',
      isOpen: true,
      pickupInstructions: 'Show your Order ID at the Express Counter for quick packed pickup in 2 minutes!',
      minOrderAmount: 20,
    });
    console.log('Store settings initialized for Manikanta Supermarket.');

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
