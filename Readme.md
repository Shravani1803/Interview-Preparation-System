# Completed Login and Sign up pages 
How other group member will access project

git clone https://github.com/Shravani1803/Interview-Preparation-System.git

This will download project.

After clone:

cd Interview-Preparation-System

Install root dependencies:

npm install

Install backend:

cd backend
npm install

Install frontend:

cd ../front-end
npm install

# Run project (if using concurrently)

Go to main folder:

cd ..

Run:

npm run dev or npm start

This runs both frontend + backend.

# If not using concurrently

Run 2 terminals:

Terminal 1:

cd backend
npm start

Terminal 2:

cd front-end
npm start

# How group member will push changes

After editing:

git add .
git commit -m "added login page"
git push

Before editing always do:

git pull