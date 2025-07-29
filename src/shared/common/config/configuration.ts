export default () => ({
  mongodb: {
    type: 'mongodb',
    host: process.env.MONGODB_HOST || 'localhost',
    port: parseInt(process.env.MONGODB_PORT || '27017', 10),
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    database: process.env.MONGODB_DATABASE || 'dev_mongo_db',
    useNewUrlParser: true,
  },
});
