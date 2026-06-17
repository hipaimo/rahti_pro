# --- Étape 1 : build de l'application React ---
FROM node:20-slim AS build

WORKDIR /app

COPY package.json ./
COPY package-lock.json* ./
RUN npm install

COPY . .

# URL de l'API injectée au moment du build (CRA inline les variables d'env)
ARG REACT_APP_API_URL=http://localhost:8000/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# --- Étape 2 : image finale, Nginx sert les fichiers statiques ---
FROM nginx:1.27-alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
