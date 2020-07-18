'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bodyParser = require('body-parser');
const dns = require('dns');

var cors = require('cors');


var urlSchema = new Schema({
  originalUrl:{
    type: String,
    unique : true
  }, 
  shortUrl: Number
});

var urlModel = mongoose.model('Url', urlSchema);

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

/** this project needs a db !! **/ 
// mongoose.connect(process.env.DB_URI);

app.use(bodyParser.urlencoded({extended: false}));

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.get("/api/shorturl/:shortUrl", function(req, res){
  var shortUrl = req.params.shortUrl;
  urlModel.findOne({shortUrl: shortUrl}, function(err, urlFound){
    if(err){
      throw err;
    }
    res.redirect(301, urlFound.originalUrl);
  });
});

app.post("/api/shorturl/new", function(req, res){
  var url = req.body.url;
  
  if(url.substr(0,4)!== "http"){
    console.log("http");
    res.json({error: "Invalid Url"});
  }
  
  var myArr = url.split("://");
  var forDns = myArr[1];
  
  
  
  dns.lookup(forDns, function(err, address, family){
    if(err){
      console.log("dns");
      res.json({error: "Invalid URL"});
    }
    
    

    // urlModel.create({originalUrl: url, shortUrl: 1}, function(err, done){
    //   if(err){
    //     return new Error(err);
    //   }
    //   res.json({message:'success'});
    // });
    urlModel.countDocuments({}, function(err, c){
      if(err){
        throw err;
      }
      urlModel.findOne({originalUrl: url}, function(err, urlFound){
        if(err){
          throw err;
        }
        if(urlFound == null){
          var urlno = parseInt(c+1);
          urlModel.create({originalUrl: url, shortUrl: urlno}, function(err, urlModel){
            if(err){
              throw err;
            }
            res.json({original_url: urlModel.originalUrl, short_url: urlModel.shortUrl});
          });
        }
        else{
          res.json({original_url: urlFound.originalUrl, short_url: urlFound.shortUrl});
        }
        
      });
      // res.json({count:c});
    });
      
    
    // res.json({address: address, family: family});
  });
  //res.json({data: req.body, more: req.headers});
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});