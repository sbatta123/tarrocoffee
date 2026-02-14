PM Vibe-Coding Project		                          
Project Overview
Coding
For this take-home project, we’d like to see how you vibe-code an end-to-end mini product: an AI voice cashier for a busy new york city coffee shop. The goal is to understand how you can translate messy real-world behavior into clean rules and workflows, handle edge cases, and demonstrate the technical fluency and detail orientation to turn those into a functioning product.

Prompt
##The Scenario##
You want to build an AI voice cashier for a busy new york city coffee shop. Your main user groups are:
The customers who place orders by talking to the AI Cashier
The baristas who make the drinks based on order tickets
The store owner who wants to see order history and gain data insights
##Menu##
Here’s the menu for the coffee shop:
## The Menu

**Coffee (Small 12oz / Large 16oz)**
* Americano (Hot/Iced) - $3.00 / $4.00
* Latte (Hot/Iced) - $4.00 / $5.00
* Cold Brew (Iced) - $4.00 / $5.00
* Mocha (Hot/Iced) - $4.50 / $5.50
* Coffee Frappuccino (Iced) - $5.50 / $6.00

**Tea (Small 12oz / Large 16oz)**
* Black Tea (Hot/Iced) - $3.00 / $3.75
* Jasmine Tea (Hot/Iced) - $3.00 / $3.75
* Lemon Green Tea (Hot/Iced) - $3.50 / $4.25
* Matcha Latte (Hot/Iced) - $4.50 / $5.25

**Pastries**
* Plain Croissant - $3.50
* Chocolate Croissant - $4.00
* Chocolate Chip Cookie - $2.50
* Banana Bread (Slice) - $3.00

**Add-Ons & Substitutions**
* Whole Milk - $0.00
* Skim Milk - $0.00
* Oat Milk - +$0.50
* Almond Milk - +$0.75
* Extra Espresso Shot - +$1.50
* Extra Matcha Shot - +$1.50
* 1 Pump Caramel Syrup - +$0.50
* 1 Pump Hazelnut Syrup - +$0.50

**Customization Options (No Charge)**
* **Sweetness Levels:** No Sugar, Less Sugar, Extra Sugar
* **Ice Levels:** No Ice, Less Ice, Extra Ice
##Feature Requirements##
Your web app should support three core user experiences:
(i) Customer View: Conversational Ordering + Receipt
This is the main chat interface where customers “talk” to the chatbot to place orders.
The chatbot should be able to:
Engage in voice-based, multi-turn conversation with the customer
Also allow customers to switch to text-based chat via a simple toggle
Ask customers clarifying questions (size, temperature, milk, ice, sweetness, etc.)
Handle modifications (oat milk, extra shot, less ice, etc.)
Reject impossible/unreasonable requests based on common sense
Post an order receipt in the chat interface once the customer finishes ordering
(ii) Barista View: Order Ticket Queue
This is the interface baristas use during their shift.
It should include:
A simple, readable list of orders tickets that’s easy for the baristas to read, so they know what drinks they need to make
Ability to mark each ticket as:
In Progress
Completed
(iii) Owner View: Data Dashboard
At the end of each day, the store owner wants a quick pulse check on business performance.
Your dashboard should:
Display the most relevant metrics and insights
Easy to understand for a coffee shop owner
You may choose whichever metrics you find most meaningful and relevant to the owner, and display them based on importance and relevance. Expect us to ask you why you think certain metrics are important to the owner.
##Additional Notes##
Not all rules are written explicitly on the menu. There are many hidden rules on what kind of drinks can or cannot be ordered. 
Examples:
Frappuccinos cannot be made “hot” 
“Latte with no espresso shots” is just plain milk
There should be a sensible maximum number of espresso shots you can add
Use your common sense to set guardrails against invalid requests.
No need to build any payment features. Assume all customers will pay in-store.


##Tech Stack recommendation##

We want you to publish your code in Github in a public repo, and to deploy your app to a hosting platform so we can access it and try it out ourselves too. 

You can use whatever technical stack you wish, but ultimately we want you to spend as much time as possible building the project, not stuck on DevOps. Here’s our recommendation:

IDE: Cursor ($20/mo plan)
Database: Google Sheets or Supabase
Your app should store order data in a persistent database so that orders remain available across sessions, reloads, and deployments.
LLM API: OpenAI or Gemini
Hosting: Railway.app (free)
Speech-to-text / Text-to-speech API: ElevenLabs

What to Expect
This project is intentionally open-ended. You will have 1 week from when we send you the prompt to complete it, along with a $50 budget to purchase any software or tools you need. We’ll send you a virtual card for this. 
We respect your time. While the project window is 1 week, we have scoped this to take 4-8 hours of active building. We’re not expecting a perfectly polished app, but rather the foundations of one that solves for the core use cases.
You can schedule a 30 minute call with your hiring manager to ask clarifying questions and additional context. The call is optional.
The project submission deadline is {insert date/time}. Here is the list of things that should be included in your submission:
URL to the project codebase on Github
Must include an orders.csv file showing your data structure with sample orders
URL of the deployed application
Please email your recruiter with these two URLs by the submission deadline.
Once the project is submitted, we will schedule a live 60-minute demo session. During the presentation, we will ask you to:
Demo your product (10 mins)
Share one time the AI or code did something unexpected, and how you 'steered' it back to the right product vision
Answer ad-hoc questions from the interviewers about your implementation. Come prepared to discuss not just what you built and why, but also what you’d want to add/change next
Make a change or add a feature LIVE to demonstrate your ability to navigate and update your own codebase. AI coding tools can be used to make the changes
