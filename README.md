Instagram Analytics Dashboard
A full-stack web application that scrapes Instagram-like profile data, processes analytics, and displays it on a **dark-themed React dashboard** with charts and an Instagram-style grid layout for posts.
 Frontend (React + Material-UI)
* Dark-themed, responsive design.
* Profile stats (followers, posts, following, engagement rate, avg likes/comments).
* Interests distribution via **donut/pie chart** (ApexCharts).
* Instagram-style **masonry grid** for posts.
* Post modal with likes, comments, and interactions.

Backend (Node.js + Express + GraphQL)

* **GraphQL API** (`/graphql`) to fetch influencer data.
* Image proxy endpoint (`/proxy-image`) to bypass CORS.
* Can be extended to integrate scraping or external APIs.

 🛠️ Tech Stack

* **Frontend:** React, Material-UI, ApexCharts, Apollo Client
* **Backend:** Node.js, Express, GraphQL, Apollo Server, MongoDB
* **Others:** Vite (bundler), Mongoose (ODM)
📂 Project Structure

```
project-root/
│
├── frontend/              # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx        # Main app component
│   │   ├── App.css        # Global styles (dark theme)
│   │   └── index.jsx
|   |   
│   └── package.json
│
├── backend/               # Node.js + GraphQL server
│   ├── server.js          # Main server file
│   ├── models/            # Mongoose schemas
│   ├── resolvers/         # GraphQL resolvers
│   ├── typeDefs.js        # GraphQL schema
│   └── package.json
│
└── README.md              # Project documentation
```


## ⚡ Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/your-username/instagram-analytics-dashboard.git
cd instagram-analytics-dashboard
```

### 2. Install Dependencies

#### Backend

```bash
cd backend
npm install
```

#### Frontend

```bash
cd ../frontend
npm install
```

### 3. Run the Application

#### Start Backend

```bash
cd backend
npm start
```

Server runs on: `http://localhost:4000/graphql`

#### Start Frontend

```bash
cd ../frontend
npm run dev
```


 Make sure to update the frontend Apollo Client **GraphQL endpoint URL** with your deployed backend URL.

---

📑 Assumptions

* Instagram official API is not used (scraping or mock data).
* Data model is simplified for demonstration (stats, posts, interests).
* Some fields like *Sentiment Score, Extrovert Level* are not implemented. 


## 📜 License

This project is licensed under the MIT License.
