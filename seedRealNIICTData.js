const mongoose = require('mongoose');
require('dotenv').config();

const Course = require('./models/Course');
const MockTest = require('./models/MockTest');
const Schedule = require('./models/Schedule');
const Job = require('./models/Job');
const News = require('./models/News');
const Mentor = require('./models/Mentor');
const Flashcard = require('./models/Flashcard');
const Paper = require('./models/Paper');
const InterviewQuestion = require('./models/InterviewQuestion');

const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://khushalyadav535:VoRMiAflk87LNPjH@cluster0.osata.mongodb.net/niict_admissions?retryWrites=true&w=majority&appName=Cluster0';

async function seedData() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB Atlas!');

    // 1. COURSES
    console.log('Seeding Courses...');
    await Course.deleteMany({});
    const courses = [
      {
        title: 'ADCA (Advanced Diploma in Computer Applications)',
        description: 'Comprehensive 1-year diploma covering complete computer fundamentals, office automation, graphic designing, accounting with Tally Prime, and web basics.',
        duration: '12 Months',
        level: 'Intermediate',
        students: 1450,
        startDate: 'Every Monday',
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
        rating: 4.9,
        price: '6500',
        originalPrice: '12000',
        discount: '46% OFF',
        features: ['Govt. Recognized Certification', '100% Practical Training', 'Free Study Material & E-Books', 'Job Placement Support'],
        syllabus: [
          { title: 'Module 1: Computer Fundamentals & Windows 11', description: 'Hardware concepts, Windows operating system, file system, control panel, settings' },
          { title: 'Module 2: MS Office Professional (Word, Excel, PowerPoint)', description: 'Advanced formatting, mail merge, complex formulas, pivot tables, presentation design' },
          { title: 'Module 3: Desktop Publishing (Photoshop & CorelDRAW)', description: 'Photo editing, banner creation, brochure design, vector illustrations, visiting cards' },
          { title: 'Module 4: Financial Accounting with Tally Prime + GST', description: 'Ledgers, vouchers, GST calculation, e-way bill, balance sheet, trial balance' },
          { title: 'Module 5: Web Designing Basics & Internet', description: 'HTML5, CSS3, browser mechanics, domain/hosting basics, cyber security awareness' },
          { title: 'Module 6: Programming Concepts with Python', description: 'Variables, loops, functions, basic automation scripts' }
        ]
      },
      {
        title: 'DCA (Diploma in Computer Applications)',
        description: 'Ideal 6-month diploma for beginners seeking strong computer literacy, data entry skills, typing expertise, and office productivity tools.',
        duration: '6 Months',
        level: 'Beginner',
        students: 2200,
        startDate: '1st & 15th of Every Month',
        image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
        rating: 4.8,
        price: '4200',
        originalPrice: '8000',
        discount: '48% OFF',
        features: ['Affiliated Certificate', 'English & Hindi Typing Labs', 'Live Projects', 'Exam Preparation Support'],
        syllabus: [
          { title: 'Module 1: Computer Fundamentals & OS', description: 'CPU, memory, storage devices, operating system operations' },
          { title: 'Module 2: MS Word & Document Processing', description: 'Letter drafting, documentation, tables, printing techniques' },
          { title: 'Module 3: MS Excel Data Management', description: 'Formulas, functions (SUM, VLOOKUP, IF), charts, data filtering' },
          { title: 'Module 4: MS PowerPoint & Digital Presentations', description: 'Slide master, transitions, animations, interactive presentations' },
          { title: 'Module 5: Internet, Email & Online Government Services', description: 'Digital payments, net banking, email etiquette, cyber hygiene' }
        ]
      },
      {
        title: 'CCC (Course on Computer Concepts - NIELIT)',
        description: 'Official Government NIELIT CCC curriculum designed to equip candidates for government job examinations (SSC, Railway, State Govt, Banking).',
        duration: '3 Months',
        level: 'Beginner',
        students: 3900,
        startDate: 'Weekly Batches',
        image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
        rating: 4.9,
        price: '2200',
        originalPrice: '4500',
        discount: '51% OFF',
        features: ['100% Exam Pass Guarantee Support', 'Daily Online Mock Tests', 'Latest LibreOffice Syllabus', 'Free Online Test Series Access'],
        syllabus: [
          { title: 'Chapter 1: Introduction to Computer & IT', description: 'Components of computer system, input/output units, operating system concepts' },
          { title: 'Chapter 2: GUI Operating System & Settings', description: 'Mouse pointers, folder management, user management, accessories' },
          { title: 'Chapter 3: LibreOffice Writer Word Processing', description: 'Interface, formatting, tables, mail merge, autocorrect' },
          { title: 'Chapter 4: LibreOffice Calc Spreadsheets', description: 'Worksheets, rows, columns, functions, charts' },
          { title: 'Chapter 5: LibreOffice Impress Presentations', description: 'Slides, design templates, slide transition, sound effects' },
          { title: 'Chapter 6: Internet, WWW & Web Browsers', description: 'LAN, WAN, IP addresses, search engines, instant messaging' },
          { title: 'Chapter 7: Cyber Security & Digital Financial Services', description: 'UPI, AEPS, USSD, Cards, OTP, phishing, firewalls' }
        ]
      },
      {
        title: 'Tally Prime with GST & E-Way Bill',
        description: 'Master computerized accounting, inventory management, GST compliance, taxation, and financial reporting with real business data.',
        duration: '3 Months',
        level: 'Intermediate',
        students: 1350,
        startDate: '10th of Every Month',
        image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
        rating: 4.8,
        price: '3500',
        originalPrice: '7000',
        discount: '50% OFF',
        features: ['Real Company Case Studies', 'GST Portal Practical Training', 'Tally Prime Authorized Certificate', 'Job Assistance in CA Firms'],
        syllabus: [
          { title: 'Section 1: Manual Accounting Basics', description: 'Golden rules of accounting, journal entries, ledger posting, trial balance' },
          { title: 'Section 2: Tally Prime Fundamentals', description: 'Company creation, chart of accounts, groups and ledgers' },
          { title: 'Section 3: Accounting Vouchers', description: 'Payment, receipt, contra, journal, sales and purchase entries' },
          { title: 'Section 4: Inventory Management', description: 'Stock groups, units of measure, godowns, purchase and sales orders' },
          { title: 'Section 5: Goods and Services Tax (GST)', description: 'CGST, SGST, IGST, GST invoicing, HSN codes, GSTR-1 & GSTR-3B preparation' },
          { title: 'Section 6: Banking & MIS Reports', description: 'Bank reconciliation statement (BRS), cash flow, profit & loss, balance sheet' }
        ]
      },
      {
        title: 'Full Stack Web Development (MERN)',
        description: 'Industry-grade software development program covering HTML5, CSS3, JavaScript ES6+, React.js, Node.js, Express, and MongoDB.',
        duration: '6 Months',
        level: 'Advanced',
        students: 980,
        startDate: '1st of Every Month',
        image: 'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?auto=format&fit=crop&w=800&q=80',
        rating: 4.9,
        price: '8500',
        originalPrice: '16000',
        discount: '47% OFF',
        features: ['5+ Live Production Projects', 'GitHub & Portfolio Reviews', 'Interview Prep & DSA Basics', 'Internship Opportunity at NIICT'],
        syllabus: [
          { title: 'Module 1: HTML5 & Responsive CSS3', description: 'Semantic markup, Flexbox, CSS Grid, mobile-first design, animations' },
          { title: 'Module 2: JavaScript Mastery (ES6+)', description: 'Closures, promises, async/await, DOM manipulation, fetch API' },
          { title: 'Module 3: React.js Frontend', description: 'Components, hooks (useState, useEffect, useContext), routing, state management' },
          { title: 'Module 4: Node.js & Express Backend', description: 'RESTful API architecture, middleware, JWT authentication, error handling' },
          { title: 'Module 5: MongoDB & Database Design', description: 'Mongoose schemas, aggregation pipelines, indexing, Atlas cloud setup' },
          { title: 'Module 6: Deployment & CI/CD', description: 'Git/GitHub, Render/Vercel deployment, environment variables, production security' }
        ]
      },
      {
        title: 'Python Programming & Data Analytics',
        description: 'Learn Python from scratch, automate tasks, scrape data, and perform exploratory data analysis using Pandas, NumPy, and Matplotlib.',
        duration: '4 Months',
        level: 'Intermediate',
        students: 820,
        startDate: 'Every Month 15th',
        image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
        rating: 4.8,
        price: '4999',
        originalPrice: '9999',
        discount: '50% OFF',
        features: ['Data Analysis Projects', 'Automation Scripts', 'Jupyter Notebook Workflows', 'Course Completion Certificate'],
        syllabus: [
          { title: 'Phase 1: Python Core', description: 'Data types, control structures, functions, lambda expressions, file handling' },
          { title: 'Phase 2: Object-Oriented Python', description: 'Classes, objects, inheritance, polymorphism, custom modules' },
          { title: 'Phase 3: NumPy for Numerical Computing', description: 'Arrays, indexing, matrix operations, statistical math' },
          { title: 'Phase 4: Pandas for Data Wrangling', description: 'Series, DataFrames, data cleaning, groupby, merging data' },
          { title: 'Phase 5: Data Visualization', description: 'Matplotlib and Seaborn graphs, dashboards, real-world data storytelling' }
        ]
      },
      {
        title: 'Graphic Design & Video Editing',
        description: 'Professional visual design curriculum covering Adobe Photoshop, CorelDRAW, Adobe Illustrator, and basic video editing for creators.',
        duration: '3 Months',
        level: 'Beginner',
        students: 710,
        startDate: 'Bi-Weekly',
        image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80',
        rating: 4.7,
        price: '3999',
        originalPrice: '7500',
        discount: '47% OFF',
        features: ['Real Client Brief Projects', 'Stock Assets Access', 'Freelancing Guidance on Upwork/Fiverr', 'Portfolio Development'],
        syllabus: [
          { title: 'Tool 1: Adobe Photoshop CC', description: 'Layers, masks, selection tools, portrait retouching, social media posters' },
          { title: 'Tool 2: CorelDRAW 2024', description: 'Vector shapes, logo creation, flex banners, packaging design, print settings' },
          { title: 'Tool 3: Adobe Illustrator', description: 'Pen tool mastery, typography, icon design, vector illustration' },
          { title: 'Tool 4: Video Editing & Motion Basics', description: 'Timeline editing, sound syncing, color grading, exporting 4K/Reels' }
        ]
      },
      {
        title: 'PGDCA (Post Graduate Diploma in Computer Applications)',
        description: 'Advanced university-level post-graduate diploma covering system software, database architecture, network administration, and enterprise software.',
        duration: '12 Months',
        level: 'Advanced',
        students: 650,
        startDate: 'Annual / Semi-Annual',
        image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
        rating: 4.9,
        price: '9500',
        originalPrice: '18000',
        discount: '47% OFF',
        features: ['Recognized Degree Alignment', 'System Architecture & Networking', 'Major Project Thesis', 'Campus Placement Support'],
        syllabus: [
          { title: 'Semester 1: Fundamentals, Operating Systems & Office', description: 'Computer architecture, Unix/Linux commands, shell scripting, office automation' },
          { title: 'Semester 2: Programming in C & Data Structures', description: 'Pointers, memory management, stacks, queues, linked lists, algorithms' },
          { title: 'Semester 3: Relational Database Management Systems (SQL)', description: 'Normalization, ER diagrams, joins, triggers, stored procedures' },
          { title: 'Semester 4: Software Engineering & Major Project', description: 'SDLC, Agile methodology, testing, live project deployment and viva' }
        ]
      }
    ];
    await Course.insertMany(courses);
    console.log(`Successfully seeded ${courses.length} courses!`);

    // 2. MOCK TESTS
    console.log('Seeding Mock Tests...');
    await MockTest.deleteMany({});
    const mockTests = [
      {
        title: 'CCC Official Examination Mock Test 2026',
        subject: 'Computer Concepts & LibreOffice',
        duration: 45,
        enrolledStudents: 1840,
        questions: [
          {
            q: 'Which of the following is the default extension of LibreOffice Writer documents?',
            options: ['.odt', '.docx', '.txt', '.pdf'],
            correctAnswer: 0
          },
          {
            q: 'What is the full form of UPI in digital banking?',
            options: ['Unified Payment Interface', 'Uniform Process Integration', 'Universal Public Identifier', 'Unique Personal Identity'],
            correctAnswer: 0
          },
          {
            q: 'In LibreOffice Calc, what symbol must every formula start with?',
            options: ['#', '=', '@', '$'],
            correctAnswer: 1
          },
          {
            q: 'What is the maximum amount that can be transferred via RTGS in India?',
            options: ['₹2 Lakh', '₹5 Lakh', '₹10 Lakh', 'No Upper Limit'],
            correctAnswer: 3
          },
          {
            q: 'Which shortcut key is used to save a file in LibreOffice Writer?',
            options: ['Ctrl + S', 'Ctrl + Shift + S', 'F12', 'Ctrl + Alt + S'],
            correctAnswer: 0
          },
          {
            q: 'Which topology requires a central hub or switch to connect all nodes?',
            options: ['Bus Topology', 'Star Topology', 'Ring Topology', 'Mesh Topology'],
            correctAnswer: 1
          },
          {
            q: 'What is the full form of OTP used in online transactions?',
            options: ['One Time Password', 'Official Trusted Password', 'Open Transmission Protocol', 'Online Transfer PIN'],
            correctAnswer: 0
          },
          {
            q: 'What is the maximum number of views available in LibreOffice Impress?',
            options: ['3', '4', '5', '6'],
            correctAnswer: 2
          }
        ]
      },
      {
        title: 'DCA Computer Fundamentals & Windows 11 Test',
        subject: 'Fundamentals & Operating Systems',
        duration: 30,
        enrolledStudents: 1210,
        questions: [
          {
            q: 'Which component is considered the brain of the computer?',
            options: ['Hard Disk', 'RAM', 'CPU (Central Processing Unit)', 'Motherboard'],
            correctAnswer: 2
          },
          {
            q: 'What type of memory is volatile and loses content when power is turned off?',
            options: ['ROM', 'RAM', 'SSD', 'Flash Drive'],
            correctAnswer: 1
          },
          {
            q: 'What is the keyboard shortcut to permanently delete a file without sending to Recycle Bin?',
            options: ['Delete', 'Shift + Delete', 'Ctrl + Delete', 'Alt + Delete'],
            correctAnswer: 1
          },
          {
            q: '1 Gigabyte (GB) is equal to how many Megabytes (MB)?',
            options: ['1000 MB', '1024 MB', '1048 MB', '512 MB'],
            correctAnswer: 1
          },
          {
            q: 'Which Windows utility is used to end unresponsive programs?',
            options: ['Control Panel', 'Device Manager', 'Task Manager', 'File Explorer'],
            correctAnswer: 2
          },
          {
            q: 'What is the shortcut key to lock your Windows computer screen immediately?',
            options: ['Windows Key + L', 'Windows Key + D', 'Windows Key + R', 'Ctrl + Alt + L'],
            correctAnswer: 0
          }
        ]
      },
      {
        title: 'Tally Prime & GST Accounting Assessment',
        subject: 'Accounting & GST Compliance',
        duration: 30,
        enrolledStudents: 940,
        questions: [
          {
            q: 'Which accounting voucher is used for cash deposits or withdrawals from a bank in Tally Prime?',
            options: ['Payment (F5)', 'Receipt (F6)', 'Contra (F4)', 'Journal (F7)'],
            correctAnswer: 2
          },
          {
            q: 'What is the Golden Rule of Nominal Accounts?',
            options: ['Debit what comes in, Credit what goes out', 'Debit the receiver, Credit the giver', 'Debit all expenses & losses, Credit all incomes & gains', 'Debit assets, Credit liabilities'],
            correctAnswer: 2
          },
          {
            q: 'In inter-state sale transactions (from one state to another), which tax is levied?',
            options: ['CGST + SGST', 'IGST (Integrated GST)', 'UTGST', 'Customs Duty'],
            correctAnswer: 1
          },
          {
            q: 'Which shortcut key in Tally Prime is used to select or change the Company?',
            options: ['F1', 'F3', 'Alt + F3', 'F11'],
            correctAnswer: 1
          },
          {
            q: 'What is the full form of HSN Code in GST invoicing?',
            options: ['Harmonized System of Nomenclature', 'High Standard Network', 'Higher Sales Number', 'Homogenous Service Notation'],
            correctAnswer: 0
          }
        ]
      },
      {
        title: 'Web Development & Frontend Coding Quiz',
        subject: 'HTML5, CSS3 & JavaScript',
        duration: 25,
        enrolledStudents: 760,
        questions: [
          {
            q: 'Which HTML5 element is used to specify a header for a document or section?',
            options: ['<head>', '<header>', '<top>', '<section-header>'],
            correctAnswer: 1
          },
          {
            q: 'In CSS, which property is used to create space around elements outside of borders?',
            options: ['padding', 'margin', 'border-spacing', 'gap'],
            correctAnswer: 1
          },
          {
            q: 'Which JavaScript method converts a JSON string into a JavaScript object?',
            options: ['JSON.stringify()', 'JSON.parse()', 'JSON.toObject()', 'JSON.convert()'],
            correctAnswer: 1
          },
          {
            q: 'What is the keyword used to declare a block-scoped variable that cannot be reassigned?',
            options: ['var', 'let', 'const', 'static'],
            correctAnswer: 2
          }
        ]
      }
    ];
    await MockTest.insertMany(mockTests);
    console.log(`Successfully seeded ${mockTests.length} mock tests!`);

    // 3. SCHEDULES
    console.log('Seeding Weekly Class Schedules...');
    await Schedule.deleteMany({});
    const schedules = [
      {
        title: 'ADCA Batch 1: MS Office & Excel Formulas Mastery',
        instructor: 'Er. Amit Sharma',
        course: 'ADCA',
        day: 'Monday',
        startTime: '10:00 AM',
        endTime: '11:30 AM',
        meetLink: 'https://meet.google.com/niict-adca-batch',
        isLive: true,
        thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80'
      },
      {
        title: 'Tally Prime: Practical GST Invoicing & Ledger Workshop',
        instructor: 'CA Neha Gupta',
        course: 'Tally Prime',
        day: 'Monday',
        startTime: '04:00 PM',
        endTime: '05:30 PM',
        meetLink: 'https://meet.google.com/niict-tally-live',
        isLive: false,
        thumbnail: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80'
      },
      {
        title: 'CCC Fast-Track: LibreOffice Impress & Networking',
        instructor: 'Prof. Rajesh Verma',
        course: 'CCC',
        day: 'Tuesday',
        startTime: '11:00 AM',
        endTime: '12:30 PM',
        meetLink: 'https://meet.google.com/niict-ccc-fast',
        isLive: true,
        thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=400&q=80'
      },
      {
        title: 'Web Development: React State & Custom Hooks',
        instructor: 'Er. Rahul Singh',
        course: 'Web Development',
        day: 'Tuesday',
        startTime: '06:00 PM',
        endTime: '07:30 PM',
        meetLink: 'https://meet.google.com/niict-react-live',
        isLive: false,
        thumbnail: 'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?auto=format&fit=crop&w=400&q=80'
      },
      {
        title: 'DCA Practical Lab: Windows Management & Typing Speed',
        instructor: 'Er. Amit Sharma',
        course: 'DCA',
        day: 'Wednesday',
        startTime: '09:30 AM',
        endTime: '11:00 AM',
        meetLink: 'https://meet.google.com/niict-dca-lab',
        isLive: false,
        thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80'
      },
      {
        title: 'Python for Beginners: Data Structures & Functions',
        instructor: 'Dr. Priya Mishra',
        course: 'Python Programming',
        day: 'Wednesday',
        startTime: '05:00 PM',
        endTime: '06:30 PM',
        meetLink: 'https://meet.google.com/niict-python-live',
        isLive: false,
        thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80'
      },
      {
        title: 'Photoshop Masterclass: Banner & Poster Design',
        instructor: 'Manoj Kumar',
        course: 'Graphic Design',
        day: 'Thursday',
        startTime: '11:00 AM',
        endTime: '12:30 PM',
        meetLink: 'https://meet.google.com/niict-design-class',
        isLive: false,
        thumbnail: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=400&q=80'
      },
      {
        title: 'CCC Special: 100 Most Expected NIELIT Questions',
        instructor: 'Prof. Rajesh Verma',
        course: 'CCC',
        day: 'Friday',
        startTime: '10:00 AM',
        endTime: '11:30 AM',
        meetLink: 'https://meet.google.com/niict-ccc-special',
        isLive: false,
        thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=400&q=80'
      },
      {
        title: 'Career Mentorship & Resume Building Session',
        instructor: 'Er. Amit Sharma',
        course: 'All Courses',
        day: 'Saturday',
        startTime: '03:00 PM',
        endTime: '04:30 PM',
        meetLink: 'https://meet.google.com/niict-career-talk',
        isLive: false,
        thumbnail: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=400&q=80'
      }
    ];
    await Schedule.insertMany(schedules);
    console.log(`Successfully seeded ${schedules.length} class schedules!`);

    // 4. JOBS
    console.log('Seeding Job Portal...');
    await Job.deleteMany({});
    const jobs = [
      {
        title: 'Computer Faculty & Lab Trainer',
        company: 'NIICT Computer Institute',
        location: 'Branch Campus / On-Site',
        type: 'Full-Time',
        salary: '₹18,000 - ₹28,000 / month',
        tags: ['Teaching', 'MS Office', 'Tally', 'DCA/ADCA']
      },
      {
        title: 'Junior Tally Accountant & Billing Executive',
        company: 'Vertex Retail Logistics',
        location: 'City Center Hub',
        type: 'Full-Time',
        salary: '₹20,000 - ₹30,000 / month',
        tags: ['Tally Prime', 'GST', 'Invoicing', 'E-Way Bill']
      },
      {
        title: 'Data Entry & MIS Executive',
        company: 'Apex Solutions Pvt Ltd',
        location: 'Head Office',
        type: 'Full-Time',
        salary: '₹15,000 - ₹22,000 / month',
        tags: ['Excel', 'MIS', 'Fast Typing', 'Data Management']
      },
      {
        title: 'Frontend Web Developer Intern',
        company: 'InfyTech Software Labs',
        location: 'Hybrid / Remote',
        type: 'Internship',
        salary: '₹10,000 - ₹15,000 / month',
        tags: ['React.js', 'HTML/CSS', 'JavaScript', 'Git']
      },
      {
        title: 'Graphic Designer & Social Media Creator',
        company: 'Bright Vision Media',
        location: 'Creative Studio',
        type: 'Full-Time',
        salary: '₹18,000 - ₹25,000 / month',
        tags: ['Photoshop', 'CorelDRAW', 'Reels Editing', 'Canva']
      }
    ];
    await Job.insertMany(jobs);
    console.log(`Successfully seeded ${jobs.length} job openings!`);

    // 5. TECH NEWS
    console.log('Seeding Tech News & Updates...');
    await News.deleteMany({});
    const newsItems = [
      {
        title: 'NIICT Annual Merit Scholarship Examination 2026 Announced',
        category: 'Scholarship',
        content: 'NIICT has announced its prestigious annual scholarship exam offering up to 100% tuition fee waiver for outstanding students enrolling in ADCA, DCA, and Web Development courses. Online registration is now live.',
        image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'NIELIT CCC Upcoming Examination Admit Cards Released',
        category: 'Exams',
        content: 'NIELIT has published the hall tickets for the upcoming CCC cycle. Students of NIICT are advised to verify their roll numbers and download their admit cards from the student portal.',
        image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Hands-on Workshop: AI Tools & Automation for Office Professionals',
        category: 'Workshop',
        content: 'Join us this Saturday for a live masterclass on using ChatGPT, Copilot, and AI spreadsheets to automate routine data entry and reporting tasks.',
        image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'New High-Tech Computer Lab Inaugurated at NIICT Campus',
        category: 'Campus',
        content: 'We have upgraded our lab infrastructure with 50 brand-new high-speed core i5 workstations, dual-monitor programming setups, and dedicated 5G optical fiber connectivity for our students.',
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80'
      }
    ];
    await News.insertMany(newsItems);
    console.log(`Successfully seeded ${newsItems.length} news articles!`);

    // 6. MENTORS
    console.log('Seeding Mentors...');
    await Mentor.deleteMany({});
    const mentors = [
      {
        name: 'Er. Amit Sharma',
        role: 'Director & Lead Computer Science Mentor',
        nextAvailable: 'Today, 10:00 AM',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
      },
      {
        name: 'CA Neha Gupta',
        role: 'Senior Tally Prime & GST Taxation Specialist',
        nextAvailable: 'Today, 04:00 PM',
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'
      },
      {
        name: 'Prof. Rajesh Verma',
        role: 'NIELIT Master Trainer & Fundamentals Expert',
        nextAvailable: 'Tomorrow, 11:00 AM',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
      },
      {
        name: 'Er. Rahul Singh',
        role: 'Full Stack MERN Developer & Cloud Architect',
        nextAvailable: 'Tomorrow, 06:00 PM',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
      }
    ];
    await Mentor.insertMany(mentors);
    console.log(`Successfully seeded ${mentors.length} faculty mentors!`);

    // 7. FLASHCARDS
    console.log('Seeding Flashcards...');
    await Flashcard.deleteMany({});
    const flashcards = [
      { front: 'Ctrl + C', back: 'Copies the selected text, file, or object to the clipboard.', category: 'Shortcuts' },
      { front: 'Ctrl + V', back: 'Pastes the copied or cut content from clipboard.', category: 'Shortcuts' },
      { front: 'Ctrl + Z vs Ctrl + Y', back: 'Ctrl + Z is Undo (revert action), Ctrl + Y is Redo (repeat action).', category: 'Shortcuts' },
      { front: 'Alt + F4', back: 'Closes the active window or opens the shutdown dialog in Windows.', category: 'Shortcuts' },
      { front: 'VLOOKUP in Excel', back: 'Searches for a value in the first column of a table array and returns a value in the same row from a specified column.', category: 'Excel' },
      { front: 'F4 in Tally Prime', back: 'Opens Contra Voucher: used for fund transfers between Cash and Bank accounts.', category: 'Tally' },
      { front: 'RAM vs ROM', back: 'RAM is volatile read-write memory; ROM is non-volatile read-only memory holding firmware (BIOS/UEFI).', category: 'Hardware' },
      { front: 'What is an IP Address?', back: 'Internet Protocol address: a unique numerical identifier assigned to every device connected to a computer network.', category: 'Networking' }
    ];
    await Flashcard.insertMany(flashcards);
    console.log(`Successfully seeded ${flashcards.length} flashcards!`);

    // 8. PREVIOUS PAPERS
    console.log('Seeding Previous Papers...');
    await Paper.deleteMany({});
    const papers = [
      { title: 'NIELIT CCC Solved Question Paper (Official Set 2025)', type: 'PDF', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
      { title: 'DCA Semester 1 Computer Fundamentals Question Paper', type: 'PDF', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
      { title: 'Tally Prime Practical Exam & Balance Sheet Problem Paper', type: 'PDF', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
      { title: 'ADCA Desktop Publishing (Photoshop & Corel) Practical Guide', type: 'PDF', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
    ];
    await Paper.insertMany(papers);
    console.log(`Successfully seeded ${papers.length} previous papers!`);

    // 9. INTERVIEW QUESTIONS
    console.log('Seeding Interview Questions...');
    await InterviewQuestion.deleteMany({});
    const interviewQuestions = [
      {
        category: 'Computer Operator',
        q: 'What is the difference between relative and absolute cell references in Microsoft Excel?',
        a: 'A relative cell reference (e.g. A1) changes automatically when copied to another cell. An absolute reference uses dollar signs (e.g. $A$1) to keep the exact row and column locked when copied across formulas.'
      },
      {
        category: 'Accounting / Tally',
        q: 'What is a 3-way reconciliation in Tally Prime?',
        a: 'Reconciliation ensures the company book balance matches the bank statement and the physical cash register, checking for uncredited deposits, unpresented cheques, or bank charges.'
      },
      {
        category: 'Web Development',
        q: 'Explain the difference between synchronous and asynchronous code in JavaScript.',
        a: 'Synchronous code executes sequentially line-by-line, blocking execution until the current task finishes. Asynchronous code (using promises or async/await) runs non-blocking tasks in the background without freezing the application.'
      },
      {
        category: 'General IT',
        q: 'What steps would you take if a client reports their computer cannot connect to the internet?',
        a: '1) Verify physical cable / Wi-Fi icon, 2) Check IP configuration with ipconfig, 3) Ping the default gateway and 8.8.8.8 to distinguish between local LAN and WAN issues, 4) Check DNS resolution and firewall.'
      }
    ];
    await InterviewQuestion.insertMany(interviewQuestions);
    console.log(`Successfully seeded ${interviewQuestions.length} interview questions!`);

    console.log('\n========================================');
    console.log('ALL REAL NIICT DATA SUCCESSFULLY SEEDED!');
    console.log('========================================');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seedData();
