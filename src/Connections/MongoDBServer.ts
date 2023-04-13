import { IDatabaseManager } from "../Abstracts/IDatabaseManager"
//import * as mongoose from "mongoose";
//const MongoClient = require('mongodb').MongoClient;
import { config } from "dotenv";

const { connect } = require("mongoose");



export class MongoDBServer implements IDatabaseManager {

    public dbCon:any;

    constructor() {
        config({ path: `${__dirname}/../.env` });
    }

    async initializeDb() {
        try {
            connect(process.env.MONGO_DB_URL, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            })
                .then((db) => {
                    console.log("DB connection successfully");
                    this.dbCon = db;
                })
            // console.info('Db connected successfully.')
        } catch (error) {
            console.error(error.message);
        }
    } 


    // async initializeDb() {

    //     // const MongoClient = require('mongodb').MongoClient;
    //     // const assert = require('assert');
        
    //     // // Connection URL
    //     // const url = process.env.MONGO_DB_URL;
        
    //     // // Database Name
    //     // const dbName = 'VideoCall';
        
    //     // // Create a new MongoClient
    //     // const client = new MongoClient(url);
        
    //     // // Use connect method to connect to the Server
    //     // client.connect(function(err) {
    //     //   assert.equal(null, err);
    //     //   console.log("Connected successfully to server");
        
    //     //   const db = client.db(dbName);
        
    //     //   client.close();
    //     // });

    //     console.log('Db connection');
    //     try {
    //         MongoClient.connect(process.env.MONGO_DB_URL, 
    //                             /*{useUnifiedTopology: true,useNewUrlParser: true},*/
    //                             function(err, db) 
    //         {
    //             if (err) {
    //             //   throw err;
    //                 console.log(err);
    //             }
    //             console.log('Db connected successfully');

    //             var dbo = db.db("testdb");
    //             var myobj = { name: "Company Inc", address: "Highway 37" };
    //               dbo.collection("users").insertOne(myobj, function(err, res) {
    //                 if (err) throw err;
    //                 console.log("1 document inserted");
    //                 db.close();
    //               });


    //             //db.close();
    //         })
    //     } catch (error) {
    //         console.log('Db Error:' + error.message);
    //     }
       
    // }

    // async initializeDb() {
    //     const { connect } = require("mongoose");
    //     connect(process.env.MONGO_DB_URL, {
    //         useNewUrlParser: true,
    //         useUnifiedTopology: true,
    //         // useFindAndModify: false,
    //     })
    //         .then((db) => {
    //             console.log("DB connection successfully");
                
    //             // success({
    //             //     message: `DB connection successfully`,
    //             //     badge: true,
    //             // });
    //         })
    // }

}