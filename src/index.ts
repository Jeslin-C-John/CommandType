import { config } from "dotenv";
import { CommandFactory } from "./Command/CommandFactory";
import { CommandHandler } from "./Command/CommandHandler";
import { ServerFactoryInstance } from "./Connections/ServerFactory";


config({ path: `${__dirname}/.env` });

console.log('Application starting...');

const server = ServerFactoryInstance.GetServer();
const database = ServerFactoryInstance.GetDatabase();

console.log('Starting Server...')

server.setCommandHandler(new CommandHandler(new CommandFactory(server)))
      .usePort(parseInt(process.env.MEDIASOUP_SERVER_PORT))
      .connect();

console.log('Initializing Db..')
database.initializeDb();



// import { Schema, model, connect } from 'mongoose';

// // 1. Create an interface representing a document in MongoDB.
// interface IUser {
//   name: string;
//   email: string;
//   avatar?: string;
// }

// // 2. Create a Schema corresponding to the document interface.
// const userSchema = new Schema<IUser>({
//   name: { type: String, required: true },
//   email: { type: String, required: true },
//   avatar: String
// });

// // 3. Create a Model.
// const User = model<IUser>('User', userSchema);

// run().catch(err => console.log(err));

// async function run() {
//   // 4. Connect to MongoDB
//  // await connect('mongodb://127.0.0.1:27017/test');

//   const user = new User({
//     name: 'Bill',
//     email: 'bill@initech.com',
//     avatar: 'https://i.imgur.com/dM7Thhn.png'
//   });
//   await user.save();

//   console.log(user.email); // 'bill@initech.com'
// }









//Try to clean up on exit
const onExit = (e) => {
      console.log('closing signaling server');
      if (e) console.error(e);
      server.cleanUp();
      process.exit();
};

process.on("uncaughtException"	, onExit);
process.on("SIGINT"		      , onExit);
process.on("SIGTERM"		      , onExit);
process.on("SIGQUIT"		      , onExit);




// var MongoClient = require('mongodb').MongoClient;
// // var url = "mongodb://localhost:27017/";
// // var url = "mongodb://0.0.0.0:27017/";
// // var url = "mongodb://127.0.0.1:27017/";
// // var url = "mongodb://localhost:27017/";
// var url = "mongodb://127.0.0.1:27017/";

// MongoClient.connect(url, function(err, db) {
//       if (err) {
//         throw err;
//       }
//       console.log('db connected');
//       db.close();
//     })

// MongoClient.connect(url, function(err, db) {
//   if (err) throw err;
//   var dbo = db.db("VideoCall");
//   var myobj = { name: "Company Inc", address: "Highway 37" };
//   dbo.collection("Room").insertOne(myobj, function(err, res) {
//     if (err) throw err;
//     console.log("1 document inserted");
//     db.close();
//   });
// });


