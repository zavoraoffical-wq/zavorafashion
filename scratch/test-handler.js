process.env.MONGODB_URI = 'mongodb+srv://zavora_app:ZavoraPass2026@cluster0.m5ehvyp.mongodb.net/zavora_fashion?retryWrites=true&w=majority&appName=Cluster0';
process.env.MONGODB_DB = 'zavora_fashion';

const handler = require('../api/products');

const req = {
  method: 'GET',
  query: {},
  headers: {}
};

const res = {
  statusCode: 200,
  headers: {},
  setHeader(k, v) { this.headers[k] = v; },
  end(body) {
    console.log("HANDLER RESPONSE STATUS:", this.statusCode);
    console.log("HANDLER RESPONSE BODY:", body);
  }
};

handler(req, res);
