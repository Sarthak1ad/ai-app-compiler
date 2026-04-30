const testPrompts = {
  standard: [
    { id: "s1", prompt: "Build a CRM with login, contacts, dashboard, role-based access, and premium plan with payments. Admins can see analytics." },
    { id: "s2", prompt: "Create an e-commerce store with product listings, shopping cart, user reviews, and an admin panel to manage inventory and orders." },
    { id: "s3", prompt: "Build a Learning Management System where teachers can upload video courses, students can take quizzes, and a certificate is generated upon completion." },
    { id: "s4", prompt: "I need a project management tool like Trello. Users can create boards, lists, and cards. Cards can have assignees, due dates, and comments." },
    { id: "s5", prompt: "Create a healthcare portal where patients can book appointments, doctors can view their schedules, and admins manage billing." },
    { id: "s6", prompt: "Build a real estate listings app. Agents can post properties with images. Buyers can search by location/price, and save favorites." },
    { id: "s7", prompt: "Develop a customer support ticketing system. Users submit tickets, agents reply and resolve them. Include SLA tracking and agent performance metrics." },
    { id: "s8", prompt: "Create a social network for pets. Users create profiles for their pets, post photos, 'paw' (like) posts, and follow other pets." },
    { id: "s9", prompt: "Build an inventory management system for a warehouse. Track stock levels, generate low-stock alerts, and log all incoming/outgoing shipments." },
    { id: "s10", prompt: "Create a SaaS billing dashboard for companies to manage their subscriptions, view invoices, and upgrade/downgrade plans." }
  ],
  edgeCases: [
    { id: "e1", type: "vague", prompt: "Make an app that makes money." },
    { id: "e2", type: "vague", prompt: "I need a website for my business." },
    { id: "e3", type: "conflicting", prompt: "Create a secure banking app. The app should not require any passwords or authentication to login. Users can transfer money freely." },
    { id: "e4", type: "conflicting", prompt: "Build a CRM where only admins can delete contacts, but any regular user has full permission to remove any contact they want." },
    { id: "e5", type: "incomplete", prompt: "Build an API that returns user data." },
    { id: "e6", type: "hallucination-trap", prompt: "Generate an app that uses the flux-capacitor protocol and the mind-reading API endpoint from OpenAI." },
    { id: "e7", type: "massive-scope", prompt: "Build an exact replica of Facebook, Amazon, and Netflix combined into one single page application." },
    { id: "e8", type: "zero-ui", prompt: "I want a background service that runs at midnight to calculate taxes. No UI needed." },
    { id: "e9", type: "circular-logic", prompt: "Create two tables: Table A and Table B. Table A requires a foreign key to Table B. Table B requires a foreign key to Table A." },
    { id: "e10", type: "non-software", prompt: "How do I bake a chocolate cake?" }
  ]
};

module.exports = testPrompts;
