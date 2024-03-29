FROM node:16-alpine

RUN apk add git

# Create app directory
WORKDIR /usr/src

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install

# Bundle app source
ADD . ./

EXPOSE 3000
CMD [ "node", "index.js" ]
