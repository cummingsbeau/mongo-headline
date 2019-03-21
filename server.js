// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var path = require("path");

var Article = require("./models/Article.js");

// Scraping tools
var request = require("request");
var cheerio = require("cheerio");
mongoose.Promise = Promise;
var port = process.env.PORT || 3000

var app = express();

app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(express.static("public"));

var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({
  defaultLayout: "main",
  partialsDir: path.join(__dirname, "/views/layouts/partials")
}));
app.set("view engine", "handlebars");

// Database configuration with mongoose
mongoose.connect("mongodb://heroku_jmv816f9:5j1nd4taq42hi29bfm5hobeujd@ds133192.mlab.com:33192/heroku_jmv816f9");

var db = mongoose.connection;

db.on("error", function (error) {
  console.log("Mongoose Error: ", error);
});

db.once("open", function () {
  console.log("Mongoose connection successful.");
});

// Routes
app.get("/", function (req, res) {
  Article.find({ "saved": false }, function (error, data) {
    var hbsObject = {
      article: data
    };
    console.log(hbsObject);
    res.render("home", hbsObject);
  });
});

app.get("/scrape", function (req, res) {

  request("https://www.tmz.com/", function (error, response, html) {

    var $ = cheerio.load(html);

    $("article").each(function (i, element) {


      var result = {};


      result.title = $(this).children("h2").text();
      result.img =$(this).children(".img").append();
      result.summary = $(this).children(".summary").text();
      result.link = $(this).children("h2").children("a").attr("href");

      var entry = new Article(result);


      entry.save(function (err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        // Or log the doc
        else {
          console.log(doc);
        }
      });

    });
    res.send("Scrape Complete");

  });

});

app.get("/articles", function (req, res) {

  Article.find({}, function (error, doc) {

    if (error) {
      console.log(error);
    }

    else {
      res.json(doc);
    }
  });
});


app.get("/articles/:id", function (req, res) {

  Article.findOne({ "_id": req.params.id })

    .populate("note")

    .exec(function (error, doc) {

      if (error) {
        console.log(error);
      }

      else {
        res.json(doc);
      }
    });
});


// Listen on port
app.listen(port, function () {
  console.log("App running on port " + port);
});

